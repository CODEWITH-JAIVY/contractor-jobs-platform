import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkerProfileForm } from '../../components/WorkerProfileForm';
import { LanguageToggle } from '../../components/ui';
import { useT } from '../../i18n';
import { C } from '../../theme';

/** Worker ke pehle login ke baad: apni profile bharo. */
export default function ProfileSetupScreen({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.concrete }}>
      <View style={{ backgroundColor: C.ink, paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <LanguageToggle dark />
        </View>
        <View style={{ width: 44, height: 6, borderRadius: 3, backgroundColor: C.yellow, marginTop: 12 }} />
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 16 }}>{t('ps.title')}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 8, lineHeight: 21 }}>{t('ps.sub')}</Text>
      </View>
      <WorkerProfileForm mode="setup" onSaved={onDone} onSkip={onSkip} />
    </View>
  );
}
