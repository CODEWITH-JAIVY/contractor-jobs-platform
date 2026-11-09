import { tr } from '../i18n';

/** Google login. Native module hai: Expo Go me nahi chalega, dev build me chalega. */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
type GoogleLib = typeof import('@react-native-google-signin/google-signin');
let configured = false;

function lib(): GoogleLib | null {
  try {
    return require('@react-native-google-signin/google-signin') as GoogleLib;
  } catch {
    return null;
  }
}

/** Google ID token deta hai. User ne cancel kiya to null. */
export async function googleIdToken(): Promise<string | null> {
  const m = lib();
  if (!m || !WEB_CLIENT_ID) {
    throw new Error(tr('err.googleNotSet'));
  }
  if (!configured) {
    m.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    configured = true;
  }
  try {
    await m.GoogleSignin.hasPlayServices();
    const r = await m.GoogleSignin.signIn();
    if (r.type !== 'success') return null;
    if (!r.data.idToken) throw new Error(tr('err.googleToken'));
    return r.data.idToken;
  } catch (e) {
    if (e instanceof Error && e.message === tr('err.googleToken')) throw e;
    const code = (e as { code?: string }).code;
    throw new Error(tr('err.googleFail', { code: code ? ` (${code})` : '' }));
  }
}

export async function googleSignOut(): Promise<void> {
  try {
    await lib()?.GoogleSignin.signOut();
  } catch {
    // ignore
  }
}
