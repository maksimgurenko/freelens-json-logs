// Verify this private installation against the built tarball/assets, not a
// prior run's manifest. No production profile or package is modified.
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { connect } from './cdp.mjs';
import { privateSession } from './private-session.mjs';
import { report } from './driver.mjs';
import { scratch } from './config.mjs';
import { configurationData, configurationProblem } from '../../src/core/configuration.ts';

const session = privateSession(), main = await connect(9242);
const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
try {
  const runtime = await main.evaluate(`({versions:process.versions,cwd:process.cwd(),profile:process.env.FREELENS_INTEGRATION_TESTING_DIR,environment:Object.fromEntries(['FIND_HOST_TICKET','FIND_HOST_RUN','FREELENS_UI_MODE','CHOKIDAR_USEPOLLING','CHOKIDAR_INTERVAL'].map(k=>[k,process.env[k]??null]))})`);
  assert.equal(runtime.profile, readFileSync(`${scratch}/integration-path`, 'utf8'));
  assert.equal(runtime.environment.FREELENS_UI_MODE, null);
  const installed = join(runtime.profile, 'Freelens/node_modules/freelens-readable-logs');
  const manifest = JSON.parse(readFileSync(join(installed, 'package.json')));
  const local = JSON.parse(readFileSync('package.json'));
  assert.equal(manifest.name, local.name); assert.equal(manifest.version, local.version);
  assert.equal(manifest.storeName, local.storeName); assert.equal(manifest.engines.freelens, '1.10.3');
  const assets = [manifest.main, manifest.renderer, `out/find-worker-${manifest.version}.js`];
  const comparison = Object.fromEntries(assets.map(asset => {
    const hashes = { installed: sha256(join(installed, asset)), local: sha256(asset) };
    assert.equal(hashes.installed, hashes.local, asset); return [asset, hashes];
  }));
  const settingsPath = join(runtime.profile, 'Freelens/extension-store/freelens-readable-logs/readable-logs.json');
  const settings = JSON.parse(readFileSync(settingsPath));
  const configuration = configurationData(settings);
  assert.equal(configurationProblem(configuration), undefined);
  assert.equal(configuration.schemaVersion, 3);
  const display = JSON.parse(readFileSync(`${scratch}/session.json`));
  const library = readFileSync(`/proc/${display.hyprlandPid}/maps`, 'utf8').split('\n')
    .find(line => line.includes('/aquamarine/build/') && line.includes('libaquamarine'))?.trim().split(/\s+/).at(-1);
  assert(library, 'Expected documented private diagnostic compositor library');
  report('package-identity', { session, runtime, manifest, schema: configuration.schemaVersion, storedSchema: settings.schemaVersion ?? null,
    settingsPath, page: 'readable-logs', configuration: 'readable-logs',
    tarball: { path: `dist/${manifest.name}-${manifest.version}.tgz`, sha256: sha256(`dist/${manifest.name}-${manifest.version}.tgz`) },
    assets: comparison, hostExecutable: { path: realpathSync(`/proc/${session.pid}/exe`), sha256: sha256(`/proc/${session.pid}/exe`) },
    display: { library, sha256: sha256(library), scope: 'Privately modified Aquamarine diagnostic; not stock compositor acceptance' },
    toolchain: { node: process.version, npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim() } });
  console.log(JSON.stringify({ pass: true, assets: assets.length, package: `${manifest.name}@${manifest.version}` }));
} finally { main.close(); }
