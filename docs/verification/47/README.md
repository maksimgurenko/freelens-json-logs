# #47: package, regression and resource integration

Implemented **Integrate package, regression and resource checks** on
`implementation/find`, reviewed against the pre-implementation HEAD
`c3d994545db7bd0861fd62d6e23a157434cf2d37` ([record](review-base.txt)).
This was the lowest eligible unfinished local ticket: #44–46 were locally done
with committed evidence. Claimed before implementation with
`gh issue edit 47 --add-assignee @me`. Live #36/#37/#38/#40/#47 bodies and full
comments match their cached originals ([comparison](authority-check.json)).

Authority is the [accepted literal-only plan at d02b7e7](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md),
the full #37 state traces and #36/#38 execution/rendering resolutions. The
[coverage map](coverage.md) maps every D01–D16 case and all 13 traces to named
pure/session/state and real production-browser tests, with the separate pending
installed-host/native/platform counterparts. D10/D11 retain literal-only scope;
no user regex feature/control or regex acceptance branch is introduced.

## Original acceptance criteria and evidence

| Criterion | Implementation and evidence |
| --- | --- |
| Complete path integration and D01–D16 / 13-trace map | [Coverage](coverage.md); `npm test` and `npm run test:browser` run all dependency paths together, including the new combined hidden-source selection, history and mark test. |
| Pinned install, logic/desktop/browser/resource/package checks | [Exact commands and exits](checks.json), [environment](environment.json), [246 passing tests](full-tests.txt), [6 UI-guard tests](ui-guards.txt), [mounted browser](browser-final.txt), [actual workers](actual-workers.txt), [resource smoke](resource-smoke-final.txt), [package checks](package-check.txt). All pass. |
| Real unpacked versioned worker, strict package and reproducibility | Existing strict tarball/build/host-global checks are retained. `check:package` executes the actual unpacked worker and production main from outside the checkout, checks version/Unicode/provenance/counts/caps/termination and no runtime dependencies. [Two pinned builds](reproducibility.txt) have the same SHA-256. CI retains host/tag/version/release-note checks and verified-asset flow. |
| Preserve and integrate original resource/CI/dependency work | Original smoke workloads and thresholds remain, extended deliberately for the current SDK/Electron boundaries and integrated without disposable rewriting. The original `react-dom` dependency/lockfile and smoke CI step ship together. [Input scope](integration-inputs.json), [preservation check](preservation-check.json). Heap/external/RSS, DOM/listener/document, strict disk/settings and zero browser-storage assertions remain. |
| Replacement/range/retention/lifecycle resource workloads | New worker smoke alternates 1000 records near 5 MiB and one exact 5 MiB source for 20 cycles. It churns queries, window/message revisions and range interests, verifies matching priority and latest-only outcomes, then inactivity/reactivation/closure and actual exit. Extended renderer smoke adds rapid input/profile/window/range/history churn across its original 40 cycles. Owned profiles are deleted; no persisted query/log history. [Measurements](resource-measurements.json). |
| Controlled timeout/late exit/stale outcomes/recovery | [19 focused controlled tests](controlled-focused.txt) and the full suite retain startup-inclusive deadlines, termination-Promise-before-exit, late callbacks, stale success/failure, exact priority, latest-only replacement, latched maintenance and explicit recovery on current data. [20 real-worker scheduler cycles](actual-workers.txt) separately confirm actual exit, reuse and no overlap. |
| Combined source/selection/history/marks and exact copy | `find-integration-browser.jsx` seeds from a hidden inspector source across 1000 exact matching records, checks mark ordinals/history despite failed decoration, independent inspection, complete DOM selection and exact copy adapter payloads. Existing browser checks retain capped decoration, every mark member, 5 MiB source selection, Unicode fragments and late visible ranges. Physical clipboard delivery remains unverified. |
| Reproducible evidence and honest limits | Commands, package/bundle hashes, warm baselines, every measured batch, observed stop-to-exit times and limitations are recorded here. All tests use isolated processes/headless Chromium; there is no installed-host/native/platform or release-acceptance claim. |

## Reproduction and package identity

