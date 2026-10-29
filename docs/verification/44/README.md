# #44: selected-text Find and temporary history

Implemented **Search selected text and recall temporary history** on
`implementation/find`, against recorded pre-implementation/review HEAD
`c9656e844f5b7a22772777b4c10270c82951b291`. #44 was the lowest eligible local
ticket; #43 is locally done with committed evidence. Claimed before implementation
with `gh issue edit 44 --add-assignee @me`. Live #44 and full decision comments
for #36/#37/#38/#40 matched the cached authority (see [authority check](authority-check.json)).
No issue comments/closure, push, merge, PR, release or installed-host operation.

Authority: the [accepted literal-only plan at d02b7e7](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md),
the [state/history decision and trace 11](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921),
the [matching contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710)
and reviewed D10/D12/D16. Literal-only and black/no-counter corrections govern
older design examples. No matching, retention, parsing, profile, acquisition,
following or Pause contract was changed.

## Original criteria and evidence

| Criterion | Implementation and verification |
| --- | --- |
| Eligible source selection before focus | Explicit source nodes and actual browser Range validation in `src/renderer/find-selection.ts`; pure Unicode eligibility in `src/core/find-selection.ts`. One row/inspector only; unmarked labels, foreign/multi-record/multiline/oversized selections excluded. Pointer capture precedes button focus; keyboard opening reads the current Range. Existing queries stay intact. Mounted tests cover message, inspector All fields/Application text/Transport line, badge/description labels, foreign/multi-record selections and 256/257 astral code points. |
| Seed flags and independent origin | Seed uses the native query-edit transaction, preserves both flags and seeks from the existing reading row. Mounted selection from row 2 still finds row 1, without rebasing to the source. Input focus/select order and pre-pointer-focus capture are asserted. |
| Seven exact tuples; action-time eligibility | `FindHistory` stores only exact nonempty text/Match case/Whole words tuples, maximum seven MRU, in memory. Current ready matching is required at the navigation/close action, including zero hits on close. No completion callback writes history. Pure and mounted checks reject pending/composing/too-long/failed/timed-out/stale inputs. Decoration is not consulted. |
| Recall and lifecycle | Recall restores both flags as a new query through the existing input/state path; no historical cursor. Mounted recall uses the current reading row, with separate inspection. Opening/closing Find, Profiles and temporary inactivity retain history. Actual session metadata restarts and container changes clear it; teardown drops the viewer instance. Independent pure histories and zero browser-storage assertions cover isolation. |
| Clock, empty state, clear and focus | Native host history icon; accessible pressed/expanded/control states; empty explanation and Clear history. Recall closes/focuses Find. Local outside click dismisses only history and returns clock focus; foreign clicks preserve host focus/ownership. Pure LocalDismissal priority/disposal test covers one-layer semantics; real unfocused browser Escape is rejected by the unchanged guard. Native key delivery remains unverified below. Clear retains the current query and focuses the empty heading. |
| Shared explicit navigation | Buttons and existing local Enter/repeat shortcuts route through `navigateMatch`, whose action-time `commitHistory('navigate')` is the common navigation commitment point. Later #46 mark actions must use this same eligibility path. Pure tests cover exact tuple deduplication/capacity, zero hits, stale/error/unfinished input; mounted tests cover recall origin and MRU flags. |
| Pure and production browser regressions/copy | [Focused tests](focused-tests.txt): **11/11**. [Full suite](full-tests.txt): **237/237**. [Mounted production renderer](browser-final.txt): **30 grouped observations/checks**, zero browser errors, two actual worker starts/exits and zero remaining workers/owner/app listeners. D10/D12/D16 and relevant traces pass at these seams, together with the existing state/identity/profile/viewport regressions. Exact original application/transport clipboard-adapter payload tests remain green; no system clipboard was written. |

## Reproduction and package identity

