# Integrated production Find acceptance matrix

Latest current artifact: [cadence continuation](cadence.md), package SHA-256
`1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`.
Its installed terminal-Q regression, 33 DOM-state checks, SDK/frame suite and
both mounted resource workloads pass in a **privately modified compositor**.
All other Host cells below retain their historical package scope and need current
artifact confirmation. Stock-output, complete Host/native/platform gates remain.

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
the unperformed parts visible. Original screenshot-driven rendering is explicitly limited
by the private compositor's 0×0 output; native presentation cadence is unverified.

| Case | Current integrated host evidence | Remaining host/native gate |
| --- | --- | --- |
| D01 | Host DOM pass: row 64, inclusive origin 73 and replacement from 64 | Physical row intent/focus and scrolling |
| D02 | Host DOM pass: deselection clears origin, new query finds first retained hit despite scrolling | Physical deselection/focus return |
| D03 | Host DOM partial: first matching row, wrap and initial Previous after deselection with no active result | Dedicated row-zero-hit fixture; real repeat shortcuts |
| D04 | Host DOM pass: progressive `up` through `upstream` remains at 73 | Native editing/IME |
| D05 | Host DOM pass: Next → 82, zero-hit suffix, correction restores 82 | Out-of-order mounted host completion/native navigation |
| D06 | Host DOM pass: full replacement, partial paste, cut/Undo/Redo, select-all composition and Clear during async dispatch | Native paste/Undo/IME delivery; stale composition completion at Host |
| D07 | Host DOM pass within screenshot frame schedule: exact native Custom Highlights, stable text node and DOM Range across query decoration, black/no-counter canvas | Native selection/copy/contrast; natural presentation cadence |
| D08 | Host DOM pass: hidden original → exact Application text; Raw decoded-only → exact Extracted message | Full inspector layout/profile matrix, physical original-copy/clipboard |
| D09 | Host DOM pass: empty, zero/one-hit feedback and wrap; no-scroll after explicit DOM scroll event | Natural scroll-event delivery and native shortcuts |
| D10 | Real SDK four combinations; 33-check settled/paused Host run verifies mode refinement, candidate retention and history recall with flags | Full host range/mark agreement across modes; platform modifiers |
| D11 | Real SDK startup-inclusive timeout, actual exit and explicit recovery pass | Clear during async dispatch passes; held mounted completion/timeout/recovery and native edit responsiveness pending |
| D12 | Host DOM partial: message Range seeds empty Find; existing query, labels and multi-record rejection pass | Full host inspector/foreign/multiline/Unicode-length matrix; physical selection isolation |
| D13 | Host DOM partial: source node/selection across query updates | Real append/duplicate/eviction/retained-selection, profile and repeated restart traces |
| D14 | Host DOM current completion after inspector dismissal preserves useful count without selection/inspector resurrection | Held actual host late current/stale success/failure |
| D15 | Host mounted bounds/Pause/active-idle sampling, real marks and visible ranges | Full measured host resize/geometry/group cycling/following; physical wheel/native windows |
| D16 | Host DOM partial: navigation and valid zero-hit Close commit history; recall restores query/flags | Complete host one-layer dismissal; physical menus/IME/AltGraph/focus |

Host DOM results: [28 original integrated assertions](host/integrated-acceptance.json), [33 continuation state assertions](host/dom-continuation/state-acceptance.json).
SDK/frame/deadline results: [SDK suite](host/sdk-suite.json),
[startup stall](host/startup-timeout.json), [mounted viewer inactivity](host/mounted-host-viewer.json),
[disable/uninstall/reactivation](host/extension-lifecycle.json),
[20 cancellation bursts](host/actual-host-churn.json).

| Original state trace | Integrated host verdict |
| --- | --- |
| 1 refinement/origin | Host DOM pass for 64/73/82 trace and full replacement |
| 2 edges/wrap | Partial: beginning, zero/wrap, initial Previous without active result, and one-hit feedback pass; dedicated row-zero-hit fixture and native repeat delivery pending |
| 3 deliberate keyboard row focus | Unperformed; pure/Chromium evidence only |
| 4 independent inspector/anchor | Partial: hidden-source action observed; A/B keyboard and eviction pending |
| 5 delayed completion after dismissal | Partial: current count after inspector dismissal without resurrected selection/inspector passes; held late worker completion remains pending |
| 6 stale complete success/failure keys | Partial: SDK foreign/retired tokens and latest-only bursts; mounted out-of-order data pending |
| 7 manual scroll/dismissal cancellation | Partial: real inactivity disposal/query retention; pending host reveal races pending |
| 8 duplicate/zero overlap | Unperformed at host snapshot seam |
| 9 maintenance without seek | Unperformed for actual snapshot/profile no-seek behavior; settled/paused mode refinement passes in the continuation; the earlier live-snapshot timing observation is retained |
| 10 input transactions | Partial: identical full replacement; DOM partial paste/cut/Undo/Redo/select-all composition pass in continuation; native delivery pending |
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

[Latest continuation](continuation.md) links 33 installed DOM-state assertions and minimized installed resource failure/retaining paths. Host trace 5 has current-count-after-dismissal coverage; held late replies remain pending. Every resource/native/platform limit above remains an execution gate.
