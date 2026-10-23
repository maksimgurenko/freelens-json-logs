# Ticket 17 — automatic formatting-profile selection

Production **freelens-readable-logs 0.1.17**, actual **Freelens 1.10.3**,
Node **24.18.0**, npm **11.16.0**, pinned SDK/core **1.10.3**, Arch/Wayland.
Observed 2026-10-23 UTC / 2026-10-22 local. GitHub #17 was assigned to `@me`
before implementation. No GitHub comments, issue closures or external messages
were sent. Disposable worktrees and global agent configuration were untouched.

## Original acceptance criteria

| Original criterion | Implementation and evidence |
| --- | --- |
| Exact namespace, Pod-label key/value and container conditions, enabled state and ordinary order controls | `ProfileMatching` in `core/profiles.ts`; staged fields and Add/Remove label controls in `renderer/profile-editor.tsx`; immediate saved Move up/down controls. [Final editor assertions](final-editor.json), [editor](editor.png), [conditions](matching.png), [design record](editor-design.md). |
| Conjunctive case-sensitive comparisons, absent labels fail, omitted conditions unrestricted; no regex/wildcards/Pod/cluster conditions | `profileMatches` uses exact equality and own-label existence. `matchingProblems` rejects unsupported condition kinds. [Pure fixtures](../../../tests/matching.test.ts) cover the accepted `prod`/`payments`/`api` example, multiple labels, case changes, empty values, missing labels and literal patterns. Actual Pod label [value case](final-label-value-case.json), [key case](final-label-key-case.json) and [missing required tier](final-label-missing.json) all fall back while paused. Each mutation is separated by an observed return to the first profile ([before key case](final-valid-before-key.json), [before removal](final-valid-before-missing.json)). |
| Manual, first enabled match in saved order, global default; no conditionless matching | [Final editor](final-editor.json) puts an enabled conditionless profile first without selecting it, proves first match and reordering, and explicitly returns manual to Auto. [Actual broader profile](final-manual-and-enable.json) matches with namespace/tier omitted. [Different namespace](final-other-acceptance.json) first falls back, then applies the broad profile on Enable. Pure fixtures cover the full precedence matrix. |
| Disabled matching still permits manual/global selection; default does not reorder; rename preserves identity/references/order | [Editor](final-editor.json) selects a disabled profile manually, changes global default without changing matching priority, renames a selected/global profile preserving its ID and position, and skips it in Auto after Disable. [Container checks](final-container-reset.json) apply the disabled global default to worker. |
| Reevaluate target/settings, Auto/deletion/context rules, show active result, reformat without log reads | Viewer derives both Auto label and active profile from saved settings plus UID-checked current Pod labels/container. Label updates enter the existing metadata observation, including while paused; they do not fetch logs. [Editor](final-editor.json), [label observations](final-label-key-case.json), [manual/Enable](final-manual-and-enable.json) and [deletion](profile-cleanup.json) assert zero additional extension log requests. [Container changes](final-container-reset.json) and [new namespace/Pod](final-other-acceptance.json) clear manual choice and read the actual new target. Deleting manual/default/matching profiles follows normal matching then Default fallback. |
| Persist conditions, enabled states, order/default and existing preferences across normal full quit/reopen | Schema **3**, profile array order, stable profile IDs and matching main/renderer `ConfigurationStore`, with main-owned durable writes. [Before Quit](prepare-restart.json) and [after full restart](final-after-restart.json) have identical complete JSON configurations: four real profiles, enabled/disabled/conditionless states, multiple conditions, custom order, global default and Bottom Inspection. Manual and unsaved matching draft reset. [Native process evidence](normal-quit-reopen.json) proves every old host PID exited and a new main PID started. [Explicit update](update-preserved.json) also preserves the entire configuration except host-owned version metadata. |
| Deterministic tests and packaged-host demonstration, including no-fetch reformatting | **93 passing tests**, zero failures/skips ([results](tests.txt)). The eight new matching tests cover exact conjunctions, missing labels, order, conditionless/disabled/manual/global precedence, rename/delete, schema migration, metadata changes and context resets. All final functional evidence above runs the installed **0.1.17** bundles, whose [hashes](installed-identity.json) match the checkout. The transport probe observes actual Node HTTP/HTTPS requests only for the owned fixture endpoints; responses pass through untouched. |

## Build and package

