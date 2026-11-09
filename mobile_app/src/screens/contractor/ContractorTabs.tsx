import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, errText } from '../../api';
import { ApiList } from '../../components/ApiList';
import { shareJob } from '../../components/job';
import { BigButton, Field, IconName, MetaRow, StatusPill, toast } from '../../components/ui';
import type { ContractorTabParamList, RootStackParamList } from '../../navigation/types';
import { useT } from '../../i18n';
import { useSession } from '../../session';
import { C, timeAgo } from '../../theme';
import type { ContractorInfo, Job } from '../../types';
import { tabScreenOptions } from '../worker/WorkerTabs';

const Tab = createBottomTabNavigator<ContractorTabParamList>();

function MyJobsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useT();
  return (
    <ApiList<Job>
      path="/jobs/mine"
      keyOf={(j) => j.id}
      emptyIcon="clipboard-outline"
      empty={t('cj.empty')}
      renderItem={(j, reload) => (
        <Pressable
          onPress={() => nav.navigate('Applicants', { jobId: j.id, title: j.title })}
          android_ripple={{ color: C.line }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{j.title}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4, marginTop: 6 }}>
              <StatusPill status={j.status} />
              <MetaRow icon="location-outline" text={j.location} />
              <MetaRow icon="time-outline" text={timeAgo(j.createdAt)} />
            </View>
          </View>
          {j.status === 'OPEN' ? (
            <>
              <Pressable onPress={() => void shareJob(j)} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="share-social-outline" size={22} color={C.ink} />
              </Pressable>
              <Pressable
                hitSlop={8}
                style={{ padding: 8 }}
                onPress={async () => {
                  try {
                    await api.put(`/jobs/${j.id}/close`);
                    reload();
                  } catch (e) {
                    toast(errText(e));
                  }
                }}
              >
                <Text style={{ color: C.red, fontWeight: '700' }}>{t('cj.close')}</Text>
              </Pressable>
            </>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={C.steel} style={{ marginRight: 8 }} />
          )}
        </Pressable>
      )}
    />
  );
}

function PostJobScreen() {
  const nav = useNavigation<BottomTabNavigationProp<ContractorTabParamList>>();
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('');
  const [salary, setSalary] = useState('');
  const [workers, setWorkers] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async () => {
    setBusy(true);
    try {
      const sal = parseInt(salary, 10);
      const w = parseInt(workers, 10);
      await api.post('/jobs', {
        title: title.trim(), location: loc.trim(), description: desc.trim(),
        salary: Number.isNaN(sal) ? null : sal, workersNeeded: Number.isNaN(w) ? null : w,
      });
      setTitle(''); setLoc(''); setSalary(''); setWorkers(''); setDesc('');
      toast(t('pj.done'));
      nav.navigate('MyJobs');
    } catch (e) {
      toast(errText(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: C.steel, lineHeight: 20, marginBottom: 14 }}>
        {t('pj.intro')}
      </Text>
      <Field label={t('pj.title')} value={title} onChangeText={setTitle} />
      <Field label={t('pj.location')} value={loc} onChangeText={setLoc} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label={t('pj.salary')} value={salary} onChangeText={setSalary} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label={t('pj.workers')} value={workers} onChangeText={setWorkers} keyboardType="number-pad" /></View>
      </View>
      <Field label={t('pj.details')} value={desc} onChangeText={setDesc} multiline />
      <BigButton icon="megaphone-outline" label={busy ? t('common.wait') : t('pj.submit')} onPress={post} disabled={busy} />
    </ScrollView>
  );
}

function ProfileScreen() {
  const { userId } = useSession();
  const { t } = useT();
  const [company, setCompany] = useState('');
  const [work, setWork] = useState('');
  const [exp, setExp] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get<ContractorInfo>(`/contractors/${userId}`);
        setCompany(p.companyName ?? '');
        setWork(p.workType ?? '');
        setExp(p.experienceYears != null ? String(p.experienceYears) : '');
        setAbout(p.about ?? '');
      } catch {
        // profile abhi bani nahi
      }
    })();
  }, [userId]);

  const save = async () => {
    setBusy(true);
    try {
      const n = parseInt(exp, 10);
      await api.put('/contractors/profile', {
        companyName: company.trim(), workType: work.trim(), experienceYears: Number.isNaN(n) ? null : n, about: about.trim(),
      });
      toast(t('cpf.saved'));
    } catch (e) {
      toast(errText(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: C.steel, lineHeight: 20, marginBottom: 14 }}>
        {t('cpf.intro')}
      </Text>
      <Field label={t('cpf.company')} value={company} onChangeText={setCompany} />
      <Field label={t('cpf.workType')} value={work} onChangeText={setWork} />
      <Field label={t('cpf.exp')} value={exp} onChangeText={setExp} keyboardType="number-pad" />
      <Field label={t('cpf.about')} value={about} onChangeText={setAbout} multiline />
      <BigButton label={busy ? t('common.wait') : t('cpf.save')} onPress={save} disabled={busy} />
    </ScrollView>
  );
}

function TabIcon({ active, inactive, focused }: { active: IconName; inactive: IconName; focused: boolean }) {
  return (
    <View style={{ width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? C.yellow : 'transparent' }}>
      <Ionicons name={focused ? active : inactive} size={22} color={focused ? C.ink : C.steel} />
    </View>
  );
}

export default function ContractorTabs() {
  const { t } = useT();
  const icon = (active: IconName, inactive: IconName) =>
    ({ focused }: { focused: boolean }) => <TabIcon active={active} inactive={inactive} focused={focused} />;
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="MyJobs" component={MyJobsScreen} options={{ title: t('tab.myJobs'), tabBarIcon: icon('list', 'list-outline') }} />
      <Tab.Screen name="PostJob" component={PostJobScreen} options={{ title: t('title.postJob'), tabBarLabel: t('tab.postJob'), tabBarIcon: icon('add-circle', 'add-circle-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('title.profile'), tabBarLabel: t('tab.profile'), tabBarIcon: icon('person', 'person-outline') }} />
    </Tab.Navigator>
  );
}
