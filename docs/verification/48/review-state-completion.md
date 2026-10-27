# Independent review: state-boundary continuation

Original #48 fixed point: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Continuation fixed point: `9280757b9c79b4f5d3944ea8bcc92699f67dda8c`.
Both resolve; current work is uncommitted at review. Reviewers received original
#48/accepted-plan/full #36/#37/#38/#40 artifacts before any parent conclusions,
repository standards/UI rules and both diff commands:

```sh
git diff 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3...HEAD -- src scripts/find-production-host
git log 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3..HEAD --oneline
git diff --cached -- scripts/find-production-host docs/verification/48 .scratch/find/issues/48-verify-production-find-against-the-acceptance-matrix.md
```

Two independent read-only agents used `fork_turns=none` with bounded complete
handoffs. No reviewer launched native UI or changed files. These reports concern
partial checkpoint correctness; they do not accept unfinished original criteria.

## Standards

No hard documented-rule violations found.

Optional smell: **Duplicated Code** in `controlled-snapshots.mjs` and
`state-boundaries.mjs`. Both implement the same full-input replacement transaction
(`setSelectionRange` → `beforeinput` → native value setter → `input`). A shared
serialized helper would reduce drift when correcting DOM-input harness behavior.
This is a maintainability judgment, not a repository-rule breach.

Limitations: read-only review; no tests or native UI launched. Both supplied pins,
cumulative production changes and the staged continuation were reviewed.
Unfinished native/platform/resource acceptance remains explicitly reported.

Disposition: defer the optional helper extraction; this checkpoint retains the
existing harness event sequence. No production-code abstraction is added for it.

## Spec

Two actionable findings at the initial staged snapshot:

1. **Contradictory current matrix verdicts.** #48 requires “link each to its
   evidence layer and verdict.” The addendum records installed DOM/controlled
   coverage, but lower trace rows still label those boundaries unperformed/pending.
   Reconcile the main rows or explicitly identify them as historical, preserving
   physical/native limitations.
2. **Old-instance failure assertion does not exclude execution-error latching.**
   #37 requires rejecting older-instance results “including errors.” Empty query/
   window/result and no timeout could still accept `Find could not complete`
   plus Retry; a following edit could erase that erroneous latch. Require expected
   empty Find status and absence of Retry/error, then rerun; otherwise narrow
   the evidence and leave error-latch rejection unverified.

No scope creep or further contract substitution found. Both fixed points resolve;
current continuation changes drivers/evidence without production bytes. Identities
match all three assets and `d19f826…` tarball. Dense/resource/native/platform gates
remain partial; the fresh-process control does not erase failed listener growth.
CPU profiling is diagnostic. Cleanup and desktop reporting retain their stated
limits, including lack of a continuous pointer trajectory.

Corrections:

- The main D/trace rows now carry current DOM/controlled verdicts and links,
  preserving natural/physical/native/platform distinctions.
- The driver now proves pending status before the controlled instance boundary,
  then asserts and records the exact delivered state before any new edit:
  `{query: '', rows: 0, active: -1, count: 'Enter text to find', retry: false}`.
  A fresh isolated profile/process/namespace repeats all **19 assertions**:
  [stronger actual installed run](host/instance-review/controlled-snapshots.json).
  Both old success and injected error satisfy it, with later successful keys
  strictly increasing the instance epoch. [Identity](host/instance-review/package-identity.json)
  retains the same package/assets; [startup shutdown](host/instance-review/shutdown-clean.json)
  observes complete actual cleanup.

Focused independent recheck confirms both substantive findings resolved. The
fresh run's epochs advance 3→4 and 4→5; worker starts/exits are 1/1 and owners/live
are zero. The final documentation detail was corrected too: current matrix/report
links now target `host/instance-review/controlled-snapshots.json`; the earlier
controlled file remains historical evidence of the weaker assertion.

Summary: Standards 0 hard violations / 1 optional duplication judgment;
Spec 2 initial findings, both corrected, 0 unresolved. Full ticket/release
acceptance remains open.
