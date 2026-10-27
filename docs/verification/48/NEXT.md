# Continue only Find #48

Branch: `implementation/find`. Original fixed/review baseline:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`. Read this checkpoint's README/matrix,
local #48, accepted cached plan and full decisions. Reclaim #48 before work;
revalidate live corrections. Do not work on another ticket or publish anything.

1. **Investigate the failed mounted-resource gate first.** Current main/renderer/
   worker bytes equal #47's integrated package; no production code was changed.
   `host/mounted-soak.json` has three warmups + six samples per dense and long
   bound, actual post-GC teardown metrics, lifecycle cleanup passes and retained
   DOM/listener/heap/RSS growth. `host/installed-sdk-soak.json` separately has 20
   measured SDK cycles per bound with stable DOM/listeners, zero remaining worker
   resources, small heap growth and fixed threads. Do not call mounted cleanup
   assertions a resource pass. Isolate production vs actual Freelens vs inspector
   and screenshot retention. Useful controls: clear DevTools console entries,
   release inspector object handles, reconnect the inspector after each cycle,
   compare a fresh isolated host without screenshot pumping and without viewer
   mount, and collect heap retainers/detached-node ownership. These are hypotheses,
   not diagnosed causes. Keep original failing samples. The owned namespace/profile
   are removed at checkpoint cleanup; recreate using `fixtures.py` and `prepare.py`.
2. **Private rendering environment needs a real frame cadence.** Original NVIDIA
   nested Hyprland initializes only a 0×0 output with GBM allocation failures;
   rAF stalls until CDP screenshot. Host DOM assertions therefore explicitly use
   screenshot-driven frames. AMD renderD128/Mesa setup attempts initialized buffers
   but did not reach Hyprland IPC. Their logs/desktop observations are retained.
   Do not fake document focus, bypass guards, or activate the user's desktop.
   A working separate session is allowed; keep all display operations confined
   to validated private runtime/socket/workspace 7. No product fallback is approved.
3. Complete real installed-host counterparts still partial/unperformed in
   `matrix.md`: D03 initial Previous; D06 native event transactions at DOM seam;
   D10 mode refinement and history recall/flags/ranges/marks; D11/D14 held completions and Clear/dismissal;
   D12 full seed-source/invalid selection matrix; D13/trace 8/9/12 real append,
   duplicate overlap, eviction, profile maintenance and observed repeated restarts;
   D15 actual measured widths/wrap/layout/group cycling/current geometry/following.
   Use only owned fixture resources. Read-only existing cluster fixtures may be
   observed; never mutate or remove them. Existing pure/production-Chromium tests
   in `../47/coverage.md` provide the original cases and assertions, not host proof.
   The original `viewer.mjs` type-then-immediately-toggle probe observed `0 of 1`.
   #37 requires toggles to refine, not maintenance. An interim assertion accepting
   zero was reverted after Spec review. First wait for actual initial logs, Pause
   to remove snapshot timing as a confound, then type/toggle independently and
   assert inclusive seek/candidate retention. The zero observation is unresolved,
   not a policy change or diagnosed production defect. Keep raw failures.
4. TDD at the already-authorized public matching/state/session/production-renderer
   seams if a production defect is established. Preserve accepted exact counts,
   native source selection, occurrence/epoch and asynchronous intents. Do not
   silently revise an accepted mechanism or substitute a fallback. Re-run pinned
   typecheck/focused tests regularly and full appropriate checks after a fix.
5. After independent implementation/evidence work, explicitly account for physical
   input/clipboard/native menus/IME/AltGraph/window delivery and Windows/macOS.
   No native input or system clipboard was accessed here. Earlier attended approval
   is inapplicable. These require a fresh agreed session or truly isolated graphical
   session/access and must never be satisfied by DOM events or Linux stand-ins.
6. Code-review has two independent axes pinned to the recorded original HEAD;
   include the current ticket diff if uncommitted. Preserve user dirty work. Commit
   only #48 work/evidence/local satisfied checkboxes. Report retry while concrete
   autonomous work remains; report blocked for exact evidence/access/decision gates
   after independent work. Done requires all original criteria satisfied.

Host reproduction scripts default to historical #42 paths. Always export
`FIND_HOST_TICKET=48` for this ticket and keep `FREELENS_UI_MODE` unset. Prepare,
launch, install through the real Extensions form once, then install the observer
before searching. Supervise display/host long-lived commands separately. Fresh
main window before any cluster is required for Disable/Uninstall maintenance.
The original `observer.cjs` wraps the actual Node Worker to log starts/exits; it
never replaces worker code/clock/results. `private-session.mjs`/CDP verify process,
profile, private socket/runtime and workspace membership. Existing shared guards
remain in place. Clean only the recorded owned app/compositors/profile/runtime
and UID-checked fixture namespace; never the user's profile, clipboard or windows.
