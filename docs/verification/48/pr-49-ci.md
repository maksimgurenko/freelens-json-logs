# PR #49: CI publication corrections

[Subsequent three-angle review](pr-49-review.md) records three independently
confirmed and corrected contract defects, the new package identity and current
validation. The CI-publication evidence below retains its `59a0d558` scope.

[PR #49](https://github.com/maksimgurenko/freelens-json-logs/pull/49) publishes
the completed Find implementation. Its initial GitHub Actions runs exposed a
browser-launcher problem and an unrelated production metadata invalidation bug.

## Browser launcher

On the Ubuntu 24.04 runner, automatic discovery selected `/usr/bin/chromium`
(resolving to `/usr/local/share/chromium/chrome-linux/chrome`), which timed out
both waiting for its DevTools port and during a five-second `--version` probe.
The installed `/usr/bin/google-chrome` reported Chrome 156.0.8078.47 and started
successfully. CI now sets the existing `CHROME_BIN` override to that binary.
No sandbox bypass, skipped test or extended production deadline was added.
The [diagnostic CI run](https://github.com/maksimgurenko/freelens-json-logs/actions/runs/40790522348)
preserves the launcher observations and the subsequent behavioral failure.

## Unchanged Pod observations restarted Find

Every metadata observation copied the Pod labels, even when their own keys and
values were unchanged. That invalidated the viewer's default-profile memo,
reformatted the retained records and changed Find's message revision without a
query or log-window change. Matching could restart during grouped-mark clicks,
selection seeding or a deliberately held reply.

The new regression deterministically fails on the old code: the first ordinary
three-second Pod poll submits a second match for the unchanged `x` query.
[The unit regression also fails before the fix](ci-publication/metadata-red.txt).
`SnapshotSession` now reuses equal label inputs, including reordered keys, while
actual label changes still publish new values and trigger profile reevaluation.
Polling, restart detection, the one-second matching limit and resource thresholds
remain unchanged.

One pending-deselection test previously re-entered the same `upstream` query and
waited for the unintended metadata restart. It now edits to `ups`, which has the
same matching records, and explicitly requires that edit to dispatch before
exercising cancellation. Its behavior assertions remain intact. Temporary launcher
and transaction instrumentation was removed.

## Validation and artifact scope

The [complete mounted production-browser suite](ci-publication/browser-green.json),
251 unit/state tests, typecheck, six desktop-policy checks, actual-worker checks,
strict package checks and two-build reproducibility pass locally.
[Recorded results](ci-publication/validation.txt). Current CI is linked from the
[PR checks](https://github.com/maksimgurenko/freelens-json-logs/pull/49/checks).

The corrected `freelens-readable-logs@0.1.34` tarball has SHA-256
`59a0d5581f038230a6eee780f03c471c00bf81a447a5ac3051cfffc7859ef6e8`.
Earlier native evidence remains scoped to the reviewed `15f99148` artifact;
this follow-up verifies the metadata correction through the actual mounted
production renderer and SDK stand-ins, without claiming a fresh native-input run.
Windows/macOS testing remains future work, both platforms unverified. The resource
follow-up remains closed as an accepted host limitation; this correction is separate
from that investigation and does not claim to fix the host watch timer.
