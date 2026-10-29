# Independent review: #48 snapshot/delivery continuation

Original ticket fixed point: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Continuation pre-implementation HEAD: `55dde7847bde0aac0983d50ee449f5da29d4a892`.
Both independent reviews used `fork_turns: none` with complete bounded read-only
handoffs and original ticket/plan/full decision/design artifacts before parent
conclusions. The scoped `git diff 3fb33db -- <ticket paths>` and continuation
`git diff 55dde78 -- <ticket paths>` included staged new/current files. Unrelated
dirty Glossary/docs-index and other user work were excluded. Neither reviewer
operated a desktop, changed resources, mutated GitHub or edited files.

## Standards

No material issue must be corrected before committing this partial checkpoint.

No actionable documented violation found. The harnesses use a verified private
host and DOM/SDK operations, consistent with the UI-verification policy. Reports
distinguish controlled transport failures, DOM selection, modified-compositor
samples and native/platform gaps. Raw artifacts support the snapshot/delivery
checks, closed worker ownership and resource deltas. The matrix keeps remaining
acceptance gates explicit. Cumulative clipping changes retain source/provenance
and current-interest boundaries.

Optional smell judgement: duplicated DOM lookup/button/edit helpers across
`snapshot-acceptance.mjs` and `held-replies.mjs`, particularly
`edit(text){const e=this.input();e.setSelectionRange(0,e.value.length);...}`.
A shared initializer could keep future selector/input corrections consistent.
This is a maintenance suggestion, not a documented violation or commit blocker;
it is deferred from this evidence checkpoint. Scoped whitespace checks pass.

## Spec

One initial actionable **P2 evidence finding**: restart claims exceeded the
assertions. The harness enabled/checked Match case only, while the report said
“flags.” The second restart checked resumed acquisition, without checking the
following status or movement, while the report said “while following.” #37
trace 12 requires all temporary state to reset, and trace 13 preserves following
and Pause independently. Declared incomplete acceptance did not excuse these
particular overstatements.

Corrected by narrowing coverage, preserving the original raw result with an
explicit label caveat, and leaving Whole words reset and following status/movement
across restart pending in NEXT.md and the matrix. The future harness label now
names Match case. There is no assertion-behavior or production change; a pinned
Node syntax check is recorded in `host/snapshots/post-review.json`.

Independent Spec follow-up: **P2 resolved; no remaining actionable Spec finding**.
The report/matrix now credit only asserted restart behavior. Original unfinished
Host geometry/seeding/stale-context/profile/maintenance, exact transport-duplicate
and metadata-order, stock/longer resource, physical/native/clipboard and
Windows/macOS gates remain open. No production defect or scope creep found.
Controlled delivery and the private compositor are not promoted to natural worker
failure, physical input or stock-platform coverage.

Standards: **0 hard findings / 1 optional smell**. Spec: **1 corrected / 0
remaining actionable findings**. No release acceptance is implied.
