import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(readFileSync('package.json'));
const tarball = `dist/${manifest.name}-${manifest.version}.tgz`;
const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n').sort();
assert.deepEqual(contents, ['package/README.md', 'package/docs/local-development.md', 'package/out/main.js', 'package/out/renderer.js', 'package/package.json'].sort());
const metadata = JSON.parse(readFileSync('dist/build-meta.json'));
const inputs = Object.keys(metadata.inputs);
assert(inputs.every(path => path.startsWith('src/') || path.startsWith('host-global:')), `Unexpected bundled dependency: ${inputs}`);
const directory = mkdtempSync(join(tmpdir(), 'readable-logs-package-'));
try {
  execFileSync('tar', ['-xzf', join(process.cwd(), tarball), '-C', directory]);
  const packed = JSON.parse(readFileSync(join(directory, 'package/package.json')));
  assert.equal(packed.engines.freelens, '1.10.3');
  assert.equal(packed.devDependencies['@freelensapp/extensions'], '1.10.3');
  assert(!packed.dependencies);
  // Test the actual packed CommonJS modules with host globals; do not execute host operations.
  const stub = class {};
  global.LensExtensions = { Main: { LensExtension: stub }, Renderer: { LensExtension: stub } };
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  global.React = require('react');
  global.MobxReact = require('mobx-react');
  for (const entry of [packed.main, packed.renderer]) {
    const loaded = require(join(directory, 'package', entry));
    assert.equal(typeof loaded.default, 'function');
  }
  const Renderer = require(join(directory, 'package', packed.renderer)).default;
  // Freelens 1.10.3 wraps every registered Page with observer itself.
  const registration = new Renderer().clusterPages[0];
  assert.doesNotThrow(() => global.MobxReact.observer(registration.components.Page));
} finally { rmSync(directory, { recursive: true, force: true }); }
console.log(JSON.stringify({ tarball, sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'), contents, bundledInputs: inputs, entryPoints: 'CommonJS default exports load with host globals; no runtime dependencies bundled' }, null, 2));
