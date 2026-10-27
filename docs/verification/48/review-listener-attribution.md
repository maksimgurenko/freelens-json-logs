# Independent review of the #48 resource-attribution continuation

Fixed continuation point: `a098a2105e3223fd435dbb7eef3b09c05ffd93b1`.
Original ticket point: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Both resolve. No commits followed the continuation baseline at review time;
the explicitly permitted scoped WIP diff includes staged new files:

```sh
git log a098a2105e3223fd435dbb7eef3b09c05ffd93b1..HEAD --oneline
git diff a098a2105e3223fd435dbb7eef3b09c05ffd93b1 -- .scratch/find/issues/48-verify-production-find-against-the-acceptance-matrix.md docs/verification/48 scripts/find-production-host
```

Two independent agents used `fork_turns=none`, each receiving original issue/
accepted plan/decision artifacts and applicable repository standards before the
parent report. Standards also received the full smell baseline. They were scoped
to read-only offline review, without Git/index/desktop/tracker mutations. Neither
review treats a partial checkpoint as full acceptance.

## Standards

Hard documented-standard violations: **none found** in the scoped WIP diff.

The changed diagnostics enforce the private-session prerequisite, use background
CDP, and contain no native input, focus, pointer or clipboard operations. Resource
checks retain the documented thresholds and now inspect every measured sample.
Reports preserve failed and unverified gates without claiming acceptance.

Optional baseline smells: **none identified** that warrant a finding.

Read-only verification reproduced the saved audit's expected failure on the old
false pass and success on the correctly reported failed soak. The corrected raw
evidence contains four violating samples, including long-source peaks of +1,543
nodes/+26 listeners. All five changed JavaScript modules passed syntax checks
with the pinned Node binary. No files, index, tracker or desktop state were mutated.

## Spec

No actionable Spec finding in the scoped continuation.

Requirements remain partial, honestly reported. #48 requires “Cover all in-scope
D01-D16 cases, the 13 state traces” and “complete owner/listener/timer/observer
cleanup.” Remaining Host coverage, failed resources, stock-display/long-duration,
physical input and Windows/macOS gates remain explicit in the report and matrix.
This is an unfinished checkpoint, not incorrect completion reporting.

No unrequested scope creep found. Changes concern verification scripts,
diagnostics and evidence. Package identity records the existing tarball and
matching installed/local assets. No production behavior change, host patch,
threshold relaxation or new fallback appears in the scoped diff.

No implemented-but-wrong behavior found. Against the requirement that
failed/unperformed production gates remain visible, the reviewer independently
recomputed the compressed samples. The historical endpoint pass genuinely hides
+9 listeners; the corrected run genuinely fails at +1,543 nodes/+26 listeners.
The soak now evaluates each measured sample, including documents, and its
interpreted verdict agrees with the raw data.

The host-only claim is appropriately narrow: both controls gain 14 nodes, and
sanitized heap inventories increase exactly **407→421** ClusterView nodes, with
756 listeners unchanged. The report leaves exact failed-sample listener
attribution unresolved. Shutdown supports 466 starts/exits and empty service maps
while openly retaining three SDK handlers at `will-quit`.

Review was read-only and offline; no desktop or host execution performed.

## Final reconciliation

No code changes were required by either review. The final report additionally
makes the source dimensions explicit (1,000 records and one near-5-MiB source),
so the latter is not claimed as an exact full-5-MiB installed response fixture.
The resource failure and all partial/unperformed gates remain open.

Findings: **Standards 0** (no worst issue); **Spec 0** (no worst issue).
