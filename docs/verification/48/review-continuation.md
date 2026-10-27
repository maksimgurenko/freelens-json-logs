# Independent two-axis continuation review

Original pre-ticket fixed point: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Continuation starting HEAD: `b740e7d1c407162d93809c43ea65b8f4e4fb436e`.
`git log 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3..HEAD --oneline` at review
contained only `b740e7d Record partial production Find acceptance and resource gate (#48)`.
Nonempty scoped diff, including current uncommitted/intent-to-add continuation:

```sh
git diff 3fb33db5f5ded3523bcf66c1145f0af967ec0bf3 -- scripts/find-production-host docs/verification/48 .scratch/find/issues/48-verify-production-find-against-the-acceptance-matrix.md
```

Two independent reviewers, each `fork_turns=none`, received original #48,
accepted handoff/full canonical decisions, standards/UI rules and the diff before
parent conclusions. They reviewed read-only, without operating UI/host or running
tests. GLOSSARY/docs index user changes and Ralph runtime were excluded. They could
isolate the continuation with `git diff b740e7d --` the same scoped paths.

## Standards

No hard documented-standard violations found. Private-session validation,
workspace 7 ownership and attended guards remain intact; no new host activation,
native input, clipboard or fabricated-focus path. Failed resource gates and
unperformed native/platform checks are honestly retained.

One nonblocking reporting inconsistency: matrix trace 2 still called initial
Previous/one-hit pending, and trace 5 still said unperformed despite the new
current-count-after-dismissal boundary evidence. Update those rows to the narrower
demonstrated scope while retaining held-completion gates.

No additional heuristic smell warrants action. Earlier screenshot-pump duplication
remains in the original checkpoint. Read-only review; no independent execution.

Disposition: trace rows corrected. No code change required.

## Spec

No remaining actionable Spec defect after corrections.

Reporting corrections verified: D03 now explicitly remains partial because its
`upstream` fixture starts matching at row 2, whereas the original case requires
“query matches the first retained record … Include that record.” Dedicated row-zero
Host evidence remains pending. Trace 2/5 distinguish demonstrated DOM boundaries
from held-completion gaps, meeting the requirement to link each evidence layer
and verdict.

Missing/partial requirements remain declared: failed installed resources;
snapshot/profile/restart/duplicate/eviction; held mounted success/failure,
timeout/recovery/decoration failure; complete geometry/following/seed sources;
physical/native and Windows/macOS. These are unfinished gates, not newly discovered
product defects. Failed/unperformed gates remain visible without release acceptance.

Heap shortest non-weak paths neither establish exclusive retention attribution
nor prove normal cadence would eliminate growth. Both limits and the failed
resource verdict remain explicit. No unrequested behavior or production fallback
found; Mesa is correctly reported as a failed environment attempt.

Disposition: both reporting corrections verified independently. This supports a
partial checkpoint and autonomous continuation, not completion/release acceptance.

Summary: Standards 0 hard violations, 1 reporting inconsistency corrected;
Spec 2 reporting inconsistencies corrected, 0 remaining actionable defects.
