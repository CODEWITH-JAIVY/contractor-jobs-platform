const fs = require('fs');

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

// http:// (dev) ho to cleartext allow; https:// (production) me apne aap band.
const cleartext = !API_URL.startsWith('https://');

module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), ['expo-build-properties', { android: { usesCleartextTraffic: cleartext } }]],
  android: {
    ...config.android,
    // google-services.json (Firebase) ho to push notification ke liye use hoga, warna chup-chap skip.
    ...(fs.existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
  },
});
