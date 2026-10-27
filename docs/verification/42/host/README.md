# #42: production SDK and worker lifecycle verification

This continuation completes the actual Linux host evidence for **Run literal Find
through owned, cancellable workers**. Production implementation is unchanged from
`623792be8f5bbfe5623642dc0fe1649c0ff5fff4`, this continuation's recorded HEAD and
review fixed point. Earlier #42 checkpoints and their test evidence remain under
[initial implementation](../README.md) and [renderer/SDK continuation](../continuation/README.md).
The original ticket baseline is `50bfc2e3999d5079ca9ca8e8698df3c158cf24a9`.

Selected #42 as the lowest eligible unfinished ticket; local #41 is done.
Claimed with `gh issue edit 42 --add-assignee @me`. Live full #42 and #36/#37/#38/#40
comments were fetched: their bodies/comments match the cached authority. Read the
accepted literal-only plan at `d02b7e7c19c8e48b1cde714f0a23813b40374824`, its state
traces and reviewed design. No GitHub comments, closure, push, PR, merge or release.

## Actual boundary and evidence

The **unchanged packed production main/renderer/worker** is installed through the
actual Extensions form in Freelens 1.10.3, Electron 41.10.0 / Node 24.18.0.
[Installed package and host hashes](installed-package.json) and
[host/runtime identity](identity.json) identify the artifact. Package/store remains
`freelens-readable-logs@0.1.34`, config/page `readable-logs`, schema 3. Main reads
`out/find-worker-0.1.34.js` relative to its installed entry while host CWD is
`/home/max`. Both package installs use one form submission, without overwrite or
a post-install restart. The isolated settings file is beneath its own userData
`extension-store/freelens-readable-logs/readable-logs.json`.

Positive results use the production renderer instance's **actual SDK client** and
production handlers. Root and real cluster iframe share webContents but have
different process/routing identities. A separate Node/Electron inspector observes
the existing production instances, owner maps, slots and listeners. A diagnostic
Worker subclass records actual creation/exit without substituting the worker
program, service, matcher, request data or clock. Inspector auto-attachment pauses
the actual worker before ready for controlled startup tests. No generic main
bridge produces matching replies; no production diagnostic endpoint, CSP change,
worker fallback, package patch or service double is used.

| Requirement / check | Evidence and result |
| --- | --- |
| Packed worker via real SDK; both frames | [SDK suite](sdk-suite.json): bidirectional foreign-token rejection; equal sender and distinct actual frame routing IDs; all four literal flag combinations; exact 1,000-record / **5 MiB** `retainSnapshot` fixture; 4,096 ranges with truthful incomplete coverage. |
| Worker reuse, inactivity, startup replacement | Same suite checks idle reuse, no eager restart on becoming active, actual exit before same-viewer replacement, rejection of retired token and recovery. |
| Actual frame destruction | Removing the real owning cluster iframe releases its idle worker, binding, sender listeners and sweep; the independent root owner still searches. Reattaching produces a new real frame. No fabricated frame tree or frame-deleted event. |
| Controlled timeout including startup | [Startup stall](startup-timeout.json): actual worker held before ready by Node inspector; production 1,000 ms supervisor returns timeout, real worker exits, explicit current request recovers. Elapsed time is one observation, not a hard latency guarantee. Controlled fake-worker tests separately cover late exit and replacement while exit is withheld. |
| Production mounted viewer | [Viewer](mounted-host-viewer.json): real fixture logs and production input/flags produce 1 of 1; switching to Extensions releases the worker while preserving query/flags; returning preserves them and automatic updates; leaving the page releases its owner. No physical input/IME/clipboard claim. |
| Disable / reactivation / Uninstall / reinstall | [Lifecycle](extension-lifecycle.json): actual Disable during paused startup, Enable, Uninstall with an idle reusable worker, one-submission reinstall and successful new matching. Actual exit, zero service owners/openings/retirements/senders/sweep and removed before-quit listener/SDK handlers are observed. Old SDK invokes fail with `No handler registered`. |
| Latest-only replacement / repeated cleanup | [Churn](actual-host-churn.json): 20 cycles of 20 actual SDK requests; only newest reply survives each burst; peak one worker, real exit before return from inactivity, no pending/running descriptor afterward; final zero owners/listeners/sweep. This short run is not long-term installed-host resource acceptance. |
| Native window closure in separate session | [Window destruction](native-window-close.json): actual owning BrowserWindow destroyed with an idle worker; no windows/workers/owners/sweep/sender binding remain. This is Electron window destruction, not physical close-button delivery. |
| App shutdown during startup | [Shutdown](shutdown-startup.json), [cleanup boundary](shutdown-clean.json), [final assertion](shutdown-result.json): production before-quit awaits actual exit and service disposal. SDK handlers still exist at the earlier will-quit observer and are gone at **process exit**. The app PID exits. |
| Focus/workspace/pointer preservation | [Desktop summary](desktop-summary.json), [continuous raw observation](real-desktop.json.gz). All display mutations target a distinct private socket/runtime; no test window enters the user's compositor. Same before/after active window, workspace, pointer and client list. Raw events are retained; repeated reports of the same active address are not called zero events. No pointer, focus, clipboard, native input or user-window operation is sent. |

