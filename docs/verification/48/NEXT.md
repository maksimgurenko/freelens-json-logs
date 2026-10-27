# Continue only Find #48

Branch `implementation/find`. Original pre-ticket review baseline
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`; latest continuation started at
`b740e7d1c407162d93809c43ea65b8f4e4fb436e`. Read local #48, the accepted cached
plan/full decisions, README, matrix and **continuation.md**. Reclaim #48 and fetch
live corrections before work. Do not choose another ticket or publish anything.

1. **Resource gate is minimized but still failed.** In `host/dom-continuation/`,
   `retention-controls.json` runs three 120-record cycles each of mount-only,
   Find, and inactivity. No screenshots; console cleared and inspector query
   handles released. All three retain detached sections (+1,438 nodes/+143
   listeners per mount-only cycle). `retaining-paths.json` captures shortest
   non-weak paths through HTMLDocument → ScriptedAnimationController → native
   queue → detached records scroller. This is a concrete native-queue retainer,
   not proof that it is the only retainer or a production leak diagnosis. The
   original dense/long mounted failure remains a release gate. Reproduce with a
   **working private graphical output and actual frame cadence** before changing
   product disposal or accepting resources. A native lifecycle queue in a 0×0
   display may explain delayed reclamation, but that causal prediction is untested.
   The final `retention-controls.mjs` exits nonzero on growth; heap-retainers.mjs
   saves only paths and deletes its scratch heap. Do not commit raw heaps/profile.
2. **Private-display limitation.** Default NVIDIA nested Hyprland has 0×0 output,
   GBM buffer allocation failure and queued native scroll/lifecycle events.
   Screenshots drive some rAF work but do not repair natural cadence. A new
   `FIND_DISPLAY_RENDERER=mesa` diagnostic removes inherited NVIDIA GBM/GLX/VA
   variables, forces Mesa EGL and `/dev/dri/renderD128` for headless labwc.
   `host/mesa-clean/hyprland-internal.log.gz` gets as far as successful 1920×1080
   linear swapchain allocation, then no Hyprland IPC in 15 s. All owned processes
   stopped. This is a failed environment, not a fallback. Investigate readiness
   against the private display only; keep the real desktop untouched. No product
   mechanism was invalidated and no workaround approved.
3. **New stable Host DOM state coverage is complete for its scope.**
   `state-acceptance.mjs` waits for a real 120-record initial snapshot, Pauses,
   and passes 33 checks. Both modes refine/retain candidates correctly, including
   after navigation; history recalls text/flags. Initial Previous, partial paste,
   cut, Undo/Redo, select-all composition, zero/one hit, selected-message seed,
   existing-query/label/multi-record rejection, async Clear and current counts
   after inspector dismissal pass. No production defect/fix was needed. Do not
   reinstate the old zero-ordinal assertion or mode-maintenance interpretation.
   No-scroll uses an explicitly dispatched DOM scroll event because native scroll
   delivery stalls. This is DOM-seam evidence, never physical/native acceptance.
4. **Remaining autonomous Host matrix:** actual snapshot append/retention/duplicate
   mapping and eviction, profile no-fetch/no-seek maintenance, repeated observed
   restarts including Pause; held mounted current/stale successes/failures,
   timeout/edit/Retry and decoration failure; complete inspector/foreign/multiline/
   Unicode-length selection-seed matrix; measured 260/390/700/1440 widths, wrap,
   fonts/layout/grouped-mark cycling/current geometry and ordinary following.
   Core/mounted Chromium checks in ../47/coverage.md pass; they are not Host proof.
   Use only newly owned namespace/Pod/profile data. Shared fixtures are read-only.
5. TDD at already-authorized public matching/state/session/production-renderer
   seams if a real production defect is established. Preserve exact counts/copy,
   occurrence/epoch and independent async intent contracts. Do not silently revise
   the chosen mechanism or add a fallback. Use project-local Node 24.18.0/npm
   11.16.0; typecheck/focused tests regularly, full appropriate checks after work.
6. Physical keyboard/pointer selection, clipboard, native paste/Undo/Redo/IME/
   AltGraph, exact modifiers/menus/focus and physical window-button delivery remain
   **unverified**, as do Windows/macOS matching/worker/package and native checks.
   Fresh attended agreement or a suitable truly separate graphical session/access
   is required; DOM events and Linux stand-ins cannot fill those cells. No prior
   attended approval applies. Do independent Host work before seeking attendance.
7. Required independent two-axis code-review is authorized, `fork_turns=none` with
   original requirements/artifacts and read-only scope. Pin to recorded pre-ticket
   HEAD and include current ticket diff. Commit only #48 work/evidence/local
   satisfied checkboxes. Retry while concrete autonomous work remains; blocked
   only for precise evidence/access/decision gates after independent work. Done
   requires every original criterion and a committed evidence/checkbox update.

Use `FIND_HOST_TICKET=48`, a **new** safe `FIND_HOST_RUN` name for evidence, and
keep `FREELENS_UI_MODE` unset. Scratch remains `.scratch/find/48-host`; the optional
run subdirectory separates evidence, not simultaneous hosts/profiles. Prepare a
new private profile/fixtures after cleanup; run display/launch as supervised
long-lived commands. Install through the real Extensions form once before opening
clusters, then install observer.cjs. Fresh main window is required for maintenance.
The observer wraps the real Worker for starts/exits without changing code/results.

Cleanup removed the owned namespace, isolated app/profile and private runtimes;
recreate rather than relying on old PIDs/session.json. Keep user config/extension,
shared fixtures, real workspace/focus/pointer unchanged. Never fake document focus,
raise windows, inject native input, access clipboard, or bypass the shared guards.
