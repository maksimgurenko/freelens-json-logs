import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { FindService } from '../../../../src/main/find-service.ts';
class Sender extends EventEmitter {
  mainFrame = { framesInSubtree: [{ processId: 4, routingId: 1 }] };
  isDestroyed() { return false; }
}
class Worker extends EventEmitter {
  stopping = false;
  postMessage() {}
  async terminate() { this.stopping = true; return 1; }
}
const sender = new Sender(), workers = [];
let watched = 0;
const service = new FindService(() => { const worker = new Worker(); workers.push(worker); return worker; }, 'test', () => { watched++; return () => { watched--; }; });
const caller = { sender, senderFrame: sender.mainFrame.framesInSubtree[0] };
const request = { requestId: 1, key: { viewerEpoch: 1, targetEpoch: 1, instanceEpoch: 1, windowRevision: 1, messageRevision: 1, queryRevision: 1 }, query: { text: 'a', matchCase: false, wholeWords: false }, records: [{ ref: { context: 'one', occurrence: 0 }, application: 'a' }], work: 'match' };
const old = await service.open(caller, 'viewer');
const running = service.submit(caller, old, request);
const reopening = service.open(caller, 'viewer');
assert(workers[0].stopping);
assert.equal(sender.listenerCount('did-frame-navigate'), 0);
// Electron documents that process/routing IDs can survive document navigation.
sender.emit('did-frame-navigate', {}, 'https://new-document/', 200, 'OK', true, 4, 1);
workers[0].emit('exit', 1);
const token = await reopening;
assert.equal(await running, undefined);
assert.equal(service.owners.size, 1);
assert.equal(watched, 1);
assert.equal(sender.listenerCount('did-frame-navigate'), 1);
// A token issued to the departed document remains admitted by the main boundary.
assert.notEqual(token, old);
await service.setActive(caller, token, false);
console.log(JSON.stringify({ pendingOpenSurvivedNavigation: true, ownersAfterNavigation: service.owners.size, watchCount: watched, workerCount: workers.length }));
await service.dispose();
