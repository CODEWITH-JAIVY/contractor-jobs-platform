import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'shared.dart';
import 'ui.dart';

class AdminHome extends StatelessWidget {
  const AdminHome({super.key});
  static const labels = {
    'workers': 'Workers', 'contractors': 'Contractors', 'verifiedContractors': 'Verified',
    'openJobs': 'Open jobs', 'applications': 'Applications', 'follows': 'Follows',
  };

  @override
  Widget build(BuildContext context) {
    final s = context.read<Session>();
    return Scaffold(
      appBar: homeBar(context, 'Admin'),
      body: Column(children: [
        FutureBuilder(
          future: s.get('/admin/stats'),
          builder: (c, snap) => Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.all(12),
            child: snap.hasData
                ? Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final e in (snap.data as Map).entries)
                      Container(
                        width: 104,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: C.concrete, borderRadius: BorderRadius.circular(10)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${e.value}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                          Text(labels[e.key] ?? '${e.key}', style: const TextStyle(color: C.steel, fontSize: 12)),
                        ]),
                      ),
                  ])
                : Text(snap.hasError ? errText(snap.error!) : 'Loading...'),
          ),
        ),
        sectionTitle('Verify karne wale contractors'),
        Expanded(
          child: ApiList(
            path: '/admin/contractors',
            query: const {'verified': 'false'},
            emptyIcon: Icons.verified_outlined,
            empty: 'Koi contractor pending nahi.',
            item: (c, a, reload) => ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              leading: IconButton(icon: const Icon(Icons.call), onPressed: () => launchUrl(Uri.parse('tel:${a['phone']}'))),
              title: Text('${a['companyName']}', style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text('${a['name']}\n${a['phone']}'),
              isThreeLine: true,
              trailing: FilledButton(
                child: const Text('Verify'),
                onPressed: () async {
                  try {
                    await s.put('/admin/contractors/${a['userId']}/verify');
                    reload();
                  } catch (e) {
                    if (c.mounted) toast(c, errText(e));
                  }
                },
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
