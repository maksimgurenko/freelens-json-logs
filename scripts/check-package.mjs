import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { checkFindWorker } from './check-find-worker.mjs';
import { checkPackedFindService } from './check-find-service.mjs';
import { checkPackageCompatibility } from './check-package-compatibility.mjs';

const manifest = JSON.parse(readFileSync('package.json'));
const tarball = `dist/${manifest.name}-${manifest.version}.tgz`;
const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n').sort();
assert.equal(manifest.main, `out/main-${manifest.version}.js`);
assert.equal(manifest.renderer, `out/renderer-${manifest.version}.mjs`);
const stylesheet = manifest.renderer.replace(/\.mjs$/, '.css');
const workerEntry = `out/find-worker-${manifest.version}.js`;
assert.deepEqual(contents, ['package/README.md', 'package/docs/local-development.md', `package/${manifest.main}`, `package/${manifest.renderer}`, `package/${stylesheet}`, `package/${workerEntry}`, 'package/package.json'].sort());
const sdk = '@freelensapp/extensions';
const lock = JSON.parse(readFileSync('package-lock.json'));
const installedSdk = JSON.parse(readFileSync(`node_modules/${sdk}/package.json`));
assert.equal(lock.packages[''].devDependencies[sdk], '2.0.0');
assert.equal(lock.packages[`node_modules/${sdk}`].version, '2.0.0');
assert.equal(installedSdk.version, '2.0.0');
const metadata = JSON.parse(readFileSync('dist/build-meta.json'));
const inputs = Object.keys(metadata.inputs);
assert(inputs.every(path => path.startsWith('src/') || path.startsWith('host-global:')
  || path === 'node_modules/@freelensapp/extensions/dist/extension-api.js'), `Unexpected bundled dependency: ${inputs}`);
const main = metadata.outputs[manifest.main];
assert.equal(main.entryPoint, 'src/main.ts');
assert(main.imports.every(({ path, kind, external }) =>
  external && kind === 'require-call' && (path === 'electron' || path.startsWith('node:'))));
assert(!Object.keys(main.inputs).some(path => path.startsWith('src/renderer/') || path.startsWith('src/worker/')));
const renderer = metadata.outputs[manifest.renderer];
assert.equal(renderer.entryPoint, 'src/renderer/index.tsx');
assert.deepEqual(renderer.imports, []);
assert.equal(renderer.cssBundle, stylesheet);
assert.deepEqual(metadata.outputs[stylesheet].imports, []);
assert(!Object.keys(renderer.inputs).some(path => path.startsWith('src/main/') || path.startsWith('src/worker/')));
const singletons = output => Object.keys(output.inputs).filter(path => path.startsWith('host-global:')).sort();
assert.deepEqual(singletons(main), ['host-global:mobx']);
assert.deepEqual(singletons(renderer), ['host-global:mobx', 'host-global:react']);
// Walk the production viewer and core import graphs independently of the host entry point.
const viewerInputs = new Set();
function checkViewerInput(path, importedBy) {
  if (viewerInputs.has(path)) return;
  assert(path.startsWith('src/core/') || path.startsWith('src/renderer/') && path !== 'src/renderer/index.tsx'
    || path === 'host-global:react' || path === 'host-global:react/jsx-runtime',
  `Host dependency in viewer/core: ${importedBy} imports ${path}`);
  viewerInputs.add(path);
  for (const dependency of metadata.inputs[path].imports) checkViewerInput(dependency.path, path);
}
checkViewerInput('src/renderer/viewer.tsx');
for (const path of inputs.filter(path => path.startsWith('src/core/'))) checkViewerInput(path);
const workerMetadata = metadata.outputs[workerEntry];
assert.deepEqual(workerMetadata.imports.map(entry => entry.path), ['node:worker_threads']);
assert.deepEqual(Object.keys(workerMetadata.inputs).sort(), ['src/core/find-matcher.ts', 'src/core/find-protocol.ts', 'src/worker/find.ts']);
const directory = mkdtempSync(join(tmpdir(), 'readable-logs-package-'));
let workerCheck, serviceCheck, compatibility;
try {
  execFileSync('tar', ['-xzf', join(process.cwd(), tarball), '-C', directory]);
  const packed = JSON.parse(readFileSync(join(directory, 'package/package.json')));
  assert.equal(packed.engines.freelens, '^2.0.0');
  assert.equal(packed.devDependencies[sdk], '2.0.0');
  assert.equal(packed.main, manifest.main);
  assert.equal(packed.renderer, manifest.renderer);
  for (const asset of [packed.main, packed.renderer, stylesheet, workerEntry]) {
    assert.deepEqual(readFileSync(join(directory, 'package', asset)), readFileSync(asset), `Packed ${asset} differs from the inspected build`);
  }
  assert.equal(packed.name, 'freelens-readable-logs-v2');
  assert.equal(packed.storeName, packed.name);
  assert(!packed.dependencies);
  compatibility = await checkPackageCompatibility(
    join(directory, 'package', packed.main), join(directory, 'package', packed.renderer), join(directory, 'isolated-settings'));
  const source = readFileSync(join(directory, 'package', workerEntry), 'utf8');
  const previousDirectory = process.cwd();
  try {
    process.chdir(directory);
    workerCheck = await checkFindWorker(source, packed.version);
    serviceCheck = await checkPackedFindService(join(directory, 'package', packed.main), join(directory, 'isolated-settings'));
  } finally { process.chdir(previousDirectory); }
} finally { rmSync(directory, { recursive: true, force: true }); }
console.log(JSON.stringify({ tarball, sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'), contents, bundledInputs: inputs, workerCheck, serviceCheck, compatibility, entryPoints: 'Browser ESM renderer and CommonJS main load with host singletons; trusted packed worker executes outside checkout' }, null, 2));
