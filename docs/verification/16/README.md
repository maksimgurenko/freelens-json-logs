# Ticket 16 — staged formatting profiles

Production package: **freelens-readable-logs 0.1.15**, actual **Freelens 1.10.3**,
Node **24.18.0**, npm **11.16.0**, pinned SDK/core **1.10.3**, Arch/Wayland.
Observed 2026-10-23 UTC (2026-10-22 local). GitHub #16 was assigned to `@me`
before implementation. GitHub issues/comments remain unchanged otherwise.
The separate operator commit **3f374a0** containing the workspace-7 instruction
is preserved. No disposable worktree was modified or merged.

## Build and package

Exact project-local toolchain invocation:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.15.tgz
```

[Toolchain](toolchain.txt), [locked installation](locked-install.txt),
[TypeScript](typecheck.txt), [85 passing tests, no failures/skips](tests.txt),
[packaging](package.txt), and [actual tarball/CommonJS inspection](package-check.txt)
passed. The [second build](rebuild.txt) has [identical bytes](rebuilt-sha256.txt).
Tarball SHA-256:
`d349429ce818f178598d34e335b48293b63113fff36e3882a5317d09c6a3722c`.
[Installed identity](installed-identity.json) matches both versioned bundles and
the packaged guide to the checkout. [Final runtime](final-host.json) loads the
0.1.15 renderer and displays that version. React/MobX, SDK and Electron remain
host dependencies; the lockfile changes only the root package version.

## Original acceptance criteria and evidence

| Criterion | Implementation and verification |
| --- | --- |
| Read-only Default, independent duplication, names, rename/delete and stable IDs | `core/profiles.ts` validates nonempty unique names, reserved Default and stable IDs. `saveProfile` preserves array order/references; duplication clones independent rules. [Actual editor](editor.json) asserts Default controls disabled, reserved/duplicate-name errors, independent edits, rename retaining global/manual references and canceled/confirmed deletion. [Cleanup](profile-cleanup.json) additionally proves deleting the global default restores built-in Default and reformats retained records. |
| Staged ordinary controls, preview, valid Save and Cancel, temporary drafts/samples | `renderer/profile-editor.tsx` provides name/path/unit/mapping controls, a sample input and preview of up to 20 lines. [Editor](editor.json) verifies specific errors disable Save, invalid drafts and samples never reach disk, valid Save and Cancel preserve independent saved state. [Editor screenshot](editor.png), [invalid draft](validation.png), [temporary state before Quit](prepare-restart.json) and [after reopening](after-restart.json). |
| Exact ordered slash paths, escapes, array indexes, replacement and empty/missing fallbacks | [Automated fixtures](../../../tests/profiles.test.ts) cover every accepted path example, literal dots, slash/tilde escapes, array indexes, empty keys, own properties, missing/unusable candidates, no appended defaults, empty role lists and no recursive/wildcard searching. [Real saved rules](editor.json) use `/event/text`, `/a~1b`, `/a~0b` and `/items/0/code`. |
| Ordered inline/hidden fields, hidden descendants, extracted leaves and preservation | `recordFormatter` removes selected/hidden leaves only from compact projections. Ordered inline selections cannot repeat leaves through overlapping paths. [Fixtures](../../../tests/profiles.test.ts) verify nested siblings/arrays, parent hiding, fallback text unchanged and both exact originals. [Actual active Save](active-save.json) compares Application text/Transport line before/after reformatting and inspects complete hidden/extracted fields. [Viewer](viewer.png) shows ordered inline fields; full records stay available in the existing inspector. |
| Explicit numeric time and numeric/text severity mappings | Tests cover unset/seconds/milliseconds, invalid/range-overflow numbers and numeric strings, timezone requirements, numeric/text source distinction, case-insensitive text keys and explicit precedence over built-in normalization. [Actual profiles](editor.json) save seconds and milliseconds plus number `30 → INFO` and text `"30" → WARN`; the real rows show INFO/WARN. Unknown values retain the earlier fallback contract. |
| Manual/Auto and global default, temporary selection and deletion fallback | [Editor](editor.json) exercises manual Default/custom selections, Auto/global default, rename and deleting a manual choice back to Auto. [Container changes](context-reset.json) clear manual selection and read the real new container. [Closed/reopened view](reopen-view.json) records an empty initial manual choice. [Full normal restart](after-restart.json) clears manual selection and applies the persisted global default. [Global deletion](profile-cleanup.json) restores built-in Default. Pure fixtures cover distinct target/UID/close resets. |
| Single versioned configuration, stable identity and main-owned persistence | Matching main/renderer `ConfigurationStore` instances persist schema **2**, saved `profiles`, stable IDs, `globalDefault` and `viewer.inspection`. Stable package/store/config names are retained. [Real full configuration](prepare-restart.json) is identical as a JSON object [after full quit/reopen](after-restart.json). [Explicit uninstall/install update](update-configuration-preserved.json) preserves both complete profiles and Inspection; only host migration metadata changes package version. |
| Immediate reformatting without fetching or changing originals/independent copies, including Find | [Editor actions](editor.json) and [active Save](active-save.json) observe **zero extension log requests** across editing, preview, selection, Save/Cancel, rename/delete and inspection while paused. The installed message changes immediately on active Save, then changes back on a second Save. Both originals and hidden/extracted complete fields stay intact. Find keeps matching original text after changing profiles; deterministic fixtures additionally verify decoded-message-only matches recompute on formatting changes. |
| Automated fixtures and actual editor/manual/persistence demonstration | All **85 tests** pass, including **13 profile tests** and the existing record, inspection, lifecycle, Find/scroll and deferred-request cases. Actual installed UI scripts assert Save/Cancel/validation/selection, and actual file observations assert complete configuration survival through every old host PID exiting and a fresh main PID starting. These are production package observations, not the disposable prototype. |
| Release exclusions | No import/export, custom row templates, executable user code or automatic target-matching UI was added. Auto uses the global default in this milestone; exact target matching remains #17. Backed-up configuration reset remains #18, and complete release/performance acceptance remains #19. |

## Accepted installation and normal restart

Final 0.1.15 installation used the accepted fresh-main-window procedure:
[normal native quit and silent workspace-7 launch](fresh-maintenance.json),
[Extensions before any cluster](extensions.json), [Uninstall](uninstall-action.json),
[confirmation](uninstall-confirmed.json), [stable removal with settings retained](removal.json),
[one Install submission](install-action.json), [Enabled/version](installed.json),
then [cluster](open-cluster.json), [correct fixture UID](fixture-target.json),
[actual Pod-details header action](header-click.json) and [usable view](initial.json).
There was no overwrite prompt, repeated install submission, cycling failure or
post-install restart used to obtain these installation results.

The later, independent **persistence** restart [used native File > Quit](normal-quit-reopen.json),
confirmed all original processes exited, and launched a new main process on
workspace **7**, silently. [Before Quit](prepare-restart.json) includes two complete
saved profiles/global default/Bottom preference plus an unsaved draft/sample,
manual selection, Raw, paused state, Find, wrap on and timestamps off. [After Quit](after-restart.json)
has exactly the same saved configuration, Auto, empty Find, Readable, automatic
updates, wrap off, timestamps on and a fresh read-only Default editor with no
sample/draft. The check then explicitly pauses the view.

Every launch used process-local `CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100` and
`TMPDIR=$HOME/.cache/freelens-readable-logs/tmp`. The earlier watcher root cause
remains unconfirmed. No global environment, agent configuration or host internals
were changed. [Native captures](desktop-capture.json) and both restart reports
record the user's workspace/focus before and immediately after the native check.
The current operation's original focus is restored, rather than assuming one
fixed workspace for the entire session.

## Reproducing the host interactions

The committed [fixture](fixture.yaml) emits real stdout with nested fields,
Unicode/newline escapes, numeric timestamps and distinct numeric/text levels.
The probes use the actual public Pod API and installed header action. On an
installed 0.1.15 package, a fresh fixture, open cluster and opt-in localhost CDP
port 9235:

```sh
node scripts/host-cdp.mjs 770814 docs/verification/16/probes/show-fixture.js
node scripts/host-cdp.mjs 770814 docs/verification/16/probes/header.js
node scripts/host-cdp.mjs 770814 docs/verification/16/probes/setup.js
node scripts/host-cdp.mjs 770814 docs/verification/16/probes/editor.js
node scripts/host-cdp.mjs 770814 docs/verification/16/probes/active-save.js
python3 docs/verification/16/capture-desktop.py
# Cancel/close the capture draft, then context-reset.js and reopen the view.
# prepare-restart.js restores observation before the normal native quit.
python3 docs/verification/16/normal-quit-reopen.py persistence same-filesystem-temp
# Open cluster/header, run after-restart.js, then setup.js and cleanup-profiles.js.
```

`setup.js` observes Node HTTP/HTTPS requests **only** for the owned fixture's
bounded extension-log endpoint. Responses pass through untouched. Container
checks record two real HTTP 200 reads with the accepted query. Observation is
explicitly restored before leaving/restarting and after cleanup. No response,
request failure, screenshot data or disk configuration was manufactured.

## Review, earlier attempts and limits

The [independent full UI review](finish-review.txt) accepted the captures and
scoped staged flow, with one material contrast fix. The host's `--colorError`
was too dark for body-sized validation text (3.28:1). Final 0.1.15 uses the host's
accessible foreground; [measured contrast](validation-contrast.json) is **16.18:1**.
The [verdict pass](finish-verdict.txt) scores that fix resolved, **ship**, with no
directly introduced regression. This verdict covers the scored fix, not a new
whole-product review. The [mechanical detector](preliminary-0.1.14/design-detector.json)
had no findings; it was run once before the contrast correction.

`preliminary-0.1.13/` and `preliminary-0.1.14/` preserve the earlier packaged
observations and failures. The .13 cluster probe ran before the host certificate
was ready; it did not reach a viewer and is not failed installation evidence.
Later probes wait only for that specific initialization error. The initial
selector selected the Find container instead of the input; its illegal-invocation
failure is retained. Another assertion wrongly expected Find to exclude Unicode
still present in original application text; the accepted rule requires it to
remain searchable. A rerun also retained a manual Default selection, correctly
overriding a new global default; setup now records initial choice and explicitly
selects Auto for the editor sequence. The final update probe briefly expected
the prior version; its failure is retained separately, and the corrected probe
reads the manifest. None of these failed probe assertions counts as acceptance.

The .14 revision adds numeric-time validity at RFC 3339's four-digit year
boundary; .15 is the reviewed contrast correction. Final functional and restart
evidence is all against .15. Valid schema 1 Inspection data migrates in memory;
the next ordinary saved change writes schema 2. Invalid/future settings inhibit
edits and retain the earlier preservation behavior; full recovery, backups and
fault injection remain ticket #18. No crash durability, transactional disk
guarantee, automatic matching or full #19 performance gate is claimed here.

## Cleanup and user state

[Profile cleanup](profile-cleanup.json) removes only profiles created by this
ticket, restores built-in global Default and verifies immediate fallback. The
previous Bottom preference is retained in schema 2. The [owned namespace is deleted](fixture-cleanup.txt);
the shared fixtures' UIDs/restart counts are [unchanged](shared-fixtures-preserved.json). [Final host](final-host.json)
is paused on the original shared `single-json/json` fixture, installed 0.1.15,
Auto/Default, empty Find and normal display defaults, with no transport probe.
[Final desktop](final-desktop.json) keeps the host on workspace 7. No unrelated native dock tabs, settings, kubeconfig, RBAC or cluster resources
were changed. The pre-existing untracked `.gitignore`, `ralph` and `docs/ralph.md`
setup files and runtime `.ralph` data are excluded from this ticket's commit.
