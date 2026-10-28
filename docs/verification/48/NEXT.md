# Find #48: Linux native groups completed

Current checkpoint: [report](native-completion-20261028.md),
[scenario ledger and review corrections](native-completion-ledger.md), [matrix](matrix.md) and
[independent review](review-native-completion.md). Review baseline
`e41520ea01e1badaa07c4adc731e080db9f8aca6`, branch `implementation/find`.

The four requested remaining Linux native groups are covered on current package
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

All original #48 criteria are reconciled in the local ticket. Resources remain
accepted/deferred, with historical failures/thresholds intact. Windows/macOS remain
explicitly excluded/unverified, as allowed by the original marking criterion.
No publication, push, PR, issue comment/closure or release is authorized. No further
native/resource work is scheduled by this ticket.

[Review corrections](native-review-corrections.md) record the CSS contrast regression/fix, final package relationship, stronger native IME replacements and failure-path cleanup checks.
