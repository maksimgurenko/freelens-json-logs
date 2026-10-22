// PROTOTYPE: same spike, one version/visible heading change for the upgrade probe.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
const source = fileURLToPath(new URL('../host-integration/', import.meta.url));
const version = process.argv[2] || '0.0.2';
const destination = `${here}.packages/${version}`;
mkdirSync(`${destination}/out`, {recursive: true});
const manifest = JSON.parse(readFileSync(`${source}package.json`, 'utf8'));
manifest.version = version;
delete manifest.scripts;
writeFileSync(`${destination}/package.json`, JSON.stringify(manifest, null, 2));
for (const name of ['main', 'renderer', 'store']) {
  let code = readFileSync(`${source}src/${name}.js`, 'utf8');
  code = code.replaceAll('{marker:store.marker}', `{marker:store.marker, packageVersion:${JSON.stringify(version)}}`);
  code = code.replace("'Disposable host integration spike'", JSON.stringify(`Disposable host integration spike ${version}`));
  writeFileSync(`${destination}/out/${name}.js`, code);
  execFileSync('node', ['--check', `${destination}/out/${name}.js`]);
}
process.stdout.write(execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', here], {cwd: destination}));
