// Isolated resource regression check. Never connects to the user's Freelens/CDP.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { build } from 'esbuild';
import { packedFindBridge } from './find-test-bridge.mjs';
import { chromePath } from './test-chromium.mjs';

const MiB = 1024 * 1024;
const directory = await mkdtemp(join(tmpdir(), 'readable-logs-resources-'));
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, server, bridge;
const processes = new Set();
const deadline = setTimeout(() => {
  console.error('Resource smoke test exceeded 180 seconds');
  for (const child of processes) kill(child);
}, 180_000);
function kill(child) {
  if (!child?.pid) return;
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Already exited. */ }
}
const canceled = () => { for (const child of processes) kill(child); process.exitCode = 1; };
process.once('SIGINT', canceled); process.once('SIGTERM', canceled);

async function disk(directory, root = directory) {
  let bytes = 0, files = 0;
  const largest = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) continue; // Chromium's singleton sockets/locks.
    try {
      if (entry.isDirectory()) {
        const result = await disk(path, root); bytes += result.bytes; files += result.files; largest.push(...result.largest);
      } else if (entry.isFile()) {
        const size = (await stat(path)).size; bytes += size; files++; largest.push({ path: relative(root, path), bytes: size });
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { bytes, files, largest: largest.sort((a, b) => b.bytes - a.bytes).slice(0, 8) };
}
try {
  const chrome = await chromePath();
  await import('./build.mjs');
  const home = join(directory, 'home'); await mkdir(home);
  const temporary = join(home, 'tmp'); await mkdir(temporary);
  for (const workload of ['core', 'find']) {
    const child = spawn(process.execPath, ['--expose-gc', '--experimental-strip-types', resolve(`tests/smoke/${workload}.mjs`), resolve(manifest.main)], {
      cwd: home, detached: true, stdio: 'inherit',
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, 'config'), XDG_CACHE_HOME: join(home, 'cache'),
        XDG_DATA_HOME: join(home, 'data'), TMPDIR: temporary },
    });
    processes.add(child);
    const [code, signal] = await once(child, 'exit'); processes.delete(child);
    assert.equal(code, 0, `${workload} resource check failed (${signal || code})`);
  }

  const fixture = await build({ entryPoints: ['tests/smoke/renderer.jsx'], bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"', PACKED_RENDERER: JSON.stringify(await readFile(manifest.renderer, 'utf8')) } });
  bridge = packedFindBridge(resolve(manifest.main), join(directory, 'find-settings'));
  server = createServer((request, response) => {
    if (request.url === '/find-rpc') { void bridge.http(request, response); return; }
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/fixture.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(fixture.outputFiles[0].text); }
    else { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><meta charset="utf-8"><title>Resource smoke</title><div id="root"></div><script src="/fixture.js"></script>'); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = join(directory, 'chromium');
  browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--disable-component-update', '--disable-extensions', '--disable-sync', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), 'about:blank'],
  { detached: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, 'config'), XDG_CACHE_HOME: join(home, 'cache'), TMPDIR: temporary } });
  processes.add(browser);
  let stderr = '', browserError;
  browser.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
  browser.on('error', error => { browserError = error; });
  let port;
  for (let attempt = 0; attempt < 300; attempt++) {
    if (browserError) throw browserError;
    if (browser.exitCode !== null) throw new Error(`Headless browser exited: ${stderr}`);
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await sleep(100);
  }
  assert(port, `Headless browser did not start: ${stderr}`);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) })).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data), callback = pending.get(message.id);
    if (callback) { pending.delete(message.id); message.error ? callback.reject(new Error(JSON.stringify(message.error))) : callback.resolve(message.result); }
  });
  socket.addEventListener('close', () => {
    for (const callback of pending.values()) callback.reject(new Error('Smoke browser disconnected'));
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await send('Performance.enable');
  await send('Page.navigate', { url: origin });
  for (let attempt = 0; attempt < 200; attempt++) {
    if (await evaluate('!!globalThis.resourceSmoke')) break;
    assert(attempt < 199, 'Renderer smoke fixture failed to load'); await sleep(25);
  }
  await evaluate('resourceSmoke.batch(4)');
  async function measure() {
    for (let i = 0; (bridge.status().live || bridge.status().inflight || bridge.status().owners) && i < 250; i++) await sleep(10);
    const lifecycle = bridge.status();
    for (const metric of ['live', 'owners', 'inflight', 'queuedTransport', 'senderListeners', 'workerListenersAfterExit']) assert.equal(lifecycle[metric], 0, `Viewer teardown retained ${metric}`);
    await send('HeapProfiler.collectGarbage'); await send('HeapProfiler.collectGarbage');
    const metrics = await send('Performance.getMetrics');
    const heapUsed = metrics.metrics.find(metric => metric.name === 'JSHeapUsedSize').value;
    const dom = await send('Memory.getDOMCounters');
    const storage = await send('Storage.getUsageAndQuota', { origin });
    assert.equal(storage.usage, 0, `Viewer retained origin data: ${JSON.stringify(storage)}`);
    return { heapUsed, ...dom, disk: await disk(profile), lifecycle };
  }
  // Chromium initializes its own databases asynchronously. Give those files a
  // bounded allowance; application storage is checked independently and must be empty.
  const limits = { heapUsed: 8 * MiB, nodes: 128, jsEventListeners: 8, documents: 0, diskBytes: 8 * MiB, diskFiles: 128 };
  const samples = [await measure()];
  let workload;
  for (let batch = 0; batch < 6; batch++) {
    workload = await evaluate('resourceSmoke.batch(6)');
    const sample = await measure(); samples.push(sample);
    for (const metric of ['heapUsed', 'nodes', 'jsEventListeners', 'documents']) {
      assert(sample[metric] - samples[0][metric] <= limits[metric], `${metric} grew after renderer teardown: ${JSON.stringify(samples)}`);
    }
    assert(sample.disk.bytes - samples[0].disk.bytes <= limits.diskBytes, `Browser profile grew beyond disk budget: ${JSON.stringify(samples)}`);
    assert(sample.disk.files - samples[0].disk.files <= limits.diskFiles, `Browser profile accumulated files: ${JSON.stringify(samples)}`);
  }
  console.log(JSON.stringify({ check: 'production renderer RAM, DOM and disk', ...workload, samples, limits }, null, 2));
  await bridge.dispose();
  console.log(JSON.stringify({ check: 'Find worker lifecycle after smoke', ...bridge.status() }));
  console.log('Resource smoke passed: core/main and renderer.');
} finally {
  clearTimeout(deadline); socket?.close();
  await bridge?.dispose();
  for (const child of processes) kill(child);
  if (browser?.pid && browser.exitCode === null) await once(browser, 'exit');
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await rm(directory, { recursive: true, force: true });
  process.removeListener('SIGINT', canceled); process.removeListener('SIGTERM', canceled);
}
