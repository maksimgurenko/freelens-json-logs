# 48: Verify production Find against the acceptance matrix

**Status:** ready-for-agent
**Blocked by:** [47: Integrate package, regression and resource checks](47-integrate-package-regression-and-resource-checks.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/48

Current checkpoint (2026-10-27): bounded unattended native pass and narrow
close→quit visibility-disposal fix are complete. See [native report](../../../docs/verification/48/native-isolated.md),
[matrix](../../../docs/verification/48/matrix.md) and [NEXT](../../../docs/verification/48/NEXT.md).
Current artifact SHA-256 is `0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`.
Pointer/full IME and the exact remaining ownership/edge subchecks stay unverified;
broad criteria below remain unchecked. Original failed evidence is retained.

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Establish evidence for the integrated production package in Freelens, including real resource and lifecycle behavior, physical input/selection and the Windows/macOS contract. Publish a clear acceptance matrix whose unperformed or failing checks remain explicit release gates.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Actual-host feasibility evidence and its limits](https://github.com/maksimgurenko/freelens-json-logs/issues/40#issuecomment-6421719705), [Matching/lifetime contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710), [Accepted rendering evidence and remaining gates](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783).

## Acceptance criteria

- [ ] Verify the actual integrated packed extension in pinned Freelens 1.10.3 and record package identity, runtime, environment and reproducible evidence. Cover all in-scope D01-D16 cases, the 13 state traces and the handoff's additional matching/execution/rendering regressions; link each to its evidence layer and verdict.
- [ ] Background host checks use workspace 7 and preserve the user's focus, workspace and pointer throughout, following current repository UI-verification guidance. Observe actual production Custom Highlights, source/geometry, snapshot/profile/restart state, following/Pause and SDK ownership. Never manufacture background focus or claim a restored desktop was uninterrupted.
- [ ] Exercise root/cluster frames sharing webContents, foreign tokens, removed frames, same-frame owner replacement, startup/idle/active cancellation, inactivity, viewer close, disable/uninstall, reactivation and shutdown. Verify actual worker exit and complete owner/listener/timer/observer cleanup.
- [x] Run installed-host active/idle lifecycle soaks at both retention bounds, recording warm baselines and retained RAM/disk/thread/listener growth plus actual stop-to-exit behavior. Separate startup, IPC, worker, DOM and input responsiveness observations; keep sample limits explicit and remove only owned test data/processes.
- [ ] Arrange a fresh explicitly attended check or separate graphical session for physical selection/copy/clipboard, native editing/paste/Undo/Redo/IME/AltGraph, modifier shortcuts, menus, focus and window lifecycle. Earlier attended approval does not carry forward, and background DOM checks cannot substitute for physical-input evidence.
- [x] Perform or explicitly mark unverified the corresponding Windows and macOS matching/worker/package, primary-modifier, IME, selection/copy, focus and lifecycle checks. Linux/prototype results cannot be relabelled as platform coverage.
- [x] Record passed, failed and unperformed checks separately, with evidence and resulting release limits. Failed/unperformed production gates remain visible and cannot be treated as release acceptance. If implementation evidence invalidates an accepted mechanism or behavior, raise a precise planning question rather than silently changing the contract or substituting a fallback.

## Local verification evidence

Partial checkpoint on `implementation/find` from pre-implementation/review HEAD
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Claimed with
`gh issue edit 48 --add-assignee @me`; live full #48 and #36/#37/#38/#40 match
cached authority. No comment/closure/publication.

- [Report, commands, package identity and limits](../../../docs/verification/48/README.md).
- [All D01-D16 and 13 trace verdicts by evidence layer](../../../docs/verification/48/matrix.md).
- Real packed Freelens 1.10.3 SDK/frame suite, startup-inclusive timeout/actual exit,
  Disable/Uninstall/reinstall, newest-only bursts and 28 installed renderer DOM
  assertions pass. Actual installed assets match integrated #47 package SHA-256
  `cbc903f572d5c7b8dc6dfd09e433538dda799803e8e7549f6212bb2634046825`.
- Pinned locked install, typecheck, 246 tests, six desktop policy tests, production
  browser/worker/resource suites, strict packed checks and two-build reproducibility
  pass. SDK-only installed soak has 20 measured cycles per bound after warmup.
- **Failed installed mounted-resource gate:** lifecycle cleanup assertions pass,
  but measured DOM/listener/renderer-memory growth requires investigation. Dense:
  +47,724 nodes/+5,259 listeners/+34,524,720 B heap. Long: +9,065 nodes/+252 listeners,
  +2,174,205,952 B RSS. Attribution to production/host/inspector is unresolved.
  No resource or release acceptance is claimed.
- Initial type/mode zero ordinal remains unresolved; #37 requires mode refinement.
  The interim maintenance assertion was reverted after independent Spec review.
- Physical input/clipboard/native IME/AltGraph/focus/window delivery and all listed
  Windows/macOS checks are explicitly **unverified**. Private compositor has a
  0x0 output; screenshot-driven host rendering does not verify native cadence.
- [Independent Standards and Spec reviews](../../../docs/verification/48/review.md):
  no hard standards violations; optional screenshot-pump duplication deferred;
  the Spec assertion/reporting finding is corrected with the host gate still open.
- [Concrete autonomous continuation](../../../docs/verification/48/NEXT.md): investigate
  retained resources, complete partial host state/snapshot/restart/geometry matrix,
  then obtain missing native/platform evidence. Original acceptance text preserved;
  only explicit platform marking and honest verdict reporting are satisfied here.

Ticket remains unfinished; report retry with checkpoint commit and this handoff.

### Continuation from b740e7d

Reclaimed #48; live bodies/full comments still equal cached authority.
[Continuation report](../../../docs/verification/48/continuation.md) records
33 passing actual installed DOM-state checks: stable mode refinement/history
flags, initial Previous, edit/composition transactions, zero/one-hit, invalid
seeds, async Clear and count-after-inspector-dismissal. No production byte changes.

Resource gate remains failed: console/handle hygiene does not remove dense
growth; a mount-only no-screenshot control also retains old viewers. Heap paths
identify native ScriptedAnimationController retention, without claiming exclusive
attribution or a product fix. Mesa-only private setup still fails IPC readiness.
Original failures retained; natural native cadence/resource acceptance is pending.
No additional full acceptance criterion is satisfied by partial host checks.
Native/clipboard/Windows/macOS remain unverified. Continue only #48 per NEXT.md.

Final continuation checks pass: pinned typecheck, 246 tests, six desktop policy
checks, production browser, real built workers, resource smoke, strict packed
checks and matching two-build SHA-256. [Independent reviews](../../../docs/verification/48/review-continuation.md)
corrected stale trace verdicts and kept row-zero Host evidence pending; no remaining
actionable defect. Owned profile/runtimes/apps/raw heaps and UID-checked namespace
are cleaned up; recorded user/config hashes and real desktop state are preserved.

### Continuation from d235606

Reclaimed #48; live bodies/full comments match cached authority. [Natural-frame
and clipping report](../../../docs/verification/48/cadence.md) records a private
compositor startup diagnostic, natural rAF without screenshots, and a production
highlight fix established by failing installed-host and range-controller checks.
Clipping ancestors now invalidate visible interest; covered pending/complete
range work survives smaller clips and redraws current visible spans. Incomplete
coverage still requests late-source ranges; no deadline reset or fallback.

