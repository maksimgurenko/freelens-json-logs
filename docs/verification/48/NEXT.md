# Continue only Find #48

Branch `implementation/find`. Original ticket fixed point:
`3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`; latest continuation/review baseline:
`f8d7643e8d6cda3abac8ee4769403d49b0278818`. Record the new current HEAD before
any next implementation/review. Reclaim #48 and fetch live full corrections.
Read the local ticket, accepted cached plan/full #36/#37/#38/#40 decisions,
[geometry.md](geometry.md), [matrix.md](matrix.md) and [snapshots.md](snapshots.md).
No other ticket, comments, closure, push, PR, merge or release is authorized.

1. **Current artifact and implementation.** Package SHA-256 is
   `d19f826bc8496a6ae3ca5afaeb79fab73753ceeebde62747174b8d4ead6dfcb3`,
   `freelens-readable-logs@0.1.34`. The existing clipping fix remains. New
   `FindMarks` cycling progress survives regrouping and pending maintenance while
   its occurrence survives. Query revision/context changes reset it; no matching,
   worker, source/copy, parsing, profile, acquisition, Pause or following contract
   is changed. Two production-browser red/green regressions cover resize and
   maintenance. Do not merge prototype/research code or introduce a fallback.
2. **The earlier dense cadence/stalled run still needs diagnosis.** The earlier
   `host/group-final` run advances through 0–9, stalls, observes about 96% renderer
   CPU and fails natural cadence (**9/61** frames in three seconds). It requires
   a forced private-host stop. This remains failed evidence; attribution to
   product/layout/host/private compositor is unresolved. A separate bounded
   `host/bounded-final` run failed at click19 because its *oracle* was wrong:
   previous row 18 is absent from the current group 0–17, so actual 0 is correct.
   Never reinterpret that as a confirmed product mismatch. Independent review
   corrected the oracle to use current ordered membership; the fresh corrected
   run under `host/review-oracle` passes six scoped DOM assertions with 37
   activations. That does not erase the earlier cadence failure. Its exact old
   async-rAF harness is retained as `host/group-final/stalled-harness.mjs.gz` with
   a source identity; expand it beside the driver under a new owned filename for
   reproduction, never overwrite the current harness. Inspect all limits first.
   Node-side polling replaces an unbounded async rAF test loop; atomic readiness/
   click observations avoid earlier pending/null-control races. This is a driver
   correction, not a change to production timing or native evidence.
3. **Other autonomous Host matrix gates remain.** Exact identical-transport-line
   duplicate windows; missing/count-then-ID metadata; held stale window/message/
   instance successes and failures; still-matching profile candidates and Profiles
   pending-reveal cancellation; Whole words enabled before restart and both flags
   reset afterward; explicit following status/movement across restart; complete
   host history/one-layer dismissal/foreign-editor/seed-mode preservation. Recheck
   current-package original inclusive-origin/row-zero and independent keyboard
   reading-row/inspector traces where only older artifacts have Host evidence.
   DOM-delivery checks remain distinct from real physical input.
4. **Current positive subsets are explicit, not whole-ticket acceptance.**
   `host/group-final/surfaces.json` passes 192 assertions (including fixture and
   Range preconditions) for inspector sources in Inline/Side/Bottom, Unicode
   length/separators, provenance, CSS widths 260/390/700/1440, fonts, expanded/hidden
   rows, current geometry and retained selection. `host/bounded-final` passes six
   independent real append/following/Pause checks; state 33, held delivery 13,
   terminal-Q, SDK/frame 10, startup timeout/actual exit, cancellation 20,
   fresh-main Disable/Uninstall/reactivation, normal startup shutdown and short
   mounted resources. Dense/long soaks have three warmups/six measured cycles per
   bound with +5 nodes/zero listener growth each. These do not establish long
   RAM/disk plateau, dense interaction/native latency or stock-display acceptance.
5. **Private environment remains diagnostic.** Stock NVIDIA nested output is 0×0;
   stock Mesa failed readiness. `cadence.md` records the private Aquamarine v0.15.1
   patch/build and checksum-verified private prerequisites. It provides a real
   1280×720 output in a separate labwc→Hyprland workspace 7, but is not a stock
   compositor acceptance environment. Reuse the exact documented private build
   for autonomous Host DOM work, or establish an unmodified suitable output.
   Do not fake focus, pump screenshots into native evidence or operate the user's
   desktop. Keep `FREELENS_UI_MODE` unset and obey UI guards.
6. **Physical/platform gates are unverified.** Fresh explicitly attended agreement
   or appropriate separate graphical access is needed for physical selection,
   clipboard, editing/paste/Undo/Redo/IME/AltGraph, modifiers, menus, OS focus and
   physical window-button delivery. Windows/macOS matching/worker/package and
   native checks remain unverified. Earlier approval never carries forward.
   Finish independent Host work first; when only missing human/access/evidence
   gates remain, report blocked precisely. Background DOM is not a substitute.
7. **Checks/review/commit.** Use project-local Node 24.18.0/npm 11.16.0. TDD remains
   authorized at matching/state/session/production-renderer seams for proven
   defects. Preserve the accepted literal-only, occurrence/epoch, separate intent,
   complete count/exact copy and Pause/following contracts. Final results and
   commands are in `host/bounded-final/checks.json`; earlier failed browser logs
   remain. Browser tests permit current covering-range reuse and await current
   measured geometry while retaining late-source/membership/coordinate assertions.
   Run appropriate focused/full checks after new changes. Independent two-axis
   code-review is authorized with `fork_turns=none`, original requirements and
   recorded baseline plus current diff. Commit only #48 work/evidence. Retry while
   concrete autonomous work remains; done requires every original criterion.

Use `FIND_HOST_TICKET=48`, a **new** safe `FIND_HOST_RUN` and new owned fixtures.
Scratch remains `.scratch/find/48-host`; old run names/PIDs/profiles/namespaces are
not reusable ownership. Prepare a fresh private profile and install once through
Extensions **before any cluster**, then attach the passive Worker observer.
Changed product bytes at the same version require a fresh process/profile.
`marks-following.mjs` supports `FIND_HOST_SCENARIO=groups|following|both`; following
appends to its owned surface fixture, so recreate it before repeating that case.
Only remove resources whose stored ownership/UID checks still match. Preserve
user configuration, package installation, shared fixtures and unrelated work.
