// Actual installed production package + real frame-bound SDK, no service double.
import assert from 'node:assert/strict';
import { driver, request, report, sleep } from './driver.mjs';
const d = await driver(), evidence = { steps: [] };
const timer = setTimeout(() => { d.close(); process.exit(2); }, 55_000);
try {
  evidence.root = await d.bind(d.root()); evidence.cluster = await d.bind(d.cluster());
  evidence.before = await d.status();
  assert.equal(evidence.before.service.owners, 0);
  const root = await d.rpc(d.root(), 'find-open', 'root'), child = await d.rpc(d.cluster(), 'find-open', 'child');
  const owned = await d.status();
  assert.equal(owned.service.executions[0].sender, owned.service.executions[1].sender);
  assert.notEqual(owned.service.executions[0].routingId, owned.service.executions[1].routingId);
  for (const [context, token] of [[d.root(), child], [d.cluster(), root]]) {
    await assert.rejects(d.rpc(context, 'find-request', token, request(1)), /Foreign or disposed/);
  }
  evidence.steps.push({ name: 'bidirectional foreign-frame rejection', owned });
  for (const matchCase of [false, true]) for (const wholeWords of [false, true]) {
    const records = ['K', 'K', 'xKx', 'k'].map((application, occurrence) => ({ ref: { context: 'host-42', occurrence }, application }));
    const reply = await d.rpc(d.cluster(), 'find-request', child, request(1 + Number(matchCase) * 2 + Number(wholeWords), 'K', records, { matchCase, wholeWords }));
    assert.equal(reply.kind, 'matches');
    assert.deepEqual(reply.records.map(x => x.ref.occurrence), matchCase ? wholeWords ? [1] : [1, 2] : wholeWords ? [0, 1, 3] : [0, 1, 2, 3]);
    evidence.steps.push({ name: 'literal flags', matchCase, wholeWords, reply });
  }
  const source = 'a '.repeat(2620) + 'a';
  const records = Array.from({ length: 1000 }, (_, occurrence) => ({ ref: { context: 'host-42', occurrence }, application: source }));
  records[0].application += ' '.repeat(881);
  // Exactly 5 MiB transport text with LF; use the actual retention boundary.
  const { retainSnapshot } = await import('../../src/core/snapshot.ts');
  const transport = records.map(r => r.application).join('\n');
  const retained = retainSnapshot(transport);
  assert.equal(retained.records.length, 1000);
  assert.equal(retained.retainedBytes, 5 * 1024 * 1024);
  const bounded = retained.records.map((record, occurrence) => ({ ref: { context: 'host-42', occurrence }, application: record.applicationText }));
  // Application property is asserted below against the public retained record.
  assert.equal(typeof bounded[0].application, 'string');
  const count = await d.rpc(d.cluster(), 'find-request', child, request(5, 'a', bounded));
  assert.equal(count.records.length, 1000);
  evidence.steps.push({ name: 'retention-bound exact records', retained: retained.records.length, bytes: Buffer.byteLength(transport), count: count.records.length });
  const dense = request(6, 'a', bounded); dense.work = 'ranges';
  dense.rangeInterest = { id: 1, scopes: bounded.map(r => ({ ref: r.ref, source: 'application', start: 0, end: r.application.length })) };
  const ranges = await d.rpc(d.cluster(), 'find-request', child, dense);
  assert.equal(ranges.ranges.length, 4096); assert.equal(ranges.coverage.at(-1).complete, false);
  evidence.steps.push({ name: 'independent range cap', count: ranges.ranges.length, lateCoverage: ranges.coverage.at(-1) });
  const starts = (await d.status()).starts;
  await d.rpc(d.cluster(), 'find-control', child, 'active', false);
  const inactive = await d.wait(s => s.live === 0);
  assert.equal(inactive.service.owners, 2);
  await d.rpc(d.cluster(), 'find-control', child, 'active', true);
  assert.equal((await d.status()).starts, starts);
  evidence.steps.push({ name: 'idle inactivity releases worker, preserves owner', inactive });
  // Ordered SDK dispatch: supersede during actual worker startup, never overlap.
  await d.page.evaluate(`global.__pending=global.__findSdk.invoke('find-request',${JSON.stringify(child)},${JSON.stringify(request(7))});true`, d.cluster());
  const replacement = await d.rpc(d.cluster(), 'find-open', 'child');
  assert.equal(await d.page.evaluate('global.__pending', d.cluster()), undefined);
  assert.equal((await d.status()).live, 0);
  await assert.rejects(d.rpc(d.cluster(), 'find-request', child, request(8)), /Foreign or disposed/);
  const latest = await d.rpc(d.cluster(), 'find-request', replacement, request(1));
  assert.equal(latest.kind, 'matches');
  evidence.steps.push({ name: 'same-frame replacement awaited startup exit', after: await d.status() });
  // Remove the actual cluster iframe with an idle reusable production worker.
  const removed = await d.page.evaluate(`(()=>{const frame=[...document.querySelectorAll('iframe')].find(f=>f.src.startsWith(${JSON.stringify(d.cluster().origin)}));if(!frame)throw Error('Cluster iframe missing');global.__removed=frame;global.__parent=frame.parentNode;frame.remove();return frame.src;})()`, d.root());
  const afterRemoval = await d.wait(s => s.live === 0 && s.service.owners === 1 && !s.service.retiring);
  assert.equal(afterRemoval.service.executions[0].viewer, 'root');
  assert.equal((await d.rpc(d.root(), 'find-request', root, request(1))).kind, 'matches');
  await d.rpc(d.root(), 'find-control', root, 'close');
  evidence.steps.push({ name: 'real owning-frame removal preserves independent root', removed, afterRemoval });
  await d.page.evaluate('global.__parent.append(global.__removed);true', d.root());
  for (let i = 0; !d.cluster() && i < 300; i++) await sleep(10);
  evidence.final = await d.wait(s => s.live === 0 && s.service.owners === 0 && !s.service.retiring);
  assert.equal(evidence.final.service.watch, false); assert.equal(evidence.final.service.senders, 0);
  assert.equal(evidence.final.starts, evidence.final.exits);
  evidence.pass = true;
} catch (error) { evidence.error = error.stack; process.exitCode = 1; }
finally { report('sdk-suite', evidence); console.log(JSON.stringify({ pass: evidence.pass, error: evidence.error, steps: evidence.steps.length })); clearTimeout(timer); d.close(); }
