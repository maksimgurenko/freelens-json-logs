# PR #49 independent verification at the original reviewed head

Reviewed head: `f200114ffcd97f73bf4e22ded807eab4f47fc658`, isolated checkout `/tmp/freelens-pr49-verify-za02i3az`. All verdicts below were established before applying any production fix. Original production source was unchanged; [identity and hashes](verifier-artifacts/reviewed-identity.json) record an empty tracked production diff.

| Claim | Independent verdict | Review axis |
| --- | --- | --- |
| R1 | **CONFIRMED** | Correctness/state contract; no separate standards smell finding |
| R2 | **CONFIRMED, with corrected mechanism** | Main SDK ownership/lifecycle contract; original same-ID premise was not demonstrated on the pinned runtime |
| R3 | **CONFIRMED in mounted production renderer** | Specification/UI contract; no separate standards smell finding |

## R1: inspector Close loses an independently successful search position

**Requirement.** Original #37 resolution, `.ralph/sources/find/live-37-comments.md:43,46`: Close preserves independently established valid active result/candidate; refinement retains a matching candidate, otherwise seeks forward inclusively from the latest surviving search position. Glossary defines search position as the latest position reached while resolving/navigating a query. The first rule does not authorize deleting an independently successful position just because its occurrence equals the reading row.

**Reachability.** The real inspector Close handler calls `FindPosition.closeInspection(inspection.selected)` at `src/renderer/viewer.tsx:293`. Deliberate row deselection calls the same method at line 278. `src/core/find-state.ts:36` clears a coincident `position`, while successful `accept()` established `candidate = position = found` at line 71.

**Trigger/expected/observed.** Inspect zero-based row 64, search `up` matching rows 20/64/70; active/candidate/position become 64. Close its inspector; active/candidate remain 64, but position becomes undefined. Refine to `ups` matching 20/70. Expected active 70 from surviving successful origin 64; observed active 20, status `1 of 2 matching records`.

**Independent reproduction and controls.** Mounted unchanged versioned CommonJS production renderer, actual built main/worker through the repository bridge: no-Close control selected 70; Close case selected 20. [Mounted evidence](verifier-artifacts/mounted-browser.json). Expected-behavior unit and mounted strict regressions fail at the original head. Reading-only/pending close still clears the unestablished origin and does not promote late results; closing a different reading row preserves an independently navigated position. These controls pass.

**Minimal fix boundary.** Distinguish reading-derived position from a successful Find position when closing inspection. Preserve independently successful surviving position even when equal to the inspected occurrence; retain cancellation of older selection/reveal intents and clearing of reading-only origin.

## R2: a pending registration can cross a document navigation

**Requirement.** Accepted plan `docs/design/find-implementation-plan.md:103–104,142` binds main ownership to the actual requesting webContents/frame and releases disposed owner/frame bindings, workers, timers and listeners. Issue #42's final acceptance criterion explicitly requires owner/worker/timer/listener cleanup on viewer/frame closure, including startup/idle cases; the issue is cached at `.ralph/pr49-review/issues.json:40`. Navigation is also explicitly treated as document invalidation in production `find-service.ts:82–83`.

**Reachability and limits.** Production `src/main.ts:33` forwards the actual extension SDK event to `find.open(event, viewer)` without changing its frame object. The public boundary accepts repeated registration for the same frame/viewer and existing `find-service.test.ts` requires same-frame replacement to await actual exit. Normal `FindClient.token()` caches a successful registration and Viewer's viewer string is a UUID; this investigation does **not** claim an ordinary UI gesture routinely duplicates that registration. It proves the supported replacement boundary using real renderer IPC events, rather than inventing a renderer event object.

