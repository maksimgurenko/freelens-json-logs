# Ticket 13 progress and retry handoff

**Not accepted or complete.** Production lifecycle implementation and automated
checks are ready for real-host verification. The one installation attempt failed
before the extension was discovered. No installed-viewer lifecycle behavior is
claimed. GitHub #13 was claimed with `gh issue edit 13 --add-assignee @me` and
remains open; no comments, closures or messages were sent. Work stays on
`implementation/readable-logs`; evidence worktrees were read only.

## Implementation

- `SnapshotSession` handles observed restart counts/container IDs, clears the
  previous-instance window and rejects pending results. It preserves Pause and
  temporary manual profile state. Automatic mode requests fresh current-instance
  logs, subject to the shared outstanding-request guard; paused mode waits for an
  explicit action. Incomplete status is not itself a restart. A new restart count
  followed by its new ID is not counted twice.
- Observed 404/deletion or different Pod UID permanently stops the original view,
  retaining any window as outdated under the original target identity. Controls
  cannot Retry or silently select the replacement; reopen from its Pod header.
- The adapter polls supported `podsApi.get` without overlapping metadata reads,
  three seconds after settlement, including during Pause. It offers regular,
  init and ephemeral containers and maps all three status arrays. Metadata errors
  stop polling and require explicit Retry; denial is not deletion.
- Document visibility and section intersection suspend reads for hidden/minimized
  documents and hidden cached cluster frames; blur is ignored. Cleanup removes
  observers on unmount/disable. Returning automatic views fetch fresh; paused views
  remain paused. New cluster/Pod identity mounts a fresh keyed viewer. Container
  switches immediately clear records/Pause/manual profile state and fetch when
  active. Close/reopen drops temporary state.
- Saved-profile UI/selection is still later-ticket scope. The current viewer uses
  Auto with built-in Default; the lifecycle model's temporary manual selection is
  tested independently so later profile controls can use the same boundary.

This is observation-based behavior, **not an atomic UID-bound log read**. A Pod
or instance can change between samples and a name-addressed log read. Detection
latency is not guaranteed, especially with a slow metadata request or hidden
view. No previous-instance request or snapshot merge is used. Invalidating a
request does not cancel it or bound download/transient memory.

## Passing automated/package checks

Local **Node 24.18.0 / npm 11.16.0**, pinned SDK/core **1.10.3**. The existing
scratch toolchain was used without any global agent/environment configuration
change. Exact local invocation prepends
`.scratch/readable-logs/toolchain/node_modules/node/bin` to PATH and runs
`node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js <arguments>`.
A normal Node 24/npm 11 installation uses the commands in
[local development](../../local-development.md).

| Check | Evidence |
| --- | --- |
| Locked clean dependencies: `ci --ignore-scripts --no-audit --no-fund` | [Passed](locked-install.txt). |
| Strict TypeScript: `run typecheck` | [Passed](typecheck.txt). |
| `test` | [57 passed, zero failed](tests.txt): the original 34 plus 23 lifecycle tests. |
| `run package` | [Build/pack passed](package.txt). |
| `run check:package` | [Actual tarball inspected](package-check.txt): CommonJS entries load, host dependencies external, pinned SDK/core, allowlisted files. |
| Repeat `run package` | [Rebuild](rebuild.txt), [same SHA-256](reproducible.txt). |

Current candidate **0.1.3** SHA-256:
`e76cab040e002109e5a5df00dd3b54135ca76067fab67a66e53dd27f270fc346`.
This final candidate has **not** been installed. The failed attempt used earlier
0.1.3 bytes with SHA-256
`ce286a2900eb933f5556393a392782d6355d7ff7cace3c131bc2278b4140727b`;
subsequent changes refine instance-ID handling and document the failure.

Deterministic coverage includes all container kinds, profile/Pause context reset,
independent cluster/Pod-name/UID changes, paused inactive selection, initial late
metadata success/failure, hide/return, close/reopen, restart in both refresh modes,
late log successes/failures after restart/deletion/replacement, sticky original
Pod identity, outstanding paused Refresh after restart, incomplete status, observer
failure/recovery, no overlapping metadata polls, stopped-observer late errors,
and combined document/intersection visibility with blur and cleanup. Existing
refresh tests continue to cover deferred same-target reads across departure and
reopening. Fake visibility events are test evidence, not native minimize proof.

## Failed actual installation

The accepted procedure was attempted once with a process-local same-filesystem
TMPDIR, a fresh main window, and no cluster frame during maintenance:

1. [Fresh host](fresh-host.json): old main PID 2152186 and all recorded children
   exited. One pre-maintenance restart started main **2190984** on workspace 7,
   preserving the user's active workspace 2 and focus.
2. [Extensions opened](open-extensions.json) before a cluster.
3. [Uninstall menu](uninstall-menu.json), [action](uninstall-action.json),
   [confirmation](uninstall-confirmation.json), then [removal wait](uninstalled.json)
   showed no extension row and zero cluster frames.
