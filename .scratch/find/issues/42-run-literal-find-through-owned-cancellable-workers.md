# 42: Run literal Find through owned, cancellable workers

**Status:** done
**Blocked by:** [41: Preserve record identity across refreshes and restarts](41-preserve-record-identity-across-refreshes-and-restarts.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/42

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Let readers search retained logs without blocking editing, using literal text with Match case and Whole words. Show exact matching-record counts and honest pending/failure feedback, with bounded background work, explicit recovery and complete worker cleanup.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Matching and execution contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710), [Actual-host feasibility and ownership evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/40#issuecomment-6421719705).

## Acceptance criteria

- [x] Wire the production Find input and both matching controls through a main-owned Node worker and extension-scoped SDK client. The query is exact untrimmed literal text; punctuation is ordinary text, both flags start off, and there is no regular-expression control.
- [x] One pure matcher supplies complete ordered record results, application-text/extracted-message provenance and bounded original-source UTF-16 ranges. Search application text OR the active extracted message, exclude Kubernetes timestamps and count each matching record once. A range cap never changes exact counts or navigation.
- [x] Implement accepted locale-independent simple/common Unicode folding, exact Match case, original-code-point Letter/Number/underscore whole-word neighbors and left-to-right non-overlap across requested source fragments. Cover all four flag combinations and the specified Kelvin/sigma/sharp-s, accents, astral/lone-surrogate and U+0345 regressions.
- [x] Validate request input before allocation/execution and replies/range bounds before applying them. Bind viewer ownership to actual requesting webContents and frame/process-routing identity; reject foreign or disposed owners. Carry viewer/target/instance/window/message/query, request, worker-generation and range-interest identities, rejecting stale failures as well as successes.
- [x] Allow at most one lazy reusable worker, one running operation and the newest replacement descriptor per active viewer. Prioritize exact matching over decoration churn, cancel superseded execution and wait for actual worker exit before replacing it. Retain bounded current inputs without a query/window backlog.
- [x] Preserve and explain queries above 16,384 UTF-16 units without executing or truncating them. Mark matching pending immediately and disable navigation; show Searching after 100 ms. Expire the whole attempt at 1,000 ms including startup, with renderer timing before dispatch and main supervision before startup/posting.
- [x] Keep query editing and logs available after timeout/failure. Latch useful local feedback until an explicit edit or Retry, use current data for recovery and never replay an old reveal. Refresh alone does not retry; there is no retry loop or silent execution fallback. Decoration failure preserves valid exact results.
- [x] Build and pack the versioned trusted standalone worker from the same matcher, resolve it relative to the installed main module and execute it as trusted main-read source. The worker has no DOM/host globals or runtime package dependency; user text remains data. Extend strict package/build checks rather than weakening them.
- [x] Release owners, workers, timers and listeners on inactivity, viewer/frame closure, extension deactivation and shutdown, including idle/startup cases; await actual exit and preserve temporary state during inactivity. Verify real packed-worker/SDK operation, frame isolation, controlled timeout/late-exit cases, latest-only replacement and retention-bound fixtures. Existing checks remain green.


## Local verification evidence

**Previous implementation checkpoint (superseded by actual-host completion below).**
Production input/two flags, SDK client,
main frame-bound ownership and trusted worker loading were wired. At that checkpoint,
the last original criterion was open because actual production Freelens SDK/frame/lifecycle
proof was still required. Automated SDK/Electron stand-ins did not satisfy that gate.

- Original ticket baseline: `50bfc2e3999d5079ca9ca8e8698df3c158cf24a9`.
  Pre-continuation/review HEAD: `67b1d5e0bf3eea07e1e8762bbb7f3849cc106203`.
- Reclaimed before work with `gh issue edit 42 --add-assignee @me`; current live
  #42 and #36/#37/#38/#40 decision comments match the cached authority.
- Current criterion-by-criterion evidence, exact commands/environment/identity,
  limitations and autonomous next-context handoff:
  [continuation report](../../../docs/verification/42/continuation/README.md).
  Earlier matcher/scheduler work: [initial report](../../../docs/verification/42/README.md).
- Typecheck, 14 focused SDK/client tests, **226 full tests**, six desktop guards,
  16 grouped real mounted production-bundle checks, strict packed main/worker
  checks and two-build reproducibility pass. Actual scheduler workload: 20 cycles,
  441 requests, 41 actual starts/exits, peak one, zero live. Packed-main service
  check: four actual starts/exits and no workers/owner/app listeners after cleanup.
- Preserved original `npm run test:smoke` **fails** because its old Electron double
  lacks the new shutdown `app` hook. The disposable adapter retains the original
  thresholds and all memory/disk/DOM/listener/storage assertions with current
  test doubles and real production main/worker. Its 40 cycles pass, with 40 actual
  worker starts/exits and none remaining. Original smoke/CI/dependency files remain
  unchanged and untracked; #47 owns their integration. No installed-host soak claim.
- Independent Standards review: zero hard breaches, one resolved nonblocking
  test-helper duplication. Spec: one actual-host evidence gate; zero confirmed
  implementation defects or scope creep. Both reviews used explicit `fork_turns: none`.
- Continue #42 only: isolated actual Freelens production package/SDK root-cluster
  frame ownership, actual frame removal, startup/idle/inactive/close, real
  Disable/Uninstall/reactivation/native-window-close and app shutdown, with actual
  worker exit and handler/owner/listener cleanup. A fresh context can establish
  the separate graphical session and finish this concrete autonomous verification.
- All prestart tracked dirty files retain their original hashes; unrelated user
  work and .ralph runtime are excluded from this ticket commit. No native desktop,
  clipboard, production-host maintenance, GitHub comments/closure or publication.
  Physical/native input, Windows/macOS and full Find/release acceptance remain
  explicitly unverified downstream gates.


### Actual production-host completion

Continued from recorded HEAD `623792be8f5bbfe5623642dc0fe1649c0ff5fff4`. Reclaimed
#42 before work; live authority matched the cached decisions. The last original
criterion is now satisfied by the real packed production extension in Freelens
1.10.3, in a separate headless graphical session on private workspace 7.

- Real SDK root/cluster frame isolation, 1,000-record / 5 MiB matching and capped
  ranges; idle reuse/inactivity, actual frame removal, startup replacement and
  debugger-controlled whole-attempt timeout/recovery.
- Actual mounted production viewer preserves query/flags across inactivity and
  releases execution; real Disable/Enable/Uninstall/single-submit reinstall,
  native window destruction and startup app shutdown verify actual exit and
  owner/listener/timer/SDK-handler cleanup. Twenty 20-request bursts prove latest-only
  production SDK dispatch; final owner/execution/listener counts are zero.
- Full commands, hashes, criterion evidence, retained harness failures, resource
  adapter results, user-work preservation and downstream limits:
  [actual-host report](../../../docs/verification/42/host/README.md). Original smoke
  command remains explicitly failed due its preserved old Electron double; #47
  owns that integration. Current production resource workloads pass via the adapter.
- No production change was needed in this continuation. Original implementation
  and matcher/client/state tests remain green. Physical/native input and clipboard,
  Windows/macOS, long host soak and later ticket/release acceptance remain unverified.
