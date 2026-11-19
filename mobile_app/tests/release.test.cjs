const test = require('node:test');
const assert = require('node:assert/strict');
const { apiUrl, releaseConfig } = require('../config/release');
test('production rejects unsafe API URLs', () => {
  for (const url of [undefined, '', 'http://api.service.com', 'https://localhost', 'https://10.0.2.2', 'https://192.168.1.2', 'https://127.1', 'https://[::1]', 'https://api.local', 'https://api.example.com', 'https://a:b@api.service.com', 'https://api.service.com?key=secret']) {
    assert.throws(() => apiUrl(url), undefined, String(url));
  }
});
test('development is explicit, production normalizes HTTPS URLs', () => {
  assert.equal(apiUrl(undefined, true), 'http://10.0.2.2:8080');
  assert.equal(apiUrl('https://api.service.com/v1/'), 'https://api.service.com/v1');
  assert.throws(() => releaseConfig({}));
  assert.equal(releaseConfig({ APP_VARIANT: 'development' }).development, true);
});
test('production requires OAuth, real ads and a valid version code', () => {
  const env = { EXPO_PUBLIC_API_URL:'https://api.service.com', EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:'unit-test.apps.googleusercontent.com',
    ADMOB_ANDROID_APP_ID:'ca-app-pub-1111111111111111~1111111111', EXPO_PUBLIC_BANNER_ID:'ca-app-pub-1111111111111111/1111111111', EXPO_PUBLIC_INTERSTITIAL_ID:'ca-app-pub-1111111111111111/2222222222' };
  assert.equal(releaseConfig(env).development, false);
  for (const key of ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'ADMOB_ANDROID_APP_ID', 'EXPO_PUBLIC_BANNER_ID', 'EXPO_PUBLIC_INTERSTITIAL_ID']) assert.throws(() => releaseConfig({ ...env, [key]: '' }));
  assert.throws(() => releaseConfig({ ...env, ADMOB_ANDROID_APP_ID:'ca-app-pub-3940256099942544~3347511713' }));
  for (const code of ['0', '-1', '1.5', 'oops']) assert.throws(() => releaseConfig({ ...env, ANDROID_VERSION_CODE: code }));
});
