import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'i18n.dart';
import 'shared.dart';
import 'ui.dart';

class ContractorHome extends StatefulWidget {
  const ContractorHome({super.key});
  @override
  State<ContractorHome> createState() => _ContractorHomeState();
}

class _ContractorHomeState extends State<ContractorHome> {
  List<String> _titles() => [tr('tab.myJobs'), tr('title.postJob'), tr('title.profile')];
  int i = 0;

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final tabs = <Widget>[const _MyJobs(), _PostJob(onPosted: () => setState(() => i = 0)), const _ProfileTab()];
    return Scaffold(
      appBar: homeBar(context, _titles()[i]),
      body: tabs[i],
      bottomNavigationBar: NavigationBar(
        selectedIndex: i,
        onDestinationSelected: (v) => setState(() => i = v),
        destinations: [
          NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: tr('tab.myJobs')),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: tr('tab.postJob')),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: tr('tab.profile')),
        ],
      ),
    );
  }
}

class _MyJobs extends StatelessWidget {
  const _MyJobs();
  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final s = context.read<Session>();
    return ApiList(
      path: '/jobs/mine',
      emptyIcon: Icons.assignment_outlined,
      empty: tr('cj.empty'),
      item: (c, j, reload) => InkWell(
        onTap: () => Navigator.push(c, MaterialPageRoute(builder: (_) => ApplicantsScreen(jobId: j['id'], title: '${j['title']}'))),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${j['title']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Wrap(spacing: 12, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  statusPill('${j['status']}'),
                  metaRow(Icons.place_outlined, '${j['location']}'),
                  metaRow(Icons.schedule, timeAgo(j['createdAt'])),
                ]),
              ]),
            ),
            if (j['status'] == 'OPEN')
              IconButton(
                icon: const Icon(Icons.share_outlined),
                tooltip: tr('share.tooltip'),
                onPressed: () => shareJob(c, j),
              ),
            if (j['status'] == 'OPEN')
              TextButton(
                onPressed: () async {
                  try {
                    await s.put('/jobs/${j['id']}/close');
                    reload();
                  } catch (e) {
                    if (c.mounted) toast(c, errText(e));
                  }
                },
                child: Text(tr('cj.close'), style: const TextStyle(color: C.red, fontWeight: FontWeight.w700)),
              )
            else
              const Icon(Icons.chevron_right, color: C.steel),
          ]),
        ),
      ),
    );
  }
}

class _PostJob extends StatefulWidget {
  final VoidCallback onPosted;
  const _PostJob({required this.onPosted});
  @override
  State<_PostJob> createState() => _PostJobState();
}

class _PostJobState extends State<_PostJob> {
  final title = TextEditingController(), desc = TextEditingController(), loc = TextEditingController();
  final salary = TextEditingController(), workers = TextEditingController();
  bool busy = false;

  Future<void> _post() async {
    setState(() => busy = true);
    try {
      await context.read<Session>().post('/jobs', {
        'title': title.text.trim(), 'description': desc.text.trim(), 'location': loc.text.trim(),
        'salary': int.tryParse(salary.text), 'workersNeeded': int.tryParse(workers.text),
      });
      for (final c in [title, desc, loc, salary, workers]) {
        c.clear();
      }
      if (mounted) toast(context, tr('pj.done'));
      widget.onPosted();
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
    if (mounted) setState(() => busy = false);
  }

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    return ListView(padding: const EdgeInsets.all(16), children: [
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Text(tr('pj.intro'), style: const TextStyle(color: C.steel, height: 1.4)),
      ),
      tf(tr('pj.title'), title),
      tf(tr('pj.location'), loc),
      Row(children: [
        Expanded(child: tf(tr('pj.salary'), salary, type: TextInputType.number)),
        const SizedBox(width: 12),
        Expanded(child: tf(tr('pj.workers'), workers, type: TextInputType.number)),
      ]),
      tf(tr('pj.details'), desc, lines: 4),
      bigBtn(busy ? tr('common.wait') : tr('pj.submit'), busy ? null : _post, icon: Icons.campaign_outlined),
    ]);
  }
}

