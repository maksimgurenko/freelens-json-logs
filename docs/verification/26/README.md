# Ticket 26 — selection, immediate inspection and exact copying

All seven original criteria are satisfied on installed **freelens-readable-logs
0.1.24** in **Freelens 1.10.3**, Arch Linux / Hyprland / Wayland, 2026-10-25 UTC.
Only #26 was implemented on `implementation/compact-view`; it was the lowest
eligible ticket and was [assigned to @me](assignment.json) before implementation.
GitHub remains open.

The earlier blocked report added a physical hardware operator requirement that
#26 does not state. That interpretation is withdrawn following the supervisor's
clarification. #26 requires actual pointer gestures creating selection in the
installed package; synthetic selection state alone is insufficient. The final
checks use **Playwright 1.64.1 trusted Chromium mouse/keyboard input**, the real
Electron selection engine and actual clipboard. No browser fixture or prebuilt
selection substitutes for gestures. Geometry ranges and state preparation are
not counted as gesture evidence. No physical hardware provenance is claimed.
**#28's separately explicit physical mouse Back gate remains intact, unimplemented
and unverified.** Windows and macOS are unavailable and unverified.

## Contracts and production change

Read `AGENTS.md`, tracker/domain guidance, `GLOSSARY.md`, the packaged development
guide, verification reports 14/19/25 and the earlier #26 evidence. Read the original
issue and full resolutions for
[layout #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[selection/navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input constraints #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[final contract #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and the linked first-release #8 contract. The disposable B prototype at `a293e92`
was compared for gesture policy; no prototype/research branch was merged wholesale.

The initial implementation is commit `53e75265bf0bb659e9b2b82264bdcc3560c26934`.
Rows track pointer movement without changing inspection during a drag. The whole
count badge is generated, unselectable interface metadata; application/inline/Raw
text, original records and original-copy payloads remain intact. First clicks are
immediate, multi-click selection retains the first inspected record, and Enter/Space
remain explicit activation. Production adds no global listener, delay or extra
Inspect control.

Continuation found a real edge case: the old guard suppressed a plain click inside
an existing selection. The minimal packaged
[0.1.23 regression](continuation/early-0.1.23/selection-click-0.1.23.json) goes red:
a gesture-created multi-row selection exists, but a normal click does not inspect.
0.1.24 captures selection anchor/focus positions at pointer-down. An unchanged old
range allows ordinary inspection; a new range or pointer drag still suppresses it.
The same [0.1.24 regression passes](continuation/selection-click-0.1.24.json).
This exercises the actual user boundary instead of a mocked selection seam.

Parsing, formatting, original-copy adapter, retained-window identity/removal,
requests/lifecycle, profile selection and configuration schema are unchanged.

## Exact package and automated checks

Tarball: `dist/freelens-readable-logs-0.1.24.tgz`.
SHA-256: `ad17fff73f29f1b5247887fb5f31785bd97ab2af2ec758881be272ebbe770fdd`.

[Installed identity](continuation/installed-identity.json) matches manifest, both
bundles and packaged guide byte-for-byte. Entries are `out/main-0.1.24.js` and
`out/renderer-0.1.24.js`. Package/store `freelens-readable-logs`, config/page
`readable-logs`, schema 3, SDK/core 1.10.3 and host-external dependencies remain
stable. Only root package version fields change in the lockfile.
[Source hashes](continuation/source-identity.json) identify final build inputs;
the completion report names their commit.

Exact commands from this checkout:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.24.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/26/continuation/package.sha256
```

[Node 24.18.0/npm 11.16.0](continuation/toolchain.txt),
[locked install](continuation/locked-install.txt),
[strict TypeScript](continuation/typecheck.txt),
[100 tests without failures/skips](continuation/tests.txt),
[packaging](continuation/package.txt), [CommonJS/tarball inspection](continuation/package-check.txt),
[identical rebuild](continuation/reproducible.txt) and
[design scan](continuation/design-detector.json) pass. Existing deterministic tests
cover the preserved first-release data/request/configuration contracts. The full
#19 release/performance matrix is not repeated by this ticket.

## All original criteria and final evidence

[Matrix summary](continuation/matrix-summary.json) derives from six independently
passing installed-package cases. Each records trusted input events, actual selected
text, actual clipboard comparisons and original clipboard restoration.

| Original criterion | Passing evidence |
| --- | --- |
| 1: drags within/across records, Readable/Raw, closed/open inspection | 24 input-created selections cover both modes, all layouts, closed inspection and a different inspected record (index 14). Every drag retains the expected inspector and text selection. See the six cases below. |
| 2: immediate click, Enter/Space, accepted multi-click tradeoff | Six first clicks, 12 Enter/Space activations and 12 double/triple-click selections pass. The first multi-click may inspect immediately; subsequent clicks retain that record and word/line selection. [Previously selected text regression](continuation/selection-click-0.1.24.json) passes too. Production has no delay. |
| 3: entire plural/singular badge excluded | Twelve clipboard cases cover `4 fields` and `1 field`, closed/open inspection and all layouts. Neither badge number nor label appears in copied rows; actual application word `fields` remains. |
| 4: actual fields keys/values/content preserved | Every Raw case selects/copies original JSON with `"fields":"fields"` and nested `"fields":"value fields"`; Readable selections retain application word `fields`. No data is stripped or rewritten. |
| 5: exact originals, copy/paste and focus | **72 actual original-copy comparisons**, immediately and after 100 ms, pass through trusted pointer activation of both copy actions. A different clipboard sentinel before every copy catches stale values. Includes empty/space-only text, indentation, Unicode, JSON escapes and original Kubernetes precision. [Ordinary Find copy/paste and Tab/Shift+Tab](continuation/focus-paste.json) pass using a cleared field and a different sentinel before Copy. |
| 6: no implicit Pause; retained identity/removal | [Automatic check](continuation/automatic.json) creates a real drag selection with another record inspected, sees another genuine HTTP 200 snapshot and retains both the inspected original and copyable selection. Only explicit Pause pauses it. [Real stdout append](continuation/emit.json) then [evicts the record](continuation/expiry-after.json): exactly 1,000 records/114,000 original bytes remain, selection clears and inspection collapses. Paused Refresh stays paused. |
| 7: real gesture behavior, layouts, keyboard and clipboard | The six full cases below create selections through trusted press/move/release and multi-click input, then compare actual Electron clipboard contents. No synthetic selection state alone counts. Provenance is limited to Linux trusted Chromium delivery. |

- [Readable / Inline](continuation/gesture-readable-inline.json)
- [Readable / Side](continuation/gesture-readable-side.json)
- [Readable / Bottom](continuation/gesture-readable-bottom.json)
- [Raw / Inline](continuation/gesture-raw-inline.json)
- [Raw / Side](continuation/gesture-raw-side.json)
- [Raw / Bottom](continuation/gesture-raw-bottom.json)

One bounded case per focus/restore operation:

```sh
CV26_PLAYWRIGHT=1 PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/26/desktop.py script continuation/gesture-readable-side docs/verification/26/continuation/gesture-case.mjs Readable side
```

Verification-only Playwright 1.64.1 was installed with the documented Node/npm into
`.scratch/compact-view/26/browser-driver` ([log](continuation/driver-install.txt)).
It is not a production dependency/bundled asset. Replay needs the owned fixture
and setup first; cleanup removed the namespace.

## Installation and retained failures

0.1.24 used [normal pre-maintenance Quit](continuation/normal-pre-maintenance-quit.json),
[silent fresh launch](continuation/fresh-update-0.1.24-desktop.json),
[Extensions before any cluster](continuation/extensions.json),
[Uninstall](continuation/uninstall.json), [confirmation](continuation/confirm-uninstall.json),
[stable removal retaining settings](continuation/removal.json),
[one Install](continuation/install.json), [Enabled 0.1.24](continuation/installed.json),
[cluster](continuation/open-cluster.json), [current target](continuation/target.json),
[actual Pod header](continuation/header.json) and
[1,000 usable real records](continuation/setup.json). Main PID **383756** remains
running. **No discovery failure or post-install restart occurred.** Launch used
process-local polling and same-filesystem TMPDIR. Initial mapping on workspace 1
was corrected to 7 before host interaction, restoring prior workspace/focus.

Earlier results remain versioned history, not final-package acceptance:

- The first fixture exceeded the shell argument limit. Only its owned Pod was
  recreated with generated stdout. Initial zero-row setup is not usable-view
  acceptance. [Failure](preliminary-fixture-failure.json), [fixture](fixture.json).
- The manual CDP driver had move-button, selection and multiline-geometry problems.
  Root `first-` through `fifth-` failure JSONs retain the failed runs and restoration.
- The old empty-application-copy mismatch remains [recorded and redacted](fifth-preliminary-input-failure.json).
  Its earlier attribution solely to retained selection was unsupported: focused
  trials copied empty text correctly even with that selection retained. The final
  full sequence uses trusted record/button clicks and distinct sentinels; all 72
  immediate/delayed comparisons pass. The exact historical 18-byte mismatch was
  not reproduced or assigned a speculative production cause. Copy adapter unchanged.
- Exploratory custom CDP/uinput selection results were inconsistent. The supervisor's
  stale-drag hypothesis was tested using the live [Input.cancelDragging contract](continuation/cancel-dragging-contract.json)
  plus explicit CDP/native left releases. The [negative test](continuation/early-0.1.23/fourth-native-gesture-readable-side.json)
  did not fix that native case; no cause is claimed. The [CSS hit-testing comparison](continuation/early-0.1.23/badge-repro.json)
  did not explain it either. These exploratory results are excluded from the
  passing matrix; production CSS was not changed in response.
- The real old-selection click regression was fixed in 0.1.24 and rerun green,
  independently of the historical copy mismatch.
- The first continuation paste probe never reached Find: a parent-window
  [owned install notification covered the button](continuation/find-parent-hit.json).
  Only [this package's notifications](continuation/dismiss-owned-toast.json) were
  dismissed. The corrected probe asserts a visible/focused input, sends one paste
  gesture, waits for its effect and passes. Failed attempts remain recorded.
- An exploratory native pointer restore changed focus under focus-follows-mouse;
  the actual prior window was immediately restored. The helper now restores final
  focus after pointer restoration if needed. All final acceptance cases record
  matching before/after workspace and focused-window identities.

Failures are not relabeled as passes. Earlier input-capability notes adding a
physical-only #26 gate are superseded by this report and supervisor clarification.
Physical mouse Back evidence remains required for #28.

## Restored state and scope

[Cleanup](continuation/cleanup.json) restores the complete configuration captured
at continuation start: Inline inspection, no profiles, built-in Default. Only
host-owned migration metadata changes to 0.1.24. Every final case restores clipboard
formats, non-image buffers and original image pixels; no other application's
clipboard content appears in final evidence.

[Final view](continuation/final-review.json) is shared `single-json/json`, paused
and Readable, no selected record/empty inspector, same three dock tabs and no test
transport/store helper. [Capture](continuation/restored-shared-view.png) and
[desktop restoration](continuation/restored-shared-view-desktop.json) leave Freelens
on workspace 7 and restore the actual preceding workspace/focused window.
The owned namespace is [removed](continuation/fixture-cleanup.txt),
[shared UIDs/restarts](continuation/shared-preserved.json) are unchanged, and the
[owned virtual input device is absent](continuation/native-device-cleanup.json).
Kubeconfig, shared fixtures and unrelated settings are preserved.

Only #26 changes/evidence are committed. Untracked `.gitignore`, `ralph`,
`docs/ralph.md`, other tickets, prior scratch and runtime `.ralph` data remain
outside the commit. No comments, issue closures, messages, pushes, merges, releases
or global agent/model setting changes were made.
