# Continue only Find #48

Branch `implementation/find`. Original ticket pin:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. This continuation was implemented and
reviewed from `a098a2105e3223fd435dbb7eef3b09c05ffd93b1`; record the **new current
HEAD** before next implementation and use it for that continuation review.
Reclaim #48 and fetch full live corrections. Read its local ticket, accepted plan,
full #36/#37/#38/#40 comments, [listener-attribution.md](listener-attribution.md),
[matrix.md](matrix.md) and prior state reports. Only #48 is authorized. No issue
comments/closure, push, PR, merge, release or unrelated host patch.

1. **Current artifact is unchanged.** `freelens-readable-logs@0.1.34`, SHA-256
   `995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
   Main/renderer/worker, stable package/store/page/config and schema 3 remain.
   Keep the compact stable highlight-status reserve from the prior checkpoint.
2. **Do not trust endpoint-only soak verdicts.** `mounted-soak.mjs` now checks
   every measured sample and documents peak/sample growth and actual violations,
   including zero document growth. Old baseline stdout says pass at +8 endpoint
   listeners but has +9 earlier. The independent saved policy audit catches this;
   the corrected new run truthfully fails at long cycle 24 (+1,543 nodes/+26
   listeners), with later listener violations too. Raw stdout/failed runs remain
   separate. No threshold was relaxed. Optional instrumented passes cannot clear
   failed uninstrumented production resource gates.
3. **Concrete next autonomous resource task.** Capture the exact extra listeners
   at a failed *pre-heap* sample. Four attached censuses are identical at 666;
   eight later heap captures each have 724 native listeners. Heap GC removes the
   transient difference, so it does not identify the failed sample's extra nine.
   Host-only route control has a +31 transient listener peak with no extension
   viewer; abort traces show host-renderer/Node call sites but change collection
   behavior. Use those source line/column groups and a bounded diagnostic that
   does not strongly retain targets/callbacks. The weak trace records reachability,
   not whether a listener was removed. Do not claim exclusive attribution or
   change product lifetime from these samples. Reproduce plain failures afterward.
4. **Node symptom has an independent host control.** Fifteen host-only inactivity
   samples retain exactly 14 additional `ClusterView` DOM nodes, no other sampled
   DOM class growth and no listener growth. An uninstrumented repetition has the
   same +14 nodes. Some paths pass through NonInjectedClusterView/MobX computed
   observers, others through the host iframe tree. No extension viewer is mounted
   in that control. This identifies host-side retention for that per-inactivity
   node symptom, not all RSS/listener growth. Do not patch the pinned host or
   subtract host growth from a failed acceptance sample without an accepted
   measurement decision. If the remaining host-only limitation requires a policy
   change, record the exact planning question locally instead of adopting one.
5. **Tools and evidence.** `listener-census.mjs` captures types/target classes and
   handler script locations without source/values; `listener-heap.mjs` captures
   sanitized native IDs/counts/paths and always deletes raw private heaps;
   `listener-signals.mjs` optionally traces new AbortSignal registrations with
   weak refs and restores methods. Caps fail rather than silently dropping data.
   `FIND_CONTROL_SCENARIOS=host-idle` minimizes navigation. Capture labels repeat:
   use a fresh evidence run name and owned profile/fixture, or a separate evidence
   directory for controls in the same proven host, as the report describes.
6. **Other Host/native gates remain.** The prior current-package subset passes
   33 state, 13 held, 192 source/geometry, terminal-Q/dense cadence, following/Pause,
   actual extension maintenance, SDK/frame ownership, timeout and bursts. An exact full-5-MiB installed response fixture is also still distinct from
   this continuation's near-bound single source. Full
   remaining snapshot/profile/restart/duplicate/stale-target/viewer counterparts
   remain distinct from older named-artifact evidence. Native editing/selection/
   clipboard, OS shortcuts/IME/AltGraph/menus/focus/windows, stock-output and long
   duration plateau, and all Windows/macOS gates stay unverified. Background
   probes and composition stand-ins do not close them. No release acceptance.
7. **Checks and ownership.** Final pinned locked install/typecheck, 249 tests, six
   UI guards, production browser, actual workers, original resource smoke, strict
   package checks and equal two-build SHA pass. Independent reviews use the new
   recorded baseline and original requirements first (`fork_turns=none`). This
   host has 466 actual starts/exits, peak one and zero service maps/watch at
   shutdown. The host/profile/private runtime and UID-checked namespace are gone;
   user settings/glossary/docs hashes match fresh before-run hashes. Private
   build/cache and unrelated scratch/user work stay. Create new owned resources.
8. **Desktop and reporting.** Use private labwc→Hyprland workspace 7 and the
   documented private Aquamarine diagnostic only for autonomous DOM work. Leave
   FREELENS_UI_MODE unset and guards intact: no user window maintenance, native
   input, pointer/clipboard operations, bringToFront or fake focus. Current real
   observer has zero focus/workspace/window transitions; pointer equality is
   endpoint-only. Complete independent work before fresh native/platform gates.
   Preserve original acceptance text; check only wholly satisfied criteria.
   Commit only #48 work/evidence before reporting. Retry while concrete autonomous
   work remains; blocked for precise missing human/access/decision/evidence gates;
   done requires every original criterion and its committed evidence.
