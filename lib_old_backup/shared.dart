import 'package:dio/dio.dart' show DioException;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'ads.dart';
import 'api.dart';
import 'ui.dart';
import 'worker_profile.dart';

void toast(BuildContext c, String m) => ScaffoldMessenger.of(c).showSnackBar(SnackBar(content: Text(m)));

Widget tf(String label, TextEditingController c,
        {TextInputType? type, int lines = 1, bool enabled = true, String? prefix, int? maxLength}) =>
    Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: c, keyboardType: type, maxLines: lines, enabled: enabled, maxLength: maxLength,
        decoration: InputDecoration(labelText: label, prefixText: prefix, counterText: ''),
      ),
    );

AppBar homeBar(BuildContext c, String title) => AppBar(
      title: Text(title),
      actions: [
        PopupMenuButton<String>(
          onSelected: (v) async {
            final s = c.read<Session>();
            if (v == 'logout') {
              await s.logout();
              return;
            }
            if (v == 'profile') {
              await Navigator.push(c, MaterialPageRoute(builder: (_) => const WorkerProfileScreen()));
              return;
            }
            final ok = await showDialog<bool>(
              context: c,
              builder: (d) => AlertDialog(
                title: const Text('Account delete karein?'),
                content: const Text('Aapka account, profile, jobs, applications aur follows hamesha ke liye hat jayenge. Ye wapas nahi hoga.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(d, false), child: const Text('Nahi')),
                  TextButton(
                    onPressed: () => Navigator.pop(d, true),
                    child: const Text('Haan, delete karo', style: TextStyle(color: C.red)),
                  ),
                ],
              ),
            );
            if (ok != true) return;
            try {
              await s.delete('/users/me');
              await s.logout();
            } catch (e) {
              if (c.mounted) toast(c, errText(e));
            }
          },
          itemBuilder: (_) => [
            if (c.read<Session>().role == 'USER') const PopupMenuItem(value: 'profile', child: Text('Meri profile')),
            const PopupMenuItem(value: 'logout', child: Text('Logout')),
            const PopupMenuItem(value: 'delete', child: Text('Account delete karo')),
          ],
        ),
      ],
    );

/// Kisi bhi list API (Page ya List) ko dikhata hai. Pull-to-refresh + infinite scroll.
class ApiList extends StatefulWidget {
  final String path;
  final Map<String, dynamic>? query;
  final String empty;
  final IconData emptyIcon;
  final int adEvery; // 0 = ad nahi; 5 = har 5 items ke baad banner
  final Widget Function(BuildContext, Map<String, dynamic>, VoidCallback) item;
  const ApiList({
    super.key, required this.path, required this.item, this.query,
    this.empty = 'Abhi kuch nahi hai', this.emptyIcon = Icons.inbox_outlined, this.adEvery = 0,
  });
  @override
  State<ApiList> createState() => _ApiListState();
}

class _ApiListState extends State<ApiList> {
  final _sc = ScrollController();
  List _items = [];
  int _page = 0;
  bool _last = true, _loading = true, _more = false;
  Object? _err;

  @override
  void initState() {
    super.initState();
    _sc.addListener(_onScroll);
    _loadFirst(spinner: false);
  }

  @override
  void dispose() {
    _sc.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(ApiList old) {
    super.didUpdateWidget(old);
    if (old.path != widget.path || '${old.query}' != '${widget.query}') _loadFirst();
  }

  Future<({List items, bool last})> _fetch(int page) async {
    final Map<String, dynamic> q = {...?widget.query, 'page': page};
    final d = await context.read<Session>().get(widget.path, q: q);
    if (d is Map) return (items: d['content'] as List, last: d['last'] != false);
    return (items: d as List, last: true);
  }

  Future<void> _loadFirst({bool spinner = true}) async {
    if (spinner && mounted) {
      setState(() {
        _loading = true;
        _err = null;
      });
    }
    try {
      final r = await _fetch(0);
      _items = r.items;
      _last = r.last;
      _page = 0;
      _err = null;
    } catch (e) {
      _err = e;
    }
    if (mounted) setState(() => _loading = false);
  }

  void reload() => _loadFirst(spinner: false);

  void _onScroll() {
    if (_last || _more || _loading || !_sc.hasClients) return;
    if (_sc.position.extentAfter < 300) _loadMore();
  }

  Future<void> _loadMore() async {
    setState(() => _more = true);
    try {
      final r = await _fetch(_page + 1);
      _items = [..._items, ...r.items];
      _last = r.last;
      _page++;
    } catch (_) {
      // network gaya to agli scroll par dobara try hoga
    }
    if (mounted) setState(() => _more = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: C.ink));
    if (_err != null) {
      return EmptyState(
        icon: Icons.wifi_off,
        text: errText(_err!),
        action: TextButton(onPressed: _loadFirst, child: const Text('Dobara try karo')),
      );
    }
    final l = _items;
    final e = widget.adEvery;
    final n = e > 0 ? l.length + l.length ~/ e : l.length;
    return RefreshIndicator(
      color: C.ink,
      onRefresh: () => _loadFirst(spinner: false),
      child: l.isEmpty
          ? ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
              const SizedBox(height: 120),
              EmptyState(icon: widget.emptyIcon, text: widget.empty),
            ])
          : ListView.separated(
              controller: _sc,
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: n + (_more ? 1 : 0),
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (c, i) {
                if (i >= n) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(
                      child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: C.ink)),
                    ),
                  );
                }
                if (e > 0 && (i + 1) % (e + 1) == 0) return const AdBanner();
                final idx = e > 0 ? i - (i + 1) ~/ (e + 1) : i;
                return Material(
                  color: Colors.white,
                  child: widget.item(c, Map<String, dynamic>.from(l[idx]), reload),
                );
              },
            ),
    );
  }
}

