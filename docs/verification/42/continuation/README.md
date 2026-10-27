# #42 continuation: SDK ownership and asynchronous production Find

**Ticket remains incomplete. Report retry, not done.** This continuation wires
production input/Match case/Whole words to the main-owned worker and adds automated
boundary evidence. The remaining original acceptance gate is actual production
Freelens SDK/frame/lifecycle verification. No installed-host, native input,
Windows/macOS or release acceptance is claimed.

Branch `implementation/find`; pre-continuation HEAD/review fixed point
`67b1d5e0bf3eea07e1e8762bbb7f3849cc106203`. The original ticket implementation
baseline remains `50bfc2e3999d5079ca9ca8e8698df3c158cf24a9`.
Selected the lowest eligible unfinished ticket **#42: Run literal Find through
owned, cancellable workers**, whose local #41 blocker is done. Reclaimed before
implementation with `gh issue edit 42 --add-assignee @me`. Live #42 and full
#36/#37/#38/#40 comments were fetched. Cached decision bodies/comments match live
content exactly. Read the accepted plan at `d02b7e7c19c8e48b1cde714f0a23813b40374824`
and reviewed design at `a774370c71193b4e3603bab9eee83189fb38c67b`, applying the
literal-only/black-canvas/no-counter corrections. Research/prototype worktrees
were read as evidence only.

## Implemented behavior and evidence

| Original criterion | Implementation / available evidence |
| --- | --- |
| 1. Production input/two flags | `src/renderer/find-client.ts`, Viewer and entry lifecycle use extension-scoped SDK RPC. `src/main.ts` binds the actual invoke event to FindService. Exact, untrimmed query; two flags initially off/reset by instance; no regex control or synchronous production matcher. Mounted real bundles exercise all four combinations and literal punctuation. |
| 2–3. Pure semantics/provenance/ranges | Original checkpoint matcher/protocol retained. Existing Unicode, original-neighbor, fragment, count, cap, 1,000-line / 5 MiB fixtures stay green. Actual packed-main requests exercise the same trusted worker and original offsets. No decoration rendering is claimed; #45 owns that UI. |
| 4. Validation/ownership/identity | `FindService` binds opaque tokens to actual RPC sender and captured process/routing identity, rechecks current public frame-tree membership, rejects foreign/disposed owners and same-frame document navigation, and retires same-viewer replacements only after actual exit. Renderer validates complete reply identity/content and ignores stale success/failure. Public-interface tests cover every input-key dimension. Tests of SDK/Electron identities are stand-ins here; actual-host proof remains under criterion 9. |
| 5. Bounded execution | Existing main scheduler still owns one reusable worker, one running operation and newest input/interest. New registry/client preserve those limits across supersession, inactive state, owner replacement and disposal. Actual worker tests and resource runs observe real starts/exits. |
| 6. Pending/limits/deadline | Renderer feedback/expiry timers start before SDK registration/dispatch. Pending disables navigation immediately; Searching appears after 100 ms; 1,000 ms expires registration/startup/dispatch together. Main retains its independent startup supervisor. Controlled clocks, delayed mounted replies and oversize no-dispatch checks pass. |
| 7. Recovery/separate permissions | Timeout/SDK/worker failure latches; maintenance/Refresh cannot retry. Explicit edit/mode/Retry uses current inputs. Retry has no selection/reveal permission. Counts can settle after dismissal without choosing/revealing a result. Clear, inspection dismissal, Profiles, inactivity, context changes and manual scrolling invalidate old reveal permission. Exact matching state is independent of range operations; full decoration presentation remains #45. |
| 8. Trusted packed worker | Main reads `find-worker-<version>.js` relative to its installed `__dirname` inside supervised startup and passes trusted bytes to `Worker(..., {eval:true})`. Strict package checks now also execute the real unpacked main/worker from a non-checkout CWD. Host pinning, allowlists, schema and stable identities remain intact. |
| 9. Lifecycle / remaining gate | Pure/fake SDK boundaries cover foreign sender/frame, frame membership removal, navigation/process loss, inactive/startup/idle workers, same-frame replacement, closure and idempotent awaited disposal. The unpacked production main check has 4 real worker starts/exits, peak 1, no workers/owner listeners after cleanup. **Actual Freelens SDK/frame removal, real Disable/Uninstall/reactivation, native window close and app-shutdown proof is not performed.** |

TDD followed the already accepted SDK ownership and matching-client seams. Initial
missing-module failures are [service-red.txt](service-red.txt) and
[client-red.txt](client-red.txt); composition regression red is
[composition-red.txt](composition-red.txt). Six service and eight client tests
exercise public behavior with controlled SDK/worker/clock boundaries. These do
not establish actual Electron/frame lifecycle.

## Exact reproduction

