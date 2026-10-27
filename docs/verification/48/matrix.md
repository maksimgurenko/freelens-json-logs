# Integrated production Find acceptance matrix

Reconciled 2026-10-27 against `freelens-readable-logs@0.1.34`, SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
[Fresh installed identity](host/functional-final/package-identity.json) verifies
main/renderer/versioned-worker bytes, Freelens 1.10.3, schema 3 and stable
package/store/page/configuration identities. No production bytes changed in this
checkpoint. [Report and exact commands](functional-final.md).

**User decision, 2026-10-27: the DOM/listener resource issue is accepted for now
and deferred.** [Accepted deferral](../../find-resource-investigation.md#accepted-deferral)
includes request/timer/queue attribution, timing controls, further soaks and related
stock-display investigation. Failed measurements and original thresholds remain;
none is relabelled passed. This overrides historical instructions to continue
that investigation. Native/clipboard and actual Windows/macOS coverage are not waived.

## Evidence layers and artifact scope

The accepted plan at `d02b7e7c19c8e48b1cde714f0a23813b40374824` and full
#36/#37/#38/#40 decisions govern, with the explicit resource deferral above.
[Live revalidation](host/functional-final/authority.json) matches cached authority.
[Core/browser coverage by case](../47/coverage.md) remains the source mapping;
this checkpoint freshly passes [249 tests](host/functional-final/tests-output.txt),
[production browser](host/functional-final/browser-output.txt),
[actual workers](host/functional-final/workers-output.txt) and
[strict package checks](host/functional-final/package-check-output.txt).

Every Host link in the two tables below is for the exact final `995f1cf5` artifact.
`feedback-final` records its prior installed functional checks; `functional-final`
adds new target/viewer/anchor checks and repeats the previously older-artifact
snapshot/state/instance subsets. Exact retention uses the same final artifact in
`exact-listeners` / `retention-reviewed`. `functional-context-reviewed` strengthens
the held-success oracle; `functional-modes-reviewed` verifies installed four-mode
matching/range/highlight/mark agreement. Earlier `cbc903f5`, `1775d0f0` and
`d19f826b` reports remain historical evidence, not silently promoted to this artifact.

**Host DOM/controlled SDK** means real installed production code through the
pinned host and main worker, with explicit DOM events, Range selection or controlled
response delivery. It never means physical input or clipboard delivery. The private
labwc → Hyprland workspace-7 session uses the documented modified Aquamarine
diagnostic. Its stock/native limits remain; investigating the display for the
accepted resource issue is deferred. No fake document focus or native input was used.

## D01–D16

“Pass” below applies to the named functional Host layer; the final column remains
unverified. Pure/browser counterparts for all rows pass at their own layers.

| Case | Final-artifact functional Host verdict and evidence | Remaining native layer |
| --- | --- | --- |
| D01 reading origin/replacement | Pass: [state boundaries](host/functional-final/state-boundaries.json), 64 → 73 → 82; independent DOM keyboard reading row 90; replacement seeks from live origin | Physical row activation, keyboard focus and scrolling |
| D02 deselect while scrolled | Pass: [settled DOM state](host/feedback-final/state-acceptance.json); deselection clears origin and a new query starts at retained beginning | Physical deselection and focus return |
| D03 first/last/initial Previous | Pass: [real row-zero snapshot](host/functional-final/snapshot-acceptance.json), [initial Previous](host/feedback-final/state-acceptance.json), zero/one-hit and wrap | Native repeat shortcuts |
| D04 progressive refinement | Pass: [state boundaries](host/functional-final/state-boundaries.json), [DOM state](host/feedback-final/state-acceptance.json); still-matching candidates stay current | Native editing and IME |
| D05 correction and stale replies | Pass: [held query replies](host/feedback-final/held-replies.json), [window/message replies](host/functional-final/state-boundaries.json), [instance replies](host/functional-final/controlled-snapshots.json), [target/viewer replacement](host/functional-context-reviewed/context-boundaries.json); stale actual success and injected transport failure cannot change the new state | Physical editing/navigation |
| D06 replacement/clear/Undo/IME | Pass: [DOM transactions](host/feedback-final/state-acceptance.json); [late composition after Clear](host/functional-final/composition-clear.json) stays empty without input/highlight resurrection | Native paste, Undo/Redo, IME delivery |
| D07 text-safe marks | Pass: [192 source/geometry assertions](host/feedback-final/surfaces.json), [real append node/Range preservation](host/functional-final/snapshot-acceptance.json), [late terminal highlight](host/feedback-final/long-source.json) | Physical drag selection/copy and contrast review |
| D08 hidden/or decoded-only hits | Pass: [exact source representations/layouts](host/feedback-final/surfaces.json), [actual saved extraction changes](host/functional-final/snapshot-acceptance.json); original-copy arguments preserve exact sources at browser layer | Physical source selection/system clipboard |
| D09 empty/zero/one/wrap | Pass: [DOM state](host/feedback-final/state-acceptance.json); Clear/zero-hit do not scroll; one hit and wrapping remain explicit | Natural physical scroll and native shortcuts |
| D10 modes/history | Pass: [four SDK modes](host/feedback-final/sdk-suite.json), [DOM mode/candidate/history flags](host/feedback-final/state-acceptance.json), [seven exact MRU tuples](host/functional-final/state-boundaries.json); [installed four-mode agreement](host/functional-modes-reviewed/mode-agreement.json) verifies identical match/range keys, highlighted rows and activated mark membership | Platform primary modifiers |
| D11 async cancellation/recovery | Pass: [startup-inclusive timeout/actual exit](host/feedback-final/startup-timeout.json), [Clear/current/stale replies, latch, Retry and failed decoration](host/feedback-final/held-replies.json), [target/viewer replies](host/functional-context-reviewed/context-boundaries.json) | Real editing responsiveness, not inferred from worker/SDK timings |
| D12 selected text | Pass: [all inspector sources, foreign/multiline and Unicode limits](host/feedback-final/surfaces.json); [seed preserves flags](host/functional-final/state-boundaries.json) | Physical selection/copy/clipboard isolation |
| D13 snapshots/repeats/maintenance | Pass: [real append/retention/profile/restarts](host/functional-final/snapshot-acceptance.json), [exact complete-transport overlap/zero overlap/metadata](host/functional-final/controlled-snapshots.json), [independent B survives inspected-A eviction](host/functional-context-reviewed/context-boundaries.json) | Physical retained selection; controlled ordering is not a natural kubelet guarantee |
| D14 dismissed inspector/pending | Pass: [held inspector/query completion](host/feedback-final/held-replies.json), [window/message/Profiles](host/functional-final/state-boundaries.json), [instance](host/functional-final/controlled-snapshots.json), [target/viewer](host/functional-context-reviewed/context-boundaries.json); no stale resurrection/error | Native focus return |
| D15 geometry/following/Pause | Pass: [measured source/geometry](host/feedback-final/surfaces.json), [actual appended following/Pause](host/feedback-final/marks-following.json), [two actual restarts with bottom movement](host/functional-final/snapshot-acceptance.json), [stable dense cadence](host/feedback-final/dense-cadence-wrap-baseline.json) | Physical wheel/resize/native window delivery; resource issue accepted/deferred |
| D16 dismissal/history/ownership | Pass for non-focus DOM state: [Close/zero-hit/history recall](host/feedback-final/state-acceptance.json), [seven-entry history and Profiles return](host/functional-final/state-boundaries.json); focus-dependent ownership guards pass in production browser | Physical one-layer Escape, native menus/editors, IME/AltGraph, OS focus and shortcuts |

## All 13 state traces

| Trace | Final-artifact functional evidence | Remaining layer |
| --- | --- | --- |
| 1 refinement/origin | [State boundaries](host/functional-final/state-boundaries.json) and [DOM state](host/feedback-final/state-acceptance.json): 64/73/82, correction, full replacement | Native editing/navigation |
| 2 edges/wrap | [Actual row zero](host/functional-final/snapshot-acceptance.json), [initial Previous/zero/one/wrap](host/feedback-final/state-acceptance.json) | Native repeat delivery |
| 3 deliberate keyboard row focus | [Explicit DOM Tab/focusin](host/functional-final/state-boundaries.json) sets reading row 90 independently of inspector 64 | Physical Tab/OS focus |
| 4 independent inspector/reading row | [Close/hidden-source preservation](host/functional-final/state-boundaries.json) plus [A eviction with B preserved](host/functional-context-reviewed/context-boundaries.json); fresh query skips earlier C to B | Physical input/focus restoration |
| 5 delayed current reply after dismissal | [Held actual worker response](host/feedback-final/held-replies.json) updates useful count without resurrecting anchor/inspection/result | Native focus |
| 6 stale success/failure identities | [Query](host/feedback-final/held-replies.json), [window/message](host/functional-final/state-boundaries.json), [instance](host/functional-final/controlled-snapshots.json), [target/new-viewer](host/functional-context-reviewed/context-boundaries.json); production viewer replacement changes viewer epoch and main owner token (targetEpoch stays 1 within each keyed viewer) | Injected failures are controlled transport evidence, not natural error frequency |
| 7 cancel old reveal | [Explicit DOM manual scroll/Close](host/feedback-final/held-replies.json), [Profiles/return/fresh navigation](host/functional-final/state-boundaries.json); installed mounted inactivity retains state, actual exit observed | Physical scroll/dismissal/OS visibility |
| 8 overlap/eviction | [Exact duplicate transport lines, identical windows, zero overlap](host/functional-final/controlled-snapshots.json), [real newest-1000 eviction](host/functional-final/snapshot-acceptance.json), [independent anchor](host/functional-context-reviewed/context-boundaries.json) | Controlled bodies do not prove natural duplicate timestamps/unseen additions |
| 9 maintenance never seeks | [Actual append/zero-hit gains/no-fetch profile](host/functional-final/snapshot-acceptance.json), [still-matching saved-profile candidate](host/functional-final/state-boundaries.json) | Physical retained selection |
| 10 input transactions | [DOM full/partial paste, cut/Undo/Redo/composition](host/feedback-final/state-acceptance.json), [Clear rejects late composition end](host/functional-final/composition-clear.json); duplicate composition suppression also in browser | Native paste/Undo/Redo/IME |
| 11 seed/history/Escape | [Sources/Unicode/layout eligibility](host/feedback-final/surfaces.json), [flags/seven-tuple MRU](host/functional-final/state-boundaries.json), [Close/recall](host/feedback-final/state-acceptance.json); Escape ownership at browser layer | Focus-dependent physical Escape/menus/AltGraph |
| 12 observed restarts | [Two actual restarts](host/functional-final/snapshot-acceptance.json) reset query/both flags/result/history, preserve manual profile/Pause/following with appended-bottom movement; [controlled metadata/old-instance/log delivery](host/functional-final/controlled-snapshots.json) covers missing/count-then-ID/known-ID cases | Controlled ordering is distinct from non-atomic natural metadata/log acquisition |
| 13 geometry/selection/following | [Measured source geometry](host/feedback-final/surfaces.json), [append/Pause/following](host/feedback-final/marks-following.json), [restart movement](host/functional-final/snapshot-acceptance.json), current browser cap-boundary regression | Physical selection/window input; resources accepted/deferred |

## Additional mandatory regressions and lifecycle

| Requirement | Evidence/verdict |
| --- | --- |
| Unicode simple/common folding, original-category whole words including U+0345, astral offsets, punctuation, whitespace, non-overlap, 16,384/16,385 units | Passed pure and mounted production-browser layers, [fresh results](host/functional-final/tests-output.txt), [browser](host/functional-final/browser-output.txt); real SDK tests all four modes |
| Exact retention/source provenance/count once/order | Passed real SDK and [six exact 5 MiB ±1-byte/newest-1000 controlled-response checks](exact-listeners.md); final artifact, original application/transport sources preserved |
| 4,096 reply / 1,024 DOM limits and late visible sources | Passed browser, [installed source/layout checks](host/feedback-final/surfaces.json), [terminal Q](host/feedback-final/long-source.json); partial decoration never caps exact matching |
| Full stale keys/worker generation/range interest; priority/latest-only/deadlines/explicit recovery | Pure/browser pass; installed query/window/message/instance/target/viewer successes and failures linked above; [SDK/frame](host/feedback-final/sdk-suite.json), [startup timeout](host/feedback-final/startup-timeout.json), [20 bursts](host/feedback-final/latest-only-bursts-output.txt), [held range failure](host/feedback-final/held-replies.json) |
| Root/cluster share webContents, reject foreign tokens, remove frame, replace same-frame owner, active/startup/idle inactivity, close, Disable/Uninstall/reactivation | Passed at real SDK/lifecycle layer: [SDK suite](host/feedback-final/sdk-suite.json), [extension maintenance](host/feedback-final/extension-lifecycle.json), [fresh context teardown](host/functional-context-reviewed/context-boundaries.json); actual exits and empty owner maps observed. Physical native-window delivery remains unverified |
| Shutdown/owned execution cleanup | [Fresh shutdown](host/functional-final/shutdown-clean.json); actual worker exits and empty service maps/watch. SDK handlers listed at will-quit are reported honestly; zero there is not claimed |
| DOM/listener/RAM/disk/thread/resource/stock-display investigation | **Accepted for now and deferred by user.** [Resource summary/decision](../../find-resource-investigation.md). Failed every-sample runs, including +1,551/+26 and +203/+36, stay failed; original thresholds are preserved. No further investigation or soak was run for this checkpoint |

## Unperformed native/platform gates

| Layer | Verdict / exact required access |
| --- | --- |
| Linux physical selection/copy/system clipboard | **Unverified.** Fresh explicitly attended session on the final package, or a suitable separate session capable of native input and clipboard verification |
| Linux native typing/paste/Undo/Redo/IME/AltGraph/modifier shortcuts/menus/focus return | **Unverified.** Real input and OS focus/IME access; synthetic DOM/CDP results do not substitute |
| Linux physical/native window lifecycle | **Unverified.** Native close/hide/minimize/restore/return delivery with actual worker cleanup; no old attended approval carries forward |
| Windows matching/worker/package/primary modifier/IME/selection/copy/focus/lifecycle | **Unverified.** Actual Windows host/session needed; explicit marking satisfies the ticket's reporting option, not platform coverage |
| macOS matching/worker/package/primary modifier/IME/selection/copy/focus/lifecycle | **Unverified.** Actual macOS host/session needed; Linux/prototype evidence is not coverage |

Remaining non-deferred acceptance is native attendance/access and actual platform
coverage. Original all-layer acceptance criteria remain unchecked where native
parts are unperformed. No release acceptance, issue closure or publication is claimed.
