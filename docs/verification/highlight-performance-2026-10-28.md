# Highlight scrolling and snapshot performance

The mounted production renderer reproduced blank highlights during snapshot
maintenance and excessive geometry work while scrolling. The fix preserves valid
native ranges and reuses matching, source indices, observers and complete range
coverage for unchanged retained occurrences.

## Reproduction and measurements

Run with the supported Node 24.18.0 toolchain and dependencies installed:

```sh
FIND_PERFORMANCE_ONLY=1 node scripts/verify-find-identity.mjs
```

This uses isolated headless Chromium, the built renderer, production SDK handlers
and the real main-owned worker. It never connects to the installed Freelens.

The initial run exited nonzero with both failures:

```text
Small scroll inspected offscreen source styles 6000 times for 1000 rows
Appending one log blanked highlights on unchanged visible text while matching
```

A further long-source regression failed with 314 text-range measurements on an
8-pixel scroll through a 2,160,002-unit wrapped record. All three checks pass
after the fix.

| Workload | Before | After |
| --- | --- | --- |
| 8-pixel scroll, 1,000 matching rows | 6,000 style reads | 0 style reads |
| One-row append while matching reply is held | Retained visible highlights disappear | Same connected source nodes remain highlighted |
| One-row append, retained visible coverage | Decoration is requested again | 6 style reads and 0 additional range requests |
| 8-pixel scroll, large wrapped source | 314 range measurements | 52 range measurements; 58 with the newer toolbar styling |
| Worker membership for one appended row | Searches all 1,000 sources | Searches 1 new source; reuses the other 999 |

Operation counts are deterministic regression signals, not native input-latency
measurements. The fixture's elapsed scroll measurement includes animation-frame
waits. Horizontal scrolling also checks that a small move reuses covering ranges
and that overlapping highlights remain visible while the next range reply is held.

## Changes

- Cache clipping ancestors and fragment bounds; read each shared clipping box once
  per measurement. Reuse source indices and observe only added/removed elements.
- Preserve native ranges only for connected nodes whose occurrence, query, modes
  and exact source text remain valid. Reassign active-result styling immediately.
- Quantize nearby range interest to 256 source units while painting only measured
  visible spans. Reuse complete coverage after appends and presentation changes.
- Delay visible pending feedback by 100 ms, exposing the immediate busy state
  separately through `aria-busy`. Clear the timer on completion and disposal.
- Keep one worker-local membership cache for the latest window. Changed sources
  and query controls recompute; evicted occurrences are dropped.

## Validation and scope

Passed with Node 24.18.0 and Linux headless Chromium 154:

- Typecheck and all 256 unit tests.
- Full mounted renderer suite, including retention, dense caps, clipping resize,
  source selection, Unicode offsets, inspector sharing, failure/retry, stale
  replies, profile changes, viewport anchors and teardown.
- Built-worker lifecycle: 441 requests; 41 workers started/exited, peak one live.
- Core/main/renderer resource smoke with the existing budgets; no surviving owned
  workers, observers, timers, frames or Custom Highlight registrations.
- Six desktop-policy tests, package build and strict packed-worker/service checks.
- `git diff --check`.

Local package: `dist/freelens-readable-logs-0.1.35.tgz`, SHA-256
`8af6e2cfc76721e3249f1206b130757ccd9162f1bfa452476721a2fef451dfac`.

Integration with the newer toolbar styling on `main` (`9e5f560`) repeated the
typecheck, all 256 unit tests, full mounted renderer suite, package build and
strict package checks successfully. Scroll and append style counts remained
0 and 6 respectively, with no range request for unchanged appended coverage.
The resource, worker lifecycle and desktop-policy runs above preceded this
toolbar integration.

The installed application was not changed or restarted. Native visual/input
acceptance of this increment remains unverified. Windows and macOS remain
explicitly unverified; no platform suites were added or run. Snapshot IPC and
validation still carry the bounded recent window; this fix avoids repeated
matching/decoration work, rather than eliminating all work proportional to the
window size.
