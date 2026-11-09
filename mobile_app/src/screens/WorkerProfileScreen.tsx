import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, errText } from '../api';
import { useT } from '../i18n';
import { BigButton, Field, toast } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { C } from '../theme';
import type { WorkerProfile } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerProfile'>;

/** Worker ki profile: contractor apply karne par ye dekhta hai. */
export default function WorkerProfileScreen({ navigation }: Props) {
  const { t } = useT();
  const [skills, setSkills] = useState('');
  const [exp, setExp] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get<WorkerProfile>('/workers/me/profile');
        setSkills(p.skills ?? '');
        setExp(p.experienceYears != null ? String(p.experienceYears) : '');
        setAbout(p.about ?? '');
      } catch (e) {
        toast(errText(e));
      }
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const n = parseInt(exp, 10);
      await api.put('/workers/me/profile', {
        skills: skills.trim(),
        experienceYears: Number.isNaN(n) ? null : n,
        about: about.trim(),
      });
      toast(t('wp.saved'));
      navigation.goBack();
    } catch (e) {
      toast(errText(e));
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: C.steel, lineHeight: 20, marginBottom: 14 }}>
        {t('wp.intro')}
      </Text>
      <Field label={t('wp.skills')} value={skills} onChangeText={setSkills} />
      <Field label={t('wp.exp')} value={exp} onChangeText={setExp} keyboardType="number-pad" />
      <Field label={t('wp.about')} value={about} onChangeText={setAbout} multiline />
      <BigButton label={busy ? t('common.wait') : t('wp.save')} onPress={save} disabled={busy} />
    </ScrollView>
  );
}
