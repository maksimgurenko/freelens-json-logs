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

- [ ] Offer regular, init and ephemeral containers for explicit selection. Changing cluster, Pod or container immediately clears the old window, clears temporary manual profile selection to Auto, and starts a fresh automatically refreshing target when active.

- [ ] Stop polling and invalidate pending results when hidden, minimized, left, closed or disabled. Merely losing keyboard focus while still displayed does not stop polling.

- [ ] Returning to an automatic view requests a fresh snapshot subject to outstanding same-target requests; returning to an explicitly paused view preserves Pause. Closing discards the window and temporary refresh state; reopening starts fresh.

- [ ] On an observed container restart within the same Pod, clear the old window, reject pre-restart results and preserve profile selection and refresh mode. Automatic mode fetches the current instance; Pause waits for Refresh/Resume, respecting the outstanding-request rule.

- [ ] On original-Pod deletion or replacement by a different UID under the same name, stop fetching and report that the original target is gone. Any retained window remains visibly outdated and identified with the original target; require explicit reopening for the replacement.

- [ ] Apply lifecycle rules to changes actually observed through supported host APIs. Do not claim an atomic UID-bound log read or guaranteed restart-detection timing, and never merge previous-instance/replacement-Pod records.

- [ ] Cover visibility, target switches, context reset, close/reopen, restart and replacement with deterministic tests including late successes and failures. Exercise container switching, hide/minimize/return, detected restart, deletion and replacement in real Freelens and record limitations of the observations.


## Implementation progress and verification (retry required)

GitHub #13 was assigned to `@me` before work. Production 0.1.3 lifecycle handling
is implemented in the session, supported Pod metadata adapter and document/frame
visibility binding. All 57 automated tests pass (23 new lifecycle tests); strict
TypeScript, locked installation, build, tarball inspection and reproducible rebuild
pass with pinned SDK/core 1.10.3 and Node 24.18.0/npm 11.16.0.

**Not complete. Original acceptance boxes remain unchecked.** The single accepted
host installation attempt failed after extraction; no real installed-viewer
lifecycle acceptance is claimed. The old 0.1.2 is uninstalled; failed 0.1.3 remains
extracted but undiscovered. Freelens remains running at Extensions with the error
visible, without a post-install restart or second Install submission.

[Ticket 13 evidence and concrete retry handoff](../../../docs/verification/13/README.md)
separates test evidence, real SDK shape observations, failed-install facts,
limitations and remaining host integration/validation. It records the final
candidate hash and the different earlier bytes used in the failed attempt. The
isolated `readable-logs-ticket-13/lifecycle` Pod remains available for completing
real container/restart/deletion/replacement checks; original fixtures are preserved.

A fresh context can investigate/recover installation and finish the adapter's
real-host lifecycle work without a known human decision or missing credential.
Use retry; do not claim done until every original criterion has real required
evidence. The runner owns Status changes. No GitHub comment, closure, message,
prototype merge or global agent configuration change was performed.
