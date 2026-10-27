# Integrated production Find acceptance matrix

This is a partial #48 checkpoint, not release acceptance. Authority is the
accepted plan at `d02b7e7c19c8e48b1cde714f0a23813b40374824`, its reviewed
`a774370` design with literal-only/black-canvas exceptions, and full #36/#37/#38/#40
resolutions. [Live revalidation](authority.json) matches cached bodies and comments.

The complete **pure/state and mounted production Chromium mapping** for every
D01–D16 case and all 13 state traces is [#47 coverage](../47/coverage.md). Those
checks were freshly rerun: [246 tests](full-tests.txt), [production browser](browser.txt),
[real workers](workers.txt), [resource smoke](resources.txt). A pass there does not
fill an unperformed installed-host/native/platform cell below.

“Host DOM” means the actual installed packed renderer through real Freelens SDK
and Kubernetes snapshots, with DOM events/Range selection. It does not mean
physical pointer, keyboard, clipboard or native input delivery. “Partial” keeps
the unperformed parts visible. Screenshot-driven rendering is explicitly limited
by the private compositor's 0×0 output; native presentation cadence is unverified.

| Case | Current integrated host evidence | Remaining host/native gate |
| --- | --- | --- |
| D01 | Host DOM pass: row 64, inclusive origin 73 and replacement from 64 | Physical row intent/focus and scrolling |
| D02 | Host DOM pass: deselection clears origin, new query finds first retained hit despite scrolling | Physical deselection/focus return |
| D03 | Host DOM partial: first retained match and wrap verified | Initial Previous without active result; real repeat shortcuts |
| D04 | Host DOM pass: progressive `up` through `upstream` remains at 73 | Native editing/IME |
| D05 | Host DOM pass: Next → 82, zero-hit suffix, correction restores 82 | Out-of-order mounted host completion/native navigation |
| D06 | Host DOM partial: identical full pre-insertion replacement resets origin | Host partial paste/cut/Undo/Redo/composition and Clear during pending; physical delivery |
| D07 | Host DOM pass within screenshot frame schedule: exact native Custom Highlights, stable text node and DOM Range across query decoration, black/no-counter canvas | Native selection/copy/contrast; natural presentation cadence |
| D08 | Host DOM pass: hidden original → exact Application text; Raw decoded-only → exact Extracted message | Full inspector layout/profile matrix, physical original-copy/clipboard |
| D09 | Host DOM partial: zero-hit clears result; both wrap directions | Complete empty/one-hit/no-scroll host matrix and native shortcuts |
| D10 | Real SDK four flag combinations pass; history displayed in real UI; type/mode zero ordinal unresolved | Stabilize host fixture and verify each mode refines per #37; history recall/range/mark agreement; platform modifiers |
| D11 | Real SDK startup-inclusive timeout, actual exit and explicit recovery pass | Mounted host pending Clear/cancel/recovery/edit responsiveness |
| D12 | Host DOM partial: actual single-message Range seeds empty Find | Full host inspector/foreign/multiline/length/existing-query cases; physical selection isolation |
| D13 | Host DOM partial: source node/selection across query updates | Real append/duplicate/eviction/retained-selection, profile and repeated restart traces |
| D14 | Pure and mounted Chromium pass; host pending races unperformed | Real host delayed current/stale success/failure after inspector dismissal |
| D15 | Host mounted bounds/Pause/active-idle sampling, real marks and visible ranges | Full measured host resize/geometry/group cycling/following; physical wheel/native windows |
| D16 | Host DOM partial: navigation commits history; Close/Open retains query | Host history recall/one-layer dismissals/inactive ownership; physical menus/IME/AltGraph/focus |

Host DOM results: [28 integrated assertions](host/integrated-acceptance.json).
SDK/frame/deadline results: [SDK suite](host/sdk-suite.json),
[startup stall](host/startup-timeout.json), [mounted viewer inactivity](host/mounted-host-viewer.json),
[disable/uninstall/reactivation](host/extension-lifecycle.json),
[20 cancellation bursts](host/actual-host-churn.json).

| Original state trace | Integrated host verdict |
| --- | --- |
| 1 refinement/origin | Host DOM pass for 64/73/82 trace and full replacement |
| 2 edges/wrap | Partial: beginning, zero and wrap; initial Previous/one-hit matrix pending |
| 3 deliberate keyboard row focus | Unperformed; pure/Chromium evidence only |
| 4 independent inspector/anchor | Partial: hidden-source action observed; A/B keyboard and eviction pending |
| 5 delayed completion after dismissal | Unperformed at host seam |
| 6 stale complete success/failure keys | Partial: SDK foreign/retired tokens and latest-only bursts; mounted out-of-order data pending |
| 7 manual scroll/dismissal cancellation | Partial: real inactivity disposal/query retention; pending host reveal races pending |
| 8 duplicate/zero overlap | Unperformed at host snapshot seam |
| 9 maintenance without seek | Unperformed for actual snapshot/profile no-seek behavior; the initial type/mode zero ordinal is an unresolved separate refinement gate |
| 10 input transactions | Partial: identical full replacement; remaining native/edit transactions pending |
| 11 seed/history/Escape | Partial: source Range seed and history commitment; complete host/native matrix pending |
| 12 observed restarts | Unperformed at host snapshot seam |
| 13 geometry/selection/following | Partial: Custom Highlights/source selection/bound workloads; resize/follow/reveal/current geometry matrix pending |

Additional mandatory regressions: Unicode (including U+0345), punctuation,
16,384/16,385 limits, non-overlap, all stale identities and capped/failed ranges
pass their freshly rerun pure/production-browser layers. The real SDK additionally
verifies four modes, exactly 1,000 records/**5 MiB**, 4,096-range incomplete coverage,
frame isolation/removal, same-frame replacement and actual exit. Full installed
host input/range-failure/geometry/state counterparts remain pending where not
explicitly linked above. No older prototype or #42 package result is promoted to
current-package coverage.

| Platform/input layer | Verdict |
| --- | --- |
| Linux real packed SDK/worker | Passed checks linked above; remaining lifecycle/state/resource scope kept explicit |
| Linux physical selection/copy/system clipboard | **Unverified**; no clipboard read/write or native input injected |
| Linux native paste/Undo/Redo/IME/AltGraph/exact modifiers/menus/focus | **Unverified**; DOM events do not satisfy these gates |
| Linux physical window lifecycle | **Unverified**; separate-session Electron destruction/shutdown is not physical close-button delivery |
| Windows matching/worker/package/primary modifier/IME/selection/copy/focus/lifecycle | **Unverified**; no Windows session available |
| macOS matching/worker/package/primary modifier/IME/selection/copy/focus/lifecycle | **Unverified**; no macOS session available |

All failed attempts are retained and described in the report. Every unverified
cell is a release gate. No release acceptance, issue closure or publication.
