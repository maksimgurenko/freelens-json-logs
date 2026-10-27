import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { FindService, type FindSender } from '../src/main/find-service.ts';
import type { FindRequest } from '../src/core/find-protocol.ts';

class Sender extends EventEmitter {
  mainFrame = { framesInSubtree: [{ processId: 4, routingId: 1 }, { processId: 4, routingId: 2 }] };
  isDestroyed() { return false; }
}
class Worker extends EventEmitter {
  stopping = false;
  postMessage() {}
  async terminate() { this.stopping = true; return 1; }
}
const input: FindRequest = { requestId: 1, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 },
  query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'a' }], work: 'match' };
const setup = () => {
  const sender = new Sender();
  const root = { sender: sender as FindSender, senderFrame: sender.mainFrame.framesInSubtree[0] };
  const child = { sender: sender as FindSender, senderFrame: sender.mainFrame.framesInSubtree[1] };
  const workers: Worker[] = [];
  let sweep = () => {}, stops = 0;
  const service = new FindService(() => { const worker = new Worker(); workers.push(worker); return worker; }, 'test',
    run => { sweep = run; return () => { stops++; }; });
  return { service, sender, root, child, workers, sweep: () => sweep(), stops: () => stops };
};

test('SDK ownership rejects foreign frames and foreign webContents, even with a valid token', async () => {
  const { service, sender, root, child, workers } = setup();
  const token = await service.open(root, 'viewer');
  assert.throws(() => service.submit(child, token, input), /Foreign or disposed/);
  assert.throws(() => service.submit({ ...root, sender: new Sender() }, token, input), /Foreign or disposed/);
  assert.equal(workers.length, 0);
  const pending = service.submit(root, token, input);
  assert.equal(workers.length, 1);
  const closing = service.close(root, token); workers[0].emit('exit', 1);
  await closing; assert.equal(await pending, undefined);
  assert.throws(() => service.submit(root, token, input), /Foreign or disposed/);
  await service.dispose(); assert.equal(sender.eventNames().length, 0);
});

test('actual frame membership removes only its owner and releases active or idle workers', async () => {
  for (const idle of [false, true]) {
    const { service, sender, root, child, workers, sweep, stops } = setup();
    const rootToken = await service.open(root, 'same-name');
    const token = await service.open(child, 'same-name');
    const pending = service.submit(child, token, input);
    if (idle) {
      workers[0].emit('message', { kind: 'ready', version: 'test' });
      workers[0].emit('message', { requestId: input.requestId, key: input.key, kind: 'matches', workerGeneration: 1, records: [{ ref: input.records[0].ref, application: true, message: false }] });
      assert.equal((await pending)?.kind, 'matches');
    }
    sender.mainFrame.framesInSubtree.pop(); sweep();
    assert(workers[0].stopping);
    assert.throws(() => service.submit(child, token, input), /Foreign or disposed/);
    await service.setActive(root, rootToken, false); // Independent root remains owned.
    let ended = false;
    const disposal = service.dispose().then(() => { ended = true; });
    await Promise.resolve(); assert.equal(ended, false);
    workers[0].emit('exit', 1); await disposal;
    if (!idle) assert.equal(await pending, undefined);
    assert.equal(sender.eventNames().length, 0); assert.equal(stops(), 1);
  }
});

test('same-frame replacement and close/reopen wait for actual old exit before admitting work', async () => {
  for (const explicitClose of [false, true]) {
    const { service, root, workers } = setup();
    const old = await service.open(root, 'viewer');
    const pending = service.submit(root, old, input);
    if (explicitClose) void service.close(root, old);
    let token: string | undefined;
    const opening = service.open(root, 'viewer').then(value => { token = value; return value; });
    await Promise.resolve(); await Promise.resolve(); assert.equal(token, undefined);
    assert(workers[0].stopping); assert.equal(await pending, undefined);
    workers[0].emit('exit', 1); token = await opening; assert.notEqual(token, old);
    assert.throws(() => service.submit(root, old, input), /Foreign or disposed/);
    const next = service.submit(root, token, input); assert.equal(workers.length, 2);
    const closing = service.dispose(); workers[1].emit('exit', 1); await closing; await next;
  }
});

test('inactivity cancels startup and idle owners without forgetting their temporary binding', async () => {
  const { service, root, workers } = setup();
  const token = await service.open(root, 'viewer');
  const pending = service.submit(root, token, input);
  const inactive = service.setActive(root, token, false); assert(workers[0].stopping);
  assert.equal(await pending, undefined);
  assert.equal(await service.submit(root, token, { ...input, requestId: 2 }), undefined);
  workers[0].emit('exit', 1); await inactive;
  await service.setActive(root, token, true);
  const next = service.submit(root, token, { ...input, requestId: 3 }); assert.equal(workers.length, 2);
  const closing = service.dispose(); workers[1].emit('exit', 1); await closing; await next;
});

test('navigation, renderer loss, shutdown and late registration cannot retain an owner', async () => {
  for (const event of ['destroyed', 'render-process-gone', 'did-frame-navigate']) {
    const { service, sender, root, workers, stops } = setup();
    const token = await service.open(root, 'viewer');
    const pending = service.submit(root, token, input);
    sender.emit(event, {}, 'url', 200, 'OK', true, 4, 1);
    assert(workers[0].stopping);
    workers[0].emit('exit', 1); await pending;
    assert.throws(() => service.submit(root, token, input), /Foreign or disposed/);
    await service.dispose(); await service.dispose();
    assert.equal(sender.eventNames().length, 0); assert.equal(stops(), 1);
    await assert.rejects(service.open(root, 'late'), /Invalid Find viewer/);
  }
  const { service, root } = setup();
  const opening = service.open(root, 'viewer');
  await service.dispose(); await assert.rejects(opening, /Disposed Find viewer/);
});

test('invalid input is rejected before worker allocation and request membership is rechecked', async () => {
  const { service, sender, root, workers } = setup();
  const token = await service.open(root, 'viewer');
  assert.throws(() => service.submit(root, token, { ...input, records: new Array(1001).fill(input.records[0]) }), /invalid Find input/);
  sender.mainFrame.framesInSubtree = [];
  assert.throws(() => service.submit(root, token, input), /Foreign or disposed/);
  assert.equal(workers.length, 0); await service.dispose();
});
