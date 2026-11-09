import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tr, useT } from '../i18n';
import { Ads } from '../native/ads';
import type { RootStackParamList } from '../navigation/types';
import { C, inr, timeAgo } from '../theme';
import type { Job } from '../types';
import { MetaRow, SalaryBadge, StatusPill, toast } from './ui';

export function JobTile({ job }: { job: Job }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useT();
  return (
    <Pressable
      onPress={() => {
        Ads.onJobView();
        nav.navigate('JobDetail', { job });
      }}
      android_ripple={{ color: C.line }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14 }}
    >
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ fontSize: 17, fontWeight: '700', color: C.ink }}>{job.title}</Text>
        <Text style={{ color: C.steel, fontSize: 14, marginTop: 4 }}>{job.contractorName}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, columnGap: 14, rowGap: 4 }}>
          <MetaRow icon="location-outline" text={job.location} />
          {job.workersNeeded != null ? <MetaRow icon="people-outline" text={t('job.workers', { n: job.workersNeeded })} /> : null}
          <MetaRow icon="time-outline" text={timeAgo(job.createdAt)} />
        </View>
      </View>
      <View style={{ marginLeft: 12 }}>{job.status === 'CLOSED' ? <StatusPill status="CLOSED" /> : <SalaryBadge salary={job.salary} />}</View>
    </Pressable>
  );
}

/** WhatsApp par job share. Link ke liye EXPO_PUBLIC_APP_LINK (Play Store URL) set karo. */
const APP_LINK = process.env.EXPO_PUBLIC_APP_LINK ?? '';

export async function shareJob(job: Job): Promise<void> {
  const sal = job.salary == null ? '' : `\n💰 ${inr(job.salary)}`;
  const text =
    `🔨 ${job.title}\n📍 ${job.location}${sal}\n👷 ${job.contractorName}\n\n` +
    `${tr('share.cta')}${APP_LINK ? `:\n${APP_LINK}` : ''}`;
  try {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  } catch {
    toast(tr('share.fail'));
  }
}
