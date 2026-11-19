const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const publicFixtures = {
  APP_VARIANT:'production', EXPO_PUBLIC_API_URL:'https://api.service.com',
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:'unit-test.apps.googleusercontent.com',
  ADMOB_ANDROID_APP_ID:'ca-app-pub-1111111111111111~1111111111',
  EXPO_PUBLIC_BANNER_ID:'ca-app-pub-1111111111111111/1111111111',
  EXPO_PUBLIC_INTERSTITIAL_ID:'ca-app-pub-1111111111111111/2222222222',
};
function configuration(firebasePackage) {
  const module = { exports:{} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../app.config.js'),'utf8'), {
    module, __dirname:'/fixture', process:{env:publicFixtures},
    require: name => name === 'fs' ? { existsSync:()=>true, readFileSync:()=>JSON.stringify({client:[{client_info:{android_client_info:{package_name:firebasePackage}}}]}) }
      : name === 'path' ? path : require('../config/release'),
  });
  return () => module.exports({config:{android:{package:'com.sanjeet.contractorjobs'},plugins:[]}});
}
test('production config disables cleartext and backups, blocks unused permissions', () => {
  const config = configuration('com.sanjeet.contractorjobs')();
  assert.equal(config.android.allowBackup,false);
  assert.equal(config.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-build-properties')[1].android.usesCleartextTraffic,false);
  assert.ok(config.android.blockedPermissions.includes('android.permission.READ_EXTERNAL_STORAGE'));
});
test('mismatched Firebase package blocks release', () => {
  assert.throws(configuration('com.wrong.app'), /package must match/);
});
test('native signing plugin removes debug release signing and requires upload credentials', () => {
  const module = {exports:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../plugins/withReleaseSigning'),'utf8'), {
    module, process:{env:{APP_VARIANT:'production'}},
    require:()=>({withAppBuildGradle:(_config,fn)=>fn({modResults:{contents:'release { signingConfig signingConfigs.debug\n}'}})}),
  });
  const result = module.exports({}).modResults.contents;
  assert.ok(!result.includes('signingConfig signingConfigs.debug'));
  assert.ok(result.includes('signingConfig null'));
  assert.ok(result.includes('ANDROID_KEYSTORE_PATH'));
  assert.ok(result.includes('Release signing missing'));
});
