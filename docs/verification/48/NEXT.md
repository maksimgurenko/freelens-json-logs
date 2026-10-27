# Continue only Find #48

Branch `implementation/find`. Original ticket pin:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Latest continuation/review baseline:
`0f39b79dc27076323a53f47f7aab209801b8022f`; record the **new current HEAD** before
any next implementation and use it for that continuation review. Reclaim #48 and
fetch full live corrections. Read the local ticket, cached accepted plan and full
#36/#37/#38/#40 decisions, [dense-cadence.md](dense-cadence.md), [matrix.md](matrix.md)
and earlier state reports. Only #48 is authorized. No comments/closure, push,
PR, merge or release. Do not work on another ticket.

1. **Current artifact/fix.** `freelens-readable-logs@0.1.34`, SHA-256
   `995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
   Stable package/store, page/config and schema 3 remain. Main/worker unchanged;
   renderer now reserves a compact, responsive highlight-status footprint while
   Find is open. Pending/completed/capped feedback cannot drive the prior clip
   oscillation. Source nodes, exact matching/counts, copy, retention and lifecycle
   contracts are unchanged. Do not revert the fix or merge research/prototypes.
2. **Concrete next autonomous task: attribute the repeated +9 listener failure.**
   Final actual-host `host/feedback-final/mounted-soak-clean-inspector.json.gz` has
   three warmups and 30 measured cycles per bound, natural frames, 100 ms inactive
   waits. Lifecycle/actual exits/settings pass, but dense post-GC listener growth
   is **+9 against +8**, nodes +51 and heap +1,862,708 B. Long +19 nodes/-1 listener.
   An earlier long-reserve package independently fails +9; intermediate compact
   package passes 30 cycles. Raw runs, summaries and commands remain separate.
   Read diagnosing-bugs. Capture sanitized listener **types/targets/retainers at
   the actual low/high samples**, not just totals. Add one-variable controls:
   root/cluster inactivity with a viewer but no Find, then host-only inactivity
   without an extension viewer. Compare with the existing stationary/host-route/
   viewer-no-Find/viewer-Find/viewer-Find-idle controls. No threshold relaxation,
   speculative lifetime change or claim that a passing control clears a failure.
3. **Node control is a lead, not yet a deterministic leak.** Intermediate
   `host/compact-final/navigation-control.json.gz` has +14 DOM nodes/15 Find-idle
   cycles and zero listener growth; stationary/route/no-Find/Find are flat.
   Final repetition is 0/-2/+9/-9/+5 nodes, listeners 0/0/+1/-1/-1. Transient host
   objects remain a competing explanation. Earlier sanitized heap capture finds
   zero detached viewer sections, which does not rule out other retained nodes.
   Remove raw private heaps after extracting sanitized paths. Do not preserve
   credentials or source-text heaps in Git. Existing controlled state/session/
   renderer seams are authorized for TDD once a real defect is isolated.
4. **Current artifact evidence.** `host/feedback-final` passes 33 DOM state,
   13 held-delivery, 192 source/geometry assertions (including 260px usable log
   height), terminal-Q, no-query/zero-hit/dense natural cadence (~186 ms/12 dense
   frames, two layouts), three initial group members, six append/following/Pause
   assertions, fresh-main Disable/Uninstall/reinstall, SDK/frame ownership,
   startup-inclusive timeout, 20 latest-only bursts and startup shutdown. Actual
   worker starts/exits **219/219**, peak one, zero maps/watch at shutdown. These
   are scoped DOM/SDK checks, not native delivery. Full current-package snapshot/
   profile/restart/duplicate and stale target/viewer counterparts remain separate
   from older named-artifact runs; do not relabel those as this package.
5. **Tools/checks/review.** Use project-local Node 24.18.0/npm 11.16.0. Latest full
   locked install/typecheck, 249 tests, six UI guards, production browser, actual
   built workers, original resource smoke, strict package and two-build SHA pass.
   Focused range tests also pass. Independent two-axis review uses the recorded
   baseline plus current scoped diff, original requirements first, `fork_turns=none`.
   Existing optional host-control duplication does not require an unrelated refactor.
6. **Private/native/platform gates.** Use the documented private labwc→Hyprland
   workspace 7 and private Aquamarine diagnostic build only for autonomous DOM
   work. Stock output remains unestablished. Keep `FREELENS_UI_MODE` unset and
   shared guards intact; no user-window activation/restart/restore/minimize, native
   input, pointer movement, clipboard operation, bringToFront or fake focus.
   Background document focus is false. Focus-dependent Escape/shortcuts/menu/
   foreign-editor delivery remains unverified, as do physical selection/copy,
   paste/Undo/Redo/IME/AltGraph/modifiers/focus/window delivery and all listed
   Windows/macOS checks. Finish independent work before seeking fresh attended or
   suitable separate native/platform evidence. No release acceptance is implied.
7. **Ownership and reporting.** All four test hosts/profiles, private runtime and
   both UID-checked namespaces are removed; private build/cache and unrelated
   scratch/user work remain. Create a fresh safe `FIND_HOST_RUN`, profile and
   owned fixtures. Install once through Extensions before opening any cluster;
   same-version changed bytes require a fresh process/profile. Following appends
   to the surface fixture, so rerun surface tests only with new owned data.
   Preserve original acceptance text and check only whole satisfied criteria.
   Commit only #48 implementation/evidence. Report retry while concrete autonomous
   work remains; blocked when only precise human/access/evidence gates remain;
   done requires every original criterion and committed evidence.
