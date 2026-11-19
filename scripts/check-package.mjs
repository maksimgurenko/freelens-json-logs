import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import Module from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { checkFindWorker } from './check-find-worker.mjs';
import { checkPackedFindService } from './check-find-service.mjs';

const manifest = JSON.parse(readFileSync('package.json'));
const tarball = `dist/${manifest.name}-${manifest.version}.tgz`;
const contents = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n').sort();
assert.equal(manifest.main, `out/main-${manifest.version}.js`);
assert.equal(manifest.renderer, `out/renderer-${manifest.version}.mjs`);
const stylesheet = manifest.renderer.replace(/\.mjs$/, '.css');
const workerEntry = `out/find-worker-${manifest.version}.js`;
assert.deepEqual(contents, ['package/README.md', 'package/docs/local-development.md', `package/${manifest.main}`, `package/${manifest.renderer}`, `package/${stylesheet}`, `package/${workerEntry}`, 'package/package.json'].sort());
const metadata = JSON.parse(readFileSync('dist/build-meta.json'));
const inputs = Object.keys(metadata.inputs);
assert(inputs.every(path => path.startsWith('src/') || path.startsWith('host-global:')
  || path === 'node_modules/@freelensapp/extensions/dist/extension-api.js'), `Unexpected bundled dependency: ${inputs}`);
assert.deepEqual(metadata.outputs[manifest.renderer].imports, []);
assert.equal(metadata.outputs[manifest.renderer].cssBundle, stylesheet);
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
let workerCheck, serviceCheck;
try {
  execFileSync('tar', ['-xzf', join(process.cwd(), tarball), '-C', directory]);
  const packed = JSON.parse(readFileSync(join(directory, 'package/package.json')));
  assert.equal(packed.engines.freelens, '^2.0.0');
  assert.equal(packed.devDependencies['@freelensapp/extensions'], '2.0.0');
  assert.equal(packed.name, 'freelens-readable-logs-v2');
  assert.equal(packed.storeName, packed.name);
  assert(!packed.dependencies);
  // Load both packed entry formats with explicit host stand-ins.
  const stub = class {};
  class IpcStub { static createInstance() { return { listen: () => () => {}, broadcast: () => {} }; } }
  class StoreStub { static getInstanceOrCreate() { return new this(); } }
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  globalThis.FreelensExtensionApi = {
    React: require('react'), ReactJsxRuntime: require('react/jsx-runtime'), Mobx: require('mobx'),
    Common: { Store: { ExtensionStore: StoreStub } }, Main: { LensExtension: stub, Ipc: IpcStub },
    Renderer: { LensExtension: stub, Ipc: IpcStub },
  };
  const originalLoad = Module._load;
  Module._load = function(id, ...args) { return id === 'electron' ? { BrowserWindow: {} } : originalLoad.call(this, id, ...args); };
  try { assert.equal(typeof require(join(directory, 'package', packed.main)).default, 'function'); }
  finally { Module._load = originalLoad; }
  const { default: Renderer } = await import(pathToFileURL(join(directory, 'package', packed.renderer)));
  // Freelens wraps each registered Page with observer.
  const registration = new Renderer().clusterPages[0];
  assert.equal(typeof registration.components.Page, 'function');
  assert.doesNotThrow(() => require('mobx-react').observer(registration.components.Page));
  const source = readFileSync(join(directory, 'package', workerEntry), 'utf8');
  const previousDirectory = process.cwd();
  try {
    process.chdir(directory);
    workerCheck = await checkFindWorker(source, packed.version);
    serviceCheck = await checkPackedFindService(join(directory, 'package', packed.main), join(directory, 'isolated-settings'));
  } finally { process.chdir(previousDirectory); }
} finally { rmSync(directory, { recursive: true, force: true }); }
console.log(JSON.stringify({ tarball, sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'), contents, bundledInputs: inputs, workerCheck, serviceCheck, entryPoints: 'Browser ESM renderer and CommonJS main load with host singletons; trusted packed worker executes outside checkout' }, null, 2));