Use the project-local invocation in [local development](../../local-development.md):

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.17.tgz
```

[Toolchain](toolchain.txt), [locked install](locked-install.txt),
[strict TypeScript](typecheck.txt), [tests](tests.txt), [build](package.txt) and
[actual tarball/CommonJS inspection](package-check.txt) pass. Only the root
package version changes in the lockfile. Host libraries remain external.
[Second build](rebuild.txt) and [repeated inspection](rebuilt-package-check.txt)
produce [identical bytes](rebuilt-sha256.txt). Final SHA-256:
`6ee6a140e204cae8a250db845ca43a28373de62df646529a160393eb98627c13`.
Both installed entry points and the packaged guide match the checkout exactly.

## Installation, migration and restart

Final installation uses [one pre-maintenance normal quit/reopen](fresh-maintenance.json),
[Extensions before any cluster](final-extensions.json), explicit
[Uninstall](final-uninstall.json), [confirmation](final-confirm-uninstall.json),
[stable removal with settings retained](final-removal.json),
[one Install submission](final-install.json), [Enabled/version](final-installed.json),
then [cluster](final-open-cluster.json), [Pod UID](final-fixture-target.json),
[actual header action](final-header.json) and [usable logs](final-initial.json).
No overwrite prompt, repeated submission, cycling failure or post-install restart
was used to obtain installation acceptance. [Saved settings](update-preserved.json)
survive the explicit 0.1.16 → 0.1.17 update.

Every launch uses process-local `CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100` and
same-filesystem `TMPDIR=$HOME/.cache/freelens-readable-logs/tmp`. The underlying
missed-event cause remains unconfirmed. Freelens runs on workspace **7**;
native operations immediately restore the previously active workspace/focus.
[Capture](desktop-capture.json), [maintenance](fresh-maintenance.json) and
[persistence restart](normal-quit-reopen.json) record before/after state.

Schema 1 preferences migrate directly to schema 3. Schema 2 profiles migrate
explicitly with disabled matching/no conditions, retaining IDs/order/rules/default
and Inspection. Pure fixtures prove valid-profile migration and invalid-data
preservation. The actual 0.1.15 → 0.1.16 update loaded the existing schema 2 Bottom
preference without overwriting it ([initial host](initial.json)); the first
ordinary saved edit wrote schema 3. Existing profile migration is tested, not
claimed as a real-host schema 2 profile migration: this host began with no saved
profiles. Corrupt/newer-file recovery and backed-up reset remain #18.

The separate final **persistence** restart follows installation and functional
checks, and proves persistence rather than repairing installation.

## Reproduction and observation limits

[Fixture YAML](fixture.yaml) owns only `readable-logs-ticket-17` and
`readable-logs-ticket-17-other`, each with a `profiles` Pod and `api`/`worker`
containers writing actual JSON stdout. Probes use the supported public Pod API,
actual installed controls and optional localhost CDP port 9235. Example:

```sh
python3 docs/verification/17/run-probe.py 770814 show-fixture
python3 docs/verification/17/run-probe.py 770814 header
python3 docs/verification/17/run-probe.py 770814 setup
python3 docs/verification/17/run-probe.py 770814 editor
```

`editor.js` expects no ticket profiles initially. `setup.js` installs scoped
request observation; `prepare-restart.js` and `cleanup-profiles.js` restore it.
`run-probe.py` fails on CDP exceptions and records outputs locally. The label
probes require the corresponding real `kubectl label` mutations; `.txt` files
record them. Reset valid labels and observe the first profile between negative
cases. Metadata reevaluation occurs when observed, not instantly on mutation.
Changing containers/targets intentionally makes new log requests; local matching
changes do not. No fake response, disk-injected settings or host patch is used.

The initial `manual-and-enable.json` probe failed because it checked before the
next metadata observation. `failed-disable-probe-panel-state.json` then toggled
an already-open editor closed. Neither is acceptance. The initial key/missing
label probes also ran consecutive fallback states without an intervening observed
match; those are not counted. Corrected `.16` probes and the complete final `.17`
matrix explicitly observe the required transitions. Failed evidence is retained.

`preliminary-0.1.16/` retains the earlier build/probes/restart and screenshots.
The final `.17` revision changes the package version and corrects migration-guide
text; production logic and styles are identical. All final functional checks and
the full restart were rerun on `.17`. The independent scoped UI review returned
[ship with no material fixes](finish-review.txt); final captures confirm the same
surface. [Detector](design-detector.json) has no findings. Desktop PNGs are
3828×2101, with a 2317×1252 CSS viewport; the matching capture intentionally
scrolls the inner editor. No mobile support, instantaneous metadata updates,
crash durability or complete #19 release/performance gate is claimed.

## Cleanup

[Deletion checks](profile-cleanup.json) remove only the four ticket-created
profiles and restore global Default while preserving Bottom Inspection. They also
prove manual deletion returns to matching Auto and global deletion leaves matching
precedence intact, with zero additional log requests. [Fixture cleanup](fixture-cleanup.txt)
removes only the two owned namespaces. [Shared fixtures](shared-fixtures-preserved.json)
retain their original UIDs/restart counts. [Final host](final-host.json) is paused
on shared `single-json/json`, Auto/Default, without transport instrumentation.
The user's native dock tabs are retained. Pre-existing `.gitignore`, `ralph`,
`docs/ralph.md`, unrelated scratch files and runtime `.ralph` data are excluded
from this ticket's commit. The runner's earlier ticket 16 Status update is retained.
