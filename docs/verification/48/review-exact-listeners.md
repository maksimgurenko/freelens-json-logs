# Independent review of the #48 exact-retention/listener continuation

Continuation baseline: `3555efc4bb3d5fbd5775bf0c405f31c37c857747`.
Original ticket baseline: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Both resolve. No commit follows the continuation baseline at review time.
The user explicitly permits including current staged WIP, including new files:

```sh
git log 3555efc4bb3d5fbd5775bf0c405f31c37c857747..HEAD --oneline
git diff --cached 3555efc4bb3d5fbd5775bf0c405f31c37c857747 -- .scratch/find/issues/48-verify-production-find-against-the-acceptance-matrix.md docs/verification/48 scripts/find-production-host
```

Two independent read-only agents use `fork_turns=none`, receiving original ticket,
accepted plan, full decisions and repository standards before the parent report.
Standards receives the complete smell baseline. No reviewer desktop, tracker,
Git/index or source mutation is authorized. A partial checkpoint is not treated
as full-ticket acceptance.

## Standards

Initial review found one hard verification defect: the retention harness could
report success after swallowed HTTP restoration/worker-owner cleanup failures.
The saved initial run did have successful closure; the defect concerned future
reproducibility. The final harness preserves both error paths, verifies exact
HTTP-method restoration and requires zero live workers/owner/retiring/opening/
sender/watch state. Either teardown failure forces `pass=false` and nonzero exit.
The same independent reviewer inspected the correction and confirmed it resolved.

No remaining hard Standards breach. Optional **Mysterious Name**: generic
EventTarget mode retains the legacy `traceAbortListeners`/`signal`/`abortSignals`
names. This naming cleanup is deferred; capture scope is explicit in output.

Compressed evidence supports resource failures/passing repetitions, environment
limits, desktop observations and saved settings hashes. The review performed
no desktop/host execution or file/index/tracker mutation.

## Spec

No confirmed Spec defect or scope creep remains in this partial continuation.

Original criterion 4's resource gate remains failed. The reviewer independently
recomputed all **180 measured samples**: long cycle 22 is the new failure at
+1,551 nodes/+26 listeners. Stable 17-listener AbortSignal coverage cannot attribute
that global increase. Passing repetitions do not erase it.

Criteria 1 and 5 remain partial: full D01–D16/13-trace Host coverage, target/viewer
stale delivery, independent-anchor eviction and physical/native checks are
explicit gates, not concealed completion claims. Windows/macOS are explicitly
unverified as criterion 6 permits. No unchecked criterion is newly checked.

The reviewer replayed actual `retainSnapshot` at ±1 byte/exact 5 MiB, predecessor
omission and newest-1,000 boundaries, independently matched source hashes,
recomputed census totals and confirmed package/three installed asset hashes.
Saved worker evidence confirms 318 actual starts/exits. The teardown correction
matches criterion 3's requirement for actual exit and complete owned cleanup.
The independent follow-up review confirms the fresh final harness: six checks,
`httpRestored=true`, empty closed lifecycle, matching package/asset hashes, and
**3 actual starts/exits** at startup shutdown. An initial draft's guessed count
of four was corrected against that raw evidence before commit.

## Reconciliation

The hard cleanup finding is corrected. Original oracle failure and failed
resource samples remain separate from passing reruns. No product/package change,
threshold relaxation, fallback or new native/platform claim was introduced.
The final installed harness verifies the changed cleanup path; broad regression
checks remain separately recorded. Optional generic-trace naming is deferred.

Remaining findings: **Standards 0 hard / 1 optional** (legacy diagnostic naming);
**Spec 0** (no worst issue). This is a retry checkpoint, not release acceptance.
