// Diagnostic replay of the preserved stalled harness, not an acceptance test.
// Its historical group-membership oracle is known to be wrong after regrouping.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { driver, report, sleep } from './driver.mjs';
import { privateSession } from './private-session.mjs';
import { evidence } from './config.mjs';

const d = await driver(), result = { session: privateSession(),
  scope: 'Bounded diagnostic with DevTools CPU sampling; exact historical harness, known old oracle, privately modified compositor. Not native latency or acceptance.' };
const source = gunzipSync(readFileSync('docs/verification/48/host/group-final/stalled-harness.mjs.gz'));
const sha256 = createHash('sha256').update(source).digest('hex');
assert.equal(sha256, 'eb43adfbdf8d77ac25c4777abdf74a7b7aa5a1e6c357c251098f5bbce1ac6810');
const path = fileURLToPath(new URL(`.dense-stalled-owned-${process.pid}.mjs`, import.meta.url));
let child;
try {
  await d.bind(d.cluster());
  await d.page.send('Profiler.enable'); await d.page.send('Profiler.setSamplingInterval', { interval: 1000 });
  await d.page.send('Profiler.start');
  writeFileSync(path, source, { flag: 'wx' });
  child = spawn(process.execPath, [path], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
  const started = performance.now();
  let exit;
  child.once('exit', (code, signal) => { exit = { code, signal }; });
  for (let i = 0; i < 400 && !exit; i++) await sleep(100);
  result.elapsedMs = performance.now() - started;
  result.driverBudgetMs = 40_000; result.sourceSha256 = sha256;
  const { profile } = await d.page.send('Profiler.stop');
  writeFileSync(`${evidence}/dense-cpu-profile.json.gz`, gzipSync(JSON.stringify(profile)));
  const nodes = new Map(profile.nodes.map(node => [node.id, node])), times = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const id = profile.samples[i]; times.set(id, (times.get(id) ?? 0) + profile.timeDeltas[i]);
  }
  result.profile = { samples: profile.samples.length, durationUs: profile.endTime - profile.startTime,
    hottest: [...times].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([id, selfUs]) => ({ ...nodes.get(id).callFrame, selfUs })) };
  result.progress = await d.page.evaluate('({trace:globalThis.__find48GroupTrace,count:document.querySelector(".rl-find-count")?.textContent,highlight:document.querySelector(".rl-highlight-status")?.textContent,focused:document.hasFocus()})', d.cluster());
  result.childBeforeStop = exit ?? null;
  if (!exit) { child.kill('SIGTERM'); await new Promise(resolve => child.once('exit', resolve)); }
  result.childAfterStop = exit; result.output = output;
  // Release the owned test page, then observe actual worker exit.
  await d.page.evaluate("LensExtensions.Renderer.Navigation.navigate('/overview');true", d.cluster());
  result.closed = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
  result.diagnosticCompleted = true;
} catch (error) { result.error = error.stack; process.exitCode = 1; }
finally {
  if (child?.exitCode === null && child?.signalCode === null) child.kill('SIGTERM');
  try { unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  report('dense-diagnostic', result); console.log(JSON.stringify({ completed: result.diagnosticCompleted, error: result.error, progressed: result.progress?.trace?.length, hottest: result.profile?.hottest.slice(0, 5) })); d.close();
}
