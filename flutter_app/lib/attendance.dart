import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'api.dart';
import 'i18n.dart';
import 'shared.dart';
import 'ui.dart';

const _lightGreen = Color(0xFFDFF3E7);
const _lightRed = Color(0xFFFBE3E3);
const _amber = Color(0xFFD9A400);

String _ymd(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
String _ym(DateTime d) => _ymd(d).substring(0, 7);
String _fmt(num h) => h == h.roundToDouble() ? h.toInt().toString() : h.toString();

/// Worker ka apna private hisaab: hazri + overtime + mahine ki kamai.
class AttendanceTab extends StatefulWidget {
  const AttendanceTab({super.key});
  @override
  State<AttendanceTab> createState() => _AttendanceTabState();
}

class _AttendanceTabState extends State<AttendanceTab> {
  late DateTime month = DateTime(DateTime.now().year, DateTime.now().month);
  Map<String, Map<String, dynamic>> entries = {};
  Map<String, dynamic> sum = {};
  Map<String, dynamic> settings = {};
  List payments = [];
  String? err;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      err = null;
    });
    final s = context.read<Session>();
    final m = _ym(month);
    try {
      final r = await Future.wait([
        s.get('/attendance', q: {'month': m}),
        s.get('/attendance/summary', q: {'month': m}),
        s.get('/attendance/settings'),
        s.get('/attendance/payments', q: {'month': m}),
      ]);
      entries = {for (final e in (r[0] as List)) '${e['date']}': Map<String, dynamic>.from(e)};
      sum = Map<String, dynamic>.from(r[1]);
      settings = Map<String, dynamic>.from(r[2]);
      payments = r[3] as List;
    } catch (e) {
      err = errText(e);
    }
    if (mounted) setState(() => loading = false);
  }

  void _shift(int delta) {
    setState(() => month = DateTime(month.year, month.month + delta));
    _load();
  }

  Future<void> _openDay(DateTime date) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => _DaySheet(date: date, existing: entries[_ymd(date)]),
    );
    if (ok == true) _load();
  }

  Future<void> _settings() async {
    final wage = TextEditingController(text: settings['dailyWage']?.toString() ?? '');
    final rate = TextEditingController(text: settings['overtimeRate']?.toString() ?? '');
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(tr('att.rateTitle')),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          tf(tr('att.dailyWage'), wage, type: TextInputType.number),
          tf(tr('att.otRate'), rate, type: TextInputType.number),
          Text(tr('att.rateNote'), style: const TextStyle(color: C.steel, fontSize: 12)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d, false), child: Text(tr('common.cancel'))),
          TextButton(onPressed: () => Navigator.pop(d, true), child: Text(tr('common.save'))),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<Session>().put('/attendance/settings', {
        'dailyWage': int.tryParse(wage.text.trim()),
        'overtimeRate': int.tryParse(rate.text.trim()),
      });
      _load();
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
  }

  Future<void> _addPayment() async {
    final amount = TextEditingController(), note = TextEditingController();
    var date = DateTime.now();
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => StatefulBuilder(
        builder: (d, setD) => AlertDialog(
          title: Text(tr('att.payTitle')),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              tf(tr('att.payAmount'), amount, type: TextInputType.number),
              tf(tr('att.payNote'), note),
              OutlinedButton.icon(
                icon: const Icon(Icons.calendar_today, size: 18),
                label: Text('${date.day} ${monthNames()[date.month - 1]} ${date.year}'),
                onPressed: () async {
                  final p = await showDatePicker(
                    context: d, initialDate: date,
                    firstDate: DateTime.now().subtract(const Duration(days: 730)), lastDate: DateTime.now(),
                  );
                  if (p != null) setD(() => date = p);
                },
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(d, false), child: Text(tr('common.cancel'))),
            TextButton(onPressed: () => Navigator.pop(d, true), child: Text(tr('common.save'))),
          ],
        ),
      ),
    );
    final amt = int.tryParse(amount.text.trim());
    if (ok != true || !mounted) return;
    if (amt == null || amt <= 0) {
      toast(context, tr('att.payInvalid'));
      return;
    }
    try {
      await context.read<Session>().post('/attendance/payments', {'date': _ymd(date), 'amount': amt, 'note': note.text.trim()});
      _load();
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
  }

  Future<void> _deletePayment(Map<String, dynamic> p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (d) => AlertDialog(
        title: Text(tr('att.removeTitle', {'amt': inr(p['amount'])})),
        actions: [
          TextButton(onPressed: () => Navigator.pop(d, false), child: Text(tr('common.no'))),
          TextButton(onPressed: () => Navigator.pop(d, true), child: Text(tr('att.removeYes'), style: const TextStyle(color: C.red))),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<Session>().delete('/attendance/payments/${p['id']}');
      _load();
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
  }

  Widget _paymentTile(Map<String, dynamic> p) => Material(
        color: Colors.white,
        child: ListTile(
          leading: const CircleAvatar(backgroundColor: _lightGreen, child: Icon(Icons.payments_outlined, color: C.green)),
          title: Text(inr(p['amount']), style: const TextStyle(fontWeight: FontWeight.w800)),
          subtitle: Text('${p['date']}${(p['note'] ?? '').toString().isEmpty ? '' : '\n${p['note']}'}'),
          isThreeLine: (p['note'] ?? '').toString().isNotEmpty,
          trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _deletePayment(p)),
        ),
      );

  void _copy() {
    final text = '${tr('att.summaryTitle', {'month': monthNames()[month.month - 1], 'year': month.year})}\n'
        '${tr('att.present')}: ${tr('att.days', {'n': sum['presentDays']})}\n${tr('att.half')}: ${sum['halfDays']}\n${tr('att.absent')}: ${sum['absentDays']}\n'
        '${tr('att.overtime')}: ${sum['overtimeHours']} ${tr('att.hours')}\n${tr('att.earn')}: ${inr(sum['totalAmount'] ?? 0)}\n'
        '${tr('att.received')}: ${inr(sum['receivedThisMonth'] ?? 0)}\n${tr('att.totalBalance')}: ${inr(sum['balance'] ?? 0)}';
    Clipboard.setData(ClipboardData(text: text));
    toast(context, tr('att.copied'));
  }

  Widget _stat(String label, String value, Color color) => Expanded(
        child: Column(children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 12, color: C.steel)),
        ]),
      );

  Widget _legend(Color bg, Color bd, String t) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 14, height: 14,
          decoration: BoxDecoration(color: bg, border: Border.all(color: bd), borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(width: 6),
        Text(t, style: const TextStyle(fontSize: 12, color: C.steel)),
      ]);

  Widget _cell(int day) {
    final date = DateTime(month.year, month.month, day);
    final key = _ymd(date);
    final e = entries[key];
    final now = DateTime.now();
    final isToday = _ymd(now) == key;
    final future = date.isAfter(DateTime(now.year, now.month, now.day));
    final st = e?['status'] as String?;
    final ot = e == null ? 0.0 : (double.tryParse('${e['overtimeHours']}') ?? 0);

    Color bg = Colors.white, bd = C.line;
    Widget? mark;
    if (st == 'PRESENT') {
      bg = _lightGreen; bd = C.green;
      mark = const Icon(Icons.check, size: 16, color: C.green);
    } else if (st == 'HALF_DAY') {
      bg = C.paleYellow; bd = _amber;
      mark = const Text('½', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF7A5B00)));
    } else if (st == 'ABSENT') {
      bg = _lightRed; bd = C.red;
      mark = const Icon(Icons.close, size: 16, color: C.red);
    }
    return Material(
      color: bg,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: isToday ? C.ink : bd, width: isToday ? 2 : 1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: future ? null : () => _openDay(date),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('$day', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: future ? C.line : C.ink)),
          if (mark != null) mark,
          if (ot > 0) Text('+${_fmt(ot)}h', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: C.ink)),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final now = DateTime.now();
    final isCurrent = month.year == now.year && month.month == now.month;
    final offset = DateTime(month.year, month.month, 1).weekday - 1;
    final count = DateTime(month.year, month.month + 1, 0).day;
    final noWage = settings['dailyWage'] == null;

    return Column(children: [
      Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Row(children: [
          IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => _shift(-1)),
          Expanded(
            child: Text('${monthNames()[month.month - 1]} ${month.year}',
                textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ),
          IconButton(icon: const Icon(Icons.chevron_right), onPressed: isCurrent ? null : () => _shift(1)),
          IconButton(icon: const Icon(Icons.tune), tooltip: tr('att.rateTitle'), onPressed: _settings),
        ]),
      ),
      const Divider(),
      Expanded(
        child: loading
            ? const Center(child: CircularProgressIndicator(color: C.ink))
            : err != null
                ? EmptyState(icon: Icons.wifi_off, text: err!, action: TextButton(onPressed: _load, child: Text(tr('common.retry'))))
                : RefreshIndicator(
                    color: C.ink,
                    onRefresh: _load,
                    child: ListView(children: [
                      Container(
                        color: C.yellow,
                        padding: const EdgeInsets.fromLTRB(16, 12, 8, 16),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            Text(tr('att.earnings'), style: const TextStyle(fontWeight: FontWeight.w600)),
                            IconButton(icon: const Icon(Icons.copy, size: 20), tooltip: tr('att.copyTooltip'), onPressed: _copy),
                          ]),
                          Text(inr(sum['totalAmount'] ?? 0), style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text('${tr('att.daysPay')}: ${inr(sum['daysAmount'] ?? 0)}    ${tr('att.overtime')}: ${inr(sum['overtimeAmount'] ?? 0)}',
                              style: const TextStyle(fontSize: 13)),
                        ]),
                      ),
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Row(children: [
                          _stat(tr('att.present'), '${sum['presentDays'] ?? 0}', C.green),
                          _stat(tr('att.half'), '${sum['halfDays'] ?? 0}', _amber),
                          _stat(tr('att.absent'), '${sum['absentDays'] ?? 0}', C.red),
                          _stat(tr('att.overtime'), '${sum['overtimeHours'] ?? 0}h', C.ink),
                        ]),
                      ),
                      Container(
                        color: Colors.white,
                        margin: const EdgeInsets.only(top: 8),
                        padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
                        child: Row(children: [
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(((sum['balance'] ?? 0) as num) < 0 ? tr('att.advance') : tr('att.balance'),
                                  style: const TextStyle(color: C.steel, fontSize: 13)),
                              Text(inr(((sum['balance'] ?? 0) as num).abs()),
                                  style: TextStyle(
                                      fontSize: 24, fontWeight: FontWeight.w800,
                                      color: ((sum['balance'] ?? 0) as num) < 0 ? C.red : C.ink)),
                            ]),
                          ),
                          FilledButton.icon(onPressed: _addPayment, icon: const Icon(Icons.add), label: Text(tr('att.addPay'))),
                        ]),
                      ),
                      if (noWage)
                        Container(
                          color: C.paleYellow,
                          child: ListTile(
                            leading: const Icon(Icons.info_outline),
                            title: Text(tr('att.setWageBanner')),
                            trailing: TextButton(onPressed: _settings, child: Text(tr('att.setNow'))),
                          ),
                        ),
                      if (isCurrent)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                          child: bigBtn(tr('att.markToday'), () => _openDay(DateTime(now.year, now.month, now.day)),
                              icon: Icons.edit_calendar),
                        ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 16, 12, 6),
                        child: Row(children: [
                          for (final d in weekdayNames())
                            Expanded(
                              child: Text(d, textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 11, color: C.steel, fontWeight: FontWeight.w600)),
                            ),
                        ]),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: GridView.count(
                          crossAxisCount: 7,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 6,
                          crossAxisSpacing: 6,
                          childAspectRatio: 0.8,
                          children: [
                            for (var i = 0; i < offset; i++) const SizedBox.shrink(),
                            for (var d = 1; d <= count; d++) _cell(d),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Wrap(spacing: 16, runSpacing: 8, children: [
                          _legend(_lightGreen, C.green, tr('att.present')),
                          _legend(C.paleYellow, _amber, tr('att.half')),
                          _legend(_lightRed, C.red, tr('att.absent')),
                        ]),
                      ),
                      if (payments.isNotEmpty) ...[
                        sectionTitle(tr('att.monthReceived', {'amt': inr(sum['receivedThisMonth'] ?? 0)})),
                        for (final p in payments) _paymentTile(Map<String, dynamic>.from(p)),
                      ],
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        child: Text(tr('att.private'), style: const TextStyle(color: C.steel, fontSize: 12)),
                      ),
                    ]),
                  ),
      ),
    ]);
  }
}

