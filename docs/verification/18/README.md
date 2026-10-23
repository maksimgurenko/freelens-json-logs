# Ticket 18 — preserved configuration fallback and backed-up reset

Production **freelens-readable-logs 0.1.18**, actual **Freelens 1.10.3**,
Node **24.18.0**, npm **11.16.0**, pinned SDK/core **1.10.3**. Observed
2026-10-23 UTC / 2026-10-22 local on Arch/Wayland. GitHub #18 was assigned to
`@me` before implementation ([claim](claim.json)). No GitHub comments, closure,
external messages, global agent configuration changes or prototype merges.

## Original acceptance criteria

| Criterion | Implementation and actual evidence |
| --- | --- |
| Validate saved versions; explain corrupt/unreadable/newer settings and preserve originals while viewing defaults | `adapter/configuration-file.ts` preflights bytes before either SDK store starts; `configuration-store.ts` exposes built-in Default/Side on failure. Real complete [controlled settings](controlled-valid.json) were created with ordinary profile controls ([creation](create-settings.json)). [Corrupt startup](corrupt-initial.json), [future startup](future-initial.json), [unreadable startup](unreadable-initial.json) all display the actual shared fixture record and clear errors. [Corrupt](corrupt-preservation.json) and [future](future-preservation.json) hashes match the exact injected fixtures, including host metadata and unknown future content. [Unreadable preservation](unreadable-original-preserved.json) compares the exact source bytes after restoring only the controlled file mode. |
| Inhibit startup synchronization and incidental writes in fallback | Preflight failure never constructs Conf or starts SDK synchronization, avoiding its startup migration-metadata writes. The store also rejects incoming models and all preference/profile mutators while blocked. The real [corrupt](corrupt-preservation.json), [future](future-preservation.json) and [unreadable](unreadable-preservation.json) checks attempt preference writes and incoming synchronization through the actual installed extension store; profile UI writes are disabled. Exact originals survive. Pure store tests additionally assert zero SDK initialization and stable `toJSON()` on rejected models. |
| Confirm reset; preserve backup before replacement; failed backup leaves original unchanged | Inline **Reset settings… → Back up and reset / Cancel reset**, with Cancel initially focused and pending actions disabled. Cancel creates no backup or replacement ([corrupt](corrupt-preservation.json), [future](future-preservation.json)). A controlled regular file at the backup-directory path produces a genuine `EEXIST`, with an unchanged original, visible error and saving still inhibited ([failed backup](corrupt-backup-failed.json), [capture](backup-failed.png)). Mode `000` produces genuine `EACCES` on load and backup ([unreadable](unreadable-preservation.json)). Main copies to an exclusive backup, verifies bytes, checks the source has not changed, writes a complete separate file and then renames it over the source. |
| Successful reset restores defaults and normal saving with no stale references | Real [corrupt reset](corrupt-reset.json), [future reset](future-reset.json) and [unreadable reset](unreadable-reset.json) each verify an exact original backup, schema 3, empty profiles/order, global Default and Side. The same paused view retains its actual log record; profile choices return to Auto. Each then saves Inline Inspection, duplicates a new profile and saves a new global default to disk. No restart is needed for recovery. [Success capture](reset-success.png). |
| Document stable settings/backup identities, reset and separate removal; no crash guarantees | [Packaged local guide](../../local-development.md#recovering-unusable-settings) documents unchanged package/store `freelens-readable-logs`, config `readable-logs`, schema 3, exact settings path, exclusive backup names under its `backups/` subdirectory, confirmation/cancellation/failure/retry, manual restoration and extension-only explicit removal including backup handling. Uninstall retains settings and backups. No crash durability or transactional disk guarantee is claimed. |
| Explicit tested older-schema migrations; never migrate future schemas | Existing schema 1 and schema 2 migrations remain explicit. Real [schema 1](migration1.json) preserves Inspection; real [schema 2](migration2.json) preserves two complete profiles, stable IDs, order, formatting rules and global default while introducing disabled empty matching. The next ordinary saved preference writes schema 3. Neither migration creates reset backups. Pure tests cover both versions and invalid/future preservation. Actual schema 999 remains unchanged until confirmed backed-up reset. |
| Automated matrix and controlled real-host recovery | **100 tests pass**, zero failures/skips ([results](tests.txt)); seven new recovery tests exercise real filesystem permissions/obstructions, canceled reset, exact backup bytes and distinct exclusive names, migrations, rejected synchronization, zero SDK startup in fallback and saving after reset. Real production evidence above covers corrupt, future, unreadable, cancellation, failed backup, successful reset and normal saving. These are observed installed-package outcomes, separate from the SDK stand-in used by store unit tests. |

## Build, package and installation

Exact project-local invocation (machine default Node 26 is not used):

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.18.tgz
```

[Versions](toolchain.txt), [locked install](locked-install.txt),
[TypeScript](typecheck.txt), [tests](tests.txt), [build](package.txt) and
[tarball/CommonJS inspection](package-check.txt) pass. Host libraries remain
external and entry filenames retain the package version. A [second build](rebuild.txt)
and [inspection](rebuilt-package-check.txt) produce [identical tarball bytes](rebuilt-sha256.txt):
`c0ceaf4926465439ab8cdb678648311cf621b9da1a988f33ab6c8ebc20c6551b`.
[Installed main/renderer/guide hashes](installed-identity.json) match the checkout.

The accepted update used one [pre-maintenance normal quit/reopen](fresh-maintenance.json),
[Extensions before any cluster](extensions.json), explicit [Uninstall](uninstall.json),
[confirmation](confirm-uninstall.json), [stable removal retaining settings](removal.json),
[one Install submission](install.json), [Enabled/version](installed.json), then
[cluster](open-cluster.json), [Pod UID](show-original.json), [actual header action](header.json)
and [usable logs with original Bottom preference](initial.json). No overwrite prompt,
repeated Install, cycling failure or post-install restart established this acceptance.
Later restarts inject controlled extension-only recovery/migration fixtures after
every old host process has exited; they do not repair installation.

All launches use process-local polling (`CHOKIDAR_USEPOLLING=1`,
`CHOKIDAR_INTERVAL=100`) and the same-filesystem TMPDIR recorded by `host.py`.
The earlier watcher root cause remains unconfirmed. Freelens uses workspace 7.
The final helper verifies placement, silently corrects it with Lua
`hl.dsp.window.move` when needed, and restores prior focus before tests.

## Reproduction and limits

`host.py <label> [controlled-source-file [mode]]` performs native File > Quit
(Alt+F4), records every old PID exiting, optionally copies only this extension's
controlled settings fixture while stopped, and silently launches. `run-probe.py`
uses the optional localhost CDP port 9235 and fails on script exceptions. For each
recovery scenario, open the cluster, run `show-original`, `header`, `setup`, then
the corresponding check. Examples after an appropriately prepared fixture:

```sh
python3 docs/verification/18/run-probe.py root open-cluster
python3 docs/verification/18/run-probe.py 770814 show-original
python3 docs/verification/18/run-probe.py 770814 header
python3 docs/verification/18/run-probe.py 770814 setup
python3 docs/verification/18/run-probe.py 770814 fallback
python3 docs/verification/18/run-probe.py 770814 reset
```

`fallback` expects readable but unusable data and verifies cancellation and
incidental writes. `failed-backup` additionally expects a controlled obstruction
at this extension's `backups` path; never overwrite an existing backup directory.
`unreadable` expects the owned settings file at mode `000`. The test explicitly
restores its mode, compares original bytes, then retries reset. The product itself
does not modify permissions. Do not run fixture injection over user settings
without preserving and restoring their complete contents and backup inventory.

The probes inspect the installed extension's own React component/store for
incidental-write checks; they do not patch host internals or transport, synthesize
log responses, or use fixture output as backup evidence. The shared cluster is
read only. Saved backups are compared with the original controlled bytes and
copied under [backups/](backups/) before test-only host backups are removed
([manifest](backup-verification-and-cleanup.json)).

The initial desktop audit caught two launches on workspace 2 despite the requested
silent workspace-7 rule; focus was also displaced during that sequence. Those
records remain in [earlier-desktop-placement/](earlier-desktop-placement/) and are
excluded from final unreadable/migration acceptance. The schema-1 check was also
repeated because its earlier restart changed focus. The corrected helper explicitly
verifies/corrects placement and restores focus. Final [unreadable launch](unreadable-start.json),
[capture](unreadable-desktop.json), [schema-2 launch](migration2-start.json),
[schema-1 launch](migration1-start.json) and
[restoration](final-restoration.json) all verify workspace 7 and unchanged prior
workspace/focus. This is a validation-helper correction, not a product or global
desktop configuration change.

The scoped visual inspection found readable error/confirmation/success notices,
available log space and consistent native controls. [Mechanical detector](design-detector.json)
has no findings. The accepted incumbent host colors and typography are retained.
This ticket makes no new crash guarantee, broader host-version claim, or claim
that the full ticket-19 release/performance matrix has been completed.

## Cleanup

The [original application configuration and file inventory](final-cleanup.json)
are restored: schema 3, no profiles, global Default, Bottom Inspection. Only
Freelens-owned version metadata changes from 0.1.17 to 0.1.18. Only ticket-created
backup files and obstruction are removed from the host, with exact copies retained
as evidence. No other extension settings, native dock tabs, cluster resources,
kubeconfig or RBAC are changed. [Final runtime](final-host.json) is the installed
0.1.18 viewer paused on shared `single-json/json`, Auto/Default, with the temporary
probe helper removed. [Desktop](final-desktop.json) leaves Freelens on workspace 7
and the user's prior workspace/focus restored. Pre-existing `.gitignore`, `ralph`,
`docs/ralph.md`, unrelated scratch and runtime `.ralph` files are excluded. The
runner's earlier ticket-17 Status update is retained in this relevant commit.
