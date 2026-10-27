// Inspector pauses the actual trusted worker before ready. Production supervision
// and SDK remain unchanged; this is a controlled startup stall, not a timing claim.
import assert from 'node:assert/strict';
import { driver, request, report } from './driver.mjs';
const d = await driver(), evidence = {};
const timer = setTimeout(() => { d.close(); process.exit(2); }, 15_000);
try {
  await d.bind(d.root());
  const token = await d.rpc(d.root(), 'find-open', 'startup-timeout');
  evidence.before = await d.status();
  await d.main.send('NodeWorker.enable', { waitForDebuggerOnStart: true });
  const started = performance.now();
  evidence.reply = await d.rpc(d.root(), 'find-request', token, request(1));
  evidence.elapsedMs = performance.now() - started;
  assert.equal(evidence.reply.kind, 'failed'); assert.equal(evidence.reply.reason, 'timeout');
  evidence.atTimeout = await d.status();
  await d.main.send('NodeWorker.disable');
  evidence.exited = await d.wait(s => s.live === 0);
  evidence.events = d.main.events;
  const recovery = await d.rpc(d.root(), 'find-request', token, request(2));
  assert.equal(recovery.kind, 'matches');
  await d.rpc(d.root(), 'find-control', token, 'close');
  evidence.final = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { await d.main.send('NodeWorker.disable').catch(() => {}); report('startup-timeout', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error, elapsedMs: evidence.elapsedMs })); clearTimeout(timer); d.close(); }
