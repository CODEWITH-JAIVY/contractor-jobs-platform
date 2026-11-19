const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function client(fetch) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../src/api.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, __DEV__:false, process:{env:{EXPO_PUBLIC_API_URL:'https://api.service.com'}},
    require: name => name === '../config/release' ? require('../config/release') : {
      tr: key => key, isKnownServerMsg: s => s === 'safe message', serverMsg: s => s,
    }, fetch, AbortController, setTimeout, clearTimeout });
  return exports;
}
test('old unauthorized request cannot sign out a newer session', async () => {
  let resolve;
  const c = client(() => new Promise(r => { resolve = r; }));
  let calls = 0;
  c.setUnauthorizedHandler(() => calls++);
  c.setToken('old');
  const request = c.api.get('/users/me');
  c.setToken('new');
  resolve(new Response('', {status:401}));
  await assert.rejects(request);
  assert.equal(calls, 0);
});
test('current unauthorized response expires the session', async () => {
  const c = client(async () => new Response('', { status:401 }));
  let calls = 0;
  c.setToken('current'); c.setUnauthorizedHandler(() => calls++);
  await assert.rejects(c.api.get('/users/me'));
  assert.equal(calls, 1);
});
test('rejects malformed success and hides untrusted server errors', async () => {
  for (const response of [new Response('<html>proxy failure</html>'), new Response(JSON.stringify({error:'private SQL and phone data'}), {status:500})]) {
    const c = client(async () => response);
    await assert.rejects(c.api.get('/jobs'), e => !e.message.includes('private') && e.message.startsWith('err.'));
  }
});
test('encodes query and sends captured token; empty success is valid', async () => {
  let sent;
  const c = client(async (url, options) => { sent = {url, options}; return new Response(null, {status:204}); });
  c.setToken('current');
  assert.equal(await c.api.get('/jobs', {city:'A & B', skip:null}), null);
  assert.equal(sent.url, 'https://api.service.com/jobs?city=A%20%26%20B');
  assert.equal(sent.options.headers.Authorization, 'Bearer current');
});
test('body failures are reported as network errors', async () => {
  const c = client(async () => ({ text: async () => { throw new Error('connection reset'); } }));
  await assert.rejects(c.api.get('/jobs'), e => e.status === 0 && e.message === 'err.network');
});
