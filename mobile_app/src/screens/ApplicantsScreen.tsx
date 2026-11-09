import React from 'react';
import { Linking, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, errText } from '../api';
import { useT } from '../i18n';
import { ApiList } from '../components/ApiList';
import { Avatar, BigButton, InfoChip, MetaRow, StatusPill, toast } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { C } from '../theme';
import type { Applicant, ApplicationStatus } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Applicants'>;

export default function ApplicantsScreen({ route }: Props) {
  const { jobId } = route.params;
  const { t } = useT();

  const setStatus = async (a: Applicant, status: ApplicationStatus, reload: () => void) => {
    try {
      await api.put(`/applications/${a.applicationId}/status`, { status });
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };

  return (
    <ApiList<Applicant>
      path={`/jobs/${jobId}/applicants`}
      keyOf={(a) => a.applicationId}
      emptyIcon="people-outline"
      empty={t('ap.empty')}
      renderItem={(a, reload) => (
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={a.name} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{a.name}</Text>
              <Text style={{ color: C.steel }}>{a.phone}</Text>
              {a.city ? <MetaRow icon="location-outline" text={a.city} /> : null}
            </View>
            <StatusPill status={a.status} />
          </View>
          {a.skills || a.experienceYears != null ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {a.skills ? <InfoChip icon="construct-outline" text={a.skills} /> : null}
              {a.experienceYears != null ? <InfoChip icon="trending-up-outline" text={t('cp.experience', { n: a.experienceYears })} /> : null}
            </View>
          ) : null}
          {a.about ? <Text style={{ marginTop: 8, color: C.steel, lineHeight: 20 }}>{a.about}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <BigButton compact outlined icon="call" label={t('common.call')} style={{ flex: 1 }} onPress={() => void Linking.openURL(`tel:${a.phone}`)} />
            {a.status !== 'ACCEPTED' ? (
              <BigButton compact label={t('ap.select')} style={{ flex: 1 }} onPress={() => void setStatus(a, 'ACCEPTED', reload)} />
            ) : null}
            {a.status !== 'REJECTED' ? (
              <BigButton compact danger label={t('ap.reject')} style={{ flex: 1 }} onPress={() => void setStatus(a, 'REJECTED', reload)} />
            ) : null}
          </View>
        </View>
      )}
    />
  );
}
