import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errText } from '../api';
import { BigButton, Divider, Field, IconName, LanguageToggle, toast } from '../components/ui';
import { useT } from '../i18n';
import { googleIdToken } from '../native/google';
import { useSession } from '../session';
import { C } from '../theme';
import type { AuthResponse, GoogleAuthResponse, Role } from '../types';

export default function LoginScreen() {
  const { login } = useSession();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null); // Google se aaye naye user ke liye
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast(errText(e));
    }
    setBusy(false);
  };

  const send = () =>
    run(async () => {
      await api.post('/auth/send-otp', { phone: phone.trim() });
      setOtpSent(true);
    });

  const verify = () =>
    run(async () => {
      const body = { phone: phone.trim(), otp: otp.trim(), name: name.trim(), role, city: city.trim() };
      const d = googleToken
        ? await api.post<GoogleAuthResponse>('/auth/google', { ...body, idToken: googleToken })
        : await api.post<AuthResponse>('/auth/verify-otp', body);
      if (d.token && d.role && d.userId != null) await login({ token: d.token, role: d.role, userId: d.userId });
    });

  const google = () =>
    run(async () => {
      const tok = await googleIdToken();
      if (!tok) return; // user ne cancel kiya
      const d = await api.post<GoogleAuthResponse>('/auth/google', { idToken: tok });
      if (d.needsPhone) {
        setGoogleToken(tok);
        setGoogleEmail(d.email);
        if (!name) setName(d.name ?? '');
        return;
      }
      if (d.token && d.role && d.userId != null) await login({ token: d.token, role: d.role, userId: d.userId });
    });

  const cancelGoogle = () => {
    setGoogleToken(null);
    setGoogleEmail(null);
    setOtpSent(false);
  };

  const roleTile = (value: Role, icon: IconName, title: string, sub: string) => {
    const sel = role === value;
    return (
      <Pressable
        key={value}
        onPress={() => setRole(value)}
        style={{
          flex: 1, padding: 14, borderRadius: 12, backgroundColor: sel ? C.paleYellow : '#fff',
          borderWidth: sel ? 2 : 1, borderColor: sel ? C.ink : C.line,
        }}
      >
        <Ionicons name={icon} size={28} color={C.ink} />
        <Text style={{ fontWeight: '700', fontSize: 15, marginTop: 8, color: C.ink }}>{title}</Text>
        <Text style={{ color: C.steel, fontSize: 12 }}>{sub}</Text>
      </Pressable>
    );
  };

  const phoneField = (
    <Field label={t('login.mobile')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" prefix="+91" maxLength={10} />
  );
  const sendBtn = <BigButton label={busy ? t('common.wait') : t('login.sendOtp')} onPress={send} disabled={busy} />;

  const phoneStep = googleToken ? (
    <>
      <Text style={{ fontWeight: '700', color: C.ink }}>{t('login.googleFound', { email: googleEmail ?? '' })}</Text>
      <Text style={{ color: C.steel, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>{t('login.googleNote')}</Text>
      {phoneField}
      {sendBtn}
      <Pressable onPress={cancelGoogle} style={{ alignItems: 'center', padding: 14 }}>
        <Text style={{ fontWeight: '700', color: C.ink }}>{t('login.back')}</Text>
      </Pressable>
    </>
  ) : (
    <>
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 14 }}>{t('login.start')}</Text>
      {phoneField}
      {sendBtn}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
        <View style={{ flex: 1 }}><Divider /></View>
        <Text style={{ color: C.steel, marginHorizontal: 12 }}>{t('login.or')}</Text>
        <View style={{ flex: 1 }}><Divider /></View>
      </View>
      <BigButton label={t('login.google')} onPress={google} disabled={busy} outlined icon="logo-google" />
    </>
  );

  const otpStep = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ flex: 1, fontWeight: '600', color: C.ink }}>{t('login.otpSentTo', { phone })}</Text>
        <Pressable onPress={() => setOtpSent(false)} hitSlop={8}>
          <Text style={{ fontWeight: '700', color: C.ink }}>{t('login.changeNumber')}</Text>
        </Pressable>
      </View>
      <Field label={t('login.otp')} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} big placeholder="······" />
      <Text style={{ color: C.steel, fontSize: 12, marginBottom: 6 }}>{t('login.testHint')}</Text>
      <View style={{ marginVertical: 18 }}><Divider /></View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 12 }}>{t('login.firstTime')}</Text>
      <Field label={t('login.name')} value={name} onChangeText={setName} />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        {roleTile('USER', 'construct-outline', t('login.roleWorker'), t('login.roleWorkerSub'))}
        {roleTile('CONTRACTOR', 'hammer-outline', t('login.roleContractor'), t('login.roleContractorSub'))}
      </View>
      <Field label={t('login.city')} value={city} onChangeText={setCity} />
      <BigButton label={busy ? t('common.wait') : t('login.submit')} onPress={verify} disabled={busy} />
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
        {otpSent ? otpStep : phoneStep}
      </ScrollView>
    </View>
  );
}
