import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HeaderMenu } from '../components/HeaderMenu';
import AdminScreen from '../screens/admin/AdminScreen';
import ApplicantsScreen from '../screens/ApplicantsScreen';
import ContractorScreen from '../screens/ContractorScreen';
import ContractorTabs from '../screens/contractor/ContractorTabs';
import JobDetailScreen from '../screens/JobDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import WorkerProfileScreen from '../screens/WorkerProfileScreen';
import WorkerTabs from '../screens/worker/WorkerTabs';
import { useT } from '../i18n';
import { useSession } from '../session';
import { C } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { token, role } = useSession();
  const { t } = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.ink },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: C.concrete },
      }}
    >
      {!token ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          {role === 'ADMIN' ? (
            <Stack.Screen name="AdminHome" component={AdminScreen} options={{ title: t('title.admin'), headerRight: () => <HeaderMenu /> }} />
          ) : role === 'CONTRACTOR' ? (
            <Stack.Screen name="ContractorHome" component={ContractorTabs} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="WorkerHome" component={WorkerTabs} options={{ headerShown: false }} />
          )}
          <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: t('title.jobDetail') }} />
          <Stack.Screen name="Contractor" component={ContractorScreen} options={{ title: t('title.contractor') }} />
          <Stack.Screen name="Applicants" component={ApplicantsScreen} options={({ route }) => ({ title: route.params.title })} />
          <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ title: t('title.profile') }} />
        </>
      )}
    </Stack.Navigator>
  );
}
