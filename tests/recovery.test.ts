import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { inspectConfiguration, resetConfiguration } from '../src/adapter/configuration-file.ts';
import { configurationData, configurationProblem, defaultConfiguration } from '../src/core/configuration.ts';
import { builtinProfile, duplicateProfile } from '../src/core/profiles.ts';

function fixture(run: (path: string, directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'readable-logs-recovery-'));
  try { run(join(directory, 'readable-logs.json'), directory); }
  finally { rmSync(directory, { recursive: true, force: true }); }
}
const future = JSON.stringify({ ...defaultConfiguration(), schemaVersion: 999, future: { preserve: '雪' } }, null, 4) + '\n';

test('preflight preserves corrupt, non-object, invalid and future bytes, including host metadata', () => {
  fixture(path => {
    for (const original of ['{broken\n', 'null', '[]', '"settings"', '{"schemaVersion":3,"viewer":null}', future]) {
      writeFileSync(path, original);
      assert(inspectConfiguration(path).problem);
      assert.equal(readFileSync(path, 'utf8'), original);
    }
    writeFileSync(path, JSON.stringify({ ...defaultConfiguration(), __internal__: { migrations: { version: '0.1.99' } } }));
    assert.deepEqual(inspectConfiguration(path), { data: defaultConfiguration(), problem: undefined });
  });
});
test('missing settings use defaults; unreadable settings remain intact and reset cannot back them up', () => {
  fixture(path => {
    assert.deepEqual(inspectConfiguration(path).data, defaultConfiguration());
    writeFileSync(path, future); chmodSync(path, 0);
    try {
      assert.match(inspectConfiguration(path).problem!, /Unable to read.*EACCES/);
      assert.match(resetConfiguration(path, true).error!, /not replaced.*EACCES/);
    } finally { chmodSync(path, 0o600); }
    assert.equal(readFileSync(path, 'utf8'), future);
  });
});
test('canceled reset does no I/O; failed backup leaves exact original bytes and no temporary replacement', () => {
  fixture((path, directory) => {
    writeFileSync(path, future);
    assert.match(resetConfiguration(path, false).error!, /canceled/);
    assert.deepEqual(readdirSync(directory), ['readable-logs.json']);
    // A real filesystem obstruction, rather than an invented error response.
    writeFileSync(join(directory, 'backups'), 'owned obstruction');
    assert.match(resetConfiguration(path, true).error!, /not replaced/);
    assert.equal(readFileSync(path, 'utf8'), future);
    assert.deepEqual(readdirSync(directory).sort(), ['backups', 'readable-logs.json']);
  });
});
test('confirmed reset verifies an exclusive exact backup before clearing all saved identities', () => {
  fixture((path, directory) => {
    writeFileSync(path, future);
    const first = resetConfiguration(path, true);
    assert.equal(first.error, undefined);
    assert.equal(readFileSync(first.backup!, 'utf8'), future);
    assert(first.backup!.startsWith(join(directory, 'backups', 'readable-logs-')));
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), defaultConfiguration());
    writeFileSync(path, '{another corrupt file}');
    const second = resetConfiguration(path, true);
    assert.notEqual(first.backup, second.backup);
    assert.equal(readFileSync(first.backup!, 'utf8'), future);
    assert.equal(readFileSync(second.backup!, 'utf8'), '{another corrupt file}');
    assert.equal(inspectConfiguration(path).problem, undefined);
  });
});
test('explicit schema 1 and 2 migrations preserve preferences, full rules, IDs, order and default; future is never migrated', () => {
  const first = duplicateProfile(builtinProfile(), 'one', 'One');
  first.format.messagePaths = ['/event/text']; first.format.severityMappings = [{ source: 30, target: 'INFO' }];
  const second = duplicateProfile(builtinProfile(), 'two', 'Two');
  const source = { schemaVersion: 2, viewer: { inspection: 'bottom' }, profiles: [first, second].map(({ matching, ...profile }) => profile), globalDefault: 'two' };
  const migrated = configurationData(source);
  assert.equal(configurationProblem(migrated), undefined);
  assert.deepEqual(migrated.profiles, [first, second]);
  assert.equal(migrated.globalDefault, 'two'); assert.deepEqual(migrated.viewer, source.viewer);
  assert.deepEqual(configurationData({ schemaVersion: 1, viewer: { inspection: 'inline' } }), { ...defaultConfiguration(), viewer: { inspection: 'inline' } });
  const newer = { ...source, schemaVersion: 999 };
  assert.deepEqual(configurationData(newer), newer); assert(configurationProblem(newer));
});

