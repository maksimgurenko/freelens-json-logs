// Run the preserved, untracked prestart smoke workloads with current SDK test
// doubles in a disposable copy. #47 owns integrating those original files.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const root = resolve('.'), directory = await mkdtemp(join(tmpdir(), 'find-resource-adapter-'));
function replace(text, before, after) { assert(text.includes(before), `Smoke adapter needs updating: ${before}`); return text.replace(before, after); }
try {
  for (const subdirectory of ['scripts', 'tests/smoke']) await mkdir(join(directory, subdirectory), { recursive: true });
  for (const name of ['src', 'node_modules', 'package.json', 'tsconfig.json']) await symlink(join(root, name), join(directory, name));
  for (const name of ['build.mjs', 'find-test-bridge.mjs']) await symlink(join(root, 'scripts', name), join(directory, 'scripts', name));
  let core = await readFile('tests/smoke/core.mjs', 'utf8');
  core = replace(core, "{ BrowserWindow: { fromWebContents: () => window } }", "{ app: Object.assign(new EventEmitter(), { quit() {} }), BrowserWindow: { fromWebContents: () => window } }");
  await writeFile(join(directory, 'tests/smoke/core.mjs'), core);
  let renderer = await readFile('tests/smoke/renderer.jsx', 'utf8');
  renderer = replace(renderer, '  async invoke(name, cluster, reply) {', `  async invoke(name, cluster, reply, ...rest) {
    if (name.startsWith('find-')) {
      const result = await (await fetch('/find-rpc', { method: 'POST', body: JSON.stringify({ channel: name, args: [cluster, reply, ...rest] }) })).json();
      if (result.error) throw new Error(result.error); return result.value;
    }`);
  await writeFile(join(directory, 'tests/smoke/renderer.jsx'), renderer);
  let runner = await readFile('scripts/resource-smoke.mjs', 'utf8');
  runner = replace(runner, "import { build } from 'esbuild';", "import { build } from 'esbuild';\nimport { packedFindBridge } from './find-test-bridge.mjs';");
  runner = replace(runner, 'let browser, socket, server;', 'let browser, socket, server, bridge;');
  runner = replace(runner, '  server = createServer((request, response) => {', `  bridge = packedFindBridge(resolve(manifest.main), join(directory, 'find-settings'));
  server = createServer((request, response) => {
    if (request.url === '/find-rpc') { void bridge.http(request, response); return; }`);
  runner = replace(runner, '  async function measure() {', `  async function measure() {
    for (let i = 0; bridge.status().live && i < 250; i++) await sleep(10);
    assert.equal(bridge.status().live, 0, 'Viewer teardown retained a worker');
    assert.equal(bridge.status().senderListeners, 0, 'Viewer teardown retained owner listeners');`);
  runner = replace(runner, "  console.log('Resource smoke passed: core/main and renderer.');", "  await bridge.dispose();\n  console.log(JSON.stringify({ check: 'Find worker lifecycle after smoke', ...bridge.status() }));\n  console.log('Resource smoke passed: core/main and renderer.');");
  runner = replace(runner, '  clearTimeout(deadline); socket?.close();', '  clearTimeout(deadline); socket?.close();\n  await bridge?.dispose();');
  await writeFile(join(directory, 'scripts/resource-smoke.mjs'), runner);
  const child = spawn(process.execPath, ['scripts/resource-smoke.mjs'], { cwd: directory, env: process.env, stdio: 'inherit' });
  const [code] = await once(child, 'exit'); assert.equal(code, 0, 'Adapted preserved resource smoke failed');
} finally { await rm(directory, { recursive: true, force: true }); }
