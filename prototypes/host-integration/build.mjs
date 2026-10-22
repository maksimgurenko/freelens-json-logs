// Disposable CommonJS package: the host supplies its own API, React, and MobX.
import {mkdirSync, copyFileSync, rmSync} from 'node:fs';
rmSync('out', {recursive:true, force:true});
mkdirSync('out');
for (const name of ['store', 'main', 'renderer']) copyFileSync(`src/${name}.js`, `out/${name}.js`);
