import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api.dart';
import 'google.dart';
import 'shared.dart';
import 'ui.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final phone = TextEditingController(), otp = TextEditingController();
  final name = TextEditingController(), city = TextEditingController();
  String role = 'USER';
  bool otpSent = false, busy = false;
  String? googleToken, googleEmail; // Google se aaye naye user ke liye

  Future<void> _run(Future<void> Function() f) async {
    setState(() => busy = true);
    try {
      await f();
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
    if (mounted) setState(() => busy = false);
  }

  Future<void> _send() => _run(() async {
        await context.read<Session>().post('/auth/send-otp', {'phone': phone.text.trim()});
        setState(() => otpSent = true);
      });

  Future<void> _verify() => _run(() async {
        final s = context.read<Session>();
        final body = {
          'phone': phone.text.trim(), 'otp': otp.text.trim(),
          'name': name.text.trim(), 'role': role, 'city': city.text.trim(),
        };
        final d = googleToken == null
            ? await s.post('/auth/verify-otp', body)
            : await s.post('/auth/google', {...body, 'idToken': googleToken});
        await s.login(d);
      });

  Future<void> _google() => _run(() async {
        final s = context.read<Session>();
        final tok = await GoogleAuth.idToken();
        if (tok == null) return; // user ne cancel kiya
        final d = await s.post('/auth/google', {'idToken': tok});
        if (d['needsPhone'] == true) {
          setState(() {
            googleToken = tok;
            googleEmail = d['email'];
            if (name.text.isEmpty) name.text = d['name'] ?? '';
          });
          return;
        }
        await s.login(d);
      });

  void _cancelGoogle() => setState(() {
        googleToken = null;
        googleEmail = null;
        otpSent = false;
      });

  Widget _role(String value, IconData icon, String title, String sub) {
    final sel = role == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => role = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: sel ? C.paleYellow : Colors.white,
            border: Border.all(color: sel ? C.ink : C.line, width: sel ? 2 : 1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, size: 28),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            Text(sub, style: const TextStyle(color: C.steel, fontSize: 12)),
          ]),
        ),
      ),
    );
  }

  List<Widget> _phoneStep() => googleToken != null
      ? [
          Text('Google account mil gaya: $googleEmail', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          const Text('Naya account banane ke liye ek baar mobile number verify karo. Contractor isi number par aapse baat karega.',
              style: TextStyle(color: C.steel, height: 1.4)),
          const SizedBox(height: 16),
          tf('Mobile number', phone, type: TextInputType.phone, prefix: '+91 ', maxLength: 10),
          bigBtn(busy ? 'Ruko...' : 'OTP bhejo', busy ? null : _send),
          TextButton(onPressed: _cancelGoogle, child: const Text('Google chhodo')),
        ]
      : [
          const Text('Mobile number se shuru karo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          tf('Mobile number', phone, type: TextInputType.phone, prefix: '+91 ', maxLength: 10),
          bigBtn(busy ? 'Ruko...' : 'OTP bhejo', busy ? null : _send),
          const SizedBox(height: 16),
          const Row(children: [
            Expanded(child: Divider()),
            Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('ya', style: TextStyle(color: C.steel))),
            Expanded(child: Divider()),
          ]),
          const SizedBox(height: 16),
          bigBtn('Google se login karo', busy ? null : _google, icon: Icons.g_mobiledata, outlined: true),
        ];

  List<Widget> _otpStep() => [
        Row(children: [
          Expanded(child: Text('OTP bheja gaya: +91 ${phone.text}', style: const TextStyle(fontWeight: FontWeight.w600))),
          TextButton(onPressed: () => setState(() => otpSent = false), child: const Text('Number badlo')),
        ]),
        const SizedBox(height: 8),
        TextField(
          controller: otp, keyboardType: TextInputType.number, maxLength: 6, textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: 10),
          decoration: const InputDecoration(hintText: '······', counterText: ''),
        ),
        const SizedBox(height: 6),
        const Text('Testing me OTP 123456 hai', style: TextStyle(color: C.steel, fontSize: 12)),
        const Divider(height: 36),
        const Text('Pehli baar aaye ho? Ye bharo', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        tf('Aapka naam', name),
        Row(children: [
          _role('USER', Icons.construction, 'Kaam chahiye', 'Worker'),
          const SizedBox(width: 12),
          _role('CONTRACTOR', Icons.engineering, 'Workers chahiye', 'Contractor'),
        ]),
        const SizedBox(height: 12),
        tf('City', city),
        bigBtn(busy ? 'Ruko...' : 'Login karo', busy ? null : _verify),
      ];

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      body: Column(children: [
        Container(
          width: double.infinity,
          color: C.ink,
          padding: EdgeInsets.fromLTRB(24, top + 36, 24, 28),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(width: 44, height: 6, decoration: BoxDecoration(color: C.yellow, borderRadius: BorderRadius.circular(3))),
            const SizedBox(height: 18),
            const Text('Kaam seedha\ncontractor se.',
                style: TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w800, height: 1.1)),
            const SizedBox(height: 10),
            const Text('Apne contractor ki nayi jobs sabse pehle paao.',
                style: TextStyle(color: Color(0xB3FFFFFF), fontSize: 15)),
          ]),
        ),
        Expanded(child: ListView(padding: const EdgeInsets.all(20), children: otpSent ? _otpStep() : _phoneStep())),
      ]),
    );
  }
}