From this checkout, with `FREELENS_UI_MODE` unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-execution.test.ts tests/find-client.test.ts tests/find-ranges.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:browser
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:workers
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
sha256sum out/main-0.1.34.js out/renderer-0.1.34.js out/find-worker-0.1.34.js
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/47/package-sha256.txt
```

Environment: Node **24.18.0**, npm **11.16.0**, Linux x64, SDK/core/host pin
**1.10.3**, Chromium **154.0.8037.97**. Package/store
`freelens-readable-logs@0.1.34`, page/configuration `readable-logs`, schema **3**.
Versioned CommonJS main/renderer and trusted worker assets remain unchanged.
Package SHA-256:
`cbc903f572d5c7b8dc6dfd09e433538dda799803e8e7549f6212bb2634046825`.
[Bundle hashes](bundle-sha256.txt) identify the three production assets.

The final browser run records **47 grouped observations**, zero uncaught errors,
two real worker starts/exits, peak one and zero remaining workers/owners/requests/
listeners. The scheduler workload independently records **441 requests**, **41
starts/exits**, peak one and zero remaining workers. These counts are observations
of the isolated built production code; SDK/Electron/frame trees are stand-ins.

The integrated resource run retains the original 40 core/main cycles and adds
20 main/worker cycles plus 40 extended renderer cycles. Worker-only starts/exits
are **60/60**, peak one, final owners/inflight/transport queue/worker listeners
zero. Post-GC timers/ports remain **0/0**, Linux process threads **7 → 7**.
Renderer starts/exits are **40/40**, with zero surviving highlights, observers,
frames or timers. Every measured sample stays within the original resource
budgets. Core settings remain one exact **90-byte** file and browser application
storage remains empty. See [raw samples](resource-smoke-final.txt) and
[measurement summary](resource-measurements.json); RSS is allocator-sensitive,
and these small samples do not establish worst-case latency or long-term soak.

## Development controls and independent review

The original smoke command first fails on its outdated Electron `app` boundary
([red](smoke-red.txt)); direct integration passes ([green](smoke-integrated-green.txt)).
The new retention workload first fails because its owner/resource observations
are absent ([red](find-smoke-red.txt)); public SDK/worker boundary accounting
makes it pass ([green](find-smoke-green.txt)). No production diagnostic cache is
introduced. Retained source-index leaks are observed through heap/DOM growth and
zero surviving Custom Highlight ranges, rather than private controller access.

The first combined test incorrectly expected every dense inspector view to hit
the decoration cap; only visible spans are requested. The test now waits for
settlement, with cap coverage retained in the existing dedicated dense tests.
It also now scopes the existing copy assertion to its own two writes. Both
harness failures are retained in `browser-integration-first.txt` and
`browser-integration-second.txt`; the complete mounted run passes afterward.

Rapid profile churn exposed a separate test-transport defect: parallel HTTP
uploads could deliver an older tiny cancel after the latest large match request,
manufacturing an execution failure. The pinned SDK renderer source calls
`ipcRenderer.invoke` synchronously. The stand-in now numbers calls, dispatches
them in caller order and keeps replies concurrent; it still runs actual main
handlers/workers and permits active cancellation. Its missing-message buffer is
bounded and disposed. [Focused transport tests](transport-green.txt),
[failed ordering trace](profile-churn-ordering.txt) and
[40-cycle correction run](profile-churn-ordering-green.txt) preserve the evidence.
Temporary tagged diagnostics and the debug runner were removed.

Both [independent code-review axes](review.md) are pinned to the recorded starting
HEAD and include the staged ticket diff. Standards: zero hard violations/material
smells. Spec: zero substantive findings. The later shared Chrome-discovery
extraction received follow-up review and [name/override checks](browser-discovery.txt).
[Mounted browser](browser-portable.txt) and [full resource](resource-smoke-portable.txt)
checks are repeated through the shared discovery path. CI retains the original
smoke step and additionally runs mounted-browser and real-worker checks. The
old `verify-find-resources.mjs` command remains as a compatibility entry.

## Limits and preserved user work

Actual installed Freelens SDK/frame lifecycle and soak, packaged Custom Highlights,
physical selection/copy/clipboard, native paste/Undo/Redo/IME/AltGraph, modifiers,
focus/window lifecycle and Windows/macOS checks remain **unverified for this
integrated package** under #48. Earlier host evidence is not relabelled as final
package acceptance. This integration neither publishes nor accepts a release.

No native window activation/focus/restart/minimize/restore, native input, pointer
movement, clipboard write, `Page.bringToFront`, fake focus or shared-guard bypass
occurred. Only owned headless browsers/processes/temp directories were removed;
pre-existing host/dock/desktop and unrelated headless state stayed untouched.

The dirty glossary, unrelated design link and untracked design/old scratch/Ralph
files are preserved. The docs index stages only its existing resource-smoke link.
The smoke/CI/manifest/lockfile/development-doc work is deliberately integrated as
required by #47. The runner's previously completed #46 Status update accompanies
this related commit. No issue comment/closure, message to others, push, merge,
PR, tag or release was performed.
