import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

// These modules are supplied by Freelens. Never ship independent React/MobX copies.
const hostGlobals = {
  '@freelensapp/extensions': 'LensExtensions',
  react: 'React', 'react/jsx-runtime': 'ReactJsxRuntime',
  'react-dom': 'ReactDOM', mobx: 'Mobx', 'mobx-react': 'MobxReact',
  'react-router-dom': 'ReactRouterDom',
};
await mkdir('dist', { recursive: true });
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
// Freelens retains require() cache across uninstall/install. Versioned module
// paths let an update load its own code without patching the host or restarting.
await rm('out', { recursive: true, force: true });
const result = await build({
  entryPoints: { main: 'src/main.ts', renderer: 'src/renderer/index.tsx' },
  outdir: 'out', entryNames: `[name]-${manifest.version}`, bundle: true, platform: 'node',
  external: ['electron'], format: 'cjs', target: 'node24', metafile: true, loader: { '.css': 'text' },
  plugins: [{
    name: 'freelens-host-globals',
    setup(build) {
      build.onResolve({ filter: /^(?:@freelensapp\/extensions|react(?:\/jsx-runtime)?|react-dom|mobx|mobx-react|react-router-dom)$/ },
        ({ path }) => ({ path, namespace: 'host-global' }));
      build.onLoad({ filter: /.*/, namespace: 'host-global' }, ({ path }) => ({
        contents: `module.exports = global.${hostGlobals[path]};`, loader: 'js',
      }));
    },
  }],
});
await writeFile('dist/build-meta.json', JSON.stringify(result.metafile, null, 2) + '\n');
