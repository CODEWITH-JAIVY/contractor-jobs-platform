import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthError implements Exception {
  final String message;
  AuthError(this.message);
  @override
  String toString() => message;
}

/// google_sign_in 7.x: singleton, initialize() ek hi baar. Build me:
/// --dart-define=GOOGLE_WEB_CLIENT_ID=<Web client ID>  (backend ka GOOGLE_CLIENT_ID bhi wahi)
class GoogleAuth {
  static const webClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');
  static bool _ready = false;

  static Future<void> init() async {
    if (_ready) return;
    try {
      await GoogleSignIn.instance.initialize(serverClientId: webClientId.isEmpty ? null : webClientId);
      _ready = true;
    } catch (e) {
      debugPrint('Google init skip: $e');
    }
  }

  /// Google ID token deta hai. User ne cancel kiya to null.
  static Future<String?> idToken() async {
    await init();
    if (!_ready) throw AuthError('Google login abhi set nahi hai');
    try {
      final user = await GoogleSignIn.instance.authenticate();
      final t = user.authentication.idToken;
      if (t == null) throw AuthError('Google se token nahi mila, setup check karo');
      return t;
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) return null;
      throw AuthError('Google login nahi ho paya (${e.code.name}). Dobara try karo.');
    }
  }

  static Future<void> signOut() async {
    try {
      await GoogleSignIn.instance.signOut();
    } catch (_) {}
  }
}
