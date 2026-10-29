# Independent review: scoped resource deferral and final functional acceptance

Review baseline: `27e4d828c436a697dba4520593df0d4579914980`; original #48 pin
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. No commits followed the baseline
before review. Exact review command: `git diff --cached 27e4d828c436a697dba4520593df0d4579914980`.
It includes the ticket, scoped user decision, new harnesses and raw evidence;
unrelated dirty glossary/docs and scratch/setup work are excluded.

Both reviewers received the original ticket/accepted plan/full decision sources,
repo standards/UI policy and the user's resource-deferral correction before parent
conclusions. Delegations and follow-ups used explicit `fork_turns=none`, bounded
read-only handoffs, no model override and no subdelegation. No reviewer ran UI,
resource checks or mutations. Production code and package bytes are unchanged.

## Standards

Initial review: no documented-standard breaches or actionable baseline smells.
Two nonblocking observations: “without new matching” exceeded the composition
probe's input/count/highlight assertions; SDK restoration failure could skip later
HTTP/navigation cleanup in a shared try block.

Corrections: narrowed the wording to no input/highlight resurrection; each wrapper
and renderer cleanup now runs independently, preserving every failure and a failed
verdict. Fresh context evidence reports all restoration steps true and empty service
state. The new D10 probe was also independently reviewed.

Final Standards follow-up:

> No remaining hard-standard breaches or actionable smells found.
>
> Both earlier observations are resolved. Context cleanup now attempts each restoration independently and preserves failures. The new mode probe uses independent expected rows, verifies complete match/range keys and flags, checks Custom Highlights, and activates every mark. Saved results show all four modes passed with successful restoration.
>
> Native/platform limits and the resource deferral remain explicit. Review was read-only; no UI or resource checks were rerun.

## Spec

Initial actionable finding: the D10 Host cell required “Matching/ranges/marks
share current key,” while existing installed checks covered mode-dependent counts
and default-mode marks separately. Browser agreement could not satisfy that cell.
The earlier context probe also did not assert the held reply's successful kind.

Corrections: a fresh [four-mode installed oracle](host/functional-modes-reviewed/mode-agreement.json)
checks known independent row lists `[0,1,2]`, `[1,2]`, `[0,1]`, `[1]`, exact match/range
key and flag equality, visible Custom Highlights and every activated mark. A fresh
[context oracle](host/functional-context-reviewed/context-boundaries.json) proves
`matches`/four records before all four stale deliveries, then verifies unchanged
replacement state. Final identities match the exact same `995f1cf5` artifact.
The reviewer independently confirms the D10 finding and held-success gap are resolved.

D16 route continuity is evidenced by installed Clear/Close flows continuing with
the same mounted viewer. Physical Escape/default-action/history delivery remains
explicitly native/unverified; the reviewer did not elevate a missing dedicated
history-index assertion into another functional finding.

Final Spec follow-up:

> No remaining actionable Spec findings in the available non-native functional scope.
>
> The fresh D10 evidence satisfies “Matching/ranges/marks share current key”: all four flag combinations have independent expected rows, matching/range key and flag agreement, correct visible highlight rows/text, and actual mark activations resolving each expected record.
>
> The fresh context evidence resolves the success-oracle weakness: all four held replies explicitly record `kind: matches` and four records before release or injected rejection. Distinct viewer epochs/owners, unchanged replacement state, and independent B-anchor preservation remain verified.
>
> Both installations match final artifact `995f1cf5`; wrapper restoration, empty owned service state and actual shutdown exits are recorded. Reports and matrix retain controlled-DOM/SDK limits, historical failures and resource deferral honestly. No scope creep found.
>
> Remaining gates are accurately blocked on fresh native Linux attendance/access and actual Windows/macOS coverage. The original requirement “background DOM checks cannot substitute for physical-input evidence” remains respected.

Native Linux attendance/clipboard/focus/window and actual Windows/macOS access
are required gates, not resource tasks. The user's accepted resource deferral is
preserved without relabelling failed measurements.

Standards: zero remaining findings. Spec: the available functional findings above
are resolved; original native/platform acceptance remains unperformed.