/// WhatsApp par job share (contractor khud workers ko bulata hai = free growth).
/// App ka link: --dart-define=APP_LINK=https://play.google.com/store/apps/details?id=...
const appLink = String.fromEnvironment('APP_LINK');

Future<void> shareJob(BuildContext c, Map<String, dynamic> j) async {
  final sal = j['salary'] == null ? '' : '\n💰 ${inr(j['salary'])}';
  final text = '🔨 ${j['title']}\n📍 ${j['location']}$sal\n👷 ${j['contractorName'] ?? ''}\n\n'
      'Contractor Jobs app par apply karo${appLink.isEmpty ? '' : ':\n$appLink'}';
  final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(text)}');
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok && c.mounted) toast(c, 'WhatsApp nahi khul paya');
}

Widget jobTile(BuildContext c, Map<String, dynamic> j) {
  final closed = j['status'] == 'CLOSED';
  return InkWell(
    onTap: () {
      Ads.onJobView();
      Navigator.push(c, MaterialPageRoute(builder: (_) => JobDetail(job: j)));
    },
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${j['title']}', maxLines: 2, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('${j['contractorName'] ?? ''}', style: const TextStyle(color: C.steel, fontSize: 14)),
            const SizedBox(height: 8),
            Wrap(spacing: 14, runSpacing: 4, children: [
              metaRow(Icons.place_outlined, '${j['location']}'),
              if (j['workersNeeded'] != null) metaRow(Icons.groups_outlined, '${j['workersNeeded']} workers'),
              metaRow(Icons.schedule, timeAgo(j['createdAt'])),
            ]),
          ]),
        ),
        const SizedBox(width: 12),
        closed ? statusPill('CLOSED') : salaryBadge(j['salary']),
      ]),
    ),
  );
}

class JobDetail extends StatefulWidget {
  final Map<String, dynamic> job;
  const JobDetail({super.key, required this.job});
  @override
  State<JobDetail> createState() => _JobDetailState();
}

class _JobDetailState extends State<JobDetail> {
  bool applied = false, busy = false;
  Map<String, dynamic> get job => widget.job;

  Future<void> _apply() async {
    setState(() => busy = true);
    try {
      await context.read<Session>().post('/jobs/${job['id']}/apply');
      if (mounted) {
        setState(() => applied = true);
        toast(context, 'Apply ho gaya. Contractor aapko call kar sakta hai.');
      }
    } catch (e) {
      if (mounted) {
        if (e is DioException && e.response?.statusCode == 409) applied = true;
        toast(context, errText(e));
      }
    }
    if (mounted) setState(() => busy = false);
  }

