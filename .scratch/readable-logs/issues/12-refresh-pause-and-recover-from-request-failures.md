# 12: Refresh, pause, and recover from request failures

**Status:** ready-for-agent

**Blocked by:** [11: Open a bounded Readable logs snapshot](11-open-a-bounded-readable-logs-snapshot.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/12

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Keep the selected target's recent log window current while allowing the user to pause immediately, inspect the frozen window, request a one-off refresh, and explicitly recover after a failure. Old or invalidated requests must never replace the accepted window.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935); [live host-integration evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/7#issuecomment-6332133294). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Fetch immediately for an active selected target, then automatically three seconds after the previous request settles while automatic mode remains eligible. Each accepted successful snapshot replaces the window without merging or deduplicating records.

- [x] Allow at most one outstanding log request for the same target, coalesce repeated Refresh actions without accumulating requests, and allow a different target to request independently.

- [x] Pause stops automatic updates and invalidates pending results immediately while keeping records inspectable and available for local reformatting. Refresh while paused fetches once and remains paused; Resume requests fresh data and restarts automatic mode.

- [x] When an invalidated same-target request is still outstanding, wait for it to settle before starting the requested fresh fetch. Never reuse that invalidated result after Resume.

- [x] Show a slow-request notice after 15 seconds and keep Pause/navigation usable. The notice is not a timeout: a hung same-target request remains outstanding until it settles; do not claim cancellation or bounded download/transient memory from stale-result rejection or retained-text limits.

- [x] Discard late failures as well as successes after request-generation invalidation, target change, departure or disable. Prevent automatic timers and pending results from outliving their eligible view.

- [x] On genuine empty success clear the window and continue automatic mode. On denial or transient failure retain any last successful window as visibly outdated, report a useful host/Kubernetes error, and stop automatic refresh; without prior success, show an error state.

- [x] Provide explicit Retry. A successful Retry restores automatic mode unless the user is paused; a failed Retry does not create a silent retry loop.

- [x] Use deterministic deferred-response and fake-clock tests for cadence, no overlap/coalescing, invalidation, pause/refresh/resume, late successes/failures, slow/hung requests and recovery. Verify the controls and representative real request failures in the packaged host extension.



## Implementation and verification evidence

Implemented GitHub #12 on `implementation/readable-logs` as production package
`freelens-readable-logs@0.1.2`. Claimed GitHub #12 by assigning `@me` before work;
no GitHub comments, issue closure or messages were sent. Prior prototype/research
worktrees were read only and no branches were merged. The Ralph runner owns the
Status update.

Full commands, observed evidence, test methods and limitations:
[Ticket 12 verification](../../../docs/verification/12/README.md).

Original acceptance criteria, in order:

1. `SnapshotSession` fetches immediately, replaces accepted windows and schedules
   automatic reads three seconds after settlement. Fake-clock/deferred tests
   verify cadence, replacement and repeated identical lines; `controls.json`
   records the real package's automatic request paths/times and visible windows.
2. `LogRequests` shares one outstanding slot per cluster/namespace/Pod name/UID/
   container across production views. Repeated Refresh shares one current intent.
   Tests cover coalescing, distinct targets and returning to a still-outstanding
   target; `slow-request.json` observes no overlapping same-target reads in host.
3. Pause invalidates generation immediately and stops timers while preserving
   original records for local formatting. Tests call `formatDefault` without a
   log request. Host `controls.json` verifies unchanged rows during Pause, one
   manual Refresh while remaining paused, then a fresh Resume and automatic read.
4. Deferred success/failure tests verify Resume waits for the invalidated read,
   discards it and issues a fresh request without accumulating Refresh actions.
   In the packaged host the held read settled before the next fresh read started
   (`slow-request.json`); Resume displayed the waiting notice. Leaving for Pods
   remained usable (22 ms CDP round trip); reopening waited with zero old rows.
5. Fake-clock tests check 14,999/15,000 ms and a further 600 seconds with no timeout
   or overlapping read. The held real-host read showed the slow notice after
   15 seconds and kept Pause usable (one observed CDP action/state round trip:
   45 ms). This is not cancellation or a five-run performance gate. Download size,
   transient response memory and total process memory are not bounded by retention.
6. Generation checks reject both late successes and failures after Pause,
   target change, departure or disable/disposal; automatic and slow timers are
   cleared. Deferred tests cover each branch, shared-pool departure/reopen and
   inactive return. Host hide/minimize and Pod observations remain ticket 13;
   this ticket does not claim those later adapter integrations.
7. Empty success clears the window and continues automatic mode in deterministic
   tests. Real API-server 403 Forbidden and a scoped real kernel ECONNREFUSED
   fault retain identical last-good rows, mark them outdated, show useful errors
   and stop automatic reads. `initial-error-and-paused-retry.json` also verifies
   a real initial denial with zero records and an error, never an empty-success
   message. See `denied.json` and `transient-failure.json` for request evidence.
8. Explicit Retry recovers both real failures. Failed Retry makes one request
   and stays stopped; successful automatic Retry restores cadence. Real successful
   Retry while paused keeps Pause and makes no further read until Resume; the
   deterministic suite covers both modes and metadata errors as well.
9. Strict TypeScript passes with pinned SDK/core 1.10.3; all 34 tests pass with
   Node 24.18.0 / npm 11.16.0. Clean locked install, build, pack and tarball checks
   pass. Rebuild SHA-256 is unchanged:
   `2920c732a9138cb6422934eaf6022fc1b815ab020daa18b1e0c4777d8652453b`.
   Installed main/renderer bytes match the build. The accepted fresh-main-window
   uninstall/wait/single-install procedure ran under main PID 2152186, with no
   post-install restart. Packaged controls, actual Kubernetes denial, scoped
   connection refusal, initial failure, paused recovery and slow outstanding read
   were exercised. Test-only Node transport instrumentation was fully restored;
   no credentials, kubeconfig, RBAC or fixture resources were changed. Original
   fixture UIDs and native dock state were preserved; the maintenance launch
   preserved the user's workspace/focus.

The host failure methods are controlled observations: denial uses an impersonation
header and gets a genuine API-server 403; transient failure directs only the
fixture's log request to closed localhost port 9 and gets a genuine socket error.
Neither substitutes snapshots or fabricates Kubernetes responses. The slow test
holds the transport before sending, then releases the real request. Fake-clock
coverage establishes the full deterministic state contract; these host checks do
not claim a spontaneous cluster outage, request cancellation or later lifecycle,
scrolling, profile persistence or full-release performance acceptance.
