> Original independent review at `f200114`; see [independent verification](verified-findings.md) and [fix revalidation](fix-revalidation.md) for final verdicts and the corrected R2 mechanism.

# Specification/UI review — PR #49

Reviewed fixed diff `c0f7338...f200114`; checked-out HEAD is `f200114`.

**P2 — Inspection layout restarts matching and loses a pending query's result selection.** `src/renderer/viewer.tsx:170` (dependency chain at 161, 167–180).

Trigger: use the built-in Default profile, begin a query from reading row 64 while its match reply is pending, then change Display options → Inspection from Side to Bottom. `ConfigurationStore.setInspection()` replaces `configuration`; `activeProfile()` consequently returns a fresh built-in formatting object. The viewer recreates an equal-text `messages` array, increments `messageRevision`, and dispatches maintenance matching. `FindPosition.prepare(..., 'maintenance')` cancels the original selection/reveal intent, so completion reports three matching records but selects none, rather than selecting row 73 from the still-live query.

Original requirement, #37 state/event resolution (`.ralph/sources/find/live-37-comments.md:56`): “Change Raw/Readable, wrap, timestamps or inspection layout … never change the matching scope or start a search. Reject stale geometry before executing a still-live explicit reveal.”

Proof: [focused Node replay](spec-ui-layout-repro.ts) exercises the actual profile, formatter, matching client and position controller with the viewer's memo dependency chain. It passes assertions that message values are equal, matching requests increase from one to two, and the final active result is absent. This is source/controller proof, not a mounted UI run. The existing no-new-request presentation assertion (`tests/find-identity-browser.jsx:459–465`) changes Raw and wrap, leaving persisted Inspection uncovered. Keep logical message identity stable for layout-only changes and add that pending-layout case to the mounted regression.

Standards/smells: no separate actionable finding.

Checked: original accepted plan, issue bodies #33/#36–48, full matching/state/rendering/SDK resolutions, commit list; changed viewer/input/history/selection, matching/ranges/highlights/marks, occurrence/viewport/session seams; relevant unit/browser tests and acceptance/artifact/native correction indexes. Executed only the focused pinned-Node replay above. No builds, package/browser/native/resource suites, desktop actions or GitHub writes. Windows/macOS remain unverified future work; accepted host-resource limitations are unchanged.
