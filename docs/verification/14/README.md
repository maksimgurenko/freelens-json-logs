# Ticket 14 — complete-record inspection and exact originals

Production package: **freelens-readable-logs 0.1.9**, running in actual Freelens
**1.10.3**, Electron **41.10.0**, on this Arch/Wayland host. Node **24.18.0**,
npm **11.16.0**, pinned SDK/core **1.10.3**. Host observations were recorded on
2026-10-23 UTC (2026-10-22 local). No disposable branch was modified or merged.

## Package and automated checks

The final installable tarball SHA-256 is
`e791cf6558da20203706e1e7bcb39df7a0718ad20c8963a90e5d2a3283ab6547`.
[Installed hashes](installed-package-hashes.txt) match both production bundles and
the packaged development guide to the current checkout. A second
[build](rebuild.txt) produced the [same tarball bytes](reproducible.txt).

Commands and results:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
```

[Locked installation](locked-install.txt), [TypeScript](typecheck.txt),
[63 passing tests, no failures/skips](tests.txt), [packaging](package.txt), and
[actual tarball inspection/CommonJS loading](package-check.txt) passed. The
lockfile changes only the root package version; transitive dependencies are
unchanged. Host React/MobX, SDK and Electron remain external. Core tests cover
exact copy payloads, complete-object preservation, snapshot selection identity,
first-use/schema validation and temporary-state separation. The host scripts
below are executable interaction tests of the actual packaged UI, not simulated
Electron clipboard results.

## Acceptance evidence

| Original criterion | Implementation and real evidence |
| --- | --- |
| Compact rows, additional fields, all data/originals | `viewer.tsx` retains native-style time/level/message rows and an additional-field count. All fields renders the complete parsed object; Application text and Transport line expose retained strings independently. [Interactions](interactions.json) verify unused aliases, extracted fields, nested siblings, arrays, nulls, Unicode and escaped newlines. [Side](side.png) compares directly with the native Logs dock below it. Extraction does not mutate the original record. |
| Inline, Side, Bottom; Side initially; selection retained; no implicit pause | [Initial new store/view](final-initial.json) starts Side. [Interactions](interactions.json) assert the actual rendered layout class, enabled selector, selected record, complete data and automatic state for every switch. Valid screenshots: [Inline](inline.png), [Side](side.png), [Bottom](bottom.png). [Automatic inspection](automatic-inspection.json) additionally exercises keyboard selection, all three layout writes and a real extension-only `tailLines=1000` HTTP 200 while the selected record survives. No Pause action occurs in that check. |
| Global versioned preference with main durable writer, across views and full restart | Matching `ConfigurationStore` instances use `Common.Store.ExtensionStore` in main and renderer; main owns SDK persistence. Schema 1 stores `viewer.inspection` separately from profile configuration. [Every layout written to disk](automatic-inspection.json), [cross-view before](cross-view-before.json)/[after](cross-view-after.json), and [another reopened view](reopened-view.json) establish reuse. [Normal full quit/reopen](normal-quit-reopen.json) records all original host PIDs exited and new main PID **2312234**; [restored view](after-reopen-view.json) is Bottom. [Before](config-before-quit.json) and [after](config-after-reopen.json) configurations match. |
| Raw and distinct exact original inspection/copy actions | [Interactions](interactions.json) asserts Raw with timestamps is the exact transport line; without timestamps it is exact application text. Both independently labeled content controls and copy buttons use retained strings. Fourteen Electron write/read round trips compare expected and actual originals, with no reconstruction from pretty JSON or displayed local time. |
| New views Raw off; no persisted temporary inspection state | Before departure, Raw and a selected record were active ([cross-view setup](cross-view-before.json)). New targets start Readable with no selection ([cross-view result](cross-view-after.json)). Before normal Quit, Raw, selection and wrap were on ([temporary state](temporary-before-quit.json)); [after reopen](after-reopen-view.json), Raw is off, selection absent, timestamps on and wrap off. Serialized settings contain only SDK metadata, schema version and global Inspection, with no record/sample/Raw/profile state. |
| Actual clipboard whitespace, blanks, Unicode, escapes, timestamp precision and interaction tests | [Final clipboard matrix](interactions.json) uses a real Kubernetes Pod's timestamped public SDK response and the installed UI's copy buttons. All seven records pass both representations, including two blank/space-only application records, indented stack text, original JSON spacing, Greek/emoji, JSON newline/tab/Unicode escapes and nanosecond Kubernetes timestamps. HTTP request observation confirms zero log requests during paused inspection/copy. [Reproducible fixture](fixtures.yaml), [interaction script](probes/interactions.js), [core tests](../../../tests/inspection.test.ts). |
| Host evidence of layouts, Raw, selected-record and layout persistence | The screenshots and executable probes above cover the production package, with matching installed hashes. [Finish review](finish-review.txt) found no material UI defect and accepted the completed normal-restart evidence. [Design detector](design-detector.json) returned no findings. |

## Installation, defects found, and limits

The accepted maintenance sequence was followed: fresh main window, Extensions
before any cluster, explicit uninstall with stable removal of both package paths,
one Install submission, wait for Enabled/version, then open the cluster and use
its actual Pod-header action without a post-install restart.
[Final maintenance launch](fresh-maintenance.json),
[removal](final-removal.json), [one submission](final-install-action.json),
[installed 0.1.9](installed.json), [header action](final-header-click.json),
[actual initial view](final-initial.json).

Two event-watcher attempts failed after extraction and before package discovery:
[first failure](failed-install.json), [clean attempt failure](failed-clean-recovery.json).
Both remain failures. No Install button was clicked twice in a failed session.
After all old host processes exited, failed extractions were preserved under the
local scratch directory and the next launch used process-local
`CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100` together with
`TMPDIR=$HOME/.cache/freelens-readable-logs/tmp`. The polling launch installed
0.1.8, then a separate supported maintenance session installed corrected 0.1.9.
This observation supports a missed filesystem-event explanation but does not
establish its cause. No host patch or global environment/configuration change
was made. The packaged development guide documents the successful environment.

The first running 0.1.8 package exposed a real configuration defect:
SDK `__internal__` migration metadata in a first-use file was mistaken for an
unsupported user schema. [Defect capture](initial-settings-defect.png).
0.1.9 ignores only that SDK-owned metadata when interpreting user configuration;
a regression test covers metadata-only initial files and preservation of newer
user schemas. [Preliminary interaction output](preliminary-copy-results-invalid-layout.json)
is **not layout acceptance**: its layout assertion was too weak to detect the
disabled selector. The final script requires the rendered class to change and
all final layout/persistence results use 0.1.9.

An additional polling probe initially tried to replace `podsApi.getLogs`.
[SDK wrapper diagnosis](sdk-proxy-diagnosis.json) proves that assignment did not
retain the spy, making its zero-request result invalid. The final probes observe
Node HTTP/HTTPS requests without altering responses and filter native Logs traffic
out of the automatic-refresh count. The final passing result contains the
extension's explicit bounded query. One early rerun navigated before that probe
settled; [interrupted result](automatic-interrupted-not-acceptance.json) is not
acceptance. No production change was needed for these probe defects.

The clipboard fixture was recreated for the corrected transport probe. Native
Pod details cached its deleted original UID, correctly producing an old-target
error in the extension ([early rerun](clipboard-stale-native-drawer-not-acceptance.json)).
The public Pod store was reloaded before using the new header action
([current native target](clipboard-fresh-native-target.json),
[fresh view](clipboard-fresh-view.json)). Final copies used that new Pod's real
originals. This is the host cache behavior already observed under ticket 13.

The initial native shortcut command used obsolete Hyprland syntax and was
rejected without action; an unfocused attempt did not quit. Neither establishes
restart acceptance. The passing script uses the configured Lua dispatcher,
focuses Freelens for its native File > Quit accelerator, confirms every old PID
exits, restores the original user focus/workspace, then launches the host silently
on workspace 7. No signal termination is counted as the normal-restart gate.
[Script](normal-quit-reopen.py), [passing facts](normal-quit-reopen.json).

No saved-profile editor, Find/scroll implementation, backed-up reset, broader host
support, crash durability or final release acceptance is claimed by ticket 14.
Selecting a record does not freeze the window; Pause does. A selected record is
cleared when its exact retained line/occurrence leaves the window. Layout switch
and reformatting never replace or mutate the retained original strings.

## Preserved state and cleanup

The matching configuration file is
`~/.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json`.
Stable package/store identifiers and schema are documented in the packaged guide.
No prior production configuration existed before this ticket. The final global
Inspection choice is Bottom. The installed 0.1.9 viewer is left paused on the
shared `single-json/json` fixture, with Raw off, on workspace 7
([final view](final-host-view.json)).

Clipboard formats were saved privately in the live probe, then restored; their
contents were not logged. [Probe restoration](probe-restored.json) confirms test
wrappers were removed. All transport wrappers used `finally` or the recorded
restore action. The user's original active workspace 2 and focused window are
preserved ([normal reopen](normal-quit-reopen.json),
[visible-check restoration](visible-check-restored.json)). Native dock tabs,
kubeconfig, RBAC and unrelated extensions/settings were preserved.

Only namespace `readable-logs-ticket-14` was created/removed. The first deletion
completed after its initial wait timed out; the recreated fixture is removed by
[final cleanup](final-cleanup.txt). The two original shared fixture Pods retain
their identities and restart counts ([preserved fixtures](preserved-shared-fixtures.json)).
[Final host identity](final-host-facts.json) confirms Freelens 1.10.3 and the
installed 0.1.9 manifest. [Final desktop facts](final-desktop-facts.json) confirm
workspace/focus preservation. Failed extracted packages remain in scratch for
diagnosis; runtime `.ralph` data
and unrelated pre-existing setup files are excluded from this ticket commit.
