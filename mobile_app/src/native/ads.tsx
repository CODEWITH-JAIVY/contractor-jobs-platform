import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import type { InterstitialAd } from 'react-native-google-mobile-ads';
type AdsLib = typeof import('react-native-google-mobile-ads');
function lib(): AdsLib | null {
  try { return require('react-native-google-mobile-ads') as AdsLib; } catch { return null; }
}
const BANNER = process.env.EXPO_PUBLIC_BANNER_ID ?? '';
const INTERSTITIAL = process.env.EXPO_PUBLIC_INTERSTITIAL_ID ?? '';
let ready = false;
let initializing = false;
let inter: InterstitialAd | null = null;
let loading = false;
let views = 0;
let cleanup: (() => void)[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(cb => cb());
function clearInterstitial() {
  cleanup.forEach(remove => remove());
  cleanup = [];
  inter = null;
  loading = false;
}
function loadInterstitial() {
  const m = lib();
  if (!m || !ready || !Ads.enabled || loading || inter) return;
  if (!__DEV__ && !INTERSTITIAL) return;
  loading = true;
  const ad = m.InterstitialAd.createForAdRequest(__DEV__ ? m.TestIds.INTERSTITIAL : INTERSTITIAL);
  cleanup = [
    ad.addAdEventListener(m.AdEventType.LOADED, () => { loading = false; inter = ad; }),
    ad.addAdEventListener(m.AdEventType.CLOSED, () => { clearInterstitial(); loadInterstitial(); }),
    ad.addAdEventListener(m.AdEventType.ERROR, clearInterstitial),
  ];
  ad.load();
}
export const Ads = {
  enabled: false,
  setEnabled(value: boolean) {
    Ads.enabled = value;
    if (!value) { clearInterstitial(); views = 0; }
    notify();
  },
  isReady: () => ready,
  onReady(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  async init() {
    const m = lib();
    if (!m || Platform.OS !== 'android' || initializing || !Ads.enabled) return;
    if (ready) { loadInterstitial(); return; }
    initializing = true;
    try {
      const consent = await m.AdsConsent.gatherConsent();
      if (!consent.canRequestAds || !Ads.enabled) return;
      await m.default().initialize();
      ready = true;
      loadInterstitial();
      notify();
    } catch { /* Fail closed: no requests until consent succeeds. */ }
    finally { initializing = false; }
  },
  async privacyOptions() {
    const m = lib();
    if (!m) return;
    ready = false;
    clearInterstitial();
    notify();
    try {
      const consent = await m.AdsConsent.showPrivacyOptionsForm();
      ready = consent.canRequestAds;
      if (ready) { await m.default().initialize(); loadInterstitial(); }
    } finally { notify(); }
  },
  onJobView() {
    if (!Ads.enabled || !ready) return;
    views++;
    if (views % 4 !== 0) return;
    if (inter) void inter.show().catch(clearInterstitial);
    else loadInterstitial();
  },
};
export function AdBanner() {
  const [, force] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => Ads.onReady(() => { setFailed(false); force(n => n + 1); }), []);
  const m = Ads.enabled && ready ? lib() : null;
  if (!m || failed || (!__DEV__ && !BANNER)) return null;
  const { BannerAd, BannerAdSize, TestIds } = m;
  return <View style={{ alignItems: 'center', paddingVertical: 8 }}>
    <BannerAd unitId={__DEV__ ? TestIds.BANNER : BANNER} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdFailedToLoad={() => setFailed(true)} />
  </View>;
}
