# Ticket 13 verification: container and Pod lifecycle

Ticket 13 is complete on `implementation/readable-logs` as
`freelens-readable-logs@0.1.7`, with the original acceptance criteria checked in
[the local ticket](../../../.scratch/readable-logs/issues/13-handle-container-and-pod-lifecycle-changes.md).
GitHub #13 was assigned to `@me` before work. No issue comments, closure, messages,
prototype merges, global agent configuration changes or unrelated commits were made.
The Ralph runner owns the ticket Status.

## Production revision and build

The final installed tarball SHA-256 is
`57aa302d8d2b920b1b410052fc9bfb319a044c558066179b0fb8c5f1043796bd`.
The code exercised throughout the passing lifecycle matrix has these SHA-256s:

- Main: `ae590a88143fd0b9034902b660c8d59b46c8554ba25ffb1c2609165671ce6361`.
- Renderer: `77093dca02bfa7bf4c16677ded887dd62c4b304689ec3ddb80ac41da6572e324`.

[Final installed hashes](continuation/final-package-hashes.txt) match both rebuilt
bundles and the packaged development guide. The matrix initially used tarball
`b828fb7a7cb374bea53ea47aeb2b9e8ac44d5b8d8745eb82e289c859156e61f6`;
the final tarball corrects one documentation sentence about persistence. Both
runtime bundles are byte-identical. After the failed reinstall and clean recovery
described below, the final tarball itself passed header, RPC-dependent opening and
actual-log verification.
[Rebuild](continuation/rebuild.txt) reproduces the final
[tarball hash](continuation/reproducible.txt).

