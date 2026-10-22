// PROTOTYPE: same spike, one version/visible heading change for the upgrade probe.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
const source = fileURLToPath(new URL('../host-integration/', import.meta.url));
const destination = `${here}.packages/v2`;
mkdirSync(`${destination}/out`, {recursive: true});
const manifest = JSON.parse(readFileSync(`${source}package.json`, 'utf8'));
manifest.version = '0.0.2';
delete manifest.scripts;
writeFileSync(`${destination}/package.json`, JSON.stringify(manifest, null, 2));
for (const name of ['main', 'renderer', 'store']) {
  let code = readFileSync(`${source}src/${name}.js`, 'utf8');
  code = code.replaceAll('{marker:store.marker}', "{marker:store.marker, packageVersion:'0.0.2'}");
  code = code.replace("'Disposable host integration spike'", "'Disposable host integration spike 0.0.2'");
  writeFileSync(`${destination}/out/${name}.js`, code);
  execFileSync('node', ['--check', `${destination}/out/${name}.js`]);
}
process.stdout.write(execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', here], {cwd: destination}));