Final package SHA-256
`1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`.
Fresh isolated form installation, all 20 terminal-Q samples, 33 DOM-state checks,
SDK/frame suite and dense/long mounted resources pass. Three warmups/six samples
per bound have +5 retained nodes, zero listener growth each; all worker exits are
observed. Pinned typecheck, 249 tests, six UI guards, browser/worker/resource,
strict package checks and deterministic rebuild pass. Earlier failed attempts
are retained. Modified compositor and short samples are explicit evidence limits.
Original acceptance text/checkboxes remain unchanged; full Host, stock-resource,
physical/native/clipboard and Windows/macOS gates remain unfinished.

Independent [Standards and Spec reviews](../../../docs/verification/48/review-cadence.md)
leave zero actionable findings. Spec identified a lost newer interest during a
pending broad reply; the added red/green regression now preserves only the latest
interest and requests it after an incomplete reply. Current full suite is 249
passing tests; the final installed artifact repeats long-source, state, SDK/frame
and both resource checks. Owned processes/profile credentials/runtimes and the
UID-checked namespace are removed; recorded user/config hashes are unchanged.
The precise autonomous continuation remains NEXT.md; release acceptance is open.

### Continuation from 55dde78

Reclaimed #48; current full bodies/comments equal cached authority.
[Snapshot/delivery report](../../../docs/verification/48/snapshots.md) records
**24 passing actual snapshot checks**: row-zero hit, retained DOM selection and
repeated application-content occurrence through append, zero-hit gains waiting,
saved profile no-fetch/no-substitute maintenance, live inspector/result eviction
at the real 1,000-record tail, and two actual restarts including Pause. Exact
identical-transport duplicates and partial metadata ordering remain Host gaps.

