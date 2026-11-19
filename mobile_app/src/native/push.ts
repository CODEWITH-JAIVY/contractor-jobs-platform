import { Platform } from 'react-native';
type NotifLib = typeof import('expo-notifications');
let startedFor: number | null = null;
let generation = 0;
let listener: { remove: () => void } | null = null;

export async function startPush(userId: number, register: (token: string) => Promise<unknown>): Promise<void> {
  if (startedFor === userId) return;
  resetPush();
  const current = generation;
  startedFor = userId;
  try {
    const N = require('expo-notifications') as NotifLib;
    N.setNotificationHandler({ handleNotification: async () => ({
      shouldShowBanner: startedFor !== null, shouldShowList: startedFor !== null,
      shouldPlaySound: false, shouldSetBadge: false,
    }) });
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', { name: 'Job alerts', importance: N.AndroidImportance.HIGH });
    }
    const permission = await N.requestPermissionsAsync();
    if (current !== generation) return;
    if (!permission.granted) { resetPush(); return; }
    const token = await N.getDevicePushTokenAsync();
    if (current !== generation) return;
    await register(String(token.data));
    if (current !== generation) return;
    listener = N.addPushTokenListener(next => {
      if (current === generation) void register(String(next.data)).catch(() => undefined);
    });
  } catch {
    if (current === generation) resetPush();
  }
}
export function resetPush(): void {
  generation++;
  startedFor = null;
  listener?.remove();
  listener = null;
}
export async function stopPush(): Promise<void> {
  try {
    const N = require('expo-notifications') as NotifLib;
    await N.unregisterForNotificationsAsync();
    await N.dismissAllNotificationsAsync();
  } catch { /* Native module may be unavailable, or device offline. */ }
}
