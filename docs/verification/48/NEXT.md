# Continue only Find #48

Branch `implementation/find`. Original ticket pin:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. This continuation began at
`863db9d74786a2ee4e689bf0fe3e464c47597cd5`; record the **new current HEAD**
before implementation/review. Reclaim #48 and fetch live corrections. Read the
original ticket/accepted plan/full #36/#37/#38/#40 comments, [weak-idle.md](weak-idle.md),
[resource summary](host/weak-idle-final/resource-summary.json), [matrix](matrix.md)
and relevant earlier state reports. No issue comments/closure, push, PR, merge,
release or pinned-host patch.

1. **Artifact unchanged.** `freelens-readable-logs@0.1.34`, SHA-256
   `995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
   Preserve versioned main/renderer/worker, stable package/store/page/config,
   schema 3 and stable highlight-feedback reserve. Use local Node 24.18.0/npm
   11.16.0; preserve dirty glossary/docs and unrelated setup/scratch/build/cache.
2. **Resources still fail; do not erase samples.** Normal corrected 120-cycle
   per-bound run fails 27 long samples, peak **+203 nodes/+36 listeners**. Early
   +9 spikes can collect during natural idle; later growth remains **+182/+27**
   after 15 seconds and separate GC. Immediate weak-root censuses have no reachable
   captured wrapper; that is not a global native-DOM inventory. Before/after
   counters preserve activity during census. Original +128/+8/zero-document/
   +8-MiB-heap every-sample limits remain. Plain 30-cycle repetition passes but
   clears no failure. All actual worker/lifecycle assertions pass.
3. **The supervisor hypothesis is tested, not adopted as cause.** The undrained
   timing control omits only the normal post-unmount two-frame wait after its
   warm baseline. Four of five undrained long samples capture one disconnected
   viewer root: **1,436 subtree nodes/24 listeners**, global +1,520–1,524/+25.
   The root alone does not explain all global objects. Weak roots remain through
   5 seconds and collect by 15 without forced GC in that comparison; native
   scroll/lifecycle processing and natural MajorGC are observed, no target-specific
   queue-emptiness or scrollend proof. The original normal-workload **+1,551/+26**
   sample remains unattributed. Never substitute the control or later heap for it.
4. **Concrete next autonomous investigation: request/timer/native ownership.**
   The later [native heap](host/weak-idle-plain/listener-heap-post-plain.json.gz)
   has zero viewer DOM, **643 host ClusterView nodes and 120 EventListener paths
   through AbortSignals**. Shortest paths include HTTPParser/ClientRequest and
   native DOMTimer/AbortController chains. Prior seven-signal/17-listener tracing
   was only a subset. Inspect these sanitized paths and pinned SDK/host source;
   capture bounded weak request/controller origins and actually attached listeners
   around the specific global violation, with a matched no-Find/host control.
   Keep callbacks/targets weak, release inspector handles, preserve pre/post
   counters, and retain no-GC idle observations. Do not repeat already-passing
   state matrices or run another long soak without a discriminating observation.
   Native backend IDs captured while mounted (before queue-critical scroll) may
   help census native-only roots when WeakRefs are empty, but first verify their
   non-owning behavior and release handles. Do not infer a native inventory from
   empty WeakRefs. A demonstrated host-only limitation may need the precise local
   planning question: must the whole-host every-sample gate still pass unchanged,
   or what explicitly approved ownership/quiescence policy can separate pinned-host
   retention? No policy change or host workaround is authorized by these results.
5. **Reusable harness.** `FIND_SOAK_VIEWER_ROOTS=1` captures weak roots inside the
   existing active-state evaluation. Violations first get `violatingViewerRoots`,
   then `FIND_SOAK_IDLE_COMPARE=1` observes 0/250/1,000/5,000/15,000 ms without
   forced GC. Optional `FIND_SOAK_IDLE_TRACE=1` traces only after that first census.
   `FIND_SOAK_POST_IDLE_GC=1` adds a separate later collectibility check, never a
   replacement verdict. `FIND_SOAK_UNDRAINED_CONTROL=1` is attribution-only and
   requires natural frames/roots/idle comparison. Self-check with
   `FIND_ROOTS_CHECK_IDLE=1 ... viewer-roots-check.mjs`. Use fresh evidence names.
   Raw JSON is losslessly gzipped. Older loaded harness snapshots stay separate.
6. **Other gates retain their exact scopes.** Current package's controlled exact
   5-MiB/±1-byte/1,001-line retention checks and previous state/held/source/geometry/
   dense-cadence/following/Pause/SDK/frame/maintenance subsets pass at their named
   layers. Full target/viewer stale-success/failure and independent B surviving
   inspected-A eviction counterparts remain distinct from older evidence. Physical
   editing/selection/copy/clipboard/IME/AltGraph/shortcuts/menus/focus/window,
   stock-output/long-duration resources and Windows/macOS remain unverified.
7. **Environment gone; establish fresh ownership.** One long-lived private
   labwc→Hyprland workspace-7 host used the modified Aquamarine diagnostic, not
   stock acceptance. Its profile/runtime/PIDs and UID-checked fixture namespace
   are removed; build/cache remains. Shutdown: **1,031 starts/exits**, peak one,
   zero live workers/owner maps/watch. Three SDK handlers were still listed at
   will-quit; do not claim zero there. Fresh user/settings/glossary/docs hashes
   match. The desktop observer records monitor/FALLBACK/focus/workspace activity
   and differing pointer/focus/workspace endpoints, same client sets and no real
   window open/close. **No unchanged-desktop claim.** No native input/clipboard,
   activation, focus restoration, pointer movement or fake focus was used. Keep
   FREELENS_UI_MODE unset and all shared guards intact; never restore the desktop.
8. **Finish correctly.** Pinned locked/typecheck/249 tests/six UI guards/browser/
   real workers/original smoke/strict package/two-build checks and independent
   Standards/Spec reviews are recorded. Next review uses the new baseline plus
   original requirements with `fork_turns=none`. Commit only #48 work/evidence,
   preserve original criteria and check only wholly satisfied items. Retry for
   concrete autonomous work; blocked for precise missing access/decision/evidence;
   done only after every original criterion and its evidence are committed.