**13 held SDK-delivery checks** pass with the actual installed worker, covering
current completion after dismissal, stale query success/injected transport failure,
manual scroll/Close cancellation, whole-attempt timeout/latch/explicit Retry and
decoration failure preserving counts/history. Controlled transport evidence is
distinct from natural worker failure or physical input. Harness failures are
retained and corrected; no production change or contract substitution occurred.

Same package SHA-256
`1775d0f0aaa1d23002bf723d68c6840fa44d2c6bd3c5536e72bbc05546f0fdf1`:
fresh isolated form install, 33 DOM state checks, terminal-Q, SDK/frame suite,
startup timeout/actual exit, 20 cancellation bursts, startup shutdown and both
mounted resource workloads pass. Short modified-compositor samples are not stock
or long-duration resource acceptance. Full remaining geometry/seed/stale-context/
maintenance, native/clipboard and Windows/macOS gates remain explicit in NEXT.md.
No original checkbox is newly checked; release acceptance remains open.

Final pinned locked install/typecheck, 249 tests, six UI guards, production
browser/worker/resource suites, strict packed checks and deterministic two-build
SHA-256 all pass. [Independent Standards and Spec reviews](../../../docs/verification/48/review-snapshots.md)
leave zero actionable findings after narrowing an overbroad restart claim:
Match case was asserted; Whole words and explicit following movement across
restart remain unverified. Original raw labels/evidence are preserved with that
caveat. Cleanup records 89 actual worker starts/exits, zero owned processes and
UID-checked namespace/profile/runtime removal; user/config hashes are unchanged.
Continue only #48 via NEXT.md; no release or full-ticket acceptance is claimed.

### Continuation from f8d7643

Reclaimed #48; live full bodies/comments equal cached authority.
[Source/geometry and cycling report](../../../docs/verification/48/geometry.md)
records two TDD regressions and a production fix: grouped-mark progress survives
rail regrouping and pending maintenance while its occurrence/query stays valid.
New edits/contexts reset it; expired refs cannot be recovered by text or index.

Current package SHA-256
`d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`.
192 actual installed source/geometry assertions pass (including preconditions),
covering all inspector layouts, Unicode seed limits/provenance, four CSS widths,
fonts, inline/hidden-source expansion, current reveals and DOM selection.
Six independent real append/following/Pause assertions pass. Current-package
state 33/held 13/terminal-Q/SDK 10/startup-timeout/20 bursts, fresh-main maintenance,
normal startup shutdown and both short mounted-resource workloads pass.

Dense interactive cadence remains unfinished: one final-package run stalls after
records 0–9 and fails natural cadence 9/61, requiring forced private-host cleanup.
A later click 19 failure was an incorrect oracle: row 18 no longer belongs to the
current group 0–17, so starting at 0 is correct. Independent Spec review caught it;
the failed harness evidence is retained and distinguished from a product bug.
The corrected fresh run and exact remaining gates are recorded in the report.
Native/clipboard, stock/long-resource, full remaining Host and Windows/macOS gates
stay unverified. No original whole acceptance criterion is newly checked.

The corrected fresh dense run passes six scoped DOM assertions with 37 activations
through the first 18-member group, complete 1,000-record membership and truthful
1,024-highlight-cap feedback; its 70.89-second whole-run duration is not native input
latency evidence. Both pending-at-close and post-close CDP requests now reject.
Independent cumulative Standards/Spec reviews use original ticket pin 3fb33db plus
the f8d7643 continuation baseline; two harness findings are corrected, none remain
actionable. Final pinned typecheck/249 tests/six UI guards/browser/worker/resource/
strict package/two-build SHA-256 all pass; earlier failed attempts stay separate.
No full acceptance/release claim. Continue only #48 using NEXT.md.

### Continuation from 9280757