Run from this checkout with `FREELENS_UI_MODE` unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-history.test.ts tests/find-selection.test.ts tests/find-state.test.ts tests/find-editing.test.ts tests/local-dismissal.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
FIND_HISTORY_SCREENSHOTS=docs/verification/44 node scripts/verify-find-identity.mjs
node scripts/verify-find-execution.mjs
node scripts/verify-find-resources.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/44/package-sha256.txt
```

[Environment](environment.json): project-local Node **24.18.0**, npm **11.16.0**,
Linux x64; Freelens SDK/core/host pin **1.10.3**. Stable package/store
`freelens-readable-logs@0.1.34`, configuration/page `readable-logs`, schema **3**,
versioned CommonJS main/renderer and trusted standalone worker retained.
[Locked install](npm-ci.txt), [typecheck](typecheck.txt), [desktop guards](ui-guards.txt),
[packed asset/CommonJS check](package-check.txt) and [two-build reproducibility](reproducibility.txt)
pass. Exact package and bundle hashes: [package-sha256.txt](package-sha256.txt),
[bundle-sha256.txt](bundle-sha256.txt). Strict package allowlists were not weakened.
The package includes the preserved dirty manifest/dependency/documentation inputs;
this is not a clean release checkout or an installed-package acceptance claim.

[Built worker check](actual-worker.json): 20 scheduler cycles, 441 requests,
41 actual starts/exits, peak one worker, zero remaining. [Final resource check](resource-smoke-final.txt)
passes the preserved heap/external/RSS, DOM/listener/document, disk and no-storage
assertions for 40 core/main and 40 renderer cycles. It additionally opens history
each renderer cycle, alternating dismissal and teardown with the popover open:
40 worker starts/exits, peak one, zero remaining workers/sender/app listeners.
The adapter uses current SDK/Electron/OS stand-ins and actual built production
worker/renderer assets in disposable processes. It leaves the pre-existing smoke
files unchanged for #47. **Original `npm run test:smoke` still fails** because its
old Electron double lacks `app.on` ([original-smoke.txt](original-smoke.txt));
this is the previously recorded #42/#43 baseline failure, not a passing check.

## Browser captures, red controls and review

The capture runner serves Roboto/Material Icons from the pinned SDK's core assets
and waits for font readiness. Inspected [260 px](history-260.png),
[390 px](history-390.png), [700 px](history-700.png) and [1440 px](history-1440.png)
production-renderer views preserve the compact separate bar, black canvas and
popover bounds. This is a mounted renderer with host doubles, not the full host
theme or installed extension. [Mechanical UI detector](ui-detector.json) reports
no findings.

TDD red controls precede implementation: [history](history-red.txt),
[Unicode selection](selection-red.txt), [missing browser seed](browser-red.txt),
[abandoned pointer capture](browser-abandoned-red.txt),
[outside-click two-layer dismissal](browser-outside-red.txt), and
[foreign focus theft](browser-foreign-focus-red.txt). Initial typecheck caught
test assertion narrowing and was corrected. Intermediate `browser-expanded*`
failures include fixture assumptions (disabled Clear history and the new clock
being counted as a direction control) and a background timer-wait assumption;
the final test waits for the deadline feedback without claiming hard real-time
timing. They are retained as development evidence, not passing results.

[Independent Standards and Spec review](review.md) is pinned to the starting HEAD
and includes the current uncommitted ticket diff. All confirmed findings were
fixed and independently rechecked. [Prestart preservation](prestart-preservation.json)
confirms exact hashes for the dirty glossary, CI, package/lockfile, local-development,
index documentation and untracked smoke sources. Those inputs, old scratch/design/
Ralph files and `.gitignore` are excluded from this commit. Only the runner-written
#43 Status change accompanies this related ticket.

No native window activation/restart/minimize/restore, pointer/input injection,
clipboard write, fake focus or guard bypass occurred. In this headless run,
`document.hasFocus()` is false: Escape remains host-owned. Pure layer ordering,
DOM focus observations and synthetic events do not prove physical Escape, primary
shortcuts, selection/paste/IME or clipboard delivery. Native/platform and actual
installed production acceptance remain #48, including Windows/macOS; no release
acceptance is claimed. #45 decorations, #46 marks and #47 package/resource/CI
integration remain separate tickets.