class _DaySheet extends StatefulWidget {
  final DateTime date;
  final Map<String, dynamic>? existing;
  const _DaySheet({required this.date, this.existing});
  @override
  State<_DaySheet> createState() => _DaySheetState();
}

class _DaySheetState extends State<_DaySheet> {
  late String status = widget.existing?['status'] ?? 'PRESENT';
  late double ot = double.tryParse('${widget.existing?['overtimeHours'] ?? 0}') ?? 0;
  late final note = TextEditingController(text: widget.existing?['note'] ?? '');
  bool busy = false;

  Future<void> _run(Future<void> Function() f) async {
    setState(() => busy = true);
    try {
      await f();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        toast(context, errText(e));
        setState(() => busy = false);
      }
    }
  }

  Future<void> _save() => _run(() async {
        await context.read<Session>().put('/attendance/${_ymd(widget.date)}', {
          'status': status,
          'overtimeHours': status == 'ABSENT' ? 0 : ot,
          'note': note.text.trim(),
        });
      });

  Future<void> _delete() => _run(() async {
        await context.read<Session>().delete('/attendance/${_ymd(widget.date)}');
      });

  Widget _chip(String v, String label, IconData icon) {
    final sel = status == v;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => status = v),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: sel ? C.paleYellow : Colors.white,
            border: Border.all(color: sel ? C.ink : C.line, width: sel ? 2 : 1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(children: [
            Icon(icon),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final d = widget.date;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${weekdayNames()[d.weekday - 1]}, ${d.day} ${monthNames()[d.month - 1]} ${d.year}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          Row(children: [
            _chip('PRESENT', tr('att.present'), Icons.check_circle_outline),
            const SizedBox(width: 8),
            _chip('HALF_DAY', tr('att.half'), Icons.timelapse),
            const SizedBox(width: 8),
            _chip('ABSENT', tr('att.absent'), Icons.cancel_outlined),
          ]),
          if (status != 'ABSENT') ...[
            const SizedBox(height: 18),
            Text(tr('att.overtime'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              IconButton.filledTonal(
                onPressed: ot <= 0 ? null : () => setState(() => ot -= 0.5),
                icon: const Icon(Icons.remove),
              ),
              const SizedBox(width: 24),
              Column(children: [
                Text(_fmt(ot), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
                Text(tr('att.hours'), style: const TextStyle(color: C.steel)),
              ]),
              const SizedBox(width: 24),
              IconButton.filledTonal(
                onPressed: ot >= 16 ? null : () => setState(() => ot += 0.5),
                icon: const Icon(Icons.add),
              ),
            ]),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: note,
            maxLength: 200,
            decoration: InputDecoration(labelText: tr('att.note'), counterText: ''),
          ),
          const SizedBox(height: 12),
          bigBtn(busy ? tr('common.wait') : tr('common.save'), busy ? null : _save),
          if (widget.existing != null)
            Center(
              child: TextButton(
                onPressed: busy ? null : _delete,
                child: Text(tr('att.removeDay'), style: const TextStyle(color: C.red)),
              ),
            ),
        ]),
      ),
    );
  }
}
