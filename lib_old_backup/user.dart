import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api.dart';
import 'attendance.dart';
import 'push.dart';
import 'shared.dart';
import 'ui.dart';

class UserHome extends StatefulWidget {
  const UserHome({super.key});
  @override
  State<UserHome> createState() => _UserHomeState();
}

class _UserHomeState extends State<UserHome> {
  static const titles = ['Meri feed', 'Saari jobs', 'Alerts', 'Mere applications', 'Mera hisaab'];
  int i = 0;
  String city = '';
  final searchC = TextEditingController();

  @override
  void initState() {
    super.initState();
    Push.start(context.read<Session>());
  }

  @override
  void dispose() {
    searchC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = context.read<Session>();
    final tabs = <Widget>[
      ApiList(
        path: '/jobs/feed',
        adEvery: 5,
        emptyIcon: Icons.dynamic_feed,
        empty: 'Feed abhi khali hai.\nJobs tab se kisi contractor ko follow karo, unki nayi jobs yahan sabse pehle aayengi.',
        item: (c, j, _) => jobTile(c, j),
      ),
      Column(children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: TextField(
            controller: searchC,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'City ya area se job dhundho',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: city.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        searchC.clear();
                        setState(() => city = '');
                      },
                    ),
            ),
            onSubmitted: (v) => setState(() => city = v.trim()),
          ),
        ),
        const Divider(),
        Expanded(
          child: ApiList(
            path: '/jobs',
            adEvery: 5,
            query: city.isEmpty ? null : {'city': city},
            emptyIcon: Icons.search_off,
            empty: city.isEmpty ? 'Abhi koi job open nahi hai' : '"$city" me abhi koi job nahi mili.\nDusra area try karo.',
            item: (c, j, _) => jobTile(c, j),
          ),
        ),
      ]),
      ApiList(
        path: '/notifications',
        emptyIcon: Icons.notifications_none,
        empty: 'Koi alert nahi.\nContractor ko follow karoge to nayi job ka alert yahan aayega.',
        item: (c, n, reload) {
          final unread = n['read'] != true;
          return ListTile(
            tileColor: unread ? C.paleYellow : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            leading: CircleAvatar(
              backgroundColor: unread ? C.yellow : C.concrete,
              child: const Icon(Icons.work_outline, color: C.ink),
            ),
            title: Text('${n['title']}', style: TextStyle(fontWeight: unread ? FontWeight.w800 : FontWeight.w600)),
            subtitle: Text('${n['body'] ?? ''}\n${timeAgo(n['createdAt'])}'),
            isThreeLine: true,
            onTap: () async {
              try {
                await s.put('/notifications/${n['id']}/read');
                if (n['jobId'] != null) {
                  final job = Map<String, dynamic>.from(await s.get('/jobs/${n['jobId']}'));
                  if (c.mounted) await Navigator.push(c, MaterialPageRoute(builder: (_) => JobDetail(job: job)));
                }
                reload();
              } catch (e) {
                if (c.mounted) toast(c, errText(e));
              }
            },
          );
        },
      ),
      ApiList(
        path: '/applications/my',
        emptyIcon: Icons.assignment_outlined,
        empty: 'Aapne abhi kisi job par apply nahi kiya.',
        item: (c, a, _) => ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          title: Text('${a['jobTitle']}', style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Padding(padding: const EdgeInsets.only(top: 4), child: metaRow(Icons.place_outlined, '${a['location']}')),
          trailing: statusPill('${a['status']}'),
        ),
      ),
      const AttendanceTab(),
    ];
    return Scaffold(
      appBar: homeBar(context, titles[i]),
      body: tabs[i],
      bottomNavigationBar: NavigationBar(
        selectedIndex: i,
        onDestinationSelected: (v) => setState(() => i = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dynamic_feed_outlined), selectedIcon: Icon(Icons.dynamic_feed), label: 'Feed'),
          NavigationDestination(icon: Icon(Icons.work_outline), selectedIcon: Icon(Icons.work), label: 'Jobs'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), selectedIcon: Icon(Icons.assignment), label: 'Applied'),
          NavigationDestination(icon: Icon(Icons.event_available_outlined), selectedIcon: Icon(Icons.event_available), label: 'Hisaab'),
        ],
      ),
    );
  }
}
