# Find #48: Linux native groups completed

[Three-angle PR review and independent fix verification](pr-49-review.md) confirm
and fix three contract defects: inspector-close refinement origin, pending
registration across document navigation, and layout-only matching invalidation.
The corrected package is `464a74d2`; 254 tests and the complete browser suite pass.
Earlier native evidence retains its reviewed `15f99148` artifact scope.

[PR publication corrections](pr-49-ci.md) fix unchanged Pod observations restarting
Find and select the working CI Chrome launcher. That prior package is `59a0d558`,
with 251 tests and the complete mounted browser suite passing locally. The native
evidence below retains its reviewed `15f99148` artifact scope.

Current checkpoint: [report](native-completion-20261028.md),
[scenario ledger and review corrections](native-completion-ledger.md), [matrix](matrix.md) and
[independent review](review-native-completion.md). Review baseline
`e41520ea01e1badaa07c4adc731e080db9f8aca6`, branch `implementation/find`.

The four requested remaining Linux native groups are covered on reviewed package
`15f99148d56a5b6100b929ff79c5d9b3680c9186a36dc5d5e08706bfed67749b`:
selection/source/layout variants; pending scroll/dismissal and native resize;
Menu/editor/auxiliary-focus/history/shortcut/edge behavior; actual native IME.
Read the report for preserved failed preconditions/oracles, IME trust flags and
the distinction between native delayed cancellation, fresh insertText and the
existing late DOM composition-end regression. No physical-hardware gate is added.

The fresh private host exited normally; all owned processes, profile, runtime and
UID/label-checked namespace are gone. Every native input/window/clipboard operation
used the private compositor. The read-only user desktop observer includes unrelated
activity and different endpoints; no unchanged interval is claimed. Unrelated real
window titles are redacted. Dirty work is preserved.

All original #48 criteria are reconciled in the local ticket. The resource
follow-up is closed as an accepted host limitation; the
[specification TLDR](../../design/find-implementation-plan.md#resource-investigation-tldr)
summarizes the watch-timer finding, clean viewer comparison and attribution limits.
Historical failures and thresholds remain intact. Windows/macOS test coverage is
planned soon in a future task; both platforms remain explicitly unverified.
Implementation and agreed acceptance are complete, so the Find implementation
tickets are eligible for closure. Publication, push, PR and release remain
separate work. No further native/resource work is scheduled by this ticket.

[Review corrections](native-review-corrections.md) record the CSS contrast regression/fix, final package relationship, stronger native IME replacements and failure-path cleanup checks.
