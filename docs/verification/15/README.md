# Ticket 15 — scroll position and Find

Production package **freelens-readable-logs 0.1.12**, installed and exercised in
actual **Freelens 1.10.3** on this Arch Linux/Wayland host, 2026-10-23 UTC
(2026-10-22 local). GitHub #15 was assigned to `@me` before implementation. Local
#12 was done with committed implementation/evidence, satisfying the Ralph
prerequisite while GitHub remains open for maintainer review. No GitHub comments,
closures or messages were posted. Prototype/research worktrees were not modified
or merged.

## Build and package

The final tarball SHA-256 is
`915ad8041753829218e3177abd074cb30b4741d95e2b059787b612fbaacfe9bd`.
[Installed identity](installed-identity.json) matches the actual installed main,
renderer and packaged guide to the rebuilt checkout. Main PID **2365693** is
unchanged from the pre-install maintenance launch through the final host checks.

With the existing project-local **Node 24.18.0 / npm 11.16.0** toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
```

[Clean locked install](locked-install.txt), [strict TypeScript](typecheck.txt),
[72 tests, no failures/skips](tests.txt), [package](package.txt),
[tarball inspection and actual CommonJS export loading](package-check.txt) pass.
Another locked install and [rebuild](rebuild.txt) produces
[identical tarball bytes](reproducible.txt). SDK/core remain pinned to 1.10.3;
React/MobX/SDK/Electron remain host supplied. Only root package version metadata
changes in the lockfile. Stable package/store/configuration identities are
unchanged; entry paths are versioned as `main-0.1.12.js`/`renderer-0.1.12.js`.
The displayed version now comes from the manifest at build time.

## Original acceptance criteria

| Criterion | Implementation and evidence |
| --- | --- |
| Follow bottom, retain visible surviving anchor including repeats, indicate lost anchor and provide To bottom | `LogViewport` captures the first visible row and its pixel offset. `windowOverlap` maps the longest observed exact old-suffix/new-prefix overlap without combining records. [Real scroll sequence](scroll.json) verifies bottom following after a paused Refresh; a repeated application-record occurrence at index 29 and offset -6.98px stays there after append; an anchor moves 150 → 110 after 40 old lines leave the 1,000-row tail, preserving offset within 0.3px; a further 1,100 emitted lines loses the anchor, shows the notice, and To bottom clears it and follows. A real subsequent automatic read follows row 2145. `viewport.test.ts` also covers repeated **exact transport lines**, lost anchors, bottom following and synchronous React renders. |
| Case-insensitive literal matching of exact application text or extracted message, excluding Kubernetes prefix, once per record | `findMatches` is the sole predicate producing the index array used by both counter and navigation. [Host Find matrix](find.json) matches decoded `decoded α`, original hidden `PRIVATE.NEEDLE[0]`, and repeated messages; a literal `.*` and an exact real Kubernetes timestamp prefix have zero results. A record matching original text and message counts once. `navigation.test.ts` covers these cases plus decoded newline matching at the pure-logic boundary. |
| Wrapping Previous/Next without filtering, original fields searchable, no regex/case switch | [Host matrix](find.json) visits indexes 29/30, wraps in both directions, checks Enter/Shift+Enter and retains all 180 rows. Hidden originals match while omitted from compact messages. No regex/case controls exist. [Native comparison](native-check.json) exercises the real native Logs search/arrows and extension query `row 214`: both show six results, native Next/Previous works, the native scroll extent is unchanged and the extension retains 1,000 rows. [Screenshot](native-comparison.png). |
| Recompute for accepted window/formatting; empty/no matches correct | [Scroll sequence](scroll.json) records hidden-field matches changing from 238 to 1,000 on paused snapshot replacement. `find.json` checks zero/empty-query counters and disabled navigation. Formatted records feed both presentation and Find; memoization depends on those messages. An automated fixture substitutes a different extracted message over unchanged originals to prove formatting recomputation. This is test-only formatting-seam evidence; a saved-profile editor/live switching belongs to #16–17. |
| Timestamps/wrap controls and new-view defaults; no global/profile persistence | [Before departure](reset-before.json) has query, timestamps off, wrap on and Raw on, with byte-for-byte unchanged extension settings and zero extra reads. [Reopened actual view](reset-after.json) has empty query, timestamps on, wrap off, Raw off, no selection and automatic mode. Settings remain schema 1 with only the existing global Inspection preference and SDK metadata. |
| Pause/paused Refresh/local reformatting compatibility without extra reads | `find.json` and `reset-before.json` observe Node HTTP/HTTPS requests for only the owned endpoint and the extension's explicit `tailLines=1000` query. Find, navigation, Raw, timestamps and wrap make **zero** extension log requests while paused. Every paused Refresh in `run-scroll.mjs` asserts exactly one real extension read and continued Pause. Formatting/search logic receives retained originals and formatted messages, with no host/request access. |
| Meaningful interaction tests and packaged/native comparison | The final 72-test suite includes the exhaustive overlap oracle, repeated exact lines, literal/decoded matching, wrapping/count consistency and a DOM-port regression reproducing React 17 synchronous publication. Executable probes exercise the actual installed UI, real API output and temporary-state reset. [Actual viewer](viewer-desktop.png), [native comparison](native-comparison.png), [independent finish review](finish-review.txt), [mechanical detector](design-detector.json). The independent review disposition is **ship**, scoped to this ticket and desktop size. |

## Host procedure and reproducible probes

The [accepted procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618)
was used for every installed test revision: a fresh main window, Extensions
before any cluster, explicit uninstall, stable removal, one Install submission,
Enabled/version check, then cluster/header/view checks without a post-install
restart. Final evidence: [fresh maintenance](fresh-maintenance.json),
[removal](removal.json), [single Install](install-action.json),
[Enabled 0.1.12](installed.json), [Pod header](header-click.json),
[initial view](initial.json). Launch variables were process-local
`CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100` and the documented same-filesystem
`TMPDIR`. There was no failed/cycling install on these launches, no overwrite
prompt and no global configuration change.

Only namespace **readable-logs-ticket-15** was owned for this check. Its
[fixture](fixture.yaml) emits 180 initial real records and then batches controlled
by `/tmp/emit`. `kubectl exec` writes a batch count; the Pod's main process emits
it to its real stdout. No log response was substituted. The host's public Pod
API and actual header action opened that fixture.

For a fresh fixture/installed package on localhost CDP port 9235, the substantive
interaction sequence is:

```sh
node scripts/host-cdp.mjs 770814 docs/verification/15/probes/show-fixture.js
node scripts/host-cdp.mjs 770814 docs/verification/14/probes/header.js
node scripts/host-cdp.mjs 770814 docs/verification/15/probes/setup.js
node scripts/host-cdp.mjs 770814 docs/verification/15/probes/find.js
node docs/verification/15/run-scroll.mjs
# reset-before.js, show-fixture.js, header.js, reset-after.js
# show-fixture.js, native-open.js, native-check.js, native-restore.js
node scripts/host-cdp.mjs 770814 docs/verification/15/probes/restore.js
```

The actual native window was focused during the final interaction checks, then
its original desktop state was restored. `setup.js` installs scoped Node transport
**observation only**. The final explicit restore removes the wrappers. Native
Logs uses a different request query, excluded from the extension request count.
Only the owned fixture endpoint is observed; credentials are not recorded.
The native check creates its own dock tab and removes only that tab, restoring
all original tab IDs and the active tab ([restoration](native-restored.json)).

## Defects and failed probes retained

The first installed 0.1.10 package exposed an inherited hard-coded displayed
version of 0.1.9 ([initial failure](preliminary-version-mismatch.json)). The
manifest and versioned bundles were 0.1.10, but that failed visible-version check
is not final acceptance. Build-time manifest injection fixes it; final 0.1.12
host/version/hash checks pass.

The next revision exposed a real scrolling defect: publishing follow status from
a native scroll listener synchronously triggered a React 17 render before the
new anchor was captured. It restored the old bottom position
([trace](anchor-defect.json), [visible trace](visible-scroll-diagnosis.json),
[failed interaction](before-scroll-fix-failed.json)). The fix stores anchor,
offset and applied coordinates before publishing status, and finishes snapshot
identity updates before notifying React. `viewport.test.ts` calls update
synchronously from the status callback to reproduce this failure. Final 0.1.12
host checks pass. Earlier .10/.11 artifacts are retained under `preliminary-*`
and `before-scroll-fix-*`; they are not final scroll acceptance.

A preliminary scroll probe produced `offset--negativeValue` while interpolating
a negative offset. That syntax failure occurred before its UI actions and was
corrected to parenthesized subtraction. An initial multiline query check also
assumed a single-line HTML search input would retain a literal newline; the host
query uses the decoded Unicode substring instead, while pure logic covers
newlines. Neither preliminary probe is counted as a pass.

The first native-arrow assertion selected the search-clear icon as well as the
two arrows ([failure](native-check-selector-failure.json)). The corrected
selector scopes the two direct arrow controls and the final
[native check](native-check.json) passes. This was a probe defect; it does not
establish that native arrows were disabled. The reviewer caught the failed
artifact before final approval; the corrected evidence and recaptures were
reviewed independently.

## Limits and restored state

The bounded API cannot identify unseen additions inside an identical repeated
whole window. Alignment uses the longest observed ordered overlap; no cursor,
exactly-once history or server record identity is claimed. A dropped anchor is
reported rather than silently assigned to a different retained occurrence.
These tests establish the supported desktop interaction, not mobile support or
the five-warmed-run performance/full-release gates of #19. Live saved-profile
switching remains #16–17; alternate formatter messages here are automated evidence.

[Probe restoration](probe-restored.json) confirms no transport wrapper remains.
The [owned namespace is deleted](fixture-cleanup.txt); the two shared fixture Pod
UIDs and restart counts are [unchanged](shared-fixtures-preserved.json).
Original native dock state is restored. [Desktop restoration](desktop-restored.json)
confirms workspace 2 and the original focused window. The global Inspection
preference remains Bottom. [Final host](final-host.json) is installed 0.1.12,
paused on the shared `single-json/json` fixture, with empty Find and normal initial
display defaults. Kubeconfig, RBAC, unrelated resources and settings are preserved.
Pre-existing untracked setup files and runtime `.ralph` data are excluded from
this ticket's commit.