The separate graphical stack is checksum-verified local **labwc 0.20.2 /
wlroots 0.20.2 → installed Hyprland → installed Freelens**, entirely off-screen.
Its private workspace is 7. HOME, host CSP and system configuration are unchanged;
XDG runtime/config/cache and `FREELENS_INTEGRATION_TESTING_DIR` are owned private
paths. `FREELENS_UI_MODE` stays unset. Existing shared guards are unchanged;
`Page.bringToFront` remains guarded. Native destruction/shutdown additionally
verify the recorded PID, private Wayland socket, distinct compositor and workspace.

This continuation adds verification at the previously accepted real SDK/frame
and lifecycle seams. The earlier matcher/client/scheduler TDD remains recorded
in the checkpoint reports. No production defect or production change required
a new red/green implementation slice here.

## Commands and regression checks

From `/home/max/work/freelens-json-logs`:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-client.test.ts tests/find-service.test.ts tests/find-execution.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node scripts/verify-find-execution.mjs
node scripts/verify-find-identity.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node scripts/verify-find-resources.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/42/host/package-sha256.txt
```

Locked install, typecheck, **23 focused** execution/client/service tests, **226 full tests**, six desktop
policy tests, 16 grouped mounted production-renderer checks, actual worker scheduler, adapted
resource checks, strict package and two-build reproducibility pass. Exact output:
[locked install](npm-ci.txt), [typecheck](typecheck.txt.gz), [focused](focused-tests.txt), [full](full-tests.txt),
[desktop guards](ui-guards.txt), [scheduler](actual-worker.json),
[mounted renderer](mounted-renderer.txt), [resources](resource-smoke.txt),
[package](package-check.txt), [hash](package-sha256.txt),
[reproducibility](reproducibility.txt).

**The original unintegrated smoke command still fails**, as at the previous
checkpoint: its pre-existing Electron double has no `app.on` shutdown hook.
[Failure output](original-smoke.txt). The disposable `verify-find-resources.mjs`
adapter retains every existing workload/threshold/assertion and runs the actual
production main/worker with corrected doubles: 40 core/main and mounted-renderer
cycles; 40 actual worker starts/exits, peak one, zero remaining workers/sender/app
listeners. #47 explicitly owns integration of the original smoke/CI/dependency
work. Those user files retain their original bytes. The adapter pass is not a
claim that the original smoke command passes, or installed-host soak evidence.

## Reproducing actual-host checks

Read `docs/agents/ui-verification.md`. These tools **refuse other debug ports,
profile identity and process/display mismatches**. They do not target the user's
installed host. Run long-lived display/host commands in separate supervised
terminals; keep `FREELENS_UI_MODE` unset. `prepare.py` copies only the existing
read-only fixture context privately and never modifies cluster resources.

```sh
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/viewer.mjs
node scripts/find-production-host/suite.mjs
node scripts/find-production-host/timeout.mjs
node scripts/find-production-host/quit.mjs
# Wait for app exit; fresh main window before Extensions maintenance.
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/lifecycle.mjs
node scripts/find-production-host/churn.mjs
node scripts/find-production-host/window-close.mjs
node scripts/find-production-host/quit.mjs
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/shutdown.mjs
```

Check actual app exit and `shutdown-result.json` conditions against the will-quit
and final process-exit records. Then create `.scratch/find/42-host/stop` and wait
for both private compositors to exit. Remove only the recorded owned private
profile/runtime and its credentials. The original package downloads are verified
against [recorded repository hashes](display-packages.json), extracted locally,
and never installed globally. The initial ad-hoc commands used equivalent saved
CDP probe bodies before they were collected into these scripts.

## Failures, preservation and limits

Initial setup placed integration data outside `/tmp`, which caused host discovery
to observe the user extension directory. The extension was disabled; no install,
activation or maintenance was performed there. That private app was stopped and
the path corrected before production checks. The corrected host log proves
private extension discovery. Earlier raw fixture sizing, host menu label, stale
observer reference after reactivation, page/activation precondition and shutdown-driver quoting failures are
retained in `*-error.json`; they are harness failures, not passing checks. Their
owned state was cleaned before rerunning. Review also caught maintenance after cluster use;
that initial cleanup experiment is retained as `extension-lifecycle-initial.json`,
and supported maintenance is rerun in a fresh main window with no cluster frame.
The driver now waits for actual renderer activation and fails on a non-fresh
maintenance session. An initially lingering built-in WebSocket connection after
completed setup was stopped by its exact owned driver PID; the driver now uses
the already locked development-tree `ws` transport and closes its connections
explicitly. Raw host/compositor logs and desktop event streams are losslessly compressed
with `gzip -n -9`; use `gzip -dc` to inspect their exact bytes.
[Final cleanup](cleanup.json) confirms all owned app/compositor PIDs are absent,
private runtime/profile and credentials are removed, and user files match the
recorded final-interval baseline. No production defect was found.

[Prestart preservation](prestart-preservation.json) confirms exact hashes of all
six dirty tracked files. Untracked design, smoke, scratch and Ralph work is
preserved and excluded. Only this ticket's scripts/report/evidence and local
acceptance updates are staged. Builds use the dirty user inputs and are not a
clean release checkout. User installation/settings hashes are compared for the
final acceptance interval; no before-hash claim is made for the initial setup.

Independent two-axis review is recorded in [review.md](review.md), pinned to the
pre-continuation HEAD above, including this uncommitted ticket diff.

Physical keyboard/IME/AltGraph, pointer selection, system clipboard, actual user
close-button delivery, Windows/macOS, later highlighting/geometry/state slices,
long installed-host RAM/disk soak and complete Find/release acceptance remain
unverified downstream gates. This completes #42's implementation/SDK/lifecycle
slice, not release acceptance.
