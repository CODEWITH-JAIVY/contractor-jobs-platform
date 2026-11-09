import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Abhi Google ke TEST ad IDs hain (safe). Release se pehle apne AdMob IDs do:
/// flutter build appbundle --dart-define=BANNER_ID=ca-app-pub-xxx/yyy --dart-define=INTERSTITIAL_ID=ca-app-pub-xxx/zzz
/// Development me apne real ads par kabhi click mat karna (account ban ho sakta hai).
class Ads {
  static bool enabled = false; // sirf USER (worker) role ke liye true hota hai
  static bool get supported => defaultTargetPlatform == TargetPlatform.android;

  static const bannerId = String.fromEnvironment('BANNER_ID', defaultValue: 'ca-app-pub-3940256099942544/6300978111');
  static const interstitialId =
      String.fromEnvironment('INTERSTITIAL_ID', defaultValue: 'ca-app-pub-3940256099942544/1033173712');

  static InterstitialAd? _inter;
  static int _views = 0;

  static Future<void> init() async {
    if (!supported) return;
    try {
      await MobileAds.instance.initialize();
      _load();
    } catch (e) {
      debugPrint('Ads skip: $e');
    }
  }

  static void _load() {
    InterstitialAd.load(
      adUnitId: interstitialId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(onAdLoaded: (ad) => _inter = ad, onAdFailedToLoad: (_) => _inter = null),
    );
  }

  /// Har 4th job khulne par full-screen ad. Apply / notification screens par kabhi nahi.
  static void onJobView() {
    if (!enabled || !supported) return;
    if (++_views % 4 != 0) return;
    final ad = _inter;
    if (ad == null) {
      _load();
      return;
    }
    _inter = null;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (a) {
        a.dispose();
        _load();
      },
      onAdFailedToShowFullScreenContent: (a, _) {
        a.dispose();
        _load();
      },
    );
    ad.show();
  }
}

class AdBanner extends StatefulWidget {
  const AdBanner({super.key});
  @override
  State<AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends State<AdBanner> {
  BannerAd? _ad;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    if (!Ads.enabled || !Ads.supported) return;
    _ad = BannerAd(
      adUnitId: Ads.bannerId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          if (mounted) setState(() => _loaded = true);
        },
        onAdFailedToLoad: (ad, _) {
          ad.dispose();
          _ad = null;
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _ad?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ad = _ad;
    if (!_loaded || ad == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(child: SizedBox(width: ad.size.width.toDouble(), height: ad.size.height.toDouble(), child: AdWidget(ad: ad))),
    );
  }
}
