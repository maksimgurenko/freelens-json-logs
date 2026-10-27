// Isolated Chromium only. Never connects to or operates the user's desktop/host.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { packedFindBridge } from './find-test-bridge.mjs';
import { build } from 'esbuild';

const directory = await mkdtemp(join(tmpdir(), 'find-identity-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, server, bridge;
const kill = () => { if (browser?.pid) { try { process.kill(-browser.pid, 'SIGKILL'); } catch { /* Already exited. */ } } };
const deadline = setTimeout(kill, 90_000);
try {
  await import('./build.mjs');
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  bridge = packedFindBridge(resolve(manifest.main), join(directory, 'settings'));
  const fixture = await build({ entryPoints: ['tests/find-identity-browser.jsx'], bundle: true, write: false, format: 'iife',
    define: { 'process.env.NODE_ENV': '"production"', PACKED_RENDERER: JSON.stringify(await readFile(manifest.renderer, 'utf8')) } });
  const fonts = new Map(await Promise.all(['MaterialIcons-Regular.ttf', 'Roboto-Regular.ttf'].map(async name =>
    [`/${name}`, await readFile(`node_modules/@freelensapp/core/static/build/library/fonts/${name}`)])));
  server = createServer((request, response) => {
    if (request.url === '/find-rpc') { void bridge.http(request, response); return; }
    if (fonts.has(request.url)) { response.setHeader('Content-Type', 'font/ttf'); response.end(fonts.get(request.url)); return; }
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', request.url === '/fixture.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/fixture.js' ? fixture.outputFiles[0].text
      : '<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Roboto;src:url(/Roboto-Regular.ttf)}@font-face{font-family:MaterialIcons;src:url(/MaterialIcons-Regular.ttf)}html,body,#root{height:100%;margin:0}body{font:14px Roboto,sans-serif;background:#1e2124}.Icon.material-icons{font-family:MaterialIcons;font-weight:normal;font-style:normal;line-height:1;white-space:nowrap;font-feature-settings:"liga"}</style><div id="root"></div><script src="/fixture.js"></script>');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  browser = spawn(process.env.CHROME_BIN || 'chromium', ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-extensions', '--disable-sync', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', `--user-data-dir=${directory}`, '--window-size=1440,900',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), 'about:blank'], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  browser.stderr.on('data', data => { stderr = (stderr + data).slice(-4000); });
  const launched = once(browser, 'spawn'); await launched;
  let port;
  for (let attempt = 0; attempt < 200; attempt++) {
    assert.equal(browser.exitCode, null, stderr);
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await sleep(50);
  }
  assert(port, stderr);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl); await once(socket, 'open');
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data), entry = pending.get(message.id);
    if (entry) { pending.delete(message.id); message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result); }
  });
  socket.addEventListener('close', () => { for (const entry of pending.values()) entry.reject(new Error('Browser disconnected')); pending.clear(); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` });
  for (let attempt = 0; attempt < 200; attempt++) {
    if (await evaluate('!!globalThis.verifyIdentity')) break;
    assert(attempt < 199, 'Fixture failed to load'); await sleep(25);
  }
  const captureDirectory = process.env.FIND_HISTORY_SCREENSHOTS;
  if (captureDirectory) { await mkdir(captureDirectory, { recursive: true }); await evaluate('globalThis.captureFindHistory = true'); }
  let finished = false;
  const verification = evaluate('verifyIdentity()').finally(() => { finished = true; });
  if (captureDirectory) {
    while (!finished) {
      const width = await evaluate('globalThis.findHistoryCaptureWidth');
      if (width) {
        const capture = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height: 900, scale: 1 } });
        await writeFile(join(captureDirectory, `history-${width}.png`), Buffer.from(capture.data, 'base64'));
        await evaluate('globalThis.findHistoryCaptureWidth = 0');
      }
      await sleep(25);
    }
  }
  const results = await verification;
  for (let i = 0; bridge.status().live && i < 200; i++) await sleep(10);
  assert.equal(bridge.status().live, 0, 'Mounted viewer retained its worker');
  await bridge.dispose();
  console.log(JSON.stringify({ workerLifecycle: bridge.status(), browser: await send('Browser.getVersion'), package: `${manifest.name}@${manifest.version}`,
    results }, null, 2));
} finally {
  clearTimeout(deadline); socket?.close();
  await bridge?.dispose();
  if (browser?.pid && browser.exitCode === null) { kill(); await once(browser, 'exit'); }
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await rm(directory, { recursive: true, force: true });
}
