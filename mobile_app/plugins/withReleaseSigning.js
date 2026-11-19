const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = config => withAppBuildGradle(config, mod => {
  let source = mod.modResults.contents;
  if (source.includes('// Contractor release signing')) return mod;
  const match = /release\s*\{([\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!match.test(source)) throw new Error('Cannot locate generated release signing block; review Expo template');
  source = source.replace(match, 'release {$1// Contractor release signing\n            signingConfig null');
  const releaseReady = process.env.APP_VARIANT === 'production' || process.env.APP_VARIANT === 'preview';
  source += `
// Contractor release signing: EAS injects managed signing configuration later.
if (System.getenv('EAS_BUILD') != 'true') {
    def signingNames = ['ANDROID_KEYSTORE_PATH', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD']
    def hasReleaseSigning = signingNames.every { System.getenv(it) }
    if (hasReleaseSigning) {
        android.signingConfigs.create('upload') {
            storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
            storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ANDROID_KEY_ALIAS')
            keyPassword System.getenv('ANDROID_KEY_PASSWORD')
        }
        android.buildTypes.release.signingConfig = android.signingConfigs.upload
    }
    gradle.taskGraph.whenReady { graph ->
        if (graph.allTasks.any { it.project == project && it.name.toLowerCase().contains('release') }) {
            if (!${releaseReady}) throw new GradleException('Android was generated for development. Prebuild again with production configuration.')
            if (System.getenv('APP_VARIANT') != 'production' && System.getenv('APP_VARIANT') != 'preview') {
                throw new GradleException('Release requires APP_VARIANT=production or preview and a fresh Expo prebuild')
            }
            if (!hasReleaseSigning) throw new GradleException('Release signing missing: supply ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD')
        }
    }
}
`;
  mod.modResults.contents = source;
  return mod;
});
