# Find integration coverage

Authority: accepted plan `d02b7e7c19c8e48b1cde714f0a23813b40374824`,
reviewed design `a774370c71193b4e3603bab9eee83189fb38c67b`, and the full
live #36/#37/#38/#40 decision comments checked for #47. D10 has two literal
flags only. D11 covers pending/clear/cancellation/deadline; user regex syntax,
invalid patterns, zero-width and hostile regex branches are excluded.

All test paths below are relative to `tests/`. **Browser** means the actual
versioned production renderer/main, real Chromium DOM and real trusted Node
worker, with explicit SDK/Electron/Kubernetes/clipboard boundary stand-ins.
The named browser functions are invoked together by `npm run test:browser`.
No row claims physical input or final installed-host acceptance.

| Case | Pure/state coverage | Production browser coverage | Still pending for #48 |
| --- | --- | --- | --- |
| D01 reading origin/replacement | `find-state.test.ts`: reading row 64; `find-editing.test.ts`: pre-insertion selection | `find-identity-browser.jsx`: `verifyPosition`, 64 → 73 → 82 and shared-prefix replacement | Installed reveal; real keyboard row intent/focus |
| D02 deselect/global beginning | `find-state.test.ts`: dismissal/inspection invalidation; `occurrences.test.ts` | `verifyPosition`: pending deselect, cleared origin, first retained hit independent of scroll | Real click/deselection and current package |
| D03 first/last edges | `find-state.test.ts`: inclusive edges and wrap | `verifyPosition`, `verifyAsync`: first retained hit and direction controls | Host scroll independence; native repeat shortcut |
| D04 refinement | `find-state.test.ts`: refinement stays 73 | `verifyPosition`: incremental text and composition | Async host and native editing/IME |
| D05 temporary zero hits | `find-state.test.ts`: correction restores 82 | `verifyPosition`: Next, typo, correction | Host out-of-order delivery; native editing |
| D06 clear/replacement | `find-editing.test.ts`, `find-state.test.ts` | `verifyPosition`: select-all/shared-prefix/partial paste/cut/undo/composition; `verifyAsync`: Clear pending | Native paste, Undo/Redo, IME and host Clear |
| D07 highlights | `find-matcher.test.ts`, `find-presentation.test.ts`, `find-ranges.test.ts` | `find-presentation-browser.jsx`: stable nodes, native Ranges, 1024 cap, no all-row shading and full 5 MiB selection | Packed-host Custom Highlights and physical selection/contrast |
| D08 hidden/decoded | `find-matcher.test.ts`: OR/provenance; `inspection.test.ts`: exact originals | `verifyPresentation`, `verifyFindPresentation`, `find-integration-browser.jsx`: explicit source tabs, independent state and original payloads | Installed active profile; physical clipboard |
| D09 empty/zero/one/wrap | `find-state.test.ts`, `find-history.test.ts` | `verifyAsync`, `verifyPosition`: disabled/pending, zero hits, both wraps, one-hit feedback | Host no unintended scroll; real shortcuts |
| D10 modes/history | `find-matcher.test.ts`: all four literal flag combinations; `find-history.test.ts`: seven exact tuples | `verifySelectionHistory`, `verifyAsync`: pressed modes, recall/empty state, no regex control | Integrated host key correspondence and primary modifiers on each OS |
| D11 pending/cancel | `find-client.test.ts`, `find-execution.test.ts`: startup deadline/late exit/latest-only; `find-protocol.test.ts`: stale errors too | `verifyAsync`: 100 ms status, timeout, stale success, latched error/explicit Retry, editable input | Actual SDK stop-to-exit and real editing responsiveness |
| D12 selection seed | `find-selection.test.ts`, `find-fields-selection.test.ts` | `verifySelectionHistory`, `verifyFindPresentation`, `verifyFindIntegration`: source provenance/foreign/multiline/256 code points and existing query | Physical selection/clipboard isolation |
| D13 refresh/eviction | `occurrences.test.ts`, `find-state.test.ts`, `viewport.test.ts` | Main `verifyIdentity` duplicate/eviction/DOM selection tests; `verifyPosition` profile maintenance; `verifyFindMarks` | Real snapshot/profile/restart integration and retained physical selection |
| D14 pending dismissal | `find-state.test.ts`: data vs intent validity; `find-client.test.ts`: full key | `verifyPosition`, `verifyAsync`: deselect, close, Profiles and delayed completion | Actual SDK late success/failure and native focus return |
| D15 following/geometry | `viewport.test.ts`, `find-marks.test.ts`, `find-state.test.ts` | `find-marks-browser.jsx`: real rows/fonts/resize/expansion/group cycling; main viewer checks following and Pause | Installed LogViewport, wheel/resize/native window lifecycle |
| D16 history/dismissal | `find-history.test.ts`, `find-editing.test.ts`, local dismissal/shortcut tests | `verifySelectionHistory`: one layer, outside click, foreign editor and opener; combined mark history under failed decoration | Host history and inactive ownership; real menus, IME/AltGraph and OS focus |

