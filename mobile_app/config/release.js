// Shared by Expo config and regression tests. No server secrets belong here.
function apiUrl(value, development = false) {
  const raw = value?.trim() || (development ? 'http://10.0.2.2:8080' : '');
  let url;
  try { url = new URL(raw); } catch { throw new Error('EXPO_PUBLIC_API_URL must be a valid API URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API URL must be HTTP(S), without credentials, query or fragment');
  }
  const host = url.hostname.toLowerCase();
  if (!development && (url.protocol !== 'https:' || !host.includes('.') ||
      /^[\d.]+$/.test(host) || host.includes(':') ||
      /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) ||
      /(^|\.)example\.(com|org|net)$/.test(host))) {
    throw new Error('Production API must use HTTPS and a public, non-placeholder DNS name');
  }
  return url.toString().replace(/\/$/, '');
}
function releaseConfig(env) {
  const variant = env.APP_VARIANT || 'production';
  if (!['development', 'preview', 'production'].includes(variant)) throw new Error('Invalid APP_VARIANT');
  const development = variant === 'development';
  const api = apiUrl(env.EXPO_PUBLIC_API_URL, development);
  const code = Number(env.ANDROID_VERSION_CODE || '1');
  if (!Number.isSafeInteger(code) || code < 1) throw new Error('ANDROID_VERSION_CODE must be a positive integer');
  if (!development) {
    if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '')) {
      throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is required for worker login');
    }
    for (const [key, separator] of [['ADMOB_ANDROID_APP_ID', '~'], ['EXPO_PUBLIC_BANNER_ID', '/'], ['EXPO_PUBLIC_INTERSTITIAL_ID', '/']]) {
      const value = env[key] || '';
      if (!new RegExp('^ca-app-pub-\\d{16}' + separator + '\\d{10}$').test(value) || value.includes('3940256099942544')) {
        throw new Error(key + ' must be your real AdMob identifier');
      }
    }
  }
  return { variant, development, api, code };
}
module.exports = { apiUrl, releaseConfig };
