import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'google.dart';
import 'i18n.dart';

/// Android emulator: 10.0.2.2 = laptop ka localhost. Real phone: --dart-define=API_URL=http://<laptop-ip>:8080
const baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8080');

final messengerKey = GlobalKey<ScaffoldMessengerState>();

class Session extends ChangeNotifier {
  final _store = const FlutterSecureStorage();
  String? token, role;
  int? userId;
  bool ready = false;

  late final Dio dio = Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 10)))
    ..interceptors.add(InterceptorsWrapper(
      onRequest: (o, h) {
        if (token != null) o.headers['Authorization'] = 'Bearer $token';
        h.next(o);
      },
      onError: (e, h) {
        if (e.response?.statusCode == 401 && token != null) logout();
        h.next(e);
      },
    ));

  Future<void> load() async {
    token = await _store.read(key: 'token');
    role = await _store.read(key: 'role');
    userId = int.tryParse(await _store.read(key: 'uid') ?? '');
    ready = true;
    notifyListeners();
  }

  Future<void> login(Map d) async {
    token = d['token'];
    role = d['role'];
    userId = d['userId'];
    await _store.write(key: 'token', value: token);
    await _store.write(key: 'role', value: role);
    await _store.write(key: 'uid', value: '$userId');
    notifyListeners();
    syncLanguage();
  }

  Future<void> logout() async {
    token = null;
    role = null;
    userId = null;
    await _store.deleteAll();
    await GoogleAuth.signOut();
    notifyListeners();
  }

  /// App ki bhasha backend ko batao (notifications isi bhasha me aate hain). Fail ho to chup.
  Future<void> syncLanguage() async {
    if (token == null) return;
    try {
      await put('/users/me/language', {'lang': currentLangCode});
    } catch (_) {}
  }

  Future<dynamic> get(String p, {Map<String, dynamic>? q}) async => (await dio.get(p, queryParameters: q)).data;
  Future<dynamic> post(String p, [Object? b]) async => (await dio.post(p, data: b)).data;
  Future<dynamic> put(String p, [Object? b]) async => (await dio.put(p, data: b)).data;
  Future<dynamic> delete(String p) async => (await dio.delete(p)).data;
}

String errText(Object e) {
  if (e is DioException) {
    final d = e.response?.data;
    if (d is Map) {
      if (d['fields'] is Map) {
        // sirf wahi validation messages dikhao jo hume pata hain, warna generic
        final known = (d['fields'] as Map).values.map((v) => '$v').where(isKnownServerMsg).toList();
        return known.isNotEmpty ? known.map(serverMsg).join('\n') : tr('err.validation');
      }
      if (d['error'] != null) return serverMsg(d['error'].toString());
    }
    return tr('err.network');
  }
  if (e is AuthError) return e.message;
  return tr('err.generic');
}