class _ProfileTab extends StatefulWidget {
  const _ProfileTab();
  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  final company = TextEditingController(), work = TextEditingController();
  final exp = TextEditingController(), about = TextEditingController();
  bool loading = true, busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final s = context.read<Session>();
      final p = await s.get('/contractors/${s.userId}');
      company.text = p['companyName'] ?? '';
      work.text = p['workType'] ?? '';
      exp.text = p['experienceYears']?.toString() ?? '';
      about.text = p['about'] ?? '';
    } catch (_) {/* profile abhi bani nahi */}
    if (mounted) setState(() => loading = false);
  }

  Future<void> _save() async {
    setState(() => busy = true);
    try {
      await context.read<Session>().put('/contractors/profile', {
        'companyName': company.text.trim(), 'workType': work.text.trim(),
        'experienceYears': int.tryParse(exp.text), 'about': about.text.trim(),
      });
      if (mounted) toast(context, tr('cpf.saved'));
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
    if (mounted) setState(() => busy = false);
  }

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    return loading
        ? const Center(child: CircularProgressIndicator(color: C.ink))
        : ListView(padding: const EdgeInsets.all(16), children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Text(tr('cpf.intro'), style: const TextStyle(color: C.steel, height: 1.4)),
            ),
            tf(tr('cpf.company'), company),
            tf(tr('cpf.workType'), work),
            tf(tr('cpf.exp'), exp, type: TextInputType.number),
            tf(tr('cpf.about'), about, lines: 3),
            bigBtn(busy ? tr('common.wait') : tr('cpf.save'), busy ? null : _save),
          ]);
  }
}

class ApplicantsScreen extends StatelessWidget {
  final int jobId;
  final String title;
  const ApplicantsScreen({super.key, required this.jobId, required this.title});

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final s = context.read<Session>();
    return Scaffold(
      appBar: AppBar(title: Text(title, overflow: TextOverflow.ellipsis)),
      body: ApiList(
        path: '/jobs/$jobId/applicants',
        emptyIcon: Icons.group_outlined,
        empty: tr('ap.empty'),
        item: (c, a, reload) {
          final st = '${a['status']}';
          Future<void> setStatus(String v) async {
            try {
              await s.put('/applications/${a['applicationId']}/status', {'status': v});
              reload();
            } catch (e) {
              if (c.mounted) toast(c, errText(e));
            }
          }

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                avatar('${a['name']}'),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${a['name']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text('${a['phone']}', style: const TextStyle(color: C.steel)),
                    if (a['city'] != null) metaRow(Icons.place_outlined, '${a['city']}'),
                  ]),
                ),
                statusPill(st),
              ]),
              if ((a['skills'] ?? '').toString().isNotEmpty || a['experienceYears'] != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Wrap(spacing: 8, runSpacing: 8, children: [
                    if ((a['skills'] ?? '').toString().isNotEmpty) infoChip(Icons.construction, '${a['skills']}'),
                    if (a['experienceYears'] != null) infoChip(Icons.timeline, tr('cp.experience', {'n': a['experienceYears']})),
                  ]),
                ),
              if ((a['about'] ?? '').toString().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('${a['about']}', style: const TextStyle(color: C.steel, height: 1.4)),
                ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => launchUrl(Uri.parse('tel:${a['phone']}')),
                    icon: const Icon(Icons.call, size: 18),
                    label: Text(tr('common.call')),
                  ),
                ),
                if (st != 'ACCEPTED') ...[
                  const SizedBox(width: 8),
                  Expanded(child: FilledButton(onPressed: () => setStatus('ACCEPTED'), child: Text(tr('ap.select')))),
                ],
                if (st != 'REJECTED') ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(foregroundColor: C.red, side: const BorderSide(color: C.red, width: 1.5)),
                      onPressed: () => setStatus('REJECTED'),
                      child: Text(tr('ap.reject')),
                    ),
                  ),
                ],
              ]),
            ]),
          );
        },
      ),
    );
  }
}
