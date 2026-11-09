import React, { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, ApiError, errText } from '../api';
import { useT } from '../i18n';
import { shareJob } from '../components/job';
import { Avatar, BigButton, IconName, SectionTitle, StatusPill, toast } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../session';
import { C, timeAgo } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ navigation, route }: Props) {
  const { job } = route.params;
  const { role } = useSession();
  const { t } = useT();
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = job.status === 'OPEN';
  const canApply = role === 'USER' && open;
  const desc = (job.description ?? '').trim();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => void shareJob(job)} hitSlop={12} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="share-social-outline" size={22} color="#fff" />
        </Pressable>
      ),
    });
  }, [navigation, job]);

  const apply = async () => {
    setBusy(true);
    try {
      await api.post(`/jobs/${job.id}/apply`);
      setApplied(true);
      toast(t('job.applyDone'));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setApplied(true);
      toast(errText(e));
    }
    setBusy(false);
  };

  const info = (icon: IconName, text: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <Ionicons name={icon} size={20} color={C.steel} />
      <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, color: C.ink }}>{text}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.concrete }}>
      <ScrollView>
        <View style={{ backgroundColor: '#fff', padding: 16 }}>
          {!open ? <View style={{ marginBottom: 8 }}><StatusPill status="CLOSED" /></View> : null}
          <Text style={{ fontSize: 24, fontWeight: '800', lineHeight: 30, color: C.ink }}>{job.title}</Text>
        </View>
        <View style={{ backgroundColor: C.yellow, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.ink }}>{t('job.salary')}</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink }}>{job.salary == null ? t('job.salaryNeg') : `₹${job.salary}`}</Text>
        </View>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10 }}>
          {info('location-outline', job.location)}
          {job.workersNeeded != null ? info('people-outline', t('job.needed', { n: job.workersNeeded })) : null}
          {info('time-outline', t('job.posted', { time: timeAgo(job.createdAt) }))}
        </View>
        <Pressable
          onPress={() => navigation.navigate('Contractor', { userId: job.contractorId })}
          android_ripple={{ color: C.line }}
          style={{ backgroundColor: '#fff', marginTop: 8, flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <Avatar name={job.contractorName} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{job.contractorName}</Text>
            <Text style={{ color: C.steel }}>{t('job.viewContractor')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.steel} />
        </Pressable>
        {desc ? (
          <>
            <SectionTitle text={t('job.about')} />
            <View style={{ backgroundColor: '#fff', padding: 16 }}>
              <Text style={{ fontSize: 15, lineHeight: 22, color: C.ink }}>{desc}</Text>
            </View>
          </>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>
      {canApply ? (
        <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, padding: 12 }}>
          <BigButton
            label={applied ? t('job.applied') : t('job.apply')}
            icon={applied ? 'checkmark-circle' : 'send'}
            onPress={apply}
            disabled={applied || busy}
          />
        </View>
      ) : null}
    </View>
  );
}
