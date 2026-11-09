import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, errText } from '../../api';
import { ApiList } from '../../components/ApiList';
import { HeaderMenu } from '../../components/HeaderMenu';
import { JobTile } from '../../components/job';
import { IconName, MetaRow, StatusPill, toast } from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import { useT } from '../../i18n';
import { startPush } from '../../native/push';
import { useSession } from '../../session';
import { C, timeAgo } from '../../theme';
import type { Job, MyApplication, NotificationItem } from '../../types';
import AttendanceScreen from './AttendanceScreen';

const Tab = createBottomTabNavigator();

function FeedScreen() {
  const { t } = useT();
  return (
    <ApiList<Job>
      path="/jobs/feed"
      keyOf={(j) => j.id}
      adEvery={5}
      emptyIcon="newspaper-outline"
      empty={t('feed.empty')}
      renderItem={(j) => <JobTile job={j} />}
    />
  );
}

function JobsScreen() {
  const { t } = useT();
  const [text, setText] = useState('');
  const [city, setCity] = useState('');
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={20} color={C.steel} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('jobs.search')}
            placeholderTextColor={C.steel}
            returnKeyType="search"
            onSubmitEditing={() => setCity(text.trim())}
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: C.ink }}
          />
          {text ? (
            <Pressable onPress={() => { setText(''); setCity(''); }} hitSlop={10}>
              <Ionicons name="close" size={20} color={C.steel} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <ApiList<Job>
          path="/jobs"
          query={city ? { city } : undefined}
          keyOf={(j) => j.id}
          adEvery={5}
          emptyIcon="search-outline"
          empty={city ? t('jobs.noneCity', { city }) : t('jobs.none')}
          renderItem={(j) => <JobTile job={j} />}
        />
      </View>
    </View>
  );
}

function AlertsScreen() {
  const { t } = useT();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ApiList<NotificationItem>
      path="/notifications"
      keyOf={(n) => n.id}
      emptyIcon="notifications-outline"
      empty={t('alerts.empty')}
      renderItem={(n, reload) => (
        <Pressable
          android_ripple={{ color: C.line }}
          style={{ flexDirection: 'row', padding: 16, backgroundColor: n.read ? '#fff' : C.paleYellow }}
          onPress={async () => {
            try {
              await api.put(`/notifications/${n.id}/read`);
              if (n.jobId != null) {
                const job = await api.get<Job>(`/jobs/${n.jobId}`);
                nav.navigate('JobDetail', { job });
              }
              reload();
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.read ? C.concrete : C.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="briefcase-outline" size={20} color={C.ink} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: n.read ? '600' : '800', color: C.ink }}>{n.title}</Text>
            {n.body ? <Text style={{ color: C.steel, marginTop: 2 }}>{n.body}</Text> : null}
            <Text style={{ color: C.steel, fontSize: 12, marginTop: 4 }}>{timeAgo(n.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

function AppliedScreen() {
  const { t } = useT();
  return (
    <ApiList<MyApplication>
      path="/applications/my"
      keyOf={(a) => a.id}
      emptyIcon="document-text-outline"
      empty={t('applied.empty')}
      renderItem={(a) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{a.jobTitle}</Text>
            <View style={{ marginTop: 4 }}><MetaRow icon="location-outline" text={a.location} /></View>
          </View>
          <StatusPill status={a.status} />
        </View>
      )}
    />
  );
}

function TabIcon({ active, inactive, focused }: { active: IconName; inactive: IconName; focused: boolean }) {
  return (
    <View style={{ width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? C.yellow : 'transparent' }}>
      <Ionicons name={focused ? active : inactive} size={22} color={focused ? C.ink : C.steel} />
    </View>
  );
}

export const tabScreenOptions = {
  headerStyle: { backgroundColor: C.ink },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 19 },
  headerRight: () => <HeaderMenu />,
  tabBarActiveTintColor: C.ink,
  tabBarInactiveTintColor: C.steel,
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
  tabBarStyle: { backgroundColor: '#fff', borderTopColor: C.line },
};

export default function WorkerTabs() {
  const { userId } = useSession();
  const { t } = useT();

  useEffect(() => {
    if (userId != null) void startPush(userId, (token) => api.put('/users/me/fcm-token', { token }));
  }, [userId]);

  const icon = (active: IconName, inactive: IconName) =>
    ({ focused }: { focused: boolean }) => <TabIcon active={active} inactive={inactive} focused={focused} />;

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: t('title.feed'), tabBarLabel: t('tab.feed'), tabBarIcon: icon('newspaper', 'newspaper-outline') }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: t('title.jobs'), tabBarLabel: t('tab.jobs'), tabBarIcon: icon('briefcase', 'briefcase-outline') }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: t('tab.alerts'), tabBarLabel: t('tab.alerts'), tabBarIcon: icon('notifications', 'notifications-outline') }} />
      <Tab.Screen name="Applied" component={AppliedScreen} options={{ title: t('title.applied'), tabBarLabel: t('tab.applied'), tabBarIcon: icon('document-text', 'document-text-outline') }} />
      <Tab.Screen name="Hisaab" component={AttendanceScreen} options={{ title: t('title.ledger'), tabBarLabel: t('tab.ledger'), tabBarIcon: icon('calendar', 'calendar-outline') }} />
    </Tab.Navigator>
  );
}
