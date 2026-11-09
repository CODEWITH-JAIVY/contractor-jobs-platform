import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'i18n.dart';

/// Design tokens: "hi-vis site signage" - ink + safety yellow on concrete.
class C {
  static const ink = Color(0xFF1C2127);
  static const yellow = Color(0xFFFFC20E);
  static const paleYellow = Color(0xFFFFF6D6);
  static const concrete = Color(0xFFF3F4F2);
  static const steel = Color(0xFF5B6670);
  static const line = Color(0xFFDDE0DC);
  static const green = Color(0xFF1E8E4E);
  static const red = Color(0xFFC62F2F);
}

ThemeData buildTheme() {
  final base = ThemeData.light(useMaterial3: true);
  final scheme = ColorScheme.fromSeed(seedColor: C.yellow).copyWith(
    primary: C.yellow, onPrimary: C.ink, secondary: C.ink, onSecondary: Colors.white,
    surface: Colors.white, onSurface: C.ink, error: C.red, outline: C.line,
  );
  OutlineInputBorder border(Color c, [double w = 1]) =>
      OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: c, width: w));
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(10));
  const btnText = TextStyle(fontSize: 16, fontWeight: FontWeight.w700);
  return base.copyWith(
    colorScheme: scheme,
    scaffoldBackgroundColor: C.concrete,
    textTheme: base.textTheme.apply(bodyColor: C.ink, displayColor: C.ink),
    appBarTheme: const AppBarTheme(
      backgroundColor: C.ink, foregroundColor: Colors.white, elevation: 0, scrolledUnderElevation: 0, centerTitle: false,
      titleTextStyle: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: Colors.white),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: C.yellow, foregroundColor: C.ink, disabledBackgroundColor: C.line,
        minimumSize: const Size(64, 50), textStyle: btnText, shape: shape),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: C.ink, minimumSize: const Size(64, 50), textStyle: btnText, shape: shape,
        side: const BorderSide(color: C.ink, width: 1.5)),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: C.ink)),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: Colors.white,
      border: border(C.line), enabledBorder: border(C.line), focusedBorder: border(C.ink, 2),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white, indicatorColor: C.yellow, height: 66,
      labelTextStyle: WidgetStatePropertyAll(const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
    ),
    dividerTheme: const DividerThemeData(color: C.line, thickness: 1, space: 1),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating, backgroundColor: C.ink, contentTextStyle: TextStyle(color: Colors.white)),
  );
}

String timeAgo(dynamic iso) {
  final t = DateTime.tryParse('$iso')?.toLocal();
  if (t == null) return '';
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return tr('time.now');
  if (d.inMinutes < 60) return tr('time.min', {'n': d.inMinutes});
  if (d.inHours < 24) return tr('time.hour', {'n': d.inHours});
  return tr('time.day', {'n': d.inDays});
}

Widget bigBtn(String label, VoidCallback? onTap, {IconData? icon, bool outlined = false}) {
  final child = Row(mainAxisSize: MainAxisSize.min, children: [
    if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
    Text(label),
  ]);
  return SizedBox(
    width: double.infinity,
    child: outlined ? OutlinedButton(onPressed: onTap, child: child) : FilledButton(onPressed: onTap, child: child),
  );
}

Widget pill(String text, Color bg, Color fg) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700)),
    );

Widget statusPill(String s) => switch (s) {
      'ACCEPTED' => pill(tr('status.accepted'), const Color(0xFFDFF3E7), C.green),
      'REJECTED' => pill(tr('status.rejected'), const Color(0xFFFBE3E3), C.red),
      'CLOSED' => pill(tr('status.closed'), C.line, C.steel),
      'OPEN' => pill(tr('status.open'), const Color(0xFFDFF3E7), C.green),
      _ => pill(tr('status.applied'), C.paleYellow, const Color(0xFF7A5B00)),
    };

/// Har job ka sabse important hissa: salary.
Widget salaryBadge(dynamic salary) => salary == null
    ? Text(tr('job.negotiable'), style: const TextStyle(color: C.steel, fontSize: 13))
    : Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: C.yellow, borderRadius: BorderRadius.circular(8)),
        child: Text('₹$salary', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      );

Widget metaRow(IconData i, String t) => ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 220),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(i, size: 16, color: C.steel),
        const SizedBox(width: 4),
        Flexible(child: Text(t, overflow: TextOverflow.ellipsis, style: const TextStyle(color: C.steel, fontSize: 13))),
      ]),
    );

Widget infoChip(IconData i, String t) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: C.concrete, borderRadius: BorderRadius.circular(20)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(i, size: 16, color: C.ink),
        const SizedBox(width: 6),
        Text(t, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );

Widget avatar(String name, {double size = 44}) => CircleAvatar(
      radius: size / 2,
      backgroundColor: C.ink,
      child: Text(name.isEmpty ? '?' : name[0].toUpperCase(),
          style: TextStyle(color: C.yellow, fontSize: size * 0.42, fontWeight: FontWeight.w800)),
    );

Widget sectionTitle(String t) => Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(t, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: C.steel)),
    );

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String text;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.text, this.action});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircleAvatar(radius: 32, backgroundColor: C.paleYellow, child: Icon(icon, size: 30, color: C.ink)),
            const SizedBox(height: 16),
            Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, color: C.steel, height: 1.4)),
            if (action != null) ...[const SizedBox(height: 8), action!],
          ]),
        ),
      );
}

/// Indian number grouping: 1234567 -> ₹12,34,567
String inr(dynamic v) {
  final n = (v as num).round();
  var s = n.abs().toString();
  if (s.length > 3) {
    final last = s.substring(s.length - 3);
    var rest = s.substring(0, s.length - 3);
    final parts = <String>[];
    while (rest.length > 2) {
      parts.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) parts.insert(0, rest);
    s = '${parts.join(',')},$last';
  }
  return '${n < 0 ? '-' : ''}₹$s';
}

/// English | हिन्दी toggle. dark=true gehre background (login header) ke liye.
class LanguageToggle extends StatelessWidget {
  final bool dark;
  const LanguageToggle({super.key, this.dark = false});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<L10n>().lang;
    Widget opt(Lang l, String label) => GestureDetector(
          onTap: () => context.read<L10n>().set(l),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: lang == l ? C.yellow : Colors.transparent, borderRadius: BorderRadius.circular(14)),
            child: Text(label,
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: lang == l ? C.ink : (dark ? Colors.white : C.ink))),
          ),
        );
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        border: Border.all(color: dark ? const Color(0x66FFFFFF) : C.line),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [opt(Lang.en, 'English'), opt(Lang.hi, 'हिन्दी')]),
    );
  }
}
