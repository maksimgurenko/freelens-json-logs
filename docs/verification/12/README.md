# Ticket 12 verification

Verified on **2026-10-22** against production **freelens-readable-logs 0.1.2** in
**Freelens 1.10.3**. GitHub #12 was assigned to `@me` before work. No comments,
issue closure, messages, prototype merges or global agent configuration changes
were made. This evidence covers refresh/pause/recovery, not the later tickets.

Package SHA-256:
`2920c732a9138cb6422934eaf6022fc1b815ab020daa18b1e0c4777d8652453b`.
[Runtime identity](package-runtime-identity.json) verifies both installed entry
points match the built outputs and main PID **2152186** remained unchanged after
installation. The rebuild produced the same tarball hash.

## Automated and package checks

With the local toolchain on PATH, the commands in
[local development](../../local-development.md) passed:

| Check | Result |
| --- | --- |
| Node/npm | [24.18.0 / 11.16.0](toolchain.txt). No global configuration changes. |
| `npm ci --ignore-scripts --no-audit --no-fund` | [Locked install](locked-install.txt) passed; SDK transitive deprecations are recorded. |
| `npm run typecheck` | [Strict TypeScript/SDK check](typecheck.txt) passed. |
| `npm test` | [34 tests passed](tests.txt), zero failures. |
| `npm run package` | [Build/pack](package.txt) passed. |
| `npm run check:package` | [Tarball inspection](package-check.txt) passed: CommonJS entries, pinned SDK/core, host dependencies external, file allowlist. |
| Rebuild | [Rebuild](rebuild.txt), [inspection](rebuilt-package-check.txt) and installed-byte comparison agree with the original package hash. |
| `git diff --check` | Passed before commit. |

The 18 new tests in `tests/refresh.test.ts` use deferred host responses and an
injected fake clock. They cover immediate reads and cadence measured from
settlement, replacement/repeated lines, repeated Refresh coalescing, hung reads,
the exact slow-notice boundary, paused local formatting, paused one-off Refresh,
Pause/Resume while a discarded read remains outstanding, discarded queued intent,
late successes and failures on container/target changes, departed/reopened views
sharing the same outstanding-target guard, inactive/disposed views, empty success,
outdated retention, failed/successful explicit Retry in both refresh modes, and
initial log/metadata failure recovery. Tests never claim request cancellation.

## Actual installation

[Fresh host](fresh-host.json) records the preceding process family exiting and one
pre-maintenance restart. The process-local `TMPDIR` matches ticket 11's successful
installation environment. User workspace **6** and focused window were preserved;
Freelens opened silently on workspace **7**.

[Before maintenance](before-maintenance.json) shows Extensions before any cluster
frame. The explicit [Uninstall action](uninstall-action.json),
[confirmation](uninstall-confirm.json) and [completed removal](uninstalled.json)
precede the [single Install submission](install-action.json).
[Completion](installed.json) shows version 0.1.2 Enabled with no cluster frame.
Only then was [the cluster opened](open-cluster.json).

The first removal wait preceded the host's Yes confirmation and expired; it was
not a failed installation. The confirmation was then accepted and removal waited
to completion. No overwrite prompt, repeated Install click, filesystem discovery
nudge or post-install restart was used.

[Header click](header-click.json) and [initial viewer](initial-view.json) verify
the actual package opens the original `changing-logs` Pod UID, `json` container
and Default profile, with 1,000 records and the new controls.

## Host controls and real failures

The reproducible host verification commands are:

```sh
node docs/verification/12/host-controls.mjs controls docs/verification/12/controls.json
node docs/verification/12/host-controls.mjs denied docs/verification/12/denied.json
node docs/verification/12/host-controls.mjs offline docs/verification/12/transient-failure.json
node docs/verification/12/host-controls.mjs slow docs/verification/12/slow-request.json
node docs/verification/12/host-controls.mjs initial docs/verification/12/initial-error-and-paused-retry.json
```

