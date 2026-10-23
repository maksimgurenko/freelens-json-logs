import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotSession, describeError, type SnapshotPort } from '../src/core/session.ts';
import { initialContainer, type PodDescription, type LogTarget } from '../src/core/target.ts';
const target: LogTarget = { clusterId: 'cluster', clusterName: 'Cluster', namespace: 'ns', podName: 'pod', podUid: 'uid' };
const pod: PodDescription = { uid: 'uid', regular: ['first', 'second'], init: ['init'], ephemeral: ['debug'], defaultContainer: 'second' };

test('default container annotation applies only to regular containers; no regular means explicit choice', () => {
  assert.equal(initialContainer(pod), 'second');
  assert.equal(initialContainer({ ...pod, defaultContainer: 'debug' }), 'first');
  assert.equal(initialContainer({ ...pod, defaultContainer: 'init' }), 'first');
  assert.equal(initialContainer({ ...pod, defaultContainer: 'missing' }), 'first');
  assert.equal(initialContainer({ ...pod, regular: [] }), '');
});

test('open preserves target, chooses annotated container and accepts one real-shaped snapshot', async t => {
  const requests: unknown[] = [];
  const port: SnapshotPort = { loadPod: async () => pod, readLogs: async (identity, container) => {
    requests.push({ identity, container }); return '2026-10-21T12:00:00Z {"msg":"ready"}\n';
  } };
  const session = new SnapshotSession(target, port, () => {});
  t.after(() => session.dispose());
  await session.open();
  assert.deepEqual(requests, [{ identity: target, container: 'second' }]);
  assert.equal(session.state.phase, 'ready');
  assert.equal(session.state.snapshot?.records[0].applicationText, '{"msg":"ready"}');
  assert.equal(session.state.target, target);
});

test('without regular containers no request is made until an explicit choice', async t => {
  let requests = 0;
  const session = new SnapshotSession(target, { loadPod: async () => ({ ...pod, regular: [] }), readLogs: async () => { requests++; return ''; } }, () => {});
  t.after(() => session.dispose());
  await session.open();
  assert.equal(session.state.phase, 'choose-container');
  assert.equal(requests, 0);
  await session.selectContainer('init');
  assert.equal(session.state.phase, 'ready');
  assert.equal(session.state.container, 'init');
  assert.equal(requests, 1);
});

test('initial failure is an error, empty success is ready, replacement UID is rejected before logs', async t => {
  const denied = { message: 'pods/log is forbidden: User cannot get resource' };
  const session = new SnapshotSession(target, { loadPod: async () => pod, readLogs: async () => { throw denied; } }, () => {});
  t.after(() => session.dispose());
  await session.open();
  assert.equal(session.state.phase, 'error');
  assert.equal(session.state.error, denied.message);
  assert.equal(session.state.snapshot, undefined);
  let requests = 0;
  const replaced = new SnapshotSession(target, { loadPod: async () => ({ ...pod, uid: 'replacement' }), readLogs: async () => { requests++; return ''; } }, () => {});
  t.after(() => replaced.dispose());
  await replaced.open();
  assert.equal(replaced.state.phase, 'error');
  assert.equal(requests, 0);
});

test('departure/disable rejects pending successes and failures without claiming cancellation', async () => {
  for (const failure of [false, true]) {
    let resolve!: (value: string) => void;
    let reject!: (error: unknown) => void;
    const response = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
    const session = new SnapshotSession(target, { loadPod: async () => pod, readLogs: () => response }, () => {});
    const opened = session.open();
    await Promise.resolve();
    session.dispose();
    if (failure) reject(new Error('late')); else resolve('late\n');
    await opened;
    assert.equal(session.state.phase, 'closed');
    assert.equal(session.state.snapshot, undefined);
    assert.equal(session.state.error, undefined);
  }
});

test('errors from the host preserve useful raw Status/wrapper messages', () => {
  assert.equal(describeError({ messages: ['forbidden', 'details'] }), 'forbidden\ndetails');
  assert.equal(describeError({ error: { message: 'connection refused' } }), 'connection refused');
  assert.equal(describeError(new Error('network failed')), 'network failed');
  assert.equal(describeError('failure'), 'failure');
});