Pinned SDK/core **1.10.3**, Node **24.18.0**, npm **11.16.0**. Commands from the repo:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.7.tgz
```

With an ordinary Node 24/npm 11 installation the equivalent `npm` commands are in
[local development](../../local-development.md). Results:
[clean locked install](continuation/locked-install.txt),
[strict TypeScript](continuation/typecheck.txt),
[58 passing tests, zero failures/skips](continuation/tests.txt),
[build/pack](continuation/package.txt), and
[actual tarball inspection/CommonJS loading](continuation/package-check.txt).
The final lockfile changes only root package versions; transitive dependency
versions, URLs and integrity hashes remain the previously committed ones. Accidental
transitive edits during intermediate version bumps were corrected before this
final clean install. Host React/MobX/SDK implementations and Electron are external.

## Changes needed after the first attempt

The existing session implementation handles all container kinds, context reset,
observed restart counts/IDs, sticky original Pod identity, outstanding requests,
and metadata observations during Pause. This continuation completed its host
integration and found two material defects:

1. **CSS-hidden cluster frames kept polling.** The actual host's iframe remains
   geometrically intersecting and its document stays visible when the main window
   moves to Extensions. [Failed check](continuation/hidden.json) and
   [actual frame styles](continuation/hidden-frame-diagnosis.json) reproduce this.
   Main now observes the owning native window's URL and hide/minimize/restore/close
   events with standard Electron APIs. Public extension RPC identifies that window;
   extension-scoped broadcasts relay updates to a unique per-view channel. The
   renderer starts ineligible until the initial answer. Focus/blur are ignored.
   Cleanup removes both renderer and main subscriptions.
2. **Fixed module paths reused old main code during updates.** The 1.10.3 loader
   calls `require(extAbsolutePath).default` without clearing Node's module cache.
   Intermediate installed packages reported Enabled but had no new visibility
   RPC handler. `out/main-<version>.js` and `out/renderer-<version>.js` now provide
   unique module paths, with the same stable package/store IDs. The build cleans
   obsolete outputs and the package check enforces those manifest paths. The
   versioned package loaded its RPC and worked immediately after explicit update,
   under the same main PID. No host cache or host source was patched.

The attempted renderer-only relay and broadcast subscription experiments are
retained under `renderer-relay-*`, `broadcast-relay-*` and `cached-main-*`.
They are failed intermediate checks, not acceptance. In particular, broadcast
callbacks have no sender in this host; public RPC preserves it. Earlier root
renderer behavior is not used to establish a general activation claim.

## Actual installation and maintenance

The initial extracted-but-undiscovered 0.1.3 failure is preserved in
[the first attempt](first-attempt.md). In this continuation the
[preparation check](continuation/install-before.json) still failed; the failed
extraction was quarantined only after every old host process exited, and a fresh
main-window installation succeeded once. Its underlying discovery failure remains
unestablished, including its recurrence during the later same-version reinstall. No manual discovery nudge or startup-loaded package is counted as
passing installation evidence.

Every subsequent candidate update used a separate valid maintenance attempt:
fully quit/reopen before maintenance, Extensions before any cluster, explicit
Uninstall, wait for UI and both package locations to disappear, one Install
submission, verify Enabled/version, then open the cluster without another restart.
This was development of different candidates, not repeated Install clicks to
hide one failed attempt. Process-local same-filesystem
`TMPDIR=$HOME/.cache/freelens-readable-logs/tmp` was used; no global setting changed.

The passing versioned update is recorded in [fresh main](continuation/fresh-update.json),
[removal](continuation/versioned-removal-settled.json),
[one submission](continuation/final-install-action.json),
[Enabled](continuation/final-install-result.json),
[header](continuation/final-header-click.json), and
[actual initial logs](continuation/final-initial-view.json).

Disable was performed from another [fresh main](continuation/fresh-disable.json).
[Disabled status](continuation/disabled.json) and
[real host check](continuation/disabled-contributions.json) show no Pod action and
no registered visibility RPC. Live disable with already-loaded cluster frames was
not used as an unsupported shortcut; deterministic disposal tests establish
pending-result invalidation, while this host check establishes contribution and
RPC removal under the accepted maintenance procedure.

The final documentation-corrected tarball first failed discovery after explicit
uninstall and stable removal of the disabled package.
[Failed attempt](continuation/failed-final-maintenance-installed.json) and
[extracted but unlinked state](continuation/failed-final-state.json) preserve that
failure. Its result was initially overlooked because a later shell command masked
the exit code; it is not counted as a passing install. Verification command chains
now stop on error. No second Install click was sent in that failed session.

For a separate clean recovery attempt, every old host process exited and the failed
extraction was quarantined before launch, preserving it for diagnosis. The exact
final tarball was installed from
[fresh main PID 2274052](continuation/fresh-final-install.json), with
[one submission](continuation/final-maintenance-install-action.json) and
[successful Enabled state](continuation/final-maintenance-installed.json).
The [final header](continuation/final-maintenance-header.json),
[usable logs](continuation/final-view.json),
[screenshot](continuation/final-view.png) and
[final host](continuation/final-host.json) retain that same PID, with no
post-install restart. [Host install log](continuation/final-install-host-log.txt).

## Original acceptance criteria and evidence

| Criterion | Observed and automated evidence |
| --- | --- |
| Regular/init/ephemeral choices; target reset | [Actual container switches](continuation/final-container-switches.json) offer `app`, `sidecar`, init `setup` and ephemeral `debug`. Each switch starts from Pause, immediately has zero old rows and returns to Auto/automatic refresh before showing the selected container's real output. Tests cover independent cluster, Pod name/UID and container changes and temporary manual-profile reset. |
| Hidden/minimized/left/closed/disabled; ignore blur | [Hidden frame](continuation/final-hidden.json) retains identical first/last rows and makes zero metadata/log reads for 6.5 seconds, including after a held real response settles. [Native minimize Auto](continuation/native-minimize-auto.json), [frozen minimized Auto](continuation/minimized-auto.json), [native minimize Pause](continuation/native-minimize-paused.json), [frozen minimized Pause](continuation/minimized-paused.json) use the native host action, not a simulated visibility event. [Displayed without focus](continuation/final-unfocused-polling.json) continues polling. [Departure](continuation/left.json) and disabled-contribution evidence above complete the host checks; late successes/failures and observer cleanup also pass deterministically. |
| Automatic/paused return; fresh reopening | [Return from hidden frame](continuation/final-returned.json) and [restore Auto](continuation/restored-auto.json) fetch fresh snapshots. [Restore Pause](continuation/restored-paused.json) retains identical rows and has only metadata observations, no log requests. [Leave with pending read](continuation/leave-pending.json) then [late real 403](continuation/left.json) does not revive the departed view or start more reads. [Reopen](continuation/reopened.json) starts automatic mode fresh, discarding the former Pause/window. Same-target outstanding settlement and both late outcomes are deterministic fixtures. |
| Restart clears old window; preserves mode/profile | [Auto restart](continuation/restart-auto.json) records the real new restart count/ID, DOM transition to zero rows, then current-instance logs. [Paused restart](continuation/restart-paused.json) has zero rows after observation and no log read without an action; [explicit one-off Refresh](continuation/restart-paused-refresh.json) reads the new instance once and stays paused. Deterministic tests assert manual-profile preservation, both modes, pending pre-restart successes/failures, incomplete status and count/ID observations without a second reset. |
| Deletion/replacement stops original target | [Replacement](continuation/replacement.json) observes a different UID while returning paused, keeps the original UID and exact retained first/last records, marks them outdated, disables target/actions, omits Retry and issues zero further reads. [Explicit reopen](continuation/replacement-reopened.json) selects the replacement UID and automatic logs. [Deletion](continuation/deletion.json) receives a real metadata 404 and retains that view's old UID/window, outdated and stopped. [Replacement screenshot](continuation/replacement.png), [deletion screenshot](continuation/deletion.png). |
| Supported observations and stated limits | Metadata uses public `podsApi.get`; native visibility/navigation uses standard Electron events and public extension IPC. Requests remain named current-instance snapshots (`previous=false`, `follow=false`, no cursor) and replace the window. Tests prove stale-generation rejection. Observation gaps and API races below are explicit; no atomic UID binding, guaranteed detection latency, cancellation or snapshot merging is claimed. |
| Deterministic plus real-host matrix | 58 tests pass, including 24 lifecycle tests beyond ticket 12's 34-test baseline. Real 1.10.3 installed-package checks cover container kinds, CSS hiding, native minimize/restore in both modes, unfocused polling, leave/reopen, detected restarts, original deletion and replacement. They use the bundle hashes above, not a prototype or test-only renderer. |

Saved-profile controls arrive in later tickets. Current UI shows Auto/Default;
manual-profile lifecycle state is implemented and tested through the session API,
not claimed as a completed saved-profile editor or persistence gate.

## Methods, limitations and preserved state

Verification uses the already enabled localhost CDP port 9235 through
`scripts/host-cdp.mjs`. Reproducible [probe sources](continuation/probes/) operate
only on the ticket fixture and are never packaged. The scoped Node HTTP probe
records paths, timing, response status, UID and instance metadata. It can hold a
request before transmission and add an impersonation header to obtain a real
Kubernetes 403. It does not replace snapshots or fabricate Kubernetes responses.
A held request is still outstanding; stale-result rejection is not cancellation.
The host checks plus deterministic deferred tests have different evidential scope.

Two verification attempts were not passes and remain visible:

- The first paused minimize action had no focused native window, so it did nothing.
  `*-paused-initial-noop.json` preserves this. The successful repeat explicitly
  checks focus and requires an actual hidden-document event before continuing.
- The second restart took longer than the initial 15-second observation probe.
  [Timing failure](continuation/restart-paused-timing-failure.json) and
  [early explicit Refresh](continuation/restart-paused-early-refresh.json) are not
  counted as paused post-restart acceptance. That Refresh happened before the new
  instance was observed, and returned then-current API output. Once the host
  reported restart count 2, the viewer cleared it; the separate passing paused
  observation and subsequent one-off Refresh establish the required behavior.

The native Pod drawer also cached the old object after replacement. The first
reopen used that stale drawer and correctly opened an already-gone old UID. A
public `podsStore.loadAll({namespaces:[ownedNamespace],merge:true})` refreshed the
native Pod object ([before/after UIDs](continuation/refresh-native-pod.json));
clicking its actual header then opened the new UID. The extension never silently
followed the replacement. This host-cache limitation is distinct from the viewer's
explicit reopen rule.

UID/instance sampling cannot bind a name-addressed log request atomically. A Pod
or container can change between observations, and no restart-detection timing is
guaranteed. A hung metadata/log read can delay detection; hidden views stop
observations. The 5 MiB retention budget does not bound download/transient memory.
These checks do not replace later profile, clipboard, scroll/Find, full release,
configuration-recovery or five-run responsiveness gates.

Only the owned `readable-logs-ticket-13` Pod was restarted, deleted or recreated.
[Cleanup](continuation/cleanup.txt) removes its namespace. The two shared original
fixture Pods remain Running with unchanged UIDs and zero restarts
([final facts](continuation/preserved-fixtures.json)). Native dock tabs were
preserved. [All test transport/DOM observers were restored](continuation/probe-restored.json)
before quitting that validation host. The final host contains no test probe and
shows the original `single-json/json` fixture in Pause. It remains on workspace 7;
the user's active workspace 2 and original focused window are unchanged. No
credentials, kubeconfig, RBAC, unrelated resources or extension settings were edited.