## All 13 accepted state traces

Numbers are the original #37 resolution's trace numbers, rather than a new
interpretation of its acceptance text. Exact production-host counterparts and
native delivery remain #48 even where a test below passes.

| Trace | Pure/session/state tests | Mounted production browser evidence |
| --- | --- | --- |
| 1 refinement/origin | `find-state.test.ts`: named 64/73/82 trace; `find-editing.test.ts` | `verifyPosition`: refinement, Next, zero-hit correction, full replacement |
| 2 edges/wrap | `find-state.test.ts`: edges and one-hit feedback | `verifyPosition`: global first hit, both wraps, one hit; `verifyAsync`: zero/empty |
| 3 deliberate row focus | `find-state.test.ts`: reading rebase | `verifyPosition`: tab intent at 90 clears active without inspection and next includes 90 |
| 4 independent inspector/anchor | `find-state.test.ts`: inspection invalidation; `inspection.test.ts` | `verifyPosition`: inspect 64/focus 90/close 64; `verifyPresentation`: hidden source preserves active/reading |
| 5 delayed completion after dismissal | `find-state.test.ts`: counts without resurrected candidate | `verifyPosition`: pending deselect; `verifyAsync`: Close Find/Profiles pending |
| 6 complete stale success/failure keys | `find-client.test.ts`, `find-protocol.test.ts`, `find-execution.test.ts`: every key dimension, both outcomes | `verifyAsync`: delayed query replacement/error/timeout; main `verifyIdentity`: late old-instance log success/failure |
| 7 canceled scroll/dismissal | `find-state.test.ts`: scroll invalidates reveal only; `viewport.test.ts` | `verifyPosition`: manual scroll plus fresh explicit navigation; `verifyAsync`: Profiles return cannot replay |
| 8 duplicate/eviction mapping | `occurrences.test.ts`, `inspection.test.ts`, `viewport.test.ts` | Main `verifyIdentity`: `[start,x,end]` → `[x,end,x]`, zero overlap, identical windows, same actual DOM/selection/focus |
| 9 maintenance does not seek | `find-state.test.ts`: maintenance retains/no substitution | Main `verifyIdentity`: newly gained hits wait; `verifyPosition`: profile reformat without reads or new result |
| 10 input transactions | `find-editing.test.ts`: pre-insertion and composition transaction | `verifyPosition`: shared-prefix replacement, partial paste, cut, Undo/Redo, one composition commit and late-end rejection |
| 11 seed/history/Escape | `find-selection.test.ts`, `find-fields-selection.test.ts`, `find-history.test.ts` | `verifySelectionHistory`: eligibility, flags, capacity/MRU, zero/pending/error, recall and dismissal; combined hidden-source/mark history |
| 12 observed restarts | `lifecycle.test.ts`: repeated/missing/count-then-ID and paused epoch cases; `occurrences.test.ts`; `find-client.test.ts` | Main `verifyIdentity`: repeated paused restarts reset input/history, first-known/missing metadata, late log outcomes and target terminal state |
| 13 geometry/selection/following | `viewport.test.ts`, `find-marks.test.ts`, `find-presentation.test.ts` | `verifyFindPresentation` and `verifyFindMarks`: full long sources, actual retention, real rectangles/fonts/resize/expansion, stale groups, ordinary following/Pause |

## Resource, protocol and packaging gates

`npm test` includes controlled clocks/worker boundaries for whole-attempt startup
timeouts, late actual exit (earlier `terminate()` resolution is insufficient),
newest-only replacement, exact-match priority over ranges, stale success/failure,
and latched explicit recovery on current data. `npm run test:workers` independently
counts real built-worker starts/exits across 20 churn cycles and startup disposal.
`npm run test:smoke` adds 20 real worker retention-bound cycles, plus the preserved
40 core/main and 40 extended renderer cycles. Its public-boundary observations
include worker listeners, RPC owners/inflight work, actual Linux thread/port/timer
counts, observers/animation frames/highlight registries and retained heap/DOM.
Retained source-index leaks are covered by post-GC heap/DOM growth checks; no
private controller inspection or production diagnostic cache is added.

`npm run check:package` checks the strict actual tarball, host globals, pure worker
metadata and no runtime dependencies. It executes the unpacked versioned worker
and main service with a working directory outside the checkout, including worker
termination and frame-owner stand-ins. CI retains its original locked-install,
host/version/tag/release-note validation, two-build SHA-256 comparison and verified
asset jobs. None of those jobs is invoked to publish anything in this session.

Actual installed-host soak, real frame lifecycle and SDK ownership, physical
input/clipboard/selection, native focus/window behavior and corresponding Windows
and macOS checks remain **unverified for this integrated package** under #48.
Historical ticket #42 host evidence does not satisfy those final-package gates.
