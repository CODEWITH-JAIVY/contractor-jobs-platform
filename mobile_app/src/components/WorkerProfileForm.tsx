import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { api, errText } from '../api';
import { useT } from '../i18n';
import { C } from '../theme';
import type { WorkerProfile } from '../types';
import { BigButton, Field, toast } from './ui';

type Props = {
  mode: 'setup' | 'edit';
  onSaved: () => void;
  onSkip?: () => void;
};

/** Worker profile: naam, shahar, (optional) phone, skills, experience, about. Setup aur edit dono me yahi. */
export function WorkerProfileForm({ mode, onSaved, onSkip }: Props) {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [exp, setExp] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get<WorkerProfile>('/workers/me/profile');
        setName(p.name ?? '');
        setCity(p.city ?? '');
        setPhone(p.phone ?? '');
        setSkills(p.skills ?? '');
        setExp(p.experienceYears != null ? String(p.experienceYears) : '');
        setAbout(p.about ?? '');
      } catch (e) {
        toast(errText(e));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!name.trim() || !city.trim()) {
      toast(t('ps.need'));
      return;
    }
    setBusy(true);
    try {
      if ((phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) ||
          (exp.trim() && (!/^\d+$/.test(exp.trim()) || Number(exp) > 60))) throw new Error(t('err.validation'));
      const n = exp.trim() ? Number(exp) : NaN;
      await api.put('/workers/me/profile', {
        name: name.trim(),
        city: city.trim(),
        phone: phone.trim(),
        skills: skills.trim(),
        experienceYears: Number.isNaN(n) ? null : n,
        about: about.trim(),
      });
      toast(t('wp.saved'));
      onSaved();
    } catch (e) {
      toast(errText(e));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {mode === 'edit' ? <Text style={{ color: C.steel, lineHeight: 20, marginBottom: 14 }}>{t('wp.intro')}</Text> : null}
      <Field label={t('login.name')} value={name} onChangeText={setName} maxLength={100} />
      <Field label={t('login.city')} value={city} onChangeText={setCity} maxLength={100} />
      <Field label={t('ps.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" prefix="+91" maxLength={10} />
      <Text style={{ color: C.steel, fontSize: 12, marginTop: -4, marginBottom: 14 }}>{t('ps.phoneHint')}</Text>
      <Field label={t('wp.skills')} value={skills} onChangeText={setSkills} maxLength={200} />
      <Field label={t('wp.exp')} value={exp} onChangeText={setExp} keyboardType="number-pad" />
      <Field label={t('wp.about')} value={about} onChangeText={setAbout} maxLength={1000} multiline />
      <BigButton
        label={busy ? t('common.wait') : mode === 'setup' ? t('ps.continue') : t('wp.save')}
        onPress={save}
        disabled={busy}
      />
      {onSkip ? (
        <Pressable onPress={onSkip} style={{ alignItems: 'center', padding: 16 }}>
          <Text style={{ fontWeight: '700', color: C.ink }}>{t('ps.skip')}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