Reclaimed #48; [live full bodies/comments](../../../docs/verification/48/host/state-completion/authority.json)
equal cached authority. [State-boundary report](../../../docs/verification/48/state-completion.md)
records **20 installed state assertions**, **31 real snapshot/restart assertions**
and **19 controlled HTTP/SDK snapshot assertions**. New subsets include independent
DOM keyboard reading/inspection, still-matching profile retention, stale window/
message successes/failures, Profiles cancellation, seven-entry history and seed
flags. Both flags demonstrably reset across two actual restarts, with Pause and
following status/real appended-bottom movement preserved.

Controlled target-scoped HTTP bodies exercise identical complete transport-line
duplicates/zero overlap, missing/count-then-ID/known-ID metadata, stale instance
success/error and stale snapshot completion/error. They run the actual installed
adapter/session/viewer/worker, but do not claim natural kubelet ordering or physical
input. All wrappers/gates are restored. Initial harness failures stay separate.

Same package SHA-256 `d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`;
no production bytes/contract change. Fresh 33-state/13-held/SDK-frame/startup-timeout/
20-burst subsets pass. Full pinned locked/typecheck/249 tests/six UI guards/browser/
worker/resource-smoke/strict-package/deterministic two-build checks pass.

Dense gates remain unfinished. Exact old-harness CPU replay completes only seven
activations in 40 seconds. The long-lived installed mounted soak passes actual
worker/lifecycle cleanup but fails dense listener growth **+15 against limit +8**.
The fresh-process comparison and final review/cleanup are recorded in the report.
No whole unfinished original criterion is checked; native/clipboard, Windows/macOS,
stock/long-resource and dense responsiveness limits remain explicit. Continue
only #48 via NEXT.md; no release acceptance is claimed.

The fresh-profile resource control passes (+1 dense listener, zero long listeners)
without clearing the failed +15 long-lived result. Independent Standards review
finds zero hard violations/one optional duplication smell. Spec review's stale
matrix and weak old-instance-error assertion are corrected: a third fresh installed
run repeats 19 controlled assertions and proves exact empty Find status/no Retry
before any new edit. [Final independent review](../../../docs/verification/48/review-state-completion.md)
leaves zero unresolved findings. All three owned hosts, profiles/runtimes and
UID-checked fixtures are cleaned; user/config hashes are unchanged. Raw failures
remain historical evidence. The concrete next autonomous task is a minimal dense
cadence loop and listener-attribution/long-resource checks in NEXT.md.

### Continuation from 0f39b79

Reclaimed #48; [live full bodies/comments and accepted-plan comparison](../../../docs/verification/48/host/dense-cadence/authority.json)
match cached authority. [Dense cadence report](../../../docs/verification/48/dense-cadence.md)
records a production feedback/clip oscillation, its exact boundary red regression
(301/325 px alternating), and the stable compact status reserve. Pending and capped
feedback stay short; width260 retains usable logs. Exact sources/copy, counts,
matching, measured marks and worker/retention/Pause/following contracts are preserved.

Final package SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Fresh isolated form install and actual asset/schema identity pass. Current package
passes 33 state, 13 held-delivery, 192 source/geometry assertions, terminal-Q,
12 natural dense frames in ~186 ms with two layouts, three grouped activations,
actual append/following/Pause, real Disable/Uninstall/reinstall, SDK/frame suite,
startup timeout, 20 latest-only bursts and startup shutdown. Actual starts/exits
are 219/219, peak one, zero service maps/watch on shutdown. Native input is unverified.

The final 30-cycle-per-bound installed soak **fails dense +9 listeners against
+8**, despite passing actual lifecycle/exit/settings checks. Dense +51 nodes and
+1,862,708 B heap; long +19 nodes/-1 listener. Intermediate resource failures and
passes stay separately attributed to their packages. Inactivity controls narrow
a node-growth lead but do not establish a deterministic cause or clear listeners.
[Exact next autonomous investigation](../../../docs/verification/48/NEXT.md) is
listener type/target/retainer capture with no-Find and host-only visibility controls.

Final locked install/typecheck, 249 tests, six UI guards, mounted production
browser, real built workers, original resource smoke, strict package checks and
deterministic two-build SHA pass. [Independent Standards/Spec review](../../../docs/verification/48/review-dense-cadence.md)
records no actionable production findings; optional helper duplication is deferred.
Cleanup removes four owned hosts/profiles, private runtime and UID-checked fixtures;
unrelated dirty hashes and recorded user settings are preserved. Desktop observer
reports only repeated notifications of the same focused kitty, no address/workspace/
window transitions; pointer equality is endpoint-only. No native input/focus/clipboard
operation was sent. No unfinished original criterion is newly checked. Resource,
remaining full Host, stock/native/clipboard and Windows/macOS gates remain open.

