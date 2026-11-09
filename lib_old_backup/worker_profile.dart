import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api.dart';
import 'shared.dart';
import 'ui.dart';

/// Worker ki profile: contractor apply karne par ye dekhta hai.
class WorkerProfileScreen extends StatefulWidget {
  const WorkerProfileScreen({super.key});
  @override
  State<WorkerProfileScreen> createState() => _WorkerProfileScreenState();
}

class _WorkerProfileScreenState extends State<WorkerProfileScreen> {
  final skills = TextEditingController(), exp = TextEditingController(), about = TextEditingController();
  bool loading = true, busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await context.read<Session>().get('/workers/me/profile');
      skills.text = p['skills'] ?? '';
      exp.text = p['experienceYears']?.toString() ?? '';
      about.text = p['about'] ?? '';
    } catch (e) {
      if (mounted) toast(context, errText(e));
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> _save() async {
    setState(() => busy = true);
    try {
      await context.read<Session>().put('/workers/me/profile', {
        'skills': skills.text.trim(),
        'experienceYears': int.tryParse(exp.text.trim()),
        'about': about.text.trim(),
      });
      if (mounted) {
        toast(context, 'Profile save ho gayi');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        toast(context, errText(e));
        setState(() => busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Meri profile')),
        body: loading
            ? const Center(child: CircularProgressIndicator(color: C.ink))
            : ListView(padding: const EdgeInsets.all(16), children: [
                const Padding(
                  padding: EdgeInsets.only(bottom: 14),
                  child: Text('Apply karne par contractor ye profile dekhta hai. Jitni poori, utna jaldi select hone ka mauka.',
                      style: TextStyle(color: C.steel, height: 1.4)),
                ),
                tf('Kaun sa kaam aata hai (Mason, Painter...)', skills),
                tf('Experience (saal)', exp, type: TextInputType.number),
                tf('Apne baare me', about, lines: 4),
                bigBtn(busy ? 'Ruko...' : 'Profile save karo', busy ? null : _save),
              ]),
      );
}
