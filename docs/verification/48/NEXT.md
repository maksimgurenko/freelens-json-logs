# Continue only Find #48

Branch `implementation/find`. Original ticket pin:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. This continuation began at
`3555efc4bb3d5fbd5775bf0c405f31c37c857747`; record the **new current HEAD**
before subsequent implementation/review. Reclaim #48 and fetch live corrections.
Read the original ticket, accepted plan, full #36/#37/#38/#40 comments,
[exact-listeners.md](exact-listeners.md), [matrix.md](matrix.md) and relevant prior
state reports. No issue comments/closure, push, PR, merge, release or host patch.

1. **Artifact remains unchanged.** `freelens-readable-logs@0.1.34`, SHA-256
   `995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
   Main/renderer/worker, stable package/store/page/config/schema 3 remain.
   Keep the compact stable highlight-status reserve. Use project-local Node
   24.18.0/npm 11.16.0, preserving original dirty glossary/docs and unrelated data.
2. **Exact installed-response gap is now covered.** `retention-boundary.mjs`
   supplies target-scoped controlled HTTP bodies through the installed production
   adapter/session/viewer/SDK/worker. Six checks pass: 5 MiB exactly, one byte
   under/over, complete full-source DOM selection/hashes and terminal highlight,
   older predecessor omission, newest 1,000 of 1,001 lines. These are not naturally
   emitted exact kubelet byte sizes, physical selection or clipboard evidence.
   The incorrect initial notice-text oracle and corrected pass remain separate.
3. **Resource gate still fails.** The abort-only pre-heap diagnostic captured a
   long-source failure at cycle 22: **+1,551 nodes/+26 listeners**, unchanged at
   census entry. Seven traced AbortSignals have 17 actual attached listeners at
   baseline and failure. This subset does not explain the extra global listeners.
   Activity continues during census (756→761 global listeners), explicitly
   recorded. Never substitute a later heap result for that failed sample.
4. **Concrete next autonomous task: minimal weak viewer-root capture.** Keep a
   bounded list of WeakRefs to owned `.readable-logs` roots captured while each
   viewer is mounted. Immediately after a violating retained-resource sample,
   dereference the roots and use non-piercing `DOMDebugger.getEventListeners` on
   their detached subtrees, recording safe node classes, handler locations,
   counts and pre/post DOM counters. Release all temporary handles before the
   next sample. This observes assigned DOM handlers too, without wrapping every
   registration; do not strongly retain callbacks/targets between samples.
   Compare the failing node/listener delta with those roots, then run plain again.
   The all-target trace in this continuation passed and thus did not identify the
   failed sample. Its stable covered subset has 359 cluster/29 root listeners,
   including host drawer/icon detached targets. It cannot exclude a missed
   retained viewer or establish exclusive attribution. Reuse/extract the bounded
   census logic only if useful; no speculative production lifetime change.
5. **Keep every-sample verdicts.** No threshold relaxation or endpoint-only pass.
   This continuation's plain 30-cycle-per-bound repetition passes (dense +28
   nodes/zero listeners, long +29/zero); the broader trace also passes (+29/zero,
   +39/+1). Both follow the failed diagnostic in the same long-lived host. They
   do not erase any previous failed plain/diagnostic result. Prior host-only
   inactivity retains 14 ClusterView nodes/15 samples, without a viewer; that
   evidence remains specific to that symptom. If a host-only limitation needs
   a measurement-policy decision, state the exact planning question locally.
6. **Other evidence/gates remain scoped.** Previous current-package subsets pass
   state/held/source/geometry/dense cadence/following/Pause, maintenance, SDK/frame,
   timeout and newest-only bursts at their named layers. Full remaining target/
   viewer stale-success/failure and independent-anchor/inspector-eviction
   counterparts remain distinct from older artifact evidence. Physical editing,
   selection/copy/clipboard, OS shortcuts/IME/AltGraph/menus/focus/windows,
   stock-output and long-duration resources, Windows/macOS remain unverified.
   Complete independent autonomous work before asking for dedicated human gates.
7. **Environment and cleanup.** All three soaks use three warmups/30 measured
   cycles per bound with natural private-output frames and 100 ms inactive waits.
   Separate private labwc→Hyprland workspace 7 uses the documented private
   Aquamarine diagnostic; not stock compositor acceptance. Fresh profile/fixture
   required: the host/profile/runtime/UID-checked namespace from this continuation
   are gone. Shutdown observes 318 actual starts/exits, peak one, zero service
   maps/watch. User-settings/glossary/docs hashes match fresh before-run hashes.
   The desktop observer records zero focus/workspace/window transitions and equal
   pointer endpoints (endpoint-only). No native input, activation, clipboard,
   focus restoration or fake focus was used. Keep FREELENS_UI_MODE unset and all
   shared guards intact. Preserve private build/cache and unrelated user data.
8. **Finish correctly.** Full pinned locked/typecheck/tests/UI guards/browser/
   actual workers/original smoke/strict package/two-build checks and independent
   Standards/Spec review are recorded in the continuation report. Pin the next
   review to the new baseline plus original requirements, fork_turns=none.
   Commit only #48 implementation/evidence before reporting. Preserve original
   acceptance text; check only wholly satisfied criteria. Retry with concrete
   autonomous work; blocked for precise missing human/access/decision/evidence;
   done only after every original criterion and its evidence are committed.
