const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
// SDK 58's package refactor passes Windows backslashes to a glob. An empty cwd
// prevents that lookup from traversing node_modules. Assets resolve in app.config.js.
const cwd = process.platform === 'win32' ? path.join(projectRoot, '.expo', 'prebuild-cwd') : projectRoot;
fs.mkdirSync(cwd, { recursive: true });
const result = spawnSync(process.execPath, [cli, 'prebuild', projectRoot,
  '--platform', 'android', '--no-install', '--no-clean', ...process.argv.slice(2)], {
  cwd, stdio: 'inherit', env: process.env,
});
process.exit(result.status ?? 1);
