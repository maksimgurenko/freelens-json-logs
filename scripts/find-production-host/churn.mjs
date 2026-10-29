import assert from 'node:assert/strict';
import { driver, request, report } from './driver.mjs';
const d = await driver(), evidence = { cycles: [] };
try {
  await d.bind(d.root());
  const token = await d.rpc(d.root(), 'find-open', 'latest-only');
  for (let cycle = 0; cycle < 20; cycle++) {
    const requests = Array.from({ length: 20 }, (_, n) => request(cycle * 20 + n + 1));
    const results = await d.page.evaluate(`Promise.all(${JSON.stringify(requests)}.map(r=>global.__findSdk.invoke('find-request',${JSON.stringify(token)},r)))`, d.root());
    assert(results.slice(0, -1).every(x => x == null));
    assert.equal(results.at(-1).kind, 'matches');
    await d.rpc(d.root(), 'find-control', token, 'active', false);
    const state = await d.status();
    assert.equal(state.live, 0); assert.equal(state.peak, 1);
    assert.equal(state.service.executions[0].running, false); assert.equal(state.service.executions[0].pending, false);
    await d.rpc(d.root(), 'find-control', token, 'active', true);
    evidence.cycles.push({ cycle, starts: state.starts, exits: state.exits, live: state.live });
  }
  await d.rpc(d.root(), 'find-control', token, 'close');
  evidence.final = await d.wait(s => !s.live && !s.service.owners && !s.service.retiring);
  assert.equal(evidence.final.service.watch, false); assert.equal(evidence.final.service.senders, 0);
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { report('actual-host-churn', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error, cycles: evidence.cycles.length })); d.close(); }
