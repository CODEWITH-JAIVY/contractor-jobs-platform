import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { api, errText } from '../api';
import { useT } from '../i18n';
import { ApiList } from '../components/ApiList';
import { JobTile } from '../components/job';
import { Avatar, BigButton, EmptyState, InfoChip, MetaRow, SectionTitle, toast } from '../components/ui';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../session';
import { C } from '../theme';
import type { ContractorInfo, Job } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Contractor'>;

export default function ContractorScreen({ route }: Props) {
  const { userId } = route.params;
  const { role } = useSession();
  const { t } = useT();
  const [info, setInfo] = useState<ContractorInfo | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setInfo(await api.get<ContractorInfo>(`/contractors/${userId}`));
        if (role === 'USER') {
          const f = await api.get<ContractorInfo[]>('/follow/my');
          setFollowing(f.some((c) => c.userId === userId));
        }
      } catch (e) {
        setErr(errText(e));
      }
    })();
  }, [userId, role]);

  const toggle = async () => {
    if (!info) return;
    try {
      if (following) {
        await api.del(`/follow/${userId}`);
        setInfo({ ...info, followers: info.followers - 1 });
      } else {
        await api.post(`/follow/${userId}`);
        setInfo({ ...info, followers: info.followers + 1 });
      }
      setFollowing(!following);
    } catch (e) {
      toast(errText(e));
    }
  };

  if (err) return <View style={{ flex: 1 }}><EmptyState icon="alert-circle-outline" text={err} /></View>;
  if (!info) return <View style={{ flex: 1 }} />;

  const header = (
    <View>
      <View style={{ backgroundColor: '#fff', padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={info.companyName} size={56} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.ink, flexShrink: 1 }}>{info.companyName}</Text>
              {info.verified ? <Ionicons name="checkmark-circle" size={20} color={C.green} style={{ marginLeft: 6 }} /> : null}
            </View>
            <Text style={{ color: C.steel }}>{info.name}</Text>
            {info.city ? <MetaRow icon="location-outline" text={info.city} /> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {info.workType ? <InfoChip icon="construct-outline" text={info.workType} /> : null}
          {info.experienceYears != null ? <InfoChip icon="trending-up-outline" text={t('cp.experience', { n: info.experienceYears })} /> : null}
          <InfoChip icon="people-outline" text={t('cp.followers', { n: info.followers })} />
        </View>
        {info.about ? <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 21, color: C.ink }}>{info.about}</Text> : null}
        {following !== null ? (
          <View style={{ marginTop: 16 }}>
            {following ? (
              <BigButton label={t('cp.following')} icon="checkmark" outlined onPress={toggle} />
            ) : (
              <BigButton label={t('cp.follow')} icon="add" onPress={toggle} />
            )}
          </View>
        ) : null}
      </View>
      <SectionTitle text={t('cp.openJobs')} />
    </View>
  );

  return (
    <ApiList<Job>
      path={`/jobs/by-contractor/${userId}`}
      keyOf={(j) => j.id}
      header={header}
      empty={t('cp.noJobs')}
      emptyIcon="briefcase-outline"
      renderItem={(j) => <JobTile job={j} />}
    />
  );
}
