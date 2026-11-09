import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api } from './src/api';
import { LangProvider, useT } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { Ads } from './src/native/ads';
import { SessionProvider, useSession } from './src/session';
import { C } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: C.concrete, primary: C.ink, card: C.ink, text: '#fff', border: C.line },
};

function Root() {
  const { ready, role, token } = useSession();
  const { lang } = useT();
  Ads.enabled = role === 'USER'; // ads sirf worker side par

  // login hone par / bhasha badalne par backend ko bata do (notifications isi bhasha me aate hain)
  useEffect(() => {
    if (token) api.put('/users/me/language', { lang }).catch(() => undefined);
  }, [token, lang]);

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
  useEffect(() => {
    void Ads.init();
  }, []);
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
