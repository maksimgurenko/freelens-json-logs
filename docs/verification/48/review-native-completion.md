# Independent Standards and Spec review

Baseline: `e41520ea01e1badaa07c4adc731e080db9f8aca6` on `implementation/find`.
No intervening commits before review. Exact review command:
`git diff --cached e41520ea01e1badaa07c4adc731e080db9f8aca6`.
This includes only #48 implementation, native harnesses, local ticket, verification
and evidence; unrelated dirty glossary/docs and scratch/runtime work are excluded.

Both independent reviewers received the original completion instructions, #48,
accepted plan/full decisions, repository standards/UI policy and original artifacts
before parent conclusions. Both spawns explicitly used `fork_turns=none`, no model
override and no subdelegation; follow-ups reused those independent contexts.
Reviews were read-only, with no native/UI/resource execution or external messages.

## Standards

Initial finding: setup could fail after creating input helpers but before returning
cleanup to callers; a failed final probe could prevent CDP close. The stale IME C
comment also incorrectly said no keyboard grab.

Correction: local setup owns cleanup, final probing cannot prevent unconditional
transport closure, input termination waits for actual exit and the comment discloses
the Enter grab. Fresh public harness probes exercise missing owned prerequisite and
closed page transport, with no input children retained. A follow-up spotted the
SIGKILL timer resolving before exit; it now only sends the signal while the helper
awaits the actual exit event. Recorded probes used normal SIGTERM, stated explicitly.

Final independent report:

> Confirmed: `stopOwned()` now waits for the actual exit event after SIGKILL escalation. The staged tooling hash matches, and the evidence note accurately limits recorded probes to SIGTERM.
>
> No remaining actionable Standards findings.

No hard documented-standard violation or actionable baseline smell remains.

## Spec

Initial findings: whole IME replacement began at the first candidate, so a wrong
refinement could satisfy its assertion; partial replacement only appended. D07
contrast was incorrectly accepted from a screenshot/style recording showing dark
text on the black canvas in the fresh light-themed host.

Correction: [fresh selected IME cases](host/native-ime-replacement-20261028/native-reviewed-completion.json)
separate origin64/candidate82, whole selection `[0,8)` →73 and partial selection
`[2,8)` →82. A production-renderer contrast regression fails first, a narrow row
palette fix resolves it, and the complete browser suite plus fresh installed native
contrast/copy/selection/highlight cases pass. [Full corrections](native-review-corrections.md)
retain failed observations and exact package relationships.

Final independent report:

> No remaining actionable Spec findings.
>
> Both original findings are resolved:
>
> - Native whole replacement now begins at candidate 82 with reading row 64 and selects `[0,8)`, producing 73. Native partial replacement selects `[2,8)` and preserves 82. These outcomes distinguish new-search from refinement behavior. Both cases assert no preedit matching and exactly one committed matching request.
> - The mounted production-renderer regression fails before the palette fix and passes under light/dark host variables afterward. Fresh installed evidence verifies readable ordinary, inspected/hovered and selected text, exact private clipboard output and Custom Highlights. The screenshot corroborates the contrast correction.
>
> The final package is identified as `15f99148…`; unchanged main/worker bytes and renderer equality apart from embedded CSS support retaining earlier evidence with its stated artifact scope.
>
> The original #48 criteria can be reconciled as complete within the explicitly documented scope: the four Linux native groups are covered through the separate session; failed observations remain preserved; resource measurements remain accepted/deferred rather than passed; Windows/macOS remain explicitly unverified as the criterion permits. Native late cancellation and the separate DOM late-composition regression remain accurately distinguished. No additional physical-hardware or universally trusted-event requirement is warranted.
>
> This was a read-only review of sources, staged changes and recorded evidence; no native/UI execution was performed.

Standards: zero remaining findings. Spec: zero remaining findings. No publication,
GitHub message, resource work or invented physical-hardware gate.
