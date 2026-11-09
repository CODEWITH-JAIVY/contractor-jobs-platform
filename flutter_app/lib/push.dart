import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'api.dart';

/// Firebase setup na ho to chup-chap skip ho jata hai (app phir bhi chalta hai).
class Push {
  static int? _uid;

  static Future<void> start(Session s) async {
    if (_uid == s.userId) return;
    _uid = s.userId;
    try {
      await Firebase.initializeApp();
      final fm = FirebaseMessaging.instance;
      await fm.requestPermission();
      final t = await fm.getToken();
      if (t != null) await s.put('/users/me/fcm-token', {'token': t});
      fm.onTokenRefresh.listen((t) => s.put('/users/me/fcm-token', {'token': t}));
      FirebaseMessaging.onMessage.listen((m) {
        final n = m.notification;
        if (n != null) {
          messengerKey.currentState?.showSnackBar(SnackBar(content: Text('${n.title}\n${n.body ?? ''}')));
        }
      });
    } catch (e) {
      debugPrint('FCM skip: $e');
    }
  }
}
