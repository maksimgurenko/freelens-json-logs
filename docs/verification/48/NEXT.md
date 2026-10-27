# Continue only Find #48

Branch `implementation/find`. Original ticket pin:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`; this continuation/review baseline:
`9280757b9c79b4f5d3944ea8bcc92699f67dda8c`. Record the next current HEAD, reclaim
#48 and fetch full live corrections. Read the local ticket, accepted cached plan,
full #36/#37/#38/#40 decisions, [state-completion.md](state-completion.md),
[matrix.md](matrix.md), [geometry.md](geometry.md) and [cadence.md](cadence.md).
Only #48 is authorized; no comments, closure, push, PR, merge or release.

1. **Current artifact is unchanged.** `freelens-readable-logs@0.1.34`, SHA-256
   `d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`.
   This continuation changes acceptance drivers/evidence only. Existing clipping
   and mark-cycle fixes remain. Installed main/renderer/worker assets match the
   build; schema 3/stable identities remain. No fallback or prototype/research merge.
2. **Concrete autonomous next task: minimise dense cadence failure.**
   `node scripts/find-production-host/dense-profile.mjs` in a prepared private host
   SHA-verifies/replays the preserved old harness, samples CPU for ~40 seconds,
   stops the owned driver and observes page/worker disposal. Only seven activations
   complete. Its old regrouping oracle is known wrong; this is diagnostic evidence,
   not acceptance. Raw `host/dense-diagnostic/dense-cpu-profile.json.gz` includes
   native/program time, highlight projection, timestamp rendering, viewport restore
   and clipping; individual profiler nodes do not establish the cause. Read the
   diagnosing-bugs skill. Build a faster red-capable natural-cadence loop comparing
   dense wrapped rows with no query, zero-hit query and capped dense query, then
   a few mark activations. Change one variable at a time and retain layout/profiler
   evidence. TDD is authorized at existing production-renderer/state/session seams
   once a product defect is isolated. Do not invent a native latency bound.
3. **Resource gate remains open.** The long-lived host's three warmups/six dense
   cycles pass actual lifecycle cleanup but fail +15 listeners (828→843) against
   +8, with +27 nodes/+862,544 B heap/+696,320 B RSS; long is +5 nodes/0 listeners.
   See `host/dense-diagnostic/mounted-soak-clean-inspector.json`. Preceding state,
   controlled-delivery and profiler workloads require fresh-process comparison
   before attribution. The separate `host/resource-control` result is in the latest
   report. Keep the failed run even if the control passes. Short samples/private
   compositor do not establish a long RAM/disk plateau or stock-display acceptance.
4. **New state subsets and their limits.** `host/state-completion` passes 20 state
   assertions and 31 real snapshot/restart assertions: independent reading/inspection
   via explicit DOM Tab/focusin, still-matching profile candidate, stale window/message
   successes/failures, Profiles cancellation, seven-entry MRU and seed flags; both
   flags reset across two actual restarts, with Pause/manual profile/history and
   explicit following/real appended-bottom movement. `host/dense-diagnostic` repeats
   33-state/13-held/SDK-frame/startup-timeout/20-burst checks. Earlier reruns failed
   their 120-row fixture precondition after the new append workload; fresh namespace
   passes are separate. Explicit focusin is not physical keyboard delivery.
5. **Controlled Host cases now pass at the boundary layer.**
   `controlled-snapshots.mjs` passes 19 assertions through the actual installed
   SDK adapter/session/viewer/main-worker with target-scoped HTTP bodies/delivery:
   exact identical-transport overlap, identical/zero-overlap windows, node/DOM
   selection, missing/first-known/count-then-ID/known-ID metadata, stale-instance
   matching success/error with increasing epochs and old log success/error.
   All descriptors/gates are restored. This is not naturally identical timestamps,
   natural kubelet ordering, physical selection or atomic UID-bound snapshot proof.
   Use the final `host/instance-review/controlled-snapshots.json`: independent review
   strengthened old-instance errors to require exact empty Find status/no Retry
   before any new edit. The earlier `dense-diagnostic` file proves less and stays
   historical. Fresh corrected 19-check evidence, matching assets and shutdown pass.
6. **Private/native/platform limits.** Stock NVIDIA nested output is 0×0; stock
   Mesa readiness failed. Reuse only the documented private Aquamarine diagnostic
   build for autonomous DOM work, or establish an unmodified suitable output.
   Use private labwc→Hyprland workspace 7, `FREELENS_UI_MODE` unset and the UI guards.
   Never fake focus, inject native input, operate clipboard or activate/restore/
   restart user windows. Background document focus is false: focus-dependent
   Escape/shortcuts/menu/foreign-editor delivery stays unverified. Fresh attended
   agreement or appropriate separate native/platform access is needed for physical
   selection/copy/clipboard, editing/paste/Undo/Redo/IME/AltGraph, modifiers, menus,
   OS focus and window buttons. Windows/macOS remain unverified. Finish independent
   work first; report blocked precisely when only human/access/evidence gates remain.
7. **Checks/review/commit.** Use local Node 24.18.0/npm 11.16.0. The latest report
   links locked install/typecheck, 249 tests, six UI guards, production browser,
   built workers/resource smoke, strict package and deterministic two-build checks.
   Independent two-axis review uses the recorded baseline plus scoped current diff
   and original requirements, with `fork_turns=none`. Commit only #48 work/evidence.
   Retry while a fresh context can finish concrete autonomous work; done requires
   every original criterion and committed ticket/evidence.

Use a new safe `FIND_HOST_RUN`, fresh profile/fixtures and `FIND_HOST_TICKET=48`.
`state-boundaries` appends to traces: unchanged state/held/mounted suites need a
new 120-row namespace afterward. `controlled-snapshots` restores the HTTP descriptor
and SDK handler. `identity.mjs` compares installed assets/build and reads the private
schema. Install once through Extensions before any cluster; changed bytes at the
same version require a new process/profile. Remove only still-owned UID-matching
resources. Preserve user configuration/installation, shared fixtures and unrelated
checkout work. Review and cleanup outcomes are in the latest report.