// Exercise the production store with real MobX reactions and a bounded public-SDK
// stand-in. Real SDK/Conf startup preservation is separately verified in Freelens.
let sdkStarts = 0, storePath = '';
class ExtensionStore {
  protected extension?: unknown;
  static getInstanceOrCreate() { return new (this as typeof ExtensionStore)(); }
  protected cwd() { return storePath; }
  loadExtension(_extension: unknown) {
    sdkStarts++;
    (this as unknown as { fromStore(data: object): void }).fromStore(JSON.parse(readFileSync(join(storePath, 'readable-logs.json'), 'utf8')));
  }
}
(globalThis as unknown as { __recoverySdk: unknown }).__recoverySdk = { Store: { ExtensionStore } };
const hook = registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@freelensapp/extensions') return { url: 'data:text/javascript,export const Common = globalThis.__recoverySdk', shortCircuit: true };
  return next(specifier, context);
} });
const { ConfigurationStore } = await import('../src/adapter/configuration-store.ts');
hook.deregister();

test('fallback never starts SDK synchronization, rejects incoming data and inhibits every incidental write; reset restores saving', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'readable-logs-store-'));
  storePath = directory;
  const path = join(directory, 'readable-logs.json');
  try {
    for (const original of ['{corrupt}', future]) {
      writeFileSync(path, original);
      const store = new ConfigurationStore();
      const before = store.toJSON(); const starts = sdkStarts;
      store.loadExtension({} as never);
      assert.equal(sdkStarts, starts);
      assert(store.read().problem); assert.deepEqual(store.read().configuration, defaultConfiguration());
      store.fromStore({ ...defaultConfiguration(), viewer: { inspection: 'bottom' } });
      store.setInspection('bottom'); store.deleteProfile('any'); store.setGlobalDefault('any'); store.moveProfile('any', -1);
      assert.throws(() => store.saveProfile(duplicateProfile(builtinProfile(), 'any', 'Any')));
      assert.equal(store.toJSON(), before); assert.equal(readFileSync(path, 'utf8'), original);
      let resetCalls = 0;
      store.bindReset(async confirmed => { resetCalls++; return resetConfiguration(path, confirmed); });
      await store.resetSettings(false); assert.equal(resetCalls, 0);
      const result = await store.resetSettings(true);
      assert.equal(result.error, undefined); assert.equal(readFileSync(result.backup!, 'utf8'), original);
      store.loadExtension({} as never);
      assert.equal(sdkStarts, starts + 1); assert.equal(store.read().problem, undefined);
      store.saveProfile(duplicateProfile(builtinProfile(), 'fresh', 'Fresh'));
      store.setGlobalDefault('fresh'); store.setInspection('bottom');
      assert.equal(store.read().configuration.profiles.length, 1);
      assert.equal(store.read().configuration.globalDefault, 'fresh'); assert.equal(store.read().inspection, 'bottom');
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('invalid synchronization cannot change the serialized model or restore writes by sending defaults', () => {
  const store = new ConfigurationStore();
  const before = store.toJSON();
  store.fromStore({ schemaVersion: 999 });
  assert(store.problem); assert.equal(store.toJSON(), before);
  store.fromStore(defaultConfiguration() as unknown as Record<string, unknown>);
  store.setInspection('bottom');
  assert(store.problem); assert.equal(store.toJSON(), before);
});
