> Original independent review at `f200114`; see [independent verification](verified-findings.md) and [fix revalidation](fix-revalidation.md) for final verdicts and the corrected R2 mechanism.

One actionable introduced defect.

- **P2 — Closing inspection discards an independently successful Find position.** `src/core/find-state.ts:36` clears `position` whenever it equals the closing inspector's reading row, even after Find has successfully addressed that occurrence. The real Close handler calls this path at `src/renderer/viewer.tsx:293`; row deselection also reaches it at line 278.

  Trigger: inspect row 64; query `up` matches rows 20, 64 and 70, addressing 64; close its inspector; refine to `ups`, which matches only 20 and 70. Expected: seek inclusively from the surviving successful position 64 and address 70. Actual: `position` becomes undefined, so refinement restarts at the beginning and addresses 20. Active result/candidate 64 survive closing, demonstrating that its independent Find state was already established. Mode changes can expose the same lost origin.

  Original authority: [#37 state contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921), Close inspection and Refine rows (`.ralph/sources/find/live-37-comments.md:43,46`): “Preserve an independently established active Find result and refinement candidate when valid.” “Otherwise seek forward inclusively from the latest surviving search position.” This is a behavior-contract breach, not a heuristic smell.

  Proof: [minimal production-core repro](correctness-close-refinement-repro.mjs), executed with the pinned Node binary and `--experimental-strip-types`, prints `expectedActiveRow: 70, actualActiveRow: 20`. UI execution was not performed; the viewer-to-core call path is source-verified.

Reviewed the pinned diff/commits, original issue bodies/decision resolutions, occurrence reconciliation, literal Unicode/UTF-16 matching, reading/refinement, current/stale success and failure acceptance, reveal cancellation, metadata/restart/profile transitions, and execution cleanup. Seven focused unit files passed (144 tests). A deterministic 10,000-case overlap comparison and adjacent independent-position/pending-dismissal assertions passed. No additional actionable correctness finding or standalone smell violation established. No source changes, builds, package checks, browser/native/resource runs or GitHub writes were made. Windows/macOS remain explicitly unverified and outside this increment.
