import { build } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const hostGlobals = {
  react: 'React', 'react/jsx-runtime': 'ReactJsxRuntime',
  mobx: 'Mobx',
};
const hostSingletons = {
  name: 'freelens-host-singletons',
  setup(build) {
    build.onResolve({ filter: /^(?:react(?:\/jsx-runtime)?|mobx)$/ },
      ({ path }) => ({ path, namespace: 'host-global' }));
    build.onLoad({ filter: /.*/, namespace: 'host-global' }, ({ path }) => ({
      contents: `module.exports = globalThis.FreelensExtensionApi.${hostGlobals[path]};`, loader: 'js',
    }));
  },
};
const options = {
  outdir: 'out', entryNames: `[name]-${manifest.version}`, bundle: true, metafile: true,
  define: { READABLE_LOGS_VERSION: JSON.stringify(manifest.version) },
};
await mkdir('dist', { recursive: true });
await rm('out', { recursive: true, force: true });
const [main, renderer] = await Promise.all([
  build({
    ...options,
    entryPoints: { main: 'src/main.ts', 'find-worker': 'src/worker/find.ts' },
    platform: 'node', format: 'cjs', target: 'node24',
    external: ['electron'], plugins: [hostSingletons],
  }),
  build({
    ...options,
    entryPoints: { renderer: 'src/renderer/index.tsx' },
    platform: 'browser', format: 'esm', outExtension: { '.js': '.mjs' },
    plugins: [hostSingletons],
  }),
]);
await copyFile('node_modules/@freelensapp/extensions/LICENSE', 'out/freelens-sdk-LICENSE');
await writeFile('dist/build-meta.json', JSON.stringify({
  inputs: { ...main.metafile.inputs, ...renderer.metafile.inputs },
  outputs: { ...main.metafile.outputs, ...renderer.metafile.outputs },
}, null, 2) + '\n');
