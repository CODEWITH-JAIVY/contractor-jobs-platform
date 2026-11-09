import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, errText } from '../../api';
import { ApiList } from '../../components/ApiList';
import { Key, useT } from '../../i18n';
import { BigButton, SectionTitle, toast } from '../../components/ui';
import { C } from '../../theme';
import type { AdminContractor } from '../../types';

const LABEL_KEYS: Record<string, Key> = {
  workers: 'admin.workers', contractors: 'admin.contractors', verifiedContractors: 'admin.verified',
  openJobs: 'admin.openJobs', applications: 'admin.applications', follows: 'admin.follows',
};

export default function AdminScreen() {
  const { t } = useT();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  useEffect(() => {
    api.get<Record<string, number>>('/admin/stats').then(setStats).catch((e) => setStatsErr(errText(e)));
  }, []);

  const header = (
    <View>
      <View style={{ backgroundColor: '#fff', padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {stats
          ? Object.entries(stats).map(([k, v]) => (
              <View key={k} style={{ width: 104, padding: 12, borderRadius: 10, backgroundColor: C.concrete }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{v}</Text>
                <Text style={{ fontSize: 12, color: C.steel }}>{LABEL_KEYS[k] ? t(LABEL_KEYS[k]) : k}</Text>
              </View>
            ))
          : <Text style={{ color: C.steel }}>{statsErr ?? t('admin.loading')}</Text>}
      </View>
      <SectionTitle text={t('admin.pending')} />
    </View>
  );

  return (
    <ApiList<AdminContractor>
      path="/admin/contractors"
      query={{ verified: 'false' }}
      keyOf={(a) => a.userId}
      header={header}
      emptyIcon="shield-checkmark-outline"
      empty={t('admin.none')}
      renderItem={(a, reload) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Pressable onPress={() => void Linking.openURL(`tel:${a.phone}`)} hitSlop={8} style={{ paddingRight: 14 }}>
            <Ionicons name="call-outline" size={24} color={C.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>{a.companyName}</Text>
            <Text style={{ color: C.steel }}>{a.name}</Text>
            <Text style={{ color: C.steel }}>{a.phone}</Text>
          </View>
          <BigButton
            compact
            label={t('common.verify')}
            onPress={async () => {
              try {
                await api.put(`/admin/contractors/${a.userId}/verify`);
                reload();
              } catch (e) {
                toast(errText(e));
              }
            }}
          />
        </View>
      )}
    />
  );
}