These require the existing opt-in localhost CDP endpoint, an open cluster and
the fixture's Readable logs page. `host-transport.js` temporarily instruments
Node `http/https.request` for **only changing-logs' log endpoint**. It records
actual request paths, start/settlement times, statuses and error bodies. Normal
requests and returned log content pass through unchanged. The helper restores
the original transports and releases held reads in `finally`.

Chrome Network/Fetch interception did not observe these Node requests. That
earlier diagnostic attempt is not counted as failure or request-count evidence.
No production test hooks, fake snapshots or fabricated Kubernetes responses are
used for the observations below.

| Scenario | Observed result |
| --- | --- |
| Cadence and controls | [Controls](controls.json): automatic reads, frozen row digest/count across Pause, one manual Refresh while staying paused, no subsequent paused read, immediate Resume read and automatic follow-up. Exact 3,000 ms boundary is established by the fake-clock tests; host times include rendering/event-loop work. |
| Actual Kubernetes denial | [Denial](denied.json): the scoped transport adds `Impersonate-User: freelens-readable-logs-ticket-12-denied`; the real API server returns HTTP **403**, `kind:Status`, `reason:Forbidden`, explicitly naming `pods/log`. This is not an invalid-container 400 or a synthesized response. No RBAC, kubeconfig, credentials or cluster resources were changed. |
| Outdated window and stopped retries | The denial retains the same 1,000-row digest, visibly marks it outdated, shows the Kubernetes explanation and Retry, and makes no automatic read during the following four seconds. Failed explicit Retry makes exactly one further request, with no subsequent loop. Removing the test header and pressing Retry succeeds, clears the error and restores automatic reads. |
| Transient transport failure | [Connection fault](transient-failure.json), [screenshot](transient-failure-offline-failure.png): only this log request is temporarily directed to closed localhost port 9. The kernel returns actual `ECONNREFUSED`, propagated by the host SDK into the production viewer. Last-good rows are retained/outdated, automatic reads stop, failed Retry remains stopped, and explicit Retry after restoring the destination succeeds and resumes automatic reads. `offline` is the helper's mode name; the desktop/cluster was not taken offline. This is a controlled real socket failure, not evidence of a spontaneous cluster outage. |
| Slow outstanding read | [Held request](slow-request.json), [screenshot](slow-request-slow.png): the Node request's `end` is held for over 15 seconds without substituting a response. The slow notice appears, Pause remains usable, Resume waits for the invalidated read, and no second same-target read starts until the held read is released and settles. The following fresh request then succeeds. Pause's single observed CDP action/state round trip was **45 ms**. Navigation to Pods remained usable (**22 ms** CDP round trip), removed the viewer, and reopening the same target waited without displaying old rows. This is not the later five-run performance gate. |
| No prior success and paused Retry | [Initial denial and paused Retry](initial-error-and-paused-retry.json): leave/reopen with the scoped denial active. Zero records, `Unable to read logs`, useful Forbidden text, and no empty-success message. Pause, remove the header and Retry: real logs return while Resume remains offered, and no automatic request follows until Resume. |

The failure and slow screenshots were visually inspected alongside the native
Logs dock. New controls, loading/slow notices, retained rows and Retry remain
usable. The [scoped design detector](design-detector.json) reported no findings;
it is not a human design verdict or a performance measurement.

## Limits and preserved state

The shared request pool retains outstanding operations across page departure and
reopen. Generation checks reject both late data and errors; they do not cancel
Node/host reads. A hung same-target read may block indefinitely. The retained-text
budget does not bound download size, transient response memory or process memory.

Core inactive-view behavior is tested, while wiring host hide/minimize and
ongoing Pod/container observations remains ticket 13. Scrolling/Find remains
ticket 15; richer inspection and saved profiles remain their respective tickets.
No real lifecycle or full-release performance approval is claimed here.

No Pods, RBAC objects, kubeconfig entries or credentials were created or changed.
Original fixture UIDs and unrelated native Logs/terminal dock state remain intact.
All test transport instrumentation is removed. The running 0.1.2 viewer is left
available for the supervisor. Final host/context/cleanup facts are recorded in
[final state](final-state.json).