From the project root, keep `FREELENS_UI_MODE` unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-client.test.ts tests/find-service.test.ts
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
sha256sum --check docs/verification/42/continuation/package-sha256.txt
git diff --cached --check
```

| Check | Outcome |
| --- | --- |
| Environment/identity | Node 24.18.0/npm 11.16.0, Chromium 154.0.8037.97, Linux x86_64. Package/store `freelens-readable-logs@0.1.34`, config/page `readable-logs`, schema 3, supported host Freelens 1.10.3. [environment.json](environment.json). |
| Locked install/typecheck | Passed; existing npm warnings retained. [npm-ci.txt](npm-ci.txt), [typecheck.txt](typecheck.txt). |
| Focused client/service | 14 tests passed, including loops over six stale-key dimensions and both successes/failures. [client-service-tests.txt](client-service-tests.txt). |
| Full unit/state | 226 passed, zero failed/skipped. [full-tests.txt](full-tests.txt). |
| Desktop guards | 6 passed against fake transports/devices. [ui-guards.txt](ui-guards.txt). No desktop/clipboard/window operation used. |
| Actual worker scheduler | 20 cycles, 441 requests, 41 starts/exits, peak one and none live. [actual-worker-lifecycle.json](actual-worker-lifecycle.json). These observations are not latency guarantees. |
| Mounted production main/renderer/worker | 16 grouped checks, zero uncaught errors; 1 worker start/exit and zero live after viewer teardown; zero sender/app listeners after extension teardown. [mounted-async.json](mounted-async.json). Real CommonJS bundles/React 17/MobX in isolated headless Chromium; SDK/Electron, logs and clipboard are stand-ins. Delays/failure are inserted only at the test SDK response boundary. No physical/native IME/clipboard/focus claim. |
| Original prestart resource command | **Fails:** its old Electron stand-in supplies BrowserWindow but no `app.on`; [original-smoke.txt](original-smoke.txt). This is a test-double compatibility gap; the production host supplies app. The original files remain byte-preserved and untracked as requested. Do not call this command green. |
| Adapted preserved resource workloads | `verify-find-resources.mjs` creates a disposable copy of the original runner/core/renderer, changes only the SDK/Electron stand-ins and adds real packed-main RPC/worker cleanup checks. Original thresholds and heap/external/RSS, DOM/listeners/documents, disk/settings and zero-browser-storage assertions are retained. 40 cycles, 40 real worker starts/exits, peak one, zero remaining worker/owner/app listeners. [resource-smoke.txt](resource-smoke.txt). This is not installed-host soak or #47's completed smoke/CI integration. |
| Package/reproducibility | Strict tarball/build checks, actual worker and packed-main service checks pass; 4 service workers start/exit with peak one, zero remaining listeners. [package-check.txt](package-check.txt). Two-build bytes match [package-sha256.txt](package-sha256.txt) / [reproducibility.txt](reproducibility.txt). Builds include the preserved dirty manifest/docs inputs; not a clean release artifact. |
| User work | Exact prestart tracked dirty hashes preserved: [prestart-preservation.json](prestart-preservation.json). Original smoke/CI/dependency/docs/glossary/scratch/Ralph work retained; no wholesale staging or runtime data committed. |
| Independent reviews | Standards: zero hard breaches, one resolved nonblocking test duplication. Spec: one remaining actual-host evidence gate, zero confirmed implementation defects/scope creep. [review.md](review.md). |

## Exact next-context handoff

Continue **#42 only**. All original checkboxes except the final actual-host/lifecycle
gate have implementation and automated boundary evidence. Do not select #43 yet.

1. Use the integrated production package from this commit in a fully isolated
   Freelens 1.10.3 profile/config/session/extensions environment and a separate
   graphical session. No private session is currently running; `labwc`, Xvfb and
   Weston were unavailable in the command inventory. The earlier experiment's
   `scripts/find-main-host/prepare-display.py` and `display.py` in the read-only
   `/tmp/freelens-find-main-host` worktree document checksum-verified local package
   extraction and headless labwc → nested installed Hyprland. Re-establish an owned
   private session; do not run or modify that evidence worktree in place, and do
   not launch into the user's active compositor. Keep Freelens on its private
   workspace 7. Observe the real desktop continuously and preserve its settings,
   package hashes, focus/workspace/pointer and unrelated resources.
2. Exercise the **real production main service through the pinned SDK** in actual
   root and cluster frames sharing webContents. No generic main-evaluation bridge,
   CSP patch, fixture replacement of service/worker or test-only production
   status endpoint. Confirm cross-frame token rejection in both directions,
   actual owning cluster iframe removal and same-frame viewer replacement,
   startup/idle/activity lifecycle, viewer close, disable/uninstall/reactivation
   and isolated-app shutdown. Verify actual worker exit/owner/listener removal,
   not only rejected Promises. Use Node/Electron diagnostics or a separate
   test-only driver/observer without changing the production package. Native
   window operations are allowed only inside a proven separate graphical session.
3. Add missing integrated lifecycle tests/fixes if actual-host evidence exposes
   defects. Renderer source lookup remains unchanged; #43–46 still own the later
   reading/refinement/history/highlight/geometry features. Do not implement those
   to complete #42. If proof exposes a product/architecture decision gap, retain
   the evidence and report blocked precisely instead of adding a fallback.
4. Integrate original smoke doubles only at #47. The disposable adapter provides
   current #42 resource verification and its exact transformations; original
   `npm run test:smoke` is still failing as explicitly recorded. Re-run relevant
   checks after any production change, preserve two-build reproducibility and
   existing user work, obtain independent code reviews pinned to this next
   context's pre-implementation HEAD, update this evidence and original criterion 9.
5. Commit the completed #42 work/evidence and report done only when every original
   criterion is satisfied. Leave attended physical input/clipboard, Windows/macOS,
   full rendering/resource soak and release acceptance to their explicit later
   gates; background/browser proof cannot substitute for them.

No GitHub comments/closure, external messages, push, merge, PR, release or
production-host maintenance occurred in this continuation.
