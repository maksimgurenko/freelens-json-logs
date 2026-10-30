import { build } from '/home/max/work/freelens-json-logs/node_modules/esbuild/lib/main.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = resolve(root, '.scratch/fixture57');
await mkdir(out, { recursive: true });
const globals = { '@freelensapp/extensions': 'FreelensExtensionApi', react: 'FreelensExtensionApi.React',
  mobx: 'FreelensExtensionApi.Mobx', 'mobx-react': 'FreelensExtensionApi.MobxReact' };
const plugin = { name: 'host-owned', setup(b) {
  b.onResolve({ filter: /^(?:@freelensapp\/extensions|react|mobx|mobx-react)$/ }, ({ path }) => ({ path, namespace: 'host' }));
  b.onLoad({ filter: /.*/, namespace: 'host' }, ({ path }) => ({ contents: `module.exports=globalThis.${globals[path]};`, loader: 'js' }));
} };
for (const name of ['main', 'renderer']) {
  const result = await build({ entryPoints: [resolve(root, `scripts/freelens2-runtime/${name}.js`)],
    outfile: resolve(out, `${name}-0.0.58.js`), format: 'esm', bundle: true,
    platform: name === 'main' ? 'node' : 'browser', target: 'es2024',
    external: ['electron'], plugins: [plugin], metafile: true });
  await writeFile(resolve(root, `docs/research/freelens2-runtime/${name}-metafile.json`), JSON.stringify(result.metafile, null, 2) + '\n');
}
await build({ entryPoints: [resolve(root, 'src/worker/find.ts')], outfile: resolve(out, 'worker-0.0.58.cjs'),
  bundle: true, platform: 'node', format: 'cjs', target: 'node24', define: { READABLE_LOGS_VERSION: '"0.0.58"' } });
await writeFile(resolve(out, 'package.json'), JSON.stringify({ name: 'freelens-runtime-probe57', version: '0.0.58',
  type: 'module', storeName: 'freelens-runtime-probe57', engines: { freelens: '2.0.1-0' },
  main: 'main-0.0.58.js', renderer: 'renderer-0.0.58.js' }, null, 2) + '\n');
console.log(out);
