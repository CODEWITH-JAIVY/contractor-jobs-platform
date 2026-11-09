import React, { ComponentProps, useState } from 'react';
import {
  Alert, KeyboardTypeOptions, Modal, Platform, Pressable, StyleProp, StyleSheet, Text, TextInput, ToastAndroid,
  View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lang, tr, useT } from '../i18n';
import { C } from '../theme';
import type { ApplicationStatus, JobStatus } from '../types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG);
  else Alert.alert('', msg);
}

export function confirm(title: string, message: string, okText: string, destructive = false): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: tr('common.no'), style: 'cancel', onPress: () => resolve(false) },
        { text: okText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

type BtnProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  outlined?: boolean;
  danger?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BigButton({ label, onPress, icon, outlined, danger, disabled, compact, style }: BtnProps) {
  const fg = disabled ? C.steel : danger ? C.red : C.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        compact && { height: 44 },
        outlined || danger
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: disabled ? C.line : danger ? C.red : C.ink }
          : { backgroundColor: disabled ? C.line : C.yellow },
        pressed && !disabled && { opacity: 0.75 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={fg} style={{ marginRight: 8 }} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: ApplicationStatus | JobStatus }) {
  const { t } = useT();
  switch (status) {
    case 'ACCEPTED':
      return <Pill text={t('status.accepted')} bg={C.lightGreen} fg={C.green} />;
    case 'REJECTED':
      return <Pill text={t('status.rejected')} bg={C.lightRed} fg={C.red} />;
    case 'CLOSED':
      return <Pill text={t('status.closed')} bg={C.line} fg={C.steel} />;
    case 'OPEN':
      return <Pill text={t('status.open')} bg={C.lightGreen} fg={C.green} />;
    default:
      return <Pill text={t('status.applied')} bg={C.paleYellow} fg="#7A5B00" />;
  }
}

export function MetaRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 220 }}>
      <Ionicons name={icon} size={16} color={C.steel} />
      <Text numberOfLines={1} style={{ color: C.steel, fontSize: 13, marginLeft: 4, flexShrink: 1 }}>
        {text}
      </Text>
    </View>
  );
}

export function InfoChip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.concrete, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Ionicons name={icon} size={16} color={C.ink} />
      <Text style={{ fontSize: 13, fontWeight: '600', marginLeft: 6, color: C.ink }}>{text}</Text>
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.yellow, fontSize: size * 0.42, fontWeight: '800' }}>{name ? name[0].toUpperCase() : '?'}</Text>
    </View>
  );
}

export function SalaryBadge({ salary }: { salary?: number | null }) {
  const { t } = useT();
  if (salary == null) return <Text style={{ color: C.steel, fontSize: 13 }}>{t('job.negotiable')}</Text>;
  return (
    <View style={{ backgroundColor: C.yellow, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>₹{salary}</Text>
    </View>
  );
}

export function SectionTitle({ text }: { text: string }) {
  return <Text style={{ fontSize: 14, fontWeight: '700', color: C.steel, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>{text}</Text>;
}

export function EmptyState({ icon, text, action }: { icon: IconName; text: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.paleYellow, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={30} color={C.ink} />
      </View>
      <Text style={{ marginTop: 16, fontSize: 16, color: C.steel, textAlign: 'center', lineHeight: 22 }}>{text}</Text>
      {action}
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  maxLength?: number;
  prefix?: string;
  editable?: boolean;
  placeholder?: string;
  big?: boolean;
};

export function Field({ label, value, onChangeText, keyboardType, multiline, maxLength, prefix, editable = true, placeholder, big }: FieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, color: C.steel, marginBottom: 6, fontWeight: '600' }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', backgroundColor: editable ? '#fff' : C.concrete,
          borderRadius: 10, borderWidth: focus ? 2 : 1, borderColor: focus ? C.ink : C.line, paddingHorizontal: 14,
        }}
      >
        {prefix ? <Text style={{ fontSize: 16, color: C.steel, marginRight: 6 }}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={C.line}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, fontSize: big ? 26 : 16, color: C.ink, paddingVertical: 12, minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? 'top' : 'center', textAlign: big ? 'center' : 'left',
            fontWeight: big ? '700' : '400', letterSpacing: big ? 10 : 0,
          }}
        />
      </View>
    </View>
  );
}

/** Neeche se upar aane wala sheet (day entry, paisa mila, rate set). */
export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        </Pressable>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 24, maxHeight: '90%' }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** English | हिन्दी toggle. dark=true gehre background (login header) ke liye. */
export function LanguageToggle({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useT();
  const opt = (l: Lang, label: string) => (
    <Pressable
      key={l}
      onPress={() => setLang(l)}
      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: lang === l ? C.yellow : 'transparent' }}
    >
      <Text style={{ fontWeight: '700', fontSize: 13, color: lang === l ? C.ink : dark ? '#fff' : C.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.4)' : C.line, borderRadius: 16, padding: 2, alignSelf: 'flex-start' }}>
      {opt('en', 'English')}
      {opt('hi', 'हिन्दी')}
    </View>
  );
}

export const Divider = () => <View style={{ height: 1, backgroundColor: C.line }} />;

const s = StyleSheet.create({
  btn: { height: 50, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
