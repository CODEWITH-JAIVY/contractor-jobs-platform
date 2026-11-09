import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import type { InterstitialAd } from 'react-native-google-mobile-ads';

type AdsLib = typeof import('react-native-google-mobile-ads');

function lib(): AdsLib | null {
  try {
    return require('react-native-google-mobile-ads') as AdsLib;
  } catch {
    return null;
  }
}

/** Khali = Google ke test ads. Release me apne AdMob IDs do (.env). */
const BANNER = process.env.EXPO_PUBLIC_BANNER_ID ?? '';
const INTERSTITIAL = process.env.EXPO_PUBLIC_INTERSTITIAL_ID ?? '';

let ready = false;
let inter: InterstitialAd | null = null;
let views = 0;
const listeners = new Set<() => void>();

function loadInterstitial() {
  const m = lib();
  if (!m) return;
  const ad = m.InterstitialAd.createForAdRequest(INTERSTITIAL || m.TestIds.INTERSTITIAL);
  ad.addAdEventListener(m.AdEventType.LOADED, () => {
    inter = ad;
  });
  ad.addAdEventListener(m.AdEventType.CLOSED, () => {
    inter = null;
    loadInterstitial();
  });
  ad.addAdEventListener(m.AdEventType.ERROR, () => {
    inter = null;
  });
  ad.load();
}

export const Ads = {
  /** Sirf worker (USER) role ke liye true */
  enabled: false,
  isReady: () => ready,
  onReady(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  async init() {
    const m = lib();
    if (!m || Platform.OS !== 'android') return;
    try {
      await m.default().initialize();
      ready = true;
      loadInterstitial();
      listeners.forEach((cb) => cb());
    } catch (e) {
      console.log('Ads skip:', e);
    }
  },
  /** Har 4th job khulne par full-screen ad. Apply / notification screens par kabhi nahi. */
  onJobView() {
    if (!Ads.enabled || !ready) return;
    views += 1;
    if (views % 4 !== 0) return;
    if (inter) inter.show();
    else loadInterstitial();
  },
};

export function AdBanner() {
  const [, force] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => Ads.onReady(() => force((n) => n + 1)), []);

  const m = Ads.enabled && ready ? lib() : null;
  if (!m || failed) return null;
  const { BannerAd, BannerAdSize, TestIds } = m;
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <BannerAd unitId={BANNER || TestIds.BANNER} size={BannerAdSize.BANNER} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}
