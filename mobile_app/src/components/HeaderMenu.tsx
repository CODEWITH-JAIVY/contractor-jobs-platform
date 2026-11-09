import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errText } from '../api';
import { useT } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../session';
import { C } from '../theme';
import { LanguageToggle, confirm, toast } from './ui';

/** Header ke top-right me menu: Meri profile (worker), Logout, Account delete. */
export function HeaderMenu() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { role, logout } = useSession();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const item = (label: string, onPress: () => void, color: string = C.ink) => (
    <Pressable
      onPress={() => {
        setOpen(false);
        onPress();
      }}
      android_ripple={{ color: C.line }}
      style={{ paddingHorizontal: 18, paddingVertical: 14 }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600', color }}>{label}</Text>
    </Pressable>
  );

  const deleteAccount = async () => {
    const ok = await confirm(t('menu.deleteTitle'), t('menu.deleteMsg'), t('menu.deleteYes'), true);
    if (!ok) return;
    try {
      await api.del('/users/me');
      await logout();
    } catch (e) {
      toast(errText(e));
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={12} style={{ paddingHorizontal: 8 }}>
        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: 'absolute', top: insets.top + 52, right: 10, backgroundColor: '#fff', borderRadius: 10, minWidth: 200,
              elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
            }}
          >
            {role === 'USER' ? item(t('menu.profile'), () => nav.navigate('WorkerProfile')) : null}
            <View style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
              <Text style={{ fontSize: 12, color: C.steel, marginBottom: 6 }}>{t('menu.language')}</Text>
              <LanguageToggle />
            </View>
            {item(t('menu.logout'), () => void logout())}
            {role !== 'ADMIN' ? item(t('menu.delete'), () => void deleteAccount(), C.red) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
