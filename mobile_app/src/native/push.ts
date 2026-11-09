import { Platform } from 'react-native';

type NotifLib = typeof import('expo-notifications');
let startedFor: number | null = null;

/** FCM token backend ko bhejta hai. Firebase (google-services.json) ya dev build na ho to chup-chap skip. */
export async function startPush(userId: number, register: (token: string) => Promise<unknown>): Promise<void> {
  if (startedFor === userId) return;
  startedFor = userId;
  try {
    const N = require('expo-notifications') as NotifLib;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', { name: 'Job alerts', importance: N.AndroidImportance.HIGH });
    }
    const perm = await N.requestPermissionsAsync();
    if (!perm.granted) return;
    const t = await N.getDevicePushTokenAsync(); // Android par native FCM token
    await register(String(t.data));
    N.addPushTokenListener((nt) => {
      void register(String(nt.data));
    });
  } catch (e) {
    console.log('Push skip:', e);
  }
}

export function resetPush(): void {
  startedFor = null;
}