**Original premise challenged.** In pinned Electron **41.10.0**, Chromium **146.0.7680.216**, same-origin cross-document navigation/reload changed routing IDs in every measured main/subframe case. No-navigation/hash kept them. The reviewer's same-ID navigation is therefore retained only as a model regression, not real-host evidence. Pinned Chromium enables RenderDocument by default at the all-frames level ([feature](https://raw.githubusercontent.com/chromium/chromium/146.0.7680.216/content/public/common/content_features.cc), [policy](https://raw.githubusercontent.com/chromium/chromium/146.0.7680.216/content/common/content_navigation_policy.cc)).

**Actual corrected mechanism.** `open()` captures the mutable `caller.senderFrame` object at `src/main/find-service.ts:43`, then awaits worker retirement at line 53. Electron's `WebFrameMain` follows its frame-tree node and can replace its backing frame host on navigation ([pinned primary source](https://raw.githubusercontent.com/electron/electron/v41.10.0/shell/browser/api/electron_api_web_frame_main.cc), frame-tree map and `UpdateRenderFrameHost`). In actual IPC, the old event's `senderFrame` becomes null, but the previously captured object reports the replacement document's new routing ID. `present()` consequently succeeds after the await and lines 56–59 publish an orphan replacement owner for the departed request. Losing navigation listeners during retirement is a separate uncovered gap; merely keeping the observer alive does not solve mutable IDs because pending opens are absent from the owner map.

**Trigger/expected/observed.** Register a viewer, start its worker, request replacement registration, hold actual exit, navigate/reload the owning document, then release exit. Expected obsolete registration rejection, zero departed owners/watch/listeners. With actual renderer `ipcRenderer.invoke` → `ipcMain.handle` → unchanged production `FindService.open`, all four cross-document cases (main/subframe × same-origin/reload) accepted the obsolete registration. Owners=1/senders=1/watch=1 persisted after a housekeeping sweep; stored owner IDs equal the replacement document IDs. Main routing changed 1→8; child 4→8. No-navigation/hash controls correctly accepted the still-live document. [Final real-IPC evidence](verifier-artifacts/electron-navigation-final.json), [strict expected rejection fails](verifier-artifacts/electron-navigation-final-red.txt).

The fixture uses the installed pinned Electron runtime in an isolated ephemeral headless copy with an unattached `WebContentsView`, real frame tree/events/IPC and a deliberately controlled Worker stand-in. It creates **no BrowserWindow** and unsets DISPLAY/WAYLAND_DISPLAY/activation variables. This is real Electron-boundary evidence, not installed Freelens/native acceptance or a measurement of worker termination timing. Re-reading the departed event for diagnostics emits Electron's own warning about asynchronous frame-property access; this diagnostic read is in the fixture.

**Counter-controls.** Immutable old numeric identity removed from the tree is correctly rejected; retargeted mutable identity fails even with an independent sibling owner keeping listeners alive. No-navigation/hash pass. The same-ID navigation test reproduces a model hole but is explicitly not counted as runtime evidence.

**Minimal fix boundary.** Snapshot numeric caller identity before the first await and validate that captured document identity after every wait. Track pending registration invalidation through navigation/renderer loss even while the final owner retires; clean temporary observers on success/failure/disposal and exclude same-document navigation. No global resource-attribution or worker-model redesign is needed.

## R3: saved Inspection layout recreates equal messages and cancels a pending query

**Requirement.** #37 resolution `.ralph/sources/find/live-37-comments.md:23,56`: presentation-only changes do not create a matching scope; Raw/Readable, wrap, timestamps and inspection layout preserve query/modes/occurrence references and never start a search. Geometry must be remeasured without discarding a still-live explicit reveal.

**Reachability.** Real Display options → Inspection control at `src/renderer/viewer.tsx:427–429` invokes production `ConfigurationStore.setInspection()`. Its shallow configuration replacement (`src/adapter/configuration-store.ts:58–60`) reevaluates `activeProfile()`. Built-in Default creates a fresh formatting object, which recreates formatted records/messages at viewer lines 161,167–170. Equal message text gets a new `messageRevision`; the production matching effect invokes maintenance `FindPosition.prepare()` and `FindMatching.update()` at lines 177–186, cancelling the original selection intent.