  Widget _info(IconData i, String t) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Icon(i, size: 20, color: C.steel),
          const SizedBox(width: 12),
          Expanded(child: Text(t, style: const TextStyle(fontSize: 15))),
        ]),
      );

  @override
  Widget build(BuildContext context) {
    final s = context.read<Session>();
    final open = job['status'] == 'OPEN';
    final canApply = s.role == 'USER' && open;
    final desc = '${job['description'] ?? ''}'.trim();
    return Scaffold(
      appBar: AppBar(title: const Text('Job ki details'), actions: [
        IconButton(icon: const Icon(Icons.share_outlined), tooltip: 'WhatsApp par bhejo', onPressed: () => shareJob(context, job)),
      ]),
      body: ListView(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (!open) Padding(padding: const EdgeInsets.only(bottom: 8), child: statusPill('CLOSED')),
            Text('${job['title']}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.2)),
          ]),
        ),
        Container(
          color: C.yellow,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Salary', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            Text(job['salary'] == null ? 'Baat se tay hoga' : '₹${job['salary']}',
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
          ]),
        ),
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Column(children: [
            _info(Icons.place_outlined, '${job['location']}'),
            if (job['workersNeeded'] != null) _info(Icons.groups_outlined, '${job['workersNeeded']} workers chahiye'),
            _info(Icons.schedule, 'Post hui: ${timeAgo(job['createdAt'])}'),
          ]),
        ),
        const SizedBox(height: 8),
        Material(
          color: Colors.white,
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: avatar('${job['contractorName']}'),
            title: Text('${job['contractorName']}', style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: const Text('Contractor ki profile dekho'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(
                context, MaterialPageRoute(builder: (_) => ContractorScreen(userId: job['contractorId']))),
          ),
        ),
        if (desc.isNotEmpty) ...[
          sectionTitle('Kaam ki details'),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            width: double.infinity,
            child: Text(desc, style: const TextStyle(fontSize: 15, height: 1.5)),
          ),
        ],
        const SizedBox(height: 24),
      ]),
      bottomNavigationBar: canApply
          ? Container(
              decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: C.line))),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: bigBtn(applied ? 'Apply ho gaya' : 'Apply karo', applied || busy ? null : _apply,
                      icon: applied ? Icons.check_circle : Icons.send),
                ),
              ),
            )
          : null,
    );
  }
}

class ContractorScreen extends StatefulWidget {
  final int userId;
  const ContractorScreen({super.key, required this.userId});
  @override
  State<ContractorScreen> createState() => _ContractorScreenState();
}

class _ContractorScreenState extends State<ContractorScreen> {
  Map<String, dynamic>? p;
  bool? following;
  String? err;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final s = context.read<Session>();
    try {
      p = Map<String, dynamic>.from(await s.get('/contractors/${widget.userId}'));
      if (s.role == 'USER') {
        final f = await s.get('/follow/my') as List;
        following = f.any((e) => e['userId'] == widget.userId);
      }
    } catch (e) {
      err = errText(e);
    }
    if (mounted) setState(() {});
  }

  Future<void> _toggle() async {
    final s = context.read<Session>();
    final id = widget.userId;
    try {
      if (following == true) {
        await s.delete('/follow/$id');
        p!['followers'] = (p!['followers'] as int) - 1;
      } else {
        await s.post('/follow/$id');
        p!['followers'] = (p!['followers'] as int) + 1;
      }
      setState(() => following = !(following ?? false));
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = p;
    return Scaffold(
      appBar: AppBar(title: const Text('Contractor ki profile')),
      body: err != null
          ? EmptyState(icon: Icons.error_outline, text: err!)
          : d == null
              ? const Center(child: CircularProgressIndicator(color: C.ink))
              : Column(children: [
                  Container(
                    color: Colors.white,
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        avatar('${d['companyName']}', size: 56),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Flexible(
                                child: Text('${d['companyName']}',
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                              ),
                              if (d['verified'] == true)
                                const Padding(
                                  padding: EdgeInsets.only(left: 6),
                                  child: Icon(Icons.verified, color: C.green, size: 20),
                                ),
                            ]),
                            Text('${d['name']}', style: const TextStyle(color: C.steel)),
                            if (d['city'] != null) metaRow(Icons.place_outlined, '${d['city']}'),
                          ]),
                        ),
                      ]),
                      const SizedBox(height: 14),
                      Wrap(spacing: 8, runSpacing: 8, children: [
                        if (d['workType'] != null) infoChip(Icons.construction, '${d['workType']}'),
                        if (d['experienceYears'] != null) infoChip(Icons.timeline, '${d['experienceYears']} saal experience'),
                        infoChip(Icons.group_outlined, '${d['followers']} followers'),
                      ]),
                      if (d['about'] != null && '${d['about']}'.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text('${d['about']}', style: const TextStyle(fontSize: 15, height: 1.4)),
                        ),
                      if (following != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: following!
                              ? bigBtn('Following', _toggle, icon: Icons.check, outlined: true)
                              : bigBtn('Follow karo', _toggle, icon: Icons.add),
                        ),
                    ]),
                  ),
                  sectionTitle('Open jobs'),
                  Expanded(
                    child: ApiList(
                      path: '/jobs/by-contractor/${widget.userId}',
                      empty: 'Abhi koi open job nahi hai.\nFollow karo, nayi job aate hi pata chal jayega.',
                      emptyIcon: Icons.work_off_outlined,
                      item: (c, j, _) => jobTile(c, j),
                    ),
                  ),
                ]),
    );
  }
}
