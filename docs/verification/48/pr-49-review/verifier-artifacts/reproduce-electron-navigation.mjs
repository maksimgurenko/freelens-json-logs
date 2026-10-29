// Run from the checkout under test. Uses standalone, isolated headless Electron,
// no BrowserWindow/display/desktop/clipboard and no production source mutations.
import { mkdtemp, mkdir, readdir, symlink, link, copyFile, writeFile, readFile, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
const original = process.env.PR49_ELECTRON_RUNTIME || '/usr/share/freelens';
const temporary = await mkdtemp(join(tmpdir(),'pr49-electron-navigation-'));
try {
  for (const name of await readdir(original)) {
    if (name === 'freelens' || name === 'resources') continue;
    await symlink(join(original,name),join(temporary,name));
  }
  try { await link(join(original,'freelens'),join(temporary,'freelens')); }
  catch { await copyFile(join(original,'freelens'),join(temporary,'freelens')); }
  const app = join(temporary,'resources','app'); await mkdir(app,{recursive:true});
  const runtime = join(temporary,'runtime'); await mkdir(runtime,{mode:0o700});
  await writeFile(join(app,'package.json'),JSON.stringify({name:'isolated-navigation-verifier',version:'1.0.0',main:'main.cjs'}));
  await writeFile(join(app,'main.cjs'),await readFile(join(dirname(fileURLToPath(import.meta.url)),'electron-navigation-main.cjs')));
  await build({entryPoints:[resolve('src/main/find-service.ts')],bundle:true,platform:'node',format:'cjs',outfile:join(app,'find-service.cjs')});
  const env = {...process.env,XDG_RUNTIME_DIR:runtime};
  for (const name of ['DISPLAY','WAYLAND_DISPLAY','ELECTRON_RUN_AS_NODE','XDG_ACTIVATION_TOKEN','DESKTOP_STARTUP_ID']) delete env[name];
  const result = spawnSync(join(temporary,'freelens'),['--headless','--ozone-platform=headless','--disable-gpu',`--user-data-dir=${join(temporary,'settings')}`],{env,encoding:'utf8',timeout:30000});
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { await rm(temporary,{recursive:true,force:true}); }