### Continuation from a098a21

Reclaimed #48; [live full authority](../../../docs/verification/48/host/listener-attribution/authority.json)
still matches cached sources/accepted plan. [Resource attribution report](../../../docs/verification/48/listener-attribution.md)
corrects a verification defect: the installed soak checked only its endpoint.
A known +8 endpoint false pass contains +9 earlier; the saved independent audit
fails before correction and agrees with the corrected live failed verdict.
Every measured sample now enforces unchanged node/listener/heap limits and zero
document growth. The corrected uninstrumented long-source run still **fails
+1,543 nodes/+26 listeners**; neither passing controls nor later GC clears it.

Four attached censuses have identical 666 listener details; eight post-heap
captures each have 724 native listeners, with no sampled Find-viewer paths.
Host-only route changes can independently spike listeners. A host-only inactivity
control retains exactly **14 host ClusterView nodes/15 samples** with no extension
viewer, repeated without census/heap capture. Weak abort traces narrow host/Node
call sites but perturb collection; exact failed-sample listener attribution stays
open. Temporary trace methods are restored and raw private heaps removed.

No production bytes change: same package SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Final pinned locked install/typecheck/249 tests/six UI guards/production browser/
actual workers/original resource smoke/strict package/two-build SHA pass.
Actual installed shutdown observes **466/466** starts/exits, peak one, zero service
maps/watch. User/config hashes match fresh before-run captures; owned host,
profile/runtime and UID-checked namespace are removed. Desktop observation has
zero focus/workspace/window transitions; pointer equality is endpoint-only.
[Independent reviews](../../../docs/verification/48/review-listener-attribution.md)
and [NEXT.md](../../../docs/verification/48/NEXT.md) retain concrete continuation.
No unfinished original criterion is newly checked; full Host/resource, stock/
long-duration, native/clipboard and Windows/macOS gates remain open.


### Continuation from 3555efc

Reclaimed #48; [live full authority](../../../docs/verification/48/host/exact-listeners/authority.json)
equals cached decisions/accepted plan. [Exact retention and pre-heap report](../../../docs/verification/48/exact-listeners.md)
records six installed controlled-response checks: exact 5 MiB and one byte under/
over, complete source/DOM selection hashes, late terminal highlight, predecessor
omission and newest 1,000 of 1,001 records. This is the actual production adapter/
session/viewer/SDK/worker with target-scoped HTTP bodies, not natural byte-size or
physical clipboard evidence. The initial incorrect notice-text oracle remains
separate from the corrected passing run; no product change occurred.

A bounded pre-heap attached-listener census distinguishes reachable callbacks
from attached listeners, includes optional detached subtrees and de-duplicates
ancestor/child capture. Its installed self-check passes removed/once/abort and
detached-parent/child cases; handles and wrappers are released. A 30-cycle-per-
bound diagnostic still **fails long +1,551 nodes/+26 listeners**. Its seven traced
AbortSignals keep exactly 17 listeners, so they do not explain the global spike.
Plain and all-target 30-cycle repetitions pass; they do not clear that failure.
The all-target subset is stable but captures no failure; attribution stays open.

