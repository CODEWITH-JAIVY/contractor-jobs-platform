import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LangProvider } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { Ads } from './src/native/ads';
import { SessionProvider, useSession } from './src/session';
import { C } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.concrete, primary: C.ink, card: C.ink, text: '#fff', border: C.line },
};

function Root() {
  const { ready, role } = useSession();

  useEffect(() => {
    Ads.setEnabled(role === 'USER');
    if (role === 'USER') void Ads.init();
    return () => Ads.setEnabled(false);
  }, [role]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.concrete }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LangProvider>
        <SessionProvider>
          <StatusBar style="light" />
          <Root />
        </SessionProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
