const fs = require('fs');
const path = require('path');
const { releaseConfig } = require('./config/release');
module.exports = ({ config }) => {
  // Resolve assets from the project, even when the CLI runs from a separate cwd.
  const asset = value => value ? path.resolve(__dirname, value) : undefined;
  const { development, api, code } = releaseConfig(process.env);
  const firebase = process.env.GOOGLE_SERVICES_JSON || path.join(__dirname, 'google-services.json');
  if (!development && !fs.existsSync(firebase)) throw new Error('GOOGLE_SERVICES_JSON must point to the Firebase Android configuration');
  if (fs.existsSync(firebase)) {
    const data = JSON.parse(fs.readFileSync(firebase, 'utf8'));
    if (!data.client?.some(c => c.client_info?.android_client_info?.package_name === config.android.package)) {
      throw new Error('Firebase Android package must match app.json');
    }
  }
  const plugins = (config.plugins || []).map(plugin => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
      return [plugin[0], { ...plugin[1], androidAppId: development ? 'ca-app-pub-3940256099942544~3347511713' : process.env.ADMOB_ANDROID_APP_ID, delayAppMeasurementInit: true }];
    }
    return plugin;
  });
  return {
    ...config,
    icon: asset(config.icon),
    android: {
      ...config.android,
      adaptiveIcon: config.android.adaptiveIcon ? {
        ...config.android.adaptiveIcon,
        foregroundImage: asset(config.android.adaptiveIcon.foregroundImage),
        backgroundImage: asset(config.android.adaptiveIcon.backgroundImage),
        monochromeImage: asset(config.android.adaptiveIcon.monochromeImage),
      } : undefined,
      versionCode: code,
      allowBackup: false,
      blockedPermissions: ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW'],
      ...(fs.existsSync(firebase) ? { googleServicesFile: firebase } : {}),
    },
    plugins: [...plugins, 'expo-status-bar', 'expo-font',
      ['expo-splash-screen', { image: asset('./assets/splash-icon.png'), backgroundColor: '#1C2127', imageWidth: 180 }],
      ['expo-build-properties', { android: { usesCleartextTraffic: development && api.startsWith('http:') } }],
      './plugins/withReleaseSigning',
    ],
  };
};
