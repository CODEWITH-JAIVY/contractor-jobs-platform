import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../api';
import { useSession } from '../../session';
import { C } from '../../theme';
import type { WorkerProfile } from '../../types';
import ProfileSetupScreen from './ProfileSetupScreen';
import WorkerTabs from './WorkerTabs';

/** Worker login ke baad: profile bani nahi (aur skip nahi ki) to pehle setup screen, warna seedha tabs. */
export default function WorkerGate() {
  const { userId } = useSession();
  const [state, setState] = useState<'loading' | 'setup' | 'ready'>('loading');
  const skipKey = `profile_skip_${userId}`;

  useEffect(() => {
    (async () => {
      try {
        if (await SecureStore.getItemAsync(skipKey)) {
          setState('ready');
          return;
        }
        const p = await api.get<WorkerProfile>('/workers/me/profile');
        setState(p.completed ? 'ready' : 'setup');
      } catch {
        setState('ready'); // network na ho to app mat roko
      }
    })();
  }, [skipKey]);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.concrete }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }
  if (state === 'setup') {
    return (
      <ProfileSetupScreen
        onDone={() => setState('ready')}
        onSkip={() => {
          SecureStore.setItemAsync(skipKey, '1').catch(() => undefined);
          setState('ready');
        }}
      />
    );
  }
  return <WorkerTabs />;
}