Package SHA-256 remains `995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Pinned full validation and [independent review](../../../docs/verification/48/review-exact-listeners.md)
are recorded with the report. Shutdown observes 318/318 actual starts/exits,
peak one, zero service maps/watch. Owned profile/runtime/UID-checked namespace
are removed; fresh user/settings hashes match. Desktop observation records zero
focus/workspace/window transitions; pointer equality is endpoint-only. No native
input/clipboard or host patch. Original criteria/checkboxes remain unchanged;
remaining resources/full Host/stock/long-duration/native/platform gates stay open.
[NEXT.md](../../../docs/verification/48/NEXT.md) gives a minimal weak-viewer-root
census as the next autonomous task. This is a retry checkpoint, not acceptance.


Independent Standards review found a harness false-pass path: HTTP restoration/
actual-exit errors were swallowed. The final harness records both failure paths
and forces failed verdict/nonzero exit; the reviewer confirms the correction.
A fresh private installation repeats all six retention checks with exact method
restoration and empty lifecycle state, then observes 3/3 actual worker starts/
exits. Final Spec follow-up confirms those raw values/asset identity. No remaining
hard Standards or Spec finding; optional legacy diagnostic naming is deferred.
Both owned host intervals are cleaned, with zero observed desktop transitions.


### Continuation from 863db9d

Reclaimed #48 before work; [live authority](../../../docs/verification/48/host/weak-idle/authority.json)
matches cached complete decisions/accepted plan. [Weak-root and idle report](../../../docs/verification/48/weak-idle.md)
records a bounded weak viewer-root census including assigned handlers, immediate
pre-trace capture, released handles and a five-sample 15-second natural-idle
comparison without forced GC. Self-checks cover connected/detached/removed
handlers and tracing cleanup. Review's initial census-ordering finding is fixed;
older loaded harness/results remain separate. No product or package bytes change.

The corrected 120-cycle-per-bound run **fails 27 long samples**, peaks +203 nodes/
+36 listeners. No captured root wrapper is reachable at those immediate censuses;
that is not a global native-DOM inventory. Early listener spikes collect during
natural idle, but later +182 nodes/+27 listeners remain at 15 seconds and a
separate post-idle GC. Every failing original sample and unchanged threshold is
preserved. An earlier 120-cycle run has a +10 spike that cleans up by 15 seconds.

A separately labelled timing control omits the normal post-unmount frame drain
for five measured cycles per bound. Four long samples capture one detached viewer,
1,436 subtree nodes/24 listeners, with larger global deltas. Its weak root and
most of the spike collect naturally by 15 seconds. This supports eventual cleanup
in that control, not exclusive native-queue attribution or the original +1,551/
+26 failure's cause. The plain 30-cycle repetition passes; it clears no failure.
Later native heap paths show no viewer DOM, 643 host ClusterView nodes and 120
AbortSignal listener paths through timers/requests. Exact ownership remains open.

Pinned locked install/typecheck, 249 tests, six UI guards, mounted production
browser, actual workers, original resource smoke, strict package checks and two
matching builds pass. Same installed SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Shutdown observes 1,031 actual starts/exits, peak one, zero live worker/service
maps. Owned profile/runtime/UID-checked namespace are removed; fresh user/settings
hashes match. No physical/native/clipboard check or host patch occurred.

The real-desktop observer retains monitor/focus/workspace activity and differing
focus/workspace/pointer endpoints, with identical client sets and no mapped test
window. No unchanged-desktop claim is made, and no native input, pointer/clipboard
operation, activation, restoration or fake focus was issued. Original acceptance
text/checkboxes remain unchanged. Remaining resource/Host/native/platform gates
stay open; [NEXT.md](../../../docs/verification/48/NEXT.md) specifies concrete
request/timer/native-owner attribution rather than repeating passing subsets.

### User acceptance of deferred resource issue on 2026-10-27

The user explicitly accepted the DOM/listener resource issue documented in
[Find resource investigation](../../../docs/find-resource-investigation.md) for
now and deferred further work. The resource execution/reporting criterion is
accepted under that decision. Existing failing measurements, original thresholds
and original criterion text remain unchanged; this is not a passing resource
verdict or a claimed leak fix. Do not run more resource attribution, related
stock-display investigation, timing controls or soaks for this issue.

Continue only the remaining non-deferred functional/host acceptance. Native
physical-input/clipboard and actual Windows/macOS coverage are not waived.

### Scoped functional checkpoint from 27e4d82

The user resource acceptance/deferral above is included in this checkpoint with
[the scoped decision summary](../../../docs/find-resource-investigation.md).
Original acceptance text and checkbox meanings remain intact. Resource failures
stay failed measurements; no further resource attribution, related stock-display
investigation, timing control or soak followed the decision.

[Final functional report](../../../docs/verification/48/functional-final.md) and
[reconciled D01–D16 / 13-trace matrix](../../../docs/verification/48/matrix.md)
record the unchanged final package SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
Fresh isolated installation verifies actual assets and schema 3. New installed
checks pass 16 target/viewer/independent-anchor assertions and late DOM composition
completion after Clear. Final-artifact counterparts pass 20 state-boundary,
19 controlled metadata/instance/snapshot and 31 real snapshot/restart assertions.
Stale actual successes and injected failures cannot alter a replacement view;
independent B survives inspected-A eviction and skips earlier matching C on a new
query. No production bytes or accepted behavior changed.

Failed harness quoting/readiness and fixture replacement attempts are preserved
separately; corrected complete runs pass. Pinned typecheck, 249 tests, six UI
guards, production browser, real built workers and strict package checks pass.
Existing exact-artifact reproducibility remains recorded; resources were not rerun.
Shutdown observes 16/16 actual starts/exits, peak one, zero live worker/service
maps/watch. Three SDK handlers remain listed at will-quit; zero there is not claimed.
Owned host/display/profile/runtime and UID-checked namespace are removed. Fresh
user/config/glossary/docs hashes match. Desktop observer records zero focus,
workspace or window events and equal pointer endpoints; pointer equality is
endpoint-only. No native input/focus/pointer/clipboard operation was dispatched.

Remaining non-deferred gate: **fresh explicitly attended final-package Linux native
selection/copy/system clipboard, editing/paste/Undo/Redo/IME/AltGraph, modifier
shortcuts/menus/foreign-editor ownership, focus return and native window delivery**,
or suitable separate native-capable session access. Actual Windows/macOS coverage
remains explicitly unverified and requires those host sessions. Reporting this
limit does not waive it. No release acceptance, publication or issue closure.
[Independent review](../../../docs/verification/48/review-functional-final.md) and
[NEXT.md](../../../docs/verification/48/NEXT.md) provide the exact handoff.

Review follow-up strengthens the held-success oracle: a fresh installation
[records matches/four known records](../../../docs/verification/48/host/functional-context-reviewed/context-boundaries.json)
in every held reply before target/viewer replacement; all 16 assertions pass.
Independent Spec review identified the remaining D10 installed mode/range/mark
agreement gap. A separate fresh same-package installation now
[passes all four combinations](../../../docs/verification/48/host/functional-modes-reviewed/mode-agreement.json)
on case/whole-word-distinguishing text: matching/range replies share complete
keys/flags, Custom Highlight rows agree, and every mark activates its expected
matching record. The matrix now cites actual Host evidence for that cell.
Standards suggestions narrow composition claims and make cleanup steps independent.
Only the native/clipboard attendance/access and actual platform gates remain.


### Bounded native pass and close→quit fix from 5982a32

The newest 2026-10-27 user direction authorized one unattended Linux pass in a
separate graphical session, followed by an explicitly requested narrow fix for
the observed native close→quit failure. Original criteria above remain verbatim.
The original 17:43:17 UTC native deadline was retained; all native execution,
including the fixed-package close→quit verification, finished in about 17 minutes.

[Native report](../../../docs/verification/48/native-isolated.md) records five
virtual-keyboard groups, two production copy/editor groups and four final-package
native BrowserWindow API groups. The initial package/results remain scoped to
`995f1cf5`; current final SHA-256 is
`0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`.
Only main changed; renderer/worker hashes match. Visibility disposal now retains
its original webContents emitter instead of re-reading a destroyed window's
throwing getter. Red-before-green regression, 27 lifecycle tests, 250 full tests,
typecheck, six UI guards, packed checks and two reproducible builds pass. Fresh
isolated native close→quit exits normally with 7 worker starts/exits, peak one,
zero live workers and closed/empty owner maps/watch.

Two setup failures, the invalid loose modifier verdict, limited IME delivery,
original failed shutdown and corrected blur-worker oracle are retained separately.
Native source drag selection/retention/seeding, wheel/manual scroll, selection/marks
through resize, full trusted IME/Enter/clear/cancel, foreign host menus/focused-other-
window shortcut exclusion and native edge/history/mode/pending-focus variants
remain unverified. No physical hardware claim; Windows/macOS excluded/unverified.
The DOM/listener issue remains accepted/deferred; no resource work followed it.

Both owned displays/profiles/runtimes and the UID-checked namespace are cleaned.
Desktop observers saw repeated notifications of one unchanged focus address,
no observed focus-address/workspace/window transition, and equal pointer endpoints.
No user-desktop native input/window/clipboard activity; original dirty files and
settings are preserved. Independent review precedes the current-branch commit.
No publication. This checkpoint remains **blocked** on the precise unperformed
Linux evidence, with broad criteria unchecked; stop after the requested attempt.
