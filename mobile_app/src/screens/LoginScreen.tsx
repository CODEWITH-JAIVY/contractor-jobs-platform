import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errText } from '../api';
import { BigButton, Divider, Field, LanguageToggle, toast } from '../components/ui';
import { useT } from '../i18n';
import { googleIdToken } from '../native/google';
import { useSession } from '../session';
import { C } from '../theme';
import type { AuthResponse, GoogleAuthResponse } from '../types';

type Tab = 'worker' | 'contractor';

/**
 * App free hai (kamai sirf ads se), isliye SMS sirf contractor ke liye:
 *  - Worker: Google (email) se, koi OTP nahi. Login ke baad profile setup.
 *  - Contractor: mobile number + OTP.
 */
export default function LoginScreen() {
  const { login } = useSession();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('worker');
  const [busy, setBusy] = useState(false);
  // contractor (OTP)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // sirf testing (dev build)
  const [devEmail, setDevEmail] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(errText(e));
    }
    setBusy(false);
  };

  const google = () =>
    run(async () => {
      const tok = await googleIdToken();
      if (!tok) return; // user ne cancel kiya
      const d = await api.post<GoogleAuthResponse>('/auth/google', { idToken: tok });
      if (!d.token || !d.role || d.userId == null) throw new Error(t('err.generic'));
      await login({ token: d.token, role: d.role, userId: d.userId });
    });

  const devLogin = () =>
    run(async () => {
      const email = devEmail.trim();
      if (!email) return;
      const d = await api.post<AuthResponse>('/auth/dev-worker', { email, name: email.split('@')[0] });
      await login({ token: d.token, role: d.role, userId: d.userId });
    });

  const sendOtp = () =>
    run(async () => {
      if (!/^[6-9]\d{9}$/.test(phone.trim())) throw new Error(t('err.validation'));
      await api.post('/auth/send-otp', { phone: phone.trim() });
      setOtpSent(true);
    });

  const verify = () =>
    run(async () => {
      if (!/^\d{6}$/.test(otp.trim())) throw new Error(t('err.validation'));
      const d = await api.post<AuthResponse>('/auth/verify-otp', {
        phone: phone.trim(), otp: otp.trim(), name: name.trim(), role: 'CONTRACTOR', city: city.trim(),
      });
      await login({ token: d.token, role: d.role, userId: d.userId });
    });

  const seg = (v: Tab, label: string) => (
    <Pressable
      key={v}
      onPress={() => setTab(v)}
      style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9, backgroundColor: tab === v ? C.ink : 'transparent' }}
    >
      <Text style={{ fontWeight: '700', color: tab === v ? '#fff' : C.ink }}>{label}</Text>
    </Pressable>
  );

  const workerPanel = (
    <>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{t('login.workerTitle')}</Text>
      <Text style={{ color: C.steel, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>{t('login.workerNote')}</Text>
      <BigButton label={t('login.google')} onPress={google} disabled={busy} icon="logo-google" />
      {__DEV__ ? (
        <View style={{ marginTop: 28, padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, borderRadius: 12 }}>
          <Text style={{ fontWeight: '700', color: C.steel, marginBottom: 10 }}>{t('login.devTitle')}</Text>
          <Field label={t('login.devEmail')} value={devEmail} onChangeText={setDevEmail} keyboardType="email-address" />
          <BigButton outlined label={t('login.devBtn')} onPress={devLogin} disabled={busy} />
        </View>
      ) : null}
    </>
  );

  const contractorPanel = otpSent ? (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ flex: 1, fontWeight: '600', color: C.ink }}>{t('login.otpSentTo', { phone })}</Text>
        <Pressable onPress={() => setOtpSent(false)} hitSlop={8}>
          <Text style={{ fontWeight: '700', color: C.ink }}>{t('login.changeNumber')}</Text>
        </Pressable>
      </View>
      <Field label={t('login.otp')} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} big placeholder="······" />
      {__DEV__ ? <Text style={{ color: C.steel, fontSize: 12, marginBottom: 6 }}>{t('login.testHint')}</Text> : null}
      <View style={{ marginVertical: 18 }}><Divider /></View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 12 }}>{t('login.firstTime')}</Text>
      <Field label={t('login.name')} value={name} onChangeText={setName} />
      <Field label={t('login.city')} value={city} onChangeText={setCity} />
      <BigButton label={busy ? t('common.wait') : t('login.submit')} onPress={verify} disabled={busy} />
    </>
  ) : (
    <>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>{t('login.contractorTitle')}</Text>
      <Text style={{ color: C.steel, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>{t('login.contractorNote')}</Text>
      <Field label={t('login.mobile')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" prefix="+91" maxLength={10} />
      <BigButton label={busy ? t('common.wait') : t('login.sendOtp')} onPress={sendOtp} disabled={busy} />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.concrete }}>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 28 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <LanguageToggle dark />
        </View>
        <View style={{ width: 44, height: 6, borderRadius: 3, backgroundColor: C.yellow, marginTop: 12 }} />
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 40, marginTop: 18 }}>{t('login.tagline1')}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 10 }}>{t('login.tagline2')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.line, marginBottom: 20 }}>
          {seg('worker', t('login.tabWorker'))}
          {seg('contractor', t('login.tabContractor'))}
        </View>
        {tab === 'worker' ? workerPanel : contractorPanel}
      </ScrollView>
    </View>
  );
}
