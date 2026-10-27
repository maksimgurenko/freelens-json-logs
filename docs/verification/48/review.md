# Independent two-axis review

Fixed pre-#48 HEAD: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
`git log 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3..HEAD --oneline` was empty:
this checkpoint was uncommitted during review. User explicitly required inclusion
of current ticket work. Nonempty scoped command:

```sh
git diff 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3 -- scripts/find-production-host docs/verification/48 .scratch/find/issues/48-verify-production-find-against-the-acceptance-matrix.md
```

New files were intent-to-add for this review. Two independent agents were spawned
with `fork_turns=none`, complete bounded handoffs, original issue/accepted authority,
repo/UI standards and read-only scope before parent conclusions. Unrelated dirty
glossary, docs index and #47 runner status were excluded. Neither reviewer operated
the host/UI or executed tests. No agent was delegated implementation work.

## Standards

No documented-standard violations found in the scoped uncommitted #48 diff.

One nonblocking baseline-smell judgment call: **Duplicated Code.** `acceptance.mjs`
and `mounted-soak.mjs` repeat the screenshot frame pump, overlap guard, swallowed
errors and cleanup. A shared start/stop helper could keep rendering controls
consistent, especially while screenshot retention remains an unresolved resource
variable. This is a maintenance suggestion, not a repository-rule violation.

Validation reporting appropriately qualifies mounted-resource failure, lifecycle
success, native/platform gaps and unfinished #48 status. No focus fabrication or
user-desktop input operation found in changed scripts. Limits: read-only artifact
review, no independent re-execution of measured results.

Disposition: deferred optional extraction so the current resource workload remains
available unchanged for investigation; it does not block a partial checkpoint.

## Spec

Original finding **[P2]: changed mode-toggle assertion contradicted accepted state
contract.** An interim edit called modes maintenance and accepted `0 of 1` while
#37 explicitly requires “Refine text or toggle a matching mode” to keep a matching
candidate or seek from the latest surviving search position. Typing followed by
immediate toggles against live snapshots could include an intervening maintenance
event; observed zero does not establish a different accepted mode policy. Restore
the original contract/assertion and isolate the fixture before accepting this gate.

No other findings. Resource failure, remaining host matrix work, native/platform
gaps and screenshot-driven rendering limits were disclosed. No scope creep.

Disposition: **checkpoint issue addressed**, independently rechecked by the same
Spec reviewer. `viewer.mjs` again matches original HEAD and expects `1 of 1`.
README, matrix D10/trace 9 and NEXT preserve mode toggles as refinement and leave
zero ordinal unresolved. Recorded modified-probe evidence has `pass:false`, keeps
its interim verdict separately and scopes useful evidence to lifecycle observations.
No remaining unsupported mode-maintenance claim or mode-refinement pass found.
No host/UI checks were rerun for this correction. The underlying observation is
an explicit verification gate for the continuation, not a diagnosed product bug.

Summary: Standards 0 hard violations, 1 optional duplication judgment call;
Spec 1 P2 assertion/reporting finding corrected, underlying host behavior unresolved.
