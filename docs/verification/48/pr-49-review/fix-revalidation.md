# Independent revalidation of the proposed PR #49 fixes

**R1 VERIFIED. R2 VERIFIED. R3 VERIFIED.** No additional production regression was demonstrated in this focused revalidation.

The original pinned-head verdicts/evidence were finalized in [verified-findings.md](verified-findings.md) before changing production source. Then the exact [proposed-fixes.patch](proposed-fixes.patch.gz) was applied with `git apply --check` and `git apply` to the isolated checkout `/tmp/freelens-pr49-verify-za02i3az`, still based on `f200114ffcd97f73bf4e22ded807eab4f47fc658`. No other production edits were made. [Fix identity](verifier-artifacts/fix-identity.json) records the applied patch hash, source/bundle hashes and six tracked files changed by that patch. Independent additional tests/fixtures are untracked and preserved separately.

| Fix | Result | Independent evidence |
| --- | --- | --- |
| R1: retain independently successful Find position on inspector Close | **VERIFIED** | Original strict mounted/core regressions now pass; zero-hit, new-query, reading-only and pending-dismissal controls pass |
| R2: snapshot caller IDs and guard pending document lifetime | **VERIFIED** | Actual pinned Electron main/subframe IPC rejects four departed-document cases; six still-live document controls succeed; temporary/listener/map cleanup passes |
| R3: preserve equal searchable message vectors by value | **VERIFIED** | Actual mounted production renderer preserves pending query through Inline/Bottom/Side, Raw/wrap/timestamps and serialized settings echo; changed extracted content still runs maintenance |

## R1 behavior and boundaries

The same inspected row64/`up`/`ups` case that selected row20 at the original head now selects row70. The no-Close control still selects row70. This executes the production inspector Close handler and actual Find edit/worker/acceptance path in mounted production bundles.

Both independent and proposed core regressions also verify that a successful row64 position survives an intervening zero-hit refinement before inspection closes. Reading-only/pending inspection closure still clears the unestablished origin, reading row and older selection permission; late matching data does not select a result. Starting a new query sequence after an older success discards the old candidate, so closing during that new pending sequence also clears its unestablished origin. A successful position distinct from the closing reading row remains valid. The candidate guard therefore preserves a successful origin without preserving every reading-derived origin.

Evidence: [expanded mounted results](verifier-artifacts/fix-mounted-expanded.json), [37 focused unit cases](verifier-artifacts/fix-unit-expanded.txt).

## R2 real Electron boundary and cleanup

The original defect was revalidated with the corrected mechanism from the original report: Electron's captured `WebFrameMain` object follows navigation even when numeric routing IDs change. The patch now snapshots numeric IDs synchronously and separately tracks invalidation while registration awaits old worker exit.

[Final Electron results](verifier-artifacts/fix-electron-final.json) execute real renderer `ipcRenderer.invoke` → `ipcMain.handle` → patched production `FindService.open` in pinned Electron **41.10.0**, Chromium **146.0.7680.216**, using an unattached headless `WebContentsView` and a controlled Worker stand-in:

- Main and subframe same-origin document replacement/reload: **4/4 obsolete registrations rejected** with `Disposed Find viewer`. Owners, sender bindings, watches, opening and retiring maps are zero after settlement/housekeeping.
- Main and subframe no-navigation, hash navigation and sibling-frame navigation: **6/6 still-live registrations accepted**. Hash remains same-document; navigating another frame does not invalidate the owner being registered.
- Exactly one temporary listener for each relevant destroyed/process-gone/frame-navigation event remains while the last owner retires. Rejected registration removes all three; successful registration retains exactly the normal owner's three observers, with no duplicate temporary observers. After service disposal, all measured service listeners return to their pre-service baselines in **10/10 scenarios**.

Independent unit controls additionally exercise one or three queued registrations across `destroyed`, `render-process-gone`, sibling navigation, hash navigation, no event and service disposal. Every settled path has the expected owner/watch count, empty opening/retiring maps and no extra temporary listeners; final disposal leaves zero listeners/watches. The same-ID navigation and mutable-ID-with-sibling cases also pass. Same-ID navigation and renderer-loss injection remain **model evidence**; the actual-runtime checks do not manufacture unchanged IDs or crash the native installed host.

