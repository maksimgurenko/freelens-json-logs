# 13: Handle container and Pod lifecycle changes

**Status:** ready-for-agent

**Blocked by:** [12: Refresh, pause, and recover from request failures](12-refresh-pause-and-recover-from-request-failures.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/13

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Switch among a Pod's containers and return to the view safely as the host, container instance or Pod identity changes. Logs retained for an old target remain clearly attributed to it and are never presented as a replacement target's current output.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Offer regular, init and ephemeral containers for explicit selection. Changing cluster, Pod or container immediately clears the old window, clears temporary manual profile selection to Auto, and starts a fresh automatically refreshing target when active.

- [x] Stop polling and invalidate pending results when hidden, minimized, left, closed or disabled. Merely losing keyboard focus while still displayed does not stop polling.

- [x] Returning to an automatic view requests a fresh snapshot subject to outstanding same-target requests; returning to an explicitly paused view preserves Pause. Closing discards the window and temporary refresh state; reopening starts fresh.

- [x] On an observed container restart within the same Pod, clear the old window, reject pre-restart results and preserve profile selection and refresh mode. Automatic mode fetches the current instance; Pause waits for Refresh/Resume, respecting the outstanding-request rule.

- [x] On original-Pod deletion or replacement by a different UID under the same name, stop fetching and report that the original target is gone. Any retained window remains visibly outdated and identified with the original target; require explicit reopening for the replacement.

- [x] Apply lifecycle rules to changes actually observed through supported host APIs. Do not claim an atomic UID-bound log read or guaranteed restart-detection timing, and never merge previous-instance/replacement-Pod records.

- [x] Cover visibility, target switches, context reset, close/reopen, restart and replacement with deterministic tests including late successes and failures. Exercise container switching, hide/minimize/return, detected restart, deletion and replacement in real Freelens and record limitations of the observations.


## Implementation and verification evidence

Completed GitHub #13 on the current `implementation/readable-logs` branch as
`freelens-readable-logs@0.1.7`. GitHub #13 was assigned to `@me` before work; no
GitHub comments, closure or messages were sent. Prototype/research worktrees were
not changed or merged. The Ralph runner owns Status updates.

Full commands, observed results, failed intermediate attempts, limitations and
artifact links: [Ticket 13 verification](../../../docs/verification/13/README.md).
The original failed attempt remains separately documented there.

Original acceptance criteria, in order:

1. Real packaged switching covers regular `app`/`sidecar`, init `setup` and
   ephemeral `debug`, immediately clearing the old window and resetting Pause to
   automatic mode. Core tests cover cluster/Pod name/UID/container reset and
   temporary manual profile selection returning to Auto. Saved-profile controls
   remain later-ticket work; current UI uses Auto with built-in Default.
2. Fixed real CSS-hidden frame polling by observing the owning native window's URL
   and visibility through standard Electron APIs and public extension IPC.
   Real hidden/native-minimized checks freeze identical records and stop both log
   and metadata polling; unfocused displayed views keep polling. Deferred tests
   reject late successes/failures after inactivity/disposal. Accepted fresh-main
   Disable removes the actual header action and visibility RPC; live cluster-frame
   disable is not claimed as supported maintenance.
3. Actual Auto return fetches fresh data; paused native restore keeps Pause and
   frozen rows with no log reads. A real late 403 after departure is ignored;
   reopening discards the former paused view and starts automatic mode. Tests
   cover outstanding same-target settlement across departure/reopen.
4. Two real app restarts keep the same Pod UID: Auto clears/refetches; Pause clears
   on observation and waits for explicit Refresh, which fetches once and remains
   paused. Tests preserve temporary profile/mode, reject pre-restart successes and
   failures, and handle incomplete/split restart-count and ID observations. The
   report explicitly records delayed Kubernetes observation and an early manual
   Refresh, rather than claiming guaranteed timing.
5. Real replacement observes a different UID under the same name; real deletion
   returns 404. Both freeze the original identified records as outdated, stop
   requests, disable target controls and omit Retry. Explicit reopening from the
   refreshed native Pod header opens the replacement UID with a fresh Auto view.
6. Public `podsApi.get` supplies observed UID/status; timestamped named log reads
   remain current-instance-only with no merge/cursor/previous logs. Standard
   Electron window/navigation events and extension-scoped IPC handle visibility.
   No atomic UID-bound read, guaranteed detection timing, cancellation or bounded
   transient response memory is promised.
7. Clean locked installation, strict TypeScript and **58 tests** pass under Node
   **24.18.0** / npm **11.16.0**, pinned SDK/core **1.10.3**. The actual package
   passes CommonJS/external-dependency/tarball inspection and repeat-build checks.
   All required real lifecycle scenarios above ran with the recorded production
   bundle hashes. Versioned entry filenames avoid the host's retained module cache
   during explicit uninstall/install updates without a post-install restart.

Final tarball SHA-256:
`57aa302d8d2b920b1b410052fc9bfb319a044c558066179b0fb8c5f1043796bd`.
Installed main/renderer bytes and packaged guide match the final build. The final
install used one submission in fresh main PID **2274052**, which remains unchanged
through working header/log verification. A preceding same-version reinstall failed
discovery and was preserved; the final clean attempt quarantined that failed
extraction only after all old processes exited. No repeated click or post-install
restart was used to turn a failed attempt into a claimed success. The owned test namespace was removed;
original shared Pod UIDs/restart counts, native dock tabs, workspace 7 placement,
and the user's active workspace/focus were preserved. The final host has no test
probe and remains usable on the original JSON fixture, paused for review.

Later tickets retain the profile/persistence, inspection/clipboard, scrolling/Find,
configuration recovery and complete release/performance gates.
