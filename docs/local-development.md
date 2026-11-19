# Develop Readable logs for Freelens 2

Build with Node **24.18.0** and npm **11.16.0**. The lockfile pins the
released Freelens SDK **2.0.0** and the complete build tree.

```sh
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
```

On this development machine the pinned toolchain is cached locally. To select it
for the commands in this guide:

```sh
freelens_toolchain="${XDG_CACHE_HOME:-$HOME/.cache}/freelens-json-logs/toolchain/node-24.18.0-npm-11.16.0"
export PATH="$freelens_toolchain/node_modules/node/bin:$freelens_toolchain/node_modules/.bin:$PATH"
```

In a private Freelens 2 profile, open **Extensions**, enter the absolute path
to this checkout, and confirm the development install. Open a fixture cluster
and choose **Readable logs** in a Pod's details header. Follow the
[Linux UI playbook](agents/ui-verification.md) for host work. The
[private-host helpers](../scripts/find-production-host/README.md) document
reusable display and CDP guards alongside the historical Freelens 1 recipe.
Use v2-specific installation and renderer probes with those guards.

## Test and package

```sh
npm run typecheck
npm test
python3 -B -m unittest discover -s tests -p hyprland_observer_test.py -v
npm run test:browser
npm run test:workers
npm run test:smoke
npm run package
npm run check:package
archive="freelens-readable-logs-v2-$(node -p "require('./package.json').version").tgz"
(cd dist && sha256sum "$archive" > SHA256SUMS)
npm run package
(cd dist && sha256sum --check SHA256SUMS)
```

Use Chromium or Chrome for the mounted browser and resource tests. Set
`CHROME_BIN` if the browser is outside the standard executable locations.
Those tests use an isolated headless browser, real worker code and v2 SDK
stand-ins. The [resource smoke guide](resource-smoke.md) explains its workloads
and thresholds. The full regression contract is in the
[behavior specification](specification.md).

The installable file is `dist/freelens-readable-logs-v2-<version>.tgz`.
Keep the checked file and its `SHA256SUMS` together for installed verification.
The package checker inspects the actual archive and uses the build metadata to
verify the boundaries between CommonJS main, browser ESM renderer with its
stylesheet, and the separate Node Find worker. The build uses Freelens'
React and MobX singletons. Electron is supplied by the host to main.

## Supported local maintenance

For a release install, download the v2 tarball and its `SHA256SUMS` from
the same [GitHub release](https://github.com/maksimgurenko/freelens-json-logs/releases).
The [installation steps](../README.md#install) use the verified archive path in
**Extensions** and a fresh app session. For a v2 update, uninstall the existing
v2 entry, wait for its removal, and install the new archive once. Check its
version and **Enabled** status before opening a cluster. Uninstall preserves
the v2 settings and backups. Follow the Linux UI playbook for automation and
diagnostics.

The manifest declares Freelens compatibility as `^2.0.0`, with Freelens
2.0.0 on Linux as the acceptance target. Other compatible 2.x builds log a
warning in main and can run if they provide the required SDK interfaces. When a
required interface is missing, the extension logs its name and stops before
opening the viewer or starting settings synchronization or the Find worker.
Windows and macOS remain unverified.

## Configuration and temporary state

Package and store name are both `freelens-readable-logs-v2`. The config name is
`readable-logs`. Its file is
`<userData>/extension-store/freelens-readable-logs-v2/readable-logs.json`
(`~/.config/Freelens/extension-store/freelens-readable-logs-v2/readable-logs.json`
on a default Linux profile). Main owns durable writes. Schema 3 stores
`viewer.inspection`, named formatting profiles in matching order and the global
default profile ID. Temporary log records, queries, drafts and manual profile
choices reset with the viewer.

The first v2 launch uses built-in Default and Side inspection. Keep the legacy
settings file at
`<userData>/extension-store/freelens-readable-logs/readable-logs.json`.
You can uninstall the legacy entry through **Extensions** if it is visible.
A legacy file is independent of the v2 settings and is retained on uninstall.

## Recovering unusable settings

When a v2 settings file is malformed, unreadable or uses an unsupported schema,
the viewer shows the exact path and runs with built-in Default and Side
inspection. Saving is disabled. In **Settings recovery**, choose **Reset
settings…**, then **Back up and reset** to confirm. Main verifies an exact backup
in the v2 store's `backups/` directory before replacing the file. Saving resumes
after a successful reset. A canceled reset or failed backup preserves the
original file.

To restore a backup, fully quit Freelens, preserve the current file if needed
and copy the desired backup to the v2 `readable-logs.json` path before reopening.
For explicit removal, quit and remove only the v2 store directory, including
its backups. Keep the shared `extension-store` directory and the legacy store.

## Local keyboard shortcuts

Open **Display options → Shortcuts** in the viewer for the current bindings.
See the [Find walkthrough](usage.md#find-records-and-follow-output) and the
[shortcut contract](specification.md#local-input-and-temporary-history).