4. [Exactly one Install click](install-action.json) submitted the 0.1.3 tarball.
   [Installation failed](installed.json) after about ten seconds with
   `There was an error during the installation`. No second click, overwrite
   prompt, filesystem discovery nudge or post-install restart was used.
5. Sequencing mistake: the script's failed completion was initially overlooked,
   and the cluster was opened before the error was inspected. It did **not**
   recover or install the extension. The main window was returned to Extensions;
   [final host](failed-final-host.json) and the visually inspected
   [screenshot](failed-install.png) preserve the failure.

[Host logs](install-host-log.txt) show removal but no subsequent discovery/install
of 0.1.3. [Filesystem state](failed-install-state.json) shows extracted 0.1.3 under
`~/.freelens/extensions/freelens-readable-logs` and no corresponding
`~/.config/Freelens/node_modules/freelens-readable-logs` link. The former 0.1.2
package is uninstalled. The failed extracted package is intentionally untouched.
The installed-viewer gates cannot run in this state.

Pinned host source (`unpack-extension` in the SDK renderer bundle) waits up to
10,000 ms for `extensionLoader.userExtensions` after extraction and displays this
message when that wait fails. Discovery watches manifest `add` and directory
`unlinkDir` events with a 300 ms write-stability threshold. A missed or coalesced
watch event after the rapid uninstall/install is a **hypothesis**, not an observed
root cause. No host source or global configuration was changed to bypass it.

## Available real SDK evidence and preserved resources

A dedicated namespace **readable-logs-ticket-13** was absent before creation.
[Fixture manifest](fixture.yaml), [creation](fixture-create.txt),
[Pod snapshot](fixture-before.json) and [SDK observation](sdk-pod-observation.json)
record the isolated `lifecycle` Pod: regular `app`/`sidecar`, init `setup` and
an ephemeral `debug` container. Ephemeral addition used:

```sh
kubectl --context kind-freelens-json-logs-spike debug -n readable-logs-ticket-13 \
  pod/lifecycle --container=debug \
  --image=busybox:1.37.0@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e \
  --attach=false -- sh -c 'while :; do echo "ephemeral output"; sleep 1; done'
node scripts/host-cdp.mjs 770814 docs/verification/13/sdk-pod-observation.js
```

The running Freelens SDK really returned these spec/status arrays and a wrapped
Kubernetes `Status` with `reason: NotFound`, `code: 404` for an absent Pod. This
confirms the adapter's API data/error shapes; it is **not** an extension UI test.
No restart/deletion/replacement was performed yet. The owned namespace and Pod
remain for the next attempt and may be recreated or removed without touching
`readable-logs-spike`. Original fixture UIDs/restart counts, the running host PID,
and desktop state are in [preserved state](preserved-state.json). No credentials,
kubeconfig, RBAC, shared fixture Pods or native dock tabs were edited.

## Concrete remaining work for a fresh context

No human decision or missing credential is established; use **retry**, not done.

1. Resume **ticket 13 only**. Inspect the retained failed extraction/discovery
   evidence and determine safe preparation for a new accepted maintenance attempt.
   Preserve failed artifacts; do not treat startup loading or manual filesystem
   discovery as passing install evidence. Respect one pre-maintenance restart and
   no post-install restart for each valid attempt. The present host has already
   loaded a cluster, so returning to Extensions is not a fresh-main-window state.
   A new attempt must wait for real uninstall/removal completion; do not blindly
   repeat Install. Diagnose/record failure if it recurs.
2. Install the final candidate above and verify main/renderer bytes, package
   version, header action and actual logs before continuing. If changes are
   needed, rebuild/retest and record the revision actually exercised.
3. Exercise app/sidecar/init/ephemeral selection in the real viewer; observe request
   paths and immediate old-window clearing. Exercise displayed blur versus hidden
   cluster frame and **native** hide/minimize/return in both Auto and Pause. The
   native host window action channel is `window:window-action` with `minimize`,
   but no native minimize test has been executed. Pure DOM visibility simulation
   must remain labeled test-only.
4. Restart only the owned fixture's app with
   `kubectl --context kind-freelens-json-logs-spike exec -n readable-logs-ticket-13 lifecycle -c app -- touch /tmp/restart`.
   Its command exits and Kubernetes starts a new container. Observe restart-count/
   ID changes and clear/refetch or paused wait. Include an outstanding read with
   late success/failure where practical; ticket 12's scoped Node transport probe
   can be adapted to this owned namespace without fabricating responses.
5. Delete/recreate **only the owned Pod**, retain its old route/UID and verify
   stale attribution, stopped reads, disabled Retry, and explicit reopening for
   the new UID. Also exercise leave/reopen and disable cleanup using accepted
   maintenance rules. Record observation timing and API race limits honestly.
6. Check each original acceptance box only with its supporting evidence, update
   the local ticket, commit the completed result, then report done with its hash.
   No acceptance box is checked in this partial attempt.