**Trigger/expected/observed.** Built-in Default; reading row 64; query `upstream` matching rows 2/73/82; hold the actual successful SDK matching reply, then change Side→Bottom. Expected one exact request, live query selects 73 after release. Observed two requests and final `0 of 3 matching records`, no active result, inspection still on 64. Displayed message text is equal across layout change. Query/modes and source strings remain unchanged.

**Mounted evidence and controls.** This was reproduced against the mounted unmodified production renderer/store/MobX plus actual built main/worker, not just the reviewer's memo replay. No-change, Raw, wrap and timestamps controls each issue one request and select 73. [Mounted results](verifier-artifacts/mounted-browser.json); [strict layout assertion fails](verifier-artifacts/mounted-R3-red.txt). SDK/filesystem/settings persistence/OS are stand-ins; the production control and reactive store change execute, but disk-sync/native geometry acceptance is not claimed.

**Minimal fix boundary.** Preserve logical searchable message-vector identity when all extracted text is equal, including built-in formatting or settings-object recreation. Continue invalidating matching when searchable content actually changes; keep layout/geometry revision separate.

## Exact executed commands and reusable regressions

All commands ran sequentially from `/tmp/freelens-pr49-verify-za02i3az` with pinned Node `/home/max/work/freelens-json-logs/.scratch/readable-logs/toolchain/node_modules/node/bin/node`. Reusable added files are preserved in [regressions.patch](verifier-artifacts/regressions.patch.gz) and [regressions/](verifier-artifacts/regressions/). They contain no production fix.

```sh
pr49_node=/home/max/work/freelens-json-logs/.scratch/readable-logs/toolchain/node_modules/node/bin/node
pr49_artifacts=/home/max/work/freelens-json-logs/.ralph/pr49-review/verifier-artifacts
"$pr49_node" --experimental-strip-types --test tests/find-state.test.ts tests/find-service.test.ts
# exit 0; 12/12 existing tests pass: unit-existing.txt
"$pr49_node" --experimental-strip-types --test tests/pr49-verified.test.ts
# exit 1; 8 tests: 4 pass/4 expected-behavior failures: unit-red.txt
"$pr49_node" /home/max/work/freelens-json-logs/.scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
# exit 0: typecheck.txt
"$pr49_node" scripts/pr49-verify-browser.mjs
# exit 0; asserts original observed defects plus controls: mounted-browser.json
PR49_EXPECT_FIXED=1 PR49_ONLY_CLAIM=R1 "$pr49_node" scripts/pr49-verify-browser.mjs
# exit 1; expected active70 violated: mounted-R1-red.txt
PR49_EXPECT_FIXED=1 PR49_ONLY_CLAIM=R3 "$pr49_node" scripts/pr49-verify-browser.mjs
# exit 1; one-request expectation violated: mounted-R3-red.txt
"$pr49_node" "$pr49_artifacts/reproduce-electron-navigation.mjs"
# exit 0; 8 real IPC/navigation scenarios: electron-navigation-final.json
PR49_ASSERT_FIXED=1 "$pr49_node" "$pr49_artifacts/reproduce-electron-navigation.mjs"
# exit 1; obsolete registration accepted: electron-navigation-final-red.txt
```

The browser runner builds only this isolated checkout. Its bridge reports one worker start/exit and zero workers, owners, sender/app/worker listeners, queued transport and inflight requests at teardown; the mounted fixture also verifies no retained highlights/geometry observers/animation frames. These bounded cleanup checks do not reopen host resource attribution or establish a soak plateau. Exploratory fixture-authoring failures were corrected before the recorded successful primary runs; they are not counted as product failures.

No root source modifications, GitHub writes, installed-host desktop operations, physical/native input, clipboard operation, resource attribution/soaks, Windows/macOS tests or further agents were used. Windows/macOS remain explicitly unverified. These are three verified contract defects, with no newly established independent standards/smell violation.
