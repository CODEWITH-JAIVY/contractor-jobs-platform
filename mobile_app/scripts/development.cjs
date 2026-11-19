const { spawnSync } = require('node:child_process');
const path = require('node:path');
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
const env = { ...process.env, APP_VARIANT: 'development' };
if (process.argv[2] === 'run:android') {
  // Refresh stale generated native configuration using the Windows-safe wrapper.
  const prebuild = spawnSync(process.execPath, [path.join(__dirname, 'prebuild.cjs')], {
    stdio: 'inherit', env,
  });
  if (prebuild.status !== 0) process.exit(prebuild.status ?? 1);
}
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: 'inherit', env,
});
process.exit(result.status ?? 1);
