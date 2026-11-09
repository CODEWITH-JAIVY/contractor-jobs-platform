import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'admin.dart';
import 'ads.dart';
import 'api.dart';
import 'contractor.dart';
import 'google.dart';
import 'i18n.dart';
import 'login.dart';
import 'ui.dart';
import 'user.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final l10n = L10n();
  await l10n.load();
  final session = Session();
  await session.load();
  l10n.onChanged = session.syncLanguage; // bhasha badle to backend ko bhi batao
  session.syncLanguage(); // pehle se login ho to bhi
  await Ads.init();
  await GoogleAuth.init();
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: session),
      ChangeNotifierProvider.value(value: l10n),
    ],
    child: const App(),
  ));
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    context.watch<L10n>();
    final s = context.watch<Session>();
    Ads.enabled = s.role == 'USER'; // ads sirf worker side par
    return MaterialApp(
      title: 'Contractor Jobs',
      scaffoldMessengerKey: messengerKey,
      theme: buildTheme(),
      home: !s.ready
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : s.token == null
              ? const LoginScreen()
              : s.role == 'ADMIN'
                  ? const AdminHome()
                  : s.role == 'CONTRACTOR'
                      ? const ContractorHome()
                      : const UserHome(),
    );
  }
}
