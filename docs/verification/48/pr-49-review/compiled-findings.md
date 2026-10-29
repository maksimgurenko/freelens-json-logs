# PR #49: compiled independent review claims

Base: `c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528`; reviewed head: `f200114ffcd97f73bf4e22ded807eab4f47fc658`.
These are reviewer claims, not verifier conclusions. Reports are retained separately by angle. No source changes have been made during review.

## Claim index

| ID | Origin | Claimed defect | Reviewer severity |
| --- | --- | --- | --- |
| R1 | Correctness | Inspector close forgets a successful Find search position, so later refinement jumps backward | P2 |
| R2 | Lifecycle/security | Navigation during retired-worker exit permits a departed document's pending registration to succeed | P2 |
| R3 | Spec/UI | Changing persisted Inspection layout invalidates equal matching messages, starts a search and cancels pending selection | P2 |

No independent reviewer reported an additional actionable standards/smell violation. Do not infer a claim is true from the severity label or presence of a model repro. Verify original requirements, reachability at real call sites, and counterexamples. Distinguish demonstrated behavior from model assumptions, especially same-ID navigation and the UI memo replay.

## Correctness / state

One actionable introduced defect.

- **P2 — Closing inspection discards an independently successful Find position.** `src/core/find-state.ts:36` clears `position` whenever it equals the closing inspector's reading row, even after Find has successfully addressed that occurrence. The real Close handler calls this path at `src/renderer/viewer.tsx:293`; row deselection also reaches it at line 278.

  Trigger: inspect row 64; query `up` matches rows 20, 64 and 70, addressing 64; close its inspector; refine to `ups`, which matches only 20 and 70. Expected: seek inclusively from the surviving successful position 64 and address 70. Actual: `position` becomes undefined, so refinement restarts at the beginning and addresses 20. Active result/candidate 64 survive closing, demonstrating that its independent Find state was already established. Mode changes can expose the same lost origin.

  Original authority: [#37 state contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921), Close inspection and Refine rows (`.ralph/sources/find/live-37-comments.md:43,46`): “Preserve an independently established active Find result and refinement candidate when valid.” “Otherwise seek forward inclusively from the latest surviving search position.” This is a behavior-contract breach, not a heuristic smell.

  Proof: [minimal production-core repro](correctness-close-refinement-repro.mjs), executed with the pinned Node binary and `--experimental-strip-types`, prints `expectedActiveRow: 70, actualActiveRow: 20`. UI execution was not performed; the viewer-to-core call path is source-verified.

Reviewed the pinned diff/commits, original issue bodies/decision resolutions, occurrence reconciliation, literal Unicode/UTF-16 matching, reading/refinement, current/stale success and failure acceptance, reveal cancellation, metadata/restart/profile transitions, and execution cleanup. Seven focused unit files passed (144 tests). A deterministic 10,000-case overlap comparison and adjacent independent-position/pending-dismissal assertions passed. No additional actionable correctness finding or standalone smell violation established. No source changes, builds, package checks, browser/native/resource runs or GitHub writes were made. Windows/macOS remain explicitly unverified and outside this increment.


## Lifecycle / security / standards

# Lifecycle/security review of PR #49

Reviewed fixed diff `c0f7338...f200114` against the supplied requirements and repository instructions.

**P2 — Pending registration survives document navigation and retains an orphan owner.** `src/main/find-service.ts:53–58` and `:98`. Trigger: an owner has an active/idle worker; the same frame/viewer requests replacement; before the old worker actually exits, that frame navigates while retaining its process/routing IDs. `retire()` immediately removes the final sender's navigation listener. The replacement `open()` awaits exit, then checks only frame-tree membership and installs a fresh owner for the departed document. Expected: reject the obsolete registration and retain no owner/listener/watch for that document. Actual: registration succeeds, `owners.size === 1`, and a watch/listeners remain; membership sweeps cannot distinguish the replacement document, while the departed viewer cannot close its new token. This breaches the accepted owner-disposal requirement (`docs/design/find-implementation-plan.md`, Disposal/storage row; issue #42's final acceptance criterion), rather than a smell heuristic. Repro: `.ralph/pr49-review/lifecycle-pending-navigation.mjs`; executed against production `FindService` with an EventEmitter worker whose termination promise resolves before actual exit. Output: `pendingOpenSurvivedNavigation: true`, `ownersAfterNavigation: 1`, `watchCount: 1`. The test models the documented same-ID navigation case; no native host reproduction was executed.

Checked main SDK token/webContents/frame ownership, request/reply/range validation, bounded replacement and range scheduling, matching priority, startup/deadline/stale delivery, idle/active cancellation, actual-exit supervision, renderer/main teardown/reactivation/shutdown, trusted versioned worker packaging, strict allowlists, and CI/release boundaries. Applied the supplied full smell baseline as judgement calls, respecting repository rules and excluding tooling-enforced issues; no additional actionable standards finding.

Executed pinned Node 24's five focused suites (`find-client`, `find-execution`, `find-protocol`, `find-ranges`, `find-service`): **31/31 passed**, plus the reproduction above. Did not build/package, launch browsers/native UI, write GitHub, or reopen the accepted host resource investigation. Windows/macOS remain unverified as required.


## Specification / UI behavior

# Specification/UI review — PR #49

Reviewed fixed diff `c0f7338...f200114`; checked-out HEAD is `f200114`.

**P2 — Inspection layout restarts matching and loses a pending query's result selection.** `src/renderer/viewer.tsx:170` (dependency chain at 161, 167–180).

Trigger: use the built-in Default profile, begin a query from reading row 64 while its match reply is pending, then change Display options → Inspection from Side to Bottom. `ConfigurationStore.setInspection()` replaces `configuration`; `activeProfile()` consequently returns a fresh built-in formatting object. The viewer recreates an equal-text `messages` array, increments `messageRevision`, and dispatches maintenance matching. `FindPosition.prepare(..., 'maintenance')` cancels the original selection/reveal intent, so completion reports three matching records but selects none, rather than selecting row 73 from the still-live query.

Original requirement, #37 state/event resolution (`.ralph/sources/find/live-37-comments.md:56`): “Change Raw/Readable, wrap, timestamps or inspection layout … never change the matching scope or start a search. Reject stale geometry before executing a still-live explicit reveal.”

Proof: [focused Node replay](spec-ui-layout-repro.ts) exercises the actual profile, formatter, matching client and position controller with the viewer's memo dependency chain. It passes assertions that message values are equal, matching requests increase from one to two, and the final active result is absent. This is source/controller proof, not a mounted UI run. The existing no-new-request presentation assertion (`tests/find-identity-browser.jsx:459–465`) changes Raw and wrap, leaving persisted Inspection uncovered. Keep logical message identity stable for layout-only changes and add that pending-layout case to the mounted regression.

Standards/smells: no separate actionable finding.

Checked: original accepted plan, issue bodies #33/#36–48, full matching/state/rendering/SDK resolutions, commit list; changed viewer/input/history/selection, matching/ranges/highlights/marks, occurrence/viewport/session seams; relevant unit/browser tests and acceptance/artifact/native correction indexes. Executed only the focused pinned-Node replay above. No builds, package/browser/native/resource suites, desktop actions or GitHub writes. Windows/macOS remain unverified future work; accepted host-resource limitations are unchanged.