The initial fix replay used an original-head diagnostic assertion requiring navigation listeners to be absent during retirement. The fix correctly violated that old-bug precondition, and cleanup then waited on the fixture-held exit until its 20-second guard. This yielded exit2 and no product verdict. It was reported before any change; only a separate fix-verification fixture was adjusted to require balanced temporary observers and always release its fake worker during cleanup. The original fixture/evidence remains intact. Final runs exit0. Expected Electron handler rejection logs and warnings from deliberate diagnostic reads of a departed event remain visible in [stderr](verifier-artifacts/fix-electron-final.stderr).

## R3 mounted renderer and meaningful counterexample

The expanded mounted fixture executes the patched production renderer, production reactive `ConfigurationStore`, actual main bundle and trusted worker via the existing isolated bridge. Each pending query starts at reading row64 and matches rows2/73/82; after its delayed successful reply, the following cases all retain active row73 and issue exactly one matching request: no change, Raw, Word wrap, timestamps, Side→Inline, Side→Bottom, Bottom→Side, and serialized configuration echo through production `ConfigurationStore.fromStore()` with recreated nested objects. Displayed message text remains equal across these cases.

A counterexample checks that value comparison does not suppress actual message changes. A record containing JSON-escaped Sigma initially matches decoded extracted text `Σ` for query `σ`; its original JSON application text has the escape rather than Sigma. Adding an inactive profile does not restart matching. Activating a profile extracting `/other` changes searchable text and issues one maintenance request, removing the now-invalid result/count. Restoring Default issues another maintenance request and restores `0 of 1 matching records` without implicitly choosing a new active result. Neither formatting change fetches logs. This checks the value-based boundary, including settings-object recreation, rather than relying solely on stable configuration references.

The mounted bridge ends with zero live workers, owners, queued/inflight transport, and worker/sender/app listeners. The fixture also verifies zero retained Custom Highlight registrations, geometry observers and pending animation frames. These bounded checks are not resource attribution or soak evidence.

## Exact commands and artifacts

From `/tmp/freelens-pr49-verify-za02i3az`:

```sh
pr49_node=/home/max/work/freelens-json-logs/.scratch/readable-logs/toolchain/node_modules/node/bin/node
pr49_artifacts=/home/max/work/freelens-json-logs/.ralph/pr49-review/verifier-artifacts
git apply --check /home/max/work/freelens-json-logs/.ralph/pr49-review/proposed-fixes.patch
git apply /home/max/work/freelens-json-logs/.ralph/pr49-review/proposed-fixes.patch
"$pr49_node" --experimental-strip-types --test tests/pr49-verified.test.ts tests/pr49-fix-extra.test.ts tests/find-state.test.ts tests/find-service.test.ts
# exit0, 37/37 pass; fix-unit-expanded.txt
PR49_EXPECT_FIXED=1 "$pr49_node" scripts/pr49-verify-browser.mjs
# exit0; original strict mounted repro now passes; fix-mounted-initial.json
PR49_EXPECT_FIXED=1 "$pr49_node" scripts/pr49-fix-browser.mjs
# exit0; all layouts/settings/content controls; fix-mounted-expanded.json
PR49_ASSERT_FIXED=1 "$pr49_node" "$pr49_artifacts/revalidate-electron-navigation.mjs"
# exit0; 10 actual IPC/frame scenarios; fix-electron-final.json
"$pr49_node" /home/max/work/freelens-json-logs/.scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
# exit0; fix-typecheck.txt
git diff --check
# exit0
```

Additional independent fixtures are preserved in [fix-regressions.patch](verifier-artifacts/fix-regressions.patch.gz) and [fix-regressions/](verifier-artifacts/fix-regressions/). The original [regressions.patch](verifier-artifacts/regressions.patch.gz) is unchanged. [revalidate-electron-navigation.mjs](verifier-artifacts/revalidate-electron-navigation.mjs) builds the calling cwd's `FindService` into an ephemeral headless copy of the installed runtime, uses [electron-fix-main.cjs](verifier-artifacts/electron-fix-main.cjs), then removes the copy. DISPLAY/WAYLAND_DISPLAY/activation variables are unset and no BrowserWindow is created.

This verifies the three proposed fixes and focused nearby controls. It does not claim a fresh installed-Freelens/native-input/clipboard/settings-persistence or packed-release acceptance run, new resource attribution/soak evidence, or Windows/macOS testing. Those platforms remain explicitly unverified. No root source changes, GitHub writes, user desktop operations or additional agents were used.
