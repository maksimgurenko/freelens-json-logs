# 47: Integrate package, regression and resource checks

**Status:** ready-for-agent
**Blocked by:** [44: Search selected text and recall temporary history](44-search-selected-text-and-recall-temporary-history.md), [45: Highlight matches and inspect hidden match sources](45-highlight-matches-and-inspect-hidden-match-sources.md), [46: Navigate scrollbar match marks using measured geometry](46-navigate-scrollbar-match-marks-using-measured-geometry.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/47

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Make the complete literal Find feature pass the project's production logic, real-browser, package and resource checks as a reproducible package. Preserve the existing resource-smoke work while extending it to prove bounded worker, input and decoration lifecycles.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Execution and lifetime contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710), [Rendering limits and geometry contract](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783).

## Acceptance criteria

- [x] Integrate the completed Find paths and map all reviewed D01-D16 cases and all 13 accepted state traces to pure/state tests, the real production browser renderer and the separately pending host/native/platform checks. Apply literal-only scope to D10/D11; regex-specific branches are excluded.
- [x] Run pinned Node 24.18.0/npm 11.16.0 locked installation, typecheck, unit/state tests, desktop-workflow tests, package creation/checks and production browser/resource smoke. Preserve existing CI checks and verify complete matching, input, history, copy, geometry, following and Pause regressions.
- [x] The actual unpacked trusted versioned worker loads independently of host working directory, runs the same matcher and terminates. Strict tarball/build checks include it without runtime dependencies or bundled host React/MobX. Preserve host pinning, version/release validation, verified assets and two-build SHA-256 reproducibility.
- [x] Preserve and integrate the primary checkout's in-progress resource-smoke, CI and development-dependency/lockfile work; do not replace it with older baseline files. Keep heap/external/RSS, DOM/listener/document, disk/settings and zero-browser-storage assertions.
- [x] Extend production workloads for rapid query/profile/window replacement, visible-range churn, dense/long retention-bound fixtures, real worker startup/cancellation, late exit, inactivity/closure and reactivation. Count workers/threads/owners and verify no retained backlog, timers, highlight indices, range registries or listeners after cleanup.
- [x] Controlled stalls/clocks exercise the whole-attempt timeout including startup, matching priority, newest-only replacement, stale success/failure and latched explicit recovery. Verify actual worker exit and no overlapping replacement rather than inferring cancellation from a rejected request.
- [x] Exercise combined selected-text/history/hidden-source/mark behavior after the parallel feature tickets integrate. Decoration caps or failure preserve every exact matching record, navigation ordinal, history eligibility and mark member. Preserve complete exact source selection/copy.
- [x] Retain reproducible commands, environment, results and resource measurements with honest limitations. Browser stand-ins do not satisfy actual Freelens soak, physical clipboard/native-input or Windows/macOS acceptance. Integrating checks does not publish or accept a release.

## Local verification evidence

Implemented on `implementation/find`, starting/reviewed against
`c3d994545db7bd0861fd62d6e23a157434cf2d37`. Claimed with
`gh issue edit 47 --add-assignee @me` before implementation. Live full
#36/#37/#38/#40/#47 bodies/comments match cached authority.

- [Report and original-criterion evidence](../../../docs/verification/47/README.md).
- [All D01-D16 cases and all 13 state traces](../../../docs/verification/47/coverage.md), with #48 host/native/platform gates kept pending.
- [Exact environment](../../../docs/verification/47/environment.json) and [commands/exits](../../../docs/verification/47/checks.json): project-local Node 24.18.0/npm 11.16.0 locked install, typecheck, 246/246 tests, 6/6 UI guards, mounted production browser, actual workers, original+extended resource smoke and package checks pass.
- [Mounted integration](../../../docs/verification/47/browser-final.txt): 47 grouped observations, source selection/history/hidden-source/marks, caps/failure, exact copy payloads, geometry/following/Pause, no uncaught errors or retained owner resources.
- [Resource measurements](../../../docs/verification/47/resource-measurements.json): preserved 40 core/main cycles, 20 worker retention-bound cycles and 40 extended renderer cycles. Real worker starts/exits 60/60 and 40/40, peak one, zero owners/inflight/queues/listeners after teardown; stable timers/ports/Linux threads. Original heap/external/RSS, DOM/listener/document, strict disk/settings and empty browser-storage assertions pass.
- [Controlled focus](../../../docs/verification/47/controlled-focused.txt): startup-inclusive deadline, late actual exit, exact priority/newest-only, stale successes/failures and latched explicit recovery. [441-request real worker check](../../../docs/verification/47/actual-workers.txt) has 41/41 starts/exits, peak one and no remaining workers.
- [Actual packed worker/main](../../../docs/verification/47/package-check.txt) pass outside checkout CWD with strict allowlists, versioned trusted assets, host pins/globals and no runtime dependencies. [Two-build SHA-256](../../../docs/verification/47/reproducibility.txt): `cbc903f572d5c7b8dc6dfd09e433538dda799803e8e7549f6212bb2634046825` for `freelens-readable-logs@0.1.34`.
- [Independent Standards and Spec reviews](../../../docs/verification/47/review.md): no findings. [Browser](../../../docs/verification/47/browser-portable.txt) and [resource](../../../docs/verification/47/resource-smoke-portable.txt) reruns pass after shared Chrome discovery; explicit missing-browser override fails instead of skipping checks.
- Original resource-smoke, CI and dependency/lockfile work is deliberately retained and extended. The test-only HTTP transport now preserves SDK caller order without serializing replies; recorded red/green evidence and transport regressions cover the discovered upload-order race. No production matching mechanism/contract changed.
- Dirty glossary, unrelated design link, untracked design/old scratch/Ralph data stay preserved; only the index resource link and this ticket's integration/evidence are staged. Runner's completed #46 Status update accompanies this related commit.

Installed-host soak/SDK/frame cleanup, physical selection/copy/clipboard,
native input/IME/AltGraph/focus/window and Windows/macOS remain unverified for
this integrated package under #48. No release acceptance, publication, push,
issue comment/closure or installed-host operation is claimed. All unattended
checks used owned isolated processes/headless Chromium, with FREELENS_UI_MODE
unset and no native desktop/clipboard/focus mutation.
