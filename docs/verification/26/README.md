# Ticket 26 — text selection and inspection

Implementation is committed for **GitHub #26**, the lowest eligible local ticket,
on `implementation/compact-view`. It was [assigned to @me](assignment.json)
before implementation. **The ticket is blocked, not done:** physical mouse
drag/click/double/triple-click evidence is unavailable in this session. Original
criteria 1, 2 and 7 remain unchecked. Windows and macOS are unverified.

Read the original issue and the full accepted resolutions for
[layout #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[selection/navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[host constraints #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[final contract #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and the linked first-release #8 contract. Read `AGENTS.md`, tracker/domain guidance,
`GLOSSARY.md`, `docs/local-development.md` and verification reports 14, 19 and 25
before editing or host checks. The disposable B prototype at `a293e92` was read
for its gesture policy; no prototype/research code was merged wholesale.

## Production changes

`Viewer` tracks a primary pointer gesture inside the records region. Pointer
clicks after movement, or intersecting an existing noncollapsed text selection,
leave inspection alone. Additional clicks in a multi-click sequence do not
inspect again. A plain first click remains immediate, without a timer or another
Inspect control. Enter/Space and assistive/programmatic activation keep their
existing explicit action. The first click of a double/triple-click may inspect,
as accepted. These handlers neither prevent native text selection/copy nor call
Pause; no document/global listeners are installed by this production change.

The whole additional-field count is CSS-generated interface metadata on an empty,
unselectable span. Its number and singular/plural label therefore stay out of
native selected text and clipboard row selections. An accessibility label retains
the count's meaning. Actual message/inline/Raw text and complete original records
are unchanged, including keys and values named `fields`. The existing original
clipboard adapter, selected-record identity, retained-window logic and schema are
unchanged.

## Package and automated checks

**freelens-readable-logs 0.1.23**, actual **Freelens 1.10.3**, Electron **41.10.0** /
Chromium **146.0.7680.216**, Arch Linux / Hyprland / Wayland, 2026-10-25 UTC.
Final tarball: `dist/freelens-readable-logs-0.1.23.tgz`.

SHA-256: `64fc858b0799ca2f3a49f6826f297bdb06b13e30e4391b977bf16c639f230f5e`.

[Installed identity](installed-identity.json) matches the manifest, both bundles
and packaged guide byte-for-byte with the build. Entry paths are
`out/main-0.1.23.js` and `out/renderer-0.1.23.js`; package/store
`freelens-readable-logs`, config/page `readable-logs`, schema 3 and SDK/core 1.10.3
are retained. The lockfile changes only its root version fields.
[Source hashes](source-identity.json) identify the build inputs above base commit
`a20af1d`; the implementation/evidence commit is recorded in the Ralph report.

Exact commands, from this checkout:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.23.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/26/package.sha256
```

[Node 24.18.0/npm 11.16.0](toolchain.txt), [locked install](locked-install.txt),
[strict TypeScript](typecheck.txt), [100 tests, no failures/skips](tests.txt),
[package creation](package.txt), [actual tarball/CommonJS inspection](package-check.txt)
and [identical rebuild](reproducible.txt) pass.
[Mechanical UI scan](design-detector.json) has no findings. Existing core tests
cover original-byte payloads, retained-record identity, request/lifecycle and
configuration contracts. No new mocked selection test is offered as gesture
evidence. This is not a repeat of the full #19 release/performance matrix.

## Actual packaged-host observations

These observations exercise the installed package and real Electron clipboard.
**Trusted Chromium CDP input is still synthetic delivery. It does not establish
physical mouse or OS input behavior.** No browser fixture is substituted for the
packaged host, and none of these observations closes that physical gate.

| Original criterion | Evidence and remaining boundary |
| --- | --- |
| 1: real pointer drags, within/across rows, Readable/Raw, closed/open inspection | **Unchecked.** [Chromium subobservations](chromium-subobservations.json) record 24 passing synthetic drags: two modes × three layouts × closed/open × within/across. A different record (index 14) remains inspected in every open case. Selected text and real clipboard values match. Physical drags remain required. |
| 2: immediate click, Enter/Space, accepted multi-click tradeoff | **Unchecked pending physical clicks.** The same passing stages record six immediate first-click inspections and 12 double/triple-click selections, preserving the first inspected record. [Separate bounded keyboard probe](focus-copy-paste.json) passes Enter and Space. No activation delay is introduced in source. |
| 3: entire singular/plural badge excluded | **Checked.** Twelve passing badge-selection/copy cases cover `4 fields` and `1 field` across Inline/Side/Bottom with closed/open inspection. Real `clipboard.readText()` equals selected text and contains neither badge. Metadata has no selectable DOM text. See `badgeCopies` in [subobservations](chromium-subobservations.json). Physical repetition remains within criterion 7. |
| 4: actual application/JSON content named fields preserved | **Checked.** Readable drag results still contain application word `fields`; Raw multi-row clipboard contains literal `"fields":"fields"` and nested `"fields":"value fields"`. See `rawOriginalFields` in [subobservations](chromium-subobservations.json). No record/formatting/parser code changed. |
| 5: exact original actions, selection/copy/paste/focus | **Checked for available packaged checks.** [Isolated copy contract](copy-contract.json) passes 12 exact Application/Transport comparisons, immediately and after 100 ms, including empty/space-only text, indentation, Unicode, JSON escapes and original Kubernetes precision. [Bounded keyboard/copy/paste check](focus-copy-paste.json) passes native Chromium paste/copy in Find, Tab/Shift+Tab and Enter/Space row activation. [Clipboard/focus restoration](focus-copy-paste-restoration.json) passes. Physical gesture coverage remains criterion 7. |
| 6: no implicit pause; retained-window selection/removal rules | **Checked.** [Automatic observation](automatic-before.json) starts a real automatic view with a DOM text range and another record inspected; [later observation](automatic-after.json) sees another genuine owned log request without Pause and retains the exact inspected transport line. [Real stdout append](emit.json) replaces the window; [expiry](expiry-after.json) retains exactly 1,000 rows/114,000 original bytes, clears the evicted selected record and collapses inspection. Paused Refresh remains paused. Selection was programmatic in this independent request-state check. |
| 7: physical gestures, clipboard, all applicable layouts and another inspected record | **Unchecked.** Synthetic stages and native clipboard results are supplementary. The physical operator/device gate below is still missing. |

## Supported installation and desktop handling

[Normal pre-maintenance Quit](normal-pre-maintenance-quit.json) confirms all old
host PIDs exited. [Fresh launch](fresh-update-desktop.json) used process-local
`CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100` and
`TMPDIR=/home/max/.cache/freelens-readable-logs/tmp` on the extension filesystem.
The initial window mapped on workspace 1 despite the silent launch request; the
helper corrected it to workspace 7 before any host interaction and restored the
actual preceding workspace/focus.

The fresh main window opened [Extensions](extensions.json) before any cluster,
then [Uninstall](uninstall.json), [confirmation](confirm-uninstall.json),
[stable removal with settings retained](removal.json), [one Install](install.json)
and [Enabled 0.1.23](installed.json). Then the cluster and actual Pod-header action
opened the viewer. [Fresh fixture header](fresh-header.json) and
[1,000 usable real records](fresh-setup.json) pass under the same main PID
**306167**, without a post-install restart. **No discovery failure occurred.**

`run-probe.py <root|770814> <probe-name> [output-label]` records background probes
and rejects exceptions. `desktop.py` records actual workspace/focus before/after
focus-dependent checks, uses `finally` restoration and keeps Freelens on 7.
[Bounded keyboard operation](focus-copy-paste-desktop.json) and
[final capture](final-restored-view-desktop.json) restore the exact prior focus.

## Preliminary failures retained

- The first owned fixture put too much output in one shell argument and failed
  with `exec /bin/sh: argument list too long`. [Failure](preliminary-fixture-failure.json),
  [initial unusable state](initial-state.json). The owned Pod was recreated using
  generated output; the public Pod cache was refreshed before the header action.
  The initial `setup.json`/`geometry.json` with zero rows are not usable-view
  acceptance. The corrected [fixture](fixture.json), [creation](fixture-recreate.txt)
  and `fresh-setup.json` contain the usable current UID/window. This was a fixture
  failure, not package discovery, and no host restart was used to recover it.
- The first exploratory CDP drag driver used `button: none` during pressed moves
  and selected no text. The second attempt tried to drag within an existing
  selection, exercising native text dragging instead of a new selection. The
  third used the center of a multiline span, producing an empty badge selection.
  Their `first-`, `second-` and `third-preliminary-input-failure.json` remain failures.
- The fourth and fifth runs passed all 24 drag cases, 12 badge copies, six first
  clicks and 12 multi-click cases before failing their final exact-copy stage:
  programmatic `.click()` retained the preceding row selection, unlike a normal
  pointer button click. [Fourth failure](fourth-preliminary-input-failure.json),
  [fifth failure](fifth-preliminary-input-failure.json). The independent copy probe
  explicitly clears that selection and passes immediate/delayed exact comparisons
  for all six records and both representations. No clipboard adapter change was
  needed. Non-fixture clipboard content is redacted in failed evidence.
- A later exploratory run stalled in Chromium drag delivery. [Progress](input-progress.json),
  [explicit clipboard/listener restoration](abort-input.json) and
  [driver abort/desktop restoration](input-desktop.json) are retained. Only the
  owned Node input driver was terminated; Freelens continued running. The
  exploratory `input.mjs` now bounds each CDP command to three seconds and cancels
  dragging on failure; that timeout-only hardening was syntax-checked, not rerun.
  There is **no overall passing `input.json`**, and the subobservations are not
  relabeled as an overall passing gesture run or physical acceptance.

## Exact blocker and supervisor handoff

[Input-capability investigation](input-capabilities.json): native computer APIs
are disabled on the current tool surface. CDP input is available. `/dev/uinput`
and `wtype` offer virtual input, which cannot establish physical-device provenance.
No physical mouse operator or external physical-input evidence is available.
Linux physical input, Windows and macOS remain **unverified**.

Required remaining gate: an operator must use a **physical mouse** in this
installed Freelens 1.10.3 package on workspace 7, record within/across-row drags in
Readable and Raw with closed and open Inline/Side/Bottom inspection, retain a
different inspected record during drags, and perform plain/double/triple clicks
plus keyboard activation. Compare actual selected/copied text, both badge forms
and original `fields` data. Record package identity, input provenance, results,
clipboard/configuration restoration and immediate actual desktop/focus restoration.
Check remaining original criteria only after that evidence passes.

Freelens remains running for the supervisor. For an isolated physical recheck,
recreate only `fixture.json` with the documented kind context, wait for the Pod,
then use `show-fixture`, `header`, `setup` and `prepare` probes. The helper's
programmatic preparation is not physical evidence. Preserve the operator's
clipboard before gestures, then restore it. Afterward use `cleanup`,
`show-original`, `header` and `final-review`, and delete only namespace
`readable-logs-ticket-26`. No reinstallation is necessary for this unchanged
package. Do not use `input.mjs` as the physical acceptance gate.

## Restored state and scope

[Cleanup](cleanup.json) restores the original complete application configuration:
Inline inspection, no saved profiles, built-in Default. Only host-owned migration
version metadata changes from 0.1.22 to 0.1.23. Clipboard formats, non-image buffers
and original image pixels were restored in every completed/aborted focused probe.
The [final view](after-focus-final-review.json) is the original shared
`single-json/json`, paused, Readable, with no selected record, no empty inspector,
no test transport/store/input helpers and the same three native dock tabs.
[Final image](final-restored-view.png) was captured after dismissing only this
ticket's package maintenance notifications. The owned namespace was
[removed](fixture-cleanup.txt); [shared UIDs/restarts](shared-fixtures-preserved.json)
are unchanged. Kubeconfig, shared fixtures and unrelated host/user settings were
not changed.

Only ticket 26, its production changes and local evidence are included in this
commit, together with the allowed runner-written completed status for #25.
Existing untracked `.gitignore`, `ralph`, `docs/ralph.md`, other tickets, previous
scratch data and runtime `.ralph` data are preserved outside the commit. No GitHub
comments/closures, messages, pushes, merges, releases or global agent/model changes
were made.
