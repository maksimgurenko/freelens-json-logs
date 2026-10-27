# 48: Verify production Find against the acceptance matrix

**Status:** ready-for-agent
**Blocked by:** [47: Integrate package, regression and resource checks](47-integrate-package-regression-and-resource-checks.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/48

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
- [ ] Run installed-host active/idle lifecycle soaks at both retention bounds, recording warm baselines and retained RAM/disk/thread/listener growth plus actual stop-to-exit behavior. Separate startup, IPC, worker, DOM and input responsiveness observations; keep sample limits explicit and remove only owned test data/processes.
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
