# 42: Run literal Find through owned, cancellable workers

**Status:** ready-for-agent
**Blocked by:** [41: Preserve record identity across refreshes and restarts](41-preserve-record-identity-across-refreshes-and-restarts.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/42

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Let readers search retained logs without blocking editing, using literal text with Match case and Whole words. Show exact matching-record counts and honest pending/failure feedback, with bounded background work, explicit recovery and complete worker cleanup.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Matching and execution contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710), [Actual-host feasibility and ownership evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/40#issuecomment-6421719705).

## Acceptance criteria

- [ ] Wire the production Find input and both matching controls through a main-owned Node worker and extension-scoped SDK client. The query is exact untrimmed literal text; punctuation is ordinary text, both flags start off, and there is no regular-expression control.
- [ ] One pure matcher supplies complete ordered record results, application-text/extracted-message provenance and bounded original-source UTF-16 ranges. Search application text OR the active extracted message, exclude Kubernetes timestamps and count each matching record once. A range cap never changes exact counts or navigation.
- [ ] Implement accepted locale-independent simple/common Unicode folding, exact Match case, original-code-point Letter/Number/underscore whole-word neighbors and left-to-right non-overlap across requested source fragments. Cover all four flag combinations and the specified Kelvin/sigma/sharp-s, accents, astral/lone-surrogate and U+0345 regressions.
- [ ] Validate request input before allocation/execution and replies/range bounds before applying them. Bind viewer ownership to actual requesting webContents and frame/process-routing identity; reject foreign or disposed owners. Carry viewer/target/instance/window/message/query, request, worker-generation and range-interest identities, rejecting stale failures as well as successes.
- [ ] Allow at most one lazy reusable worker, one running operation and the newest replacement descriptor per active viewer. Prioritize exact matching over decoration churn, cancel superseded execution and wait for actual worker exit before replacing it. Retain bounded current inputs without a query/window backlog.
- [ ] Preserve and explain queries above 16,384 UTF-16 units without executing or truncating them. Mark matching pending immediately and disable navigation; show Searching after 100 ms. Expire the whole attempt at 1,000 ms including startup, with renderer timing before dispatch and main supervision before startup/posting.
- [ ] Keep query editing and logs available after timeout/failure. Latch useful local feedback until an explicit edit or Retry, use current data for recovery and never replay an old reveal. Refresh alone does not retry; there is no retry loop or silent execution fallback. Decoration failure preserves valid exact results.
- [ ] Build and pack the versioned trusted standalone worker from the same matcher, resolve it relative to the installed main module and execute it as trusted main-read source. The worker has no DOM/host globals or runtime package dependency; user text remains data. Extend strict package/build checks rather than weakening them.
- [ ] Release owners, workers, timers and listeners on inactivity, viewer/frame closure, extension deactivation and shutdown, including idle/startup cases; await actual exit and preserve temporary state during inactivity. Verify real packed-worker/SDK operation, frame isolation, controlled timeout/late-exit cases, latest-only replacement and retention-bound fixtures. Existing checks remain green.

## Local verification evidence

Partial implementation checkpoint on `implementation/find`; **not done**. The
pure matcher/protocol, trusted standalone worker/package checks and per-viewer
main scheduler are implemented and independently reviewed. Production SDK/frame
ownership and Find UI integration remain unfinished, so the original acceptance
checkboxes remain open.

- Pre-implementation/review baseline: `50bfc2e3999d5079ca9ca8e8698df3c158cf24a9`.
- Claimed on GitHub before implementation with `gh issue edit 42 --add-assignee @me`.
- Full evidence, exact commands/environment, package identity and continuation:
  [verification report](../../../docs/verification/42/README.md).
- 97 focused matcher/protocol/scheduler tests, 212 full tests, typecheck, six UI
  guards, nine grouped mounted identity checks and existing resource smoke pass.
  The actual worker lifecycle has 20 cycles/441 requests, 41 starts and actual
  exits, peak concurrency one and zero remaining workers. Strict tarball checks
  execute the unpacked asset outside the checkout, preserve exact counts under
  the range cap and confirm exit. Two package builds have identical SHA-256.
- Independent Standards review: one nonblocking repeated cancellation rule,
  consolidated before final checks. Spec review: zero confirmed checkpoint defects;
  remaining integration/acceptance gates are explicitly recorded.
- Next context must continue #42: main-owned package-relative trusted source and
  SDK ownership bound to webContents plus frame/process-routing membership;
  renderer client/input and two flags with full identities, pending/deadline and
  latched explicit recovery; mounted async and actual packed SDK/frame/lifecycle
  checks. Follow the exact continuation in the report. No native/platform or
  complete Find/release acceptance is claimed.
