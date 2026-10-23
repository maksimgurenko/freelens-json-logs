# Ticket 19 — verified supported local release

GitHub #19 was assigned to `@me` before work. This is the sole selected ticket;
local #13, #14, #15, #17 and #18 were done with committed implementation/evidence.
GitHub remains open for maintainer review. No comments, external messages,
prototype/worktree merges or global agent configuration changes were made.
Published commits are preserved; subsequent work uses new commits.

## Production release and original acceptance

**Freelens 1.10.3**, **freelens-readable-logs 0.1.20**, source revision
**b9521a4041d216820fa5851ee2dea5b7256b1b60**, Arch Linux/Wayland. The prior
0.1.18 and 0.1.19 observations below remain explicitly identified by version.
They are not silently relabeled as 0.1.20 outcomes.

[Clean build](clean-build.json) archives only tracked sources from that revision
into an initially absent directory, installs locked dependencies and runs strict
TypeScript, all **100 tests** (zero failures/skips), packaging and tarball/CommonJS
inspection. Exact commands and Node **24.18.0** / npm **11.16.0** results are in
[toolchain](toolchain.txt), [npm](npm-version.txt), [locked installation](locked-install.txt),
[typecheck](typecheck.txt), [tests](tests.txt), [package](package.txt),
[inspection](package-check.txt) and [tarball contents](tarball-files.txt).
The machine-default Node 26 is not the build toolchain.

All ten original acceptance criteria are satisfied. The actual installed release
is **0.1.20**; the local ticket records checked criteria and this evidence. GitHub
remains open for maintainer review. No public distribution is included.

| Original criterion | Passing production evidence |
| --- | --- |
| Clean locked TypeScript build, tests, inspect and run actual tarball | [Clean revision/commands](clean-build.json), [100 passing tests](tests.txt), [tarball inspection](package-check.txt), [reproduction](reproducible.json), [final installed hashes](final-installed-identity.json). |
| Fresh-main-window maintenance; explicit uninstall/wait/single install; no post-install restart | [Fresh main](fresh-fix-maintenance.json), [removal](fix-removal.json), [single update submission](fix-install.json), [working before restart](fix-update-preserved.json); independently [clean install after removal](clean20-install.json), [working directly](clean20-view.json). |
| Actual version/Enabled, approved header placement and correct target/logs | [Actual row status](clean20-installed.json), [native Logs and Readable logs as toolbar siblings](final-header-placement.json), [target UID](final-header-target.json), [header click](final-header-action.json), [usable view](final-usable.json), [runtime](final-review.json). |
| Complete profiles/preferences across full quit/reopen and explicit update; temporary resets and migrations | [Full settings before Quit](fix-before-full-quit.json), [every old PID exited](normal-full-reopen.json), [exact settings/new-view defaults after reopen](fix-after-full-reopen.json), [update preservation](fix-update-preserved.json), [schema 1](schema1-20-migration.json), [three complete schema 2 profiles](schema2-20-migration.json). |
| Disable/uninstall removes contributions, invalidates work, retains settings; scoped explicit removal and backups | [Disabled header](disabled-page20-header.json), [disabled page](disabled-page20-page.json), [disable/enable settings and backups](disable-enable-preserved.json), [uninstalled header](uninstall20-header-absent.json), [uninstalled page](uninstall20-page-absent.json), [retained full settings/backups](uninstall-preserved.json), [only-extension removal and preserved backups](explicit-removal20.json). Current deterministic disposal tests and actual late-response rejection below cover invalidation; the accepted fresh-main maintenance state has no active viewer read. |
| Actual host target/container/visibility/restart/replacement/empty/error matrix | [Container kinds and resets](lifecycle20-switches.json), [automatic restart](lifecycle20-restart-auto.json), [paused restart/Refresh](lifecycle20-restart-paused.json), [hidden Auto](lifecycle20-hidden-auto.json), [hidden Pause](lifecycle20-hidden-paused.json), [returns](lifecycle20-return-auto.json), [native minimize Auto](final20-minimize-auto-hidden.json), [native return](final20-minimize-auto-returned.json), [minimize/return Pause](final20-minimize-paused-returned.json), [late 403/departure/reopen](lifecycle20-leave-reopen.json), [different UID](lifecycle20-replacement.json), [real 404](lifecycle20-deletion.json), [empty/malformed/oversized](fix-retention.json), [real Kubernetes denial](fix-denied.json), [real socket fault](fix-offline.json). |
| Retention/originals, clipboard, layouts, Find/scroll and Save/Cancel | [Retention oracle](fix-retention.json), [18 clipboard comparisons/layouts/Find](fix-interactions.json), [surviving anchor](fix-scroll-overlap.json), [lost anchor/expired Bottom selection](fix-scroll-loss.json), [bottom following](fix-scroll-follow.json), [actual saved profiles and Cancel](profiles.json), [temporary editor/sample not persisted](fix-before-full-quit.json), [ordinary profile Save after reset](future20-reset.json). |
| Five warmed responsiveness runs, network separated, material defects resolved | [1,000-row runs](fix-performance-bounded.json), [near-budget UTF-8 runs](fix-performance-near.json). Across both sets, worst response-through-paint opportunity **191.6 ms**, Pause **46.1 ms**, navigation **30.8 ms**; all within the 1,000/100 ms targets. [Refresh flicker resolved](flicker-after.json). |
| Full corrupt/newer preservation, confirmation, exact backup/reset and failed backup | [Full controlled input](controlled-valid-20.json), [corrupt preservation/cancellation/incidental writes](corrupt20-preservation.json), [real failed backup](corrupt20-failed-backup.json), [confirmed corrupt reset](corrupt20-reset.json), [future preservation](future20-preservation.json), [future reset](future20-reset.json), [exact original backup copies](backup-verification.json). |
| Supported local workflow and limits documented | [Packaged guide](../../local-development.md): pinned build/host, stable identities, process-local launch, update/disable/uninstall, recovery, backup/reset/removal and API limitations. |

Tarball SHA-256:
`8dfd57b2489b87d8434144d83c7c7a44b7f67726f18f13fa0b637b77fa9c9de7`.
[Second build](rebuild.txt) and [inspection](rebuilt-package-check.txt) reproduce
[identical bytes](reproducible.json). [Installed identity](installed-identity.json)
compares the actual installed main, renderer, manifest and packaged guide with
the clean checkout's files. Host libraries remain external; stable package,
store/configuration identities and versioned entry filenames remain intact.

## Actual updates and complete configuration

0.1.18 → 0.1.19 used [one pre-maintenance native quit/reopen](fresh-maintenance.json),
Extensions before any cluster, explicit Uninstall/wait, one Install, Enabled/version,
then the actual Pod header and usable logs under the same main PID. The full
[three-profile configuration](profiles.json) was created through ordinary controls,
including formatting lists, numeric interpretation/mapping, multiple matching
conditions, enabled/disabled states, custom order, global default and Inspection.
[Update preservation](update-preserved.json) compares the complete configuration;
it is not a stored string marker. Save/Cancel/validation/sample actions made no
log request.

The UI correction's 0.1.19 → 0.1.20 update repeats the accepted sequence:
[fresh main](fresh-fix-maintenance.json), [Extensions](fix-extensions.json),
[Uninstall](fix-uninstall.json), [confirmation](fix-confirm-uninstall.json),
[stable removal retaining settings](fix-removal.json), [one Install](fix-install.json),
[Enabled 0.1.20](fix-installed.json), [cluster](fix-open-cluster.json),
[current Pod UID](fix-target.json), [actual header action](fix-header.json),
[full saved configuration and usable logs](fix-update-preserved.json).
There was no overwrite/reinstall prompt or post-install restart.

All launches use only process-local `CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100`
and the documented same-filesystem TMPDIR. The earlier watcher root cause remains
unconfirmed. `host.py` silently launches on workspace 7 and records before/after
workspace/focus and every old process exiting. The early
[certificate-not-ready observation](preliminary-fix-cluster-certificate-not-ready.json)
is not failed installation: the corrected metadata opener waits only for that
known initial certificate error, then verifies the current target without restarting.

## User feedback: snapshot flicker

The user reported a brief box containing “snapshot” above the logs. The actual
installed 0.1.19 [red-capable loop](probes/refresh-flicker.js) produced
[a failure](flicker-before.json): [the trace](flicker-before-trace.json) observes
three transient **Reading log snapshot…** banners and **44.99 px** changes to
both log-area top and height. The row count remains 1,000 throughout, ruling out
rows clearing as this symptom's cause. A temporary extension-only style hiding
transient notices produces [zero visible banners and zero movement](flicker-isolated-banner.json).
No transport response or host code was substituted.

0.1.20 removes routine loading/waiting paragraphs from the document flow and uses
the existing fixed-width update-status slot. The records region exposes
`aria-busy`; slow and error notices remain explicit. The same actual-host loop
[now passes](flicker-after.json), with **zero** visible snapshot banners and
**zero** measured log-area movement. This is a rendering fix, not a cadence,
request, stale-result or cancellation change. The [actual slow/busy check](fix-busy-slow.json)
verifies quiet accessible loading, the retained 15-second notice and responsive Pause.

## User clarification: Bottom inspector

The supplied [screenshot](user-bottom-placeholder.png) was inspected. The user
explicitly wants Bottom Inspection to occupy no height without a valid selected
record, retaining the saved Bottom preference. [Before](bottom-before.json),
the actual inspector reserves space and fails the regression probe.

The 0.1.20 renderer now mounts the Bottom inspector only for a valid selection.
[Actual-host regression](bottom-after.json) verifies full-height logs with no
selection, opening on selection, collapse on Close and unavailable selection,
retained Bottom preference, and unchanged Side empty-state guidance. The scoped
[mechanical detector](fix-design-detector.json) reports no findings.
[Collapsed capture](bottom-collapsed.png) and [selected capture](bottom-selected.png)
were visually inspected together; the desktop capture reports preserve the
workspace/focus current at each operation. Inline and Side behavior remain scoped
out of this clarification except for regression checks.

## Earlier release observations (versioned, not final gate completion)

Installed **0.1.19** passed the [retention matrix](final-retention.json):
1,000 lines, real 1,100-line over-tail input, 5,148,000-byte near-budget UTF-8,
5,241,660-byte retained suffix from over-budget input, repeated lines,
malformed/scalar/blank inputs, an oversized newest record, and genuine empty output.
An independent byte/suffix oracle checks actual production state, rendered row
counts and exact originals. Only the over-tail case changes the owned outgoing
request's tail to 1,100; Kubernetes returns genuine stdout and unchanged responses.
Normal production queries remain `tailLines=1000`.

[0.1.19 inspection/copy/Find](final-interactions.json) covers all layouts and
18 actual Electron clipboard comparisons, including whitespace, Unicode, escapes,
blank lines and Kubernetes timestamp precision; clipboard contents are restored.
[Real 403](final-denied.json) and [real closed-port failure](final-offline.json)
verify exact retained outdated originals, stopped automatic refresh, failed explicit
Retry without a loop and successful explicit recovery restoring automatic reads.
These probes affect only the owned fixture endpoint and restore transports.

0.1.19 [container switches](lifecycle-switches.json) cover regular/init/ephemeral,
immediate old-window clearing and manual/Pause reset. [Automatic restart](restart-auto.json)
and [paused restart](restart-paused.json) observe real changed restart count/ID,
window clearing, mode/manual preservation and explicit paused Refresh. Only the
owned lifecycle Pod is restarted. [Late real 403 after departure](leave-reopen.json)
is discarded and reopening starts fresh. [Replacement](replacement.json) observes
a different UID after returning from a hidden frame; [deletion](deletion.json)
observes a real 404. Both retain the original UID/window, mark it outdated and
stop further reads. Native Pod cache refresh is explicit before reopening.

[Paused hide/return](paused-hidden-return.json) and
[automatic hide/return](automatic-hidden-return.json) pass under 0.1.19, including
settlement of a held real read while hidden. Document visibility alone remains
insufficient for cached cluster frames; the existing main visibility observer and
extension-scoped IPC are retained.

Two sets of five warmed **0.1.19** runs meet the accepted response/Pause/navigation
targets: [1,000 rows](final-performance-bounded.json) and
[near 5 MiB](final-performance-near.json). Measurements separate actual network
wait, prepend the real response-end timestamp before SDK end processing, and
check usable DOM geometry plus two paint opportunities. This is not a guarantee
of physical scanout timing or total process memory.

## Latest-package checks after the UI fixes

The installed **0.1.20** now passes [native automatic minimize/restore](final20-minimize-auto-hidden.json)
and [paused minimize/restore](final20-minimize-paused-hidden.json), with separate
[automatic return](final20-minimize-auto-returned.json) and
[paused return](final20-minimize-paused-returned.json). The native and desktop
reports for both cycles record genuine minimize events, the continuous frozen
interval before focus restoration, public native restoration and preserved desktop
state. Healthy explicit recovery establishes the baseline before these final passes. No post-install restart or host modification establishes these results.

Both sets of five warmed measurements pass again on 0.1.20:
[1,000 rows](fix-performance-bounded.json) and [near 5 MiB](fix-performance-near.json).
The [retention matrix](fix-retention.json) and [clipboard/layout/Find matrix](fix-interactions.json)
also pass again against the corrected installed package. Earlier-version results
remain useful history, not substitutes for these final-package observations.

## Probe failures retained

All `preliminary-*` results are excluded from acceptance. Early timing probes
read the stale alternate React fiber or treated an initially unmounted session as
an error. The corrected helper reads the current React tree. Pause DOM timing is
measured after publication, rather than requiring an undocumented synchronous commit.
The initial maintenance menu selectors also assumed labels without native icon
text and the label “Enable”; the actual command is titled “Enabled”. The corrected
selectors use the native title, and final status checks read the actual package row.
No failed selector clicked Disable/Enable or is counted as successful maintenance.
The initial over-tail override changed a URL whose separate request options then
overrode its path; the corrected probe records both original and transmitted paths.
The paused-restart probe wrongly expected an empty snapshot object; production
correctly clears it to undefined and renders zero records. Its corrected assertion
checks the rendered/retained zero-window behavior without changing the criterion.

Native minimize needs one continuous observation before focus restoration.
Refocusing a minimized target immediately can restore it. The initial generic
focus helper did exactly that when Freelens was already the user's focused window.
Other attempts lacked a focused renderer, or treated a second CLI invocation as
unminimization. `native-cycle.py` separates minimize/frozen observation/restore and
uses explicit public native actions; failed artifacts remain failures. A held
request left across lengthy probe debugging also produced a visible
`Request Timeout` (the underlying timeout origin was not isolated); that
contaminated the next automatic-return baseline and is
not evidence of a production retry loop. `recover-baseline.js` establishes a
healthy explicit-Retry baseline before fresh minimize checks.

The first scroll probe failed before any append: background scroll did not leave
the recorded Following state. It is excluded. The focused 0.1.20 surviving/lost
anchor and following checks linked above all pass; they also verify that Bottom
Inspection collapses when the selected record leaves the bounded window.

## Completion, cleanup and reproduction

The original application settings are [restored](final-review.json): no saved
profiles, global built-in Default, Bottom Inspection. Only host-owned version
metadata changes from the original 0.1.18 value to 0.1.20. The final view is
paused on the original shared `single-json/json` Pod, in Readable mode with normal
new-view defaults and no selected record or empty Bottom inspector. [Final capture](final-review.png)
and [desktop facts](final-review-desktop.json) preserve the user's workspace/focus
current at that operation; Freelens stays on workspace **7**.

[Only the ticket namespace is deleted](fixture-cleanup.txt). Both original shared
Pod UIDs/restart counts are [unchanged](shared-fixtures-preserved.json). No RBAC,
kubeconfig, credentials, other extension settings or native dock tabs were edited.
[Explicit removal](explicit-removal20.json) hashes other extension-store files
before/after the scoped operation while the host is stopped; they are identical.
The two ticket-created corrupt/future backups were moved to the documented chosen
location outside the active settings directory, with identical hashes, and exact
copies remain under [backups/](backups/). No pre-existing backup content was removed.
[Final binaries](final-installed-identity.json) still match the clean tarball.
No test transport/store helpers remain in the [review session](final-review.json).

`run-probe.py <root|770814> <probe> [output-name]` uses the existing opt-in local
CDP endpoint and fails on exceptions. `host.py <label> [controlled-settings-source
[mode]]` normally quits, waits for every old process and silently launches on
workspace 7 with the tested process-local environment. If the old focused window
was Freelens itself, its replacement is focused after launch; otherwise the exact
existing user window/focus is restored. `--remove-settings` is the explicitly
requested scoped removal demonstration, and must not be run over user data without
preserving it and its backups. It never removes the shared extension-store directory.

For fixture-based reproduction, apply [fixture.json](fixture.json) only in its owned
namespace, open its actual Pod header, then run `setup`. Lifecycle scenarios also
use [fixture-lifecycle.yaml](fixture-lifecycle.yaml) and the explicitly added owned
ephemeral container. Probes operate on actual stdout/API responses. `emit.py` writes
to the owned container's real stdout FD; it does not substitute log responses.

Restore nested transport probes in order: `__rl13.restore()` then
`__rl19.restore()`; the supplied `restore.js` does both. `native-cycle.py` keeps the
native hidden interval separate from restoration, establishes native focus through
public CDP/native actions, and records the whole desktop sequence. Do not refocus
a minimized target in the middle of the frozen interval. A failed/cycling install
is still a failure; never repeat Install or restart afterward to conceal one.

The [runtime source scope](runtime-scope.json) shows that 0.1.18, 0.1.19 and 0.1.20
have **identical main-bundle bytes**; all runtime changes after ticket 18 are in
viewer markup/styles. Nevertheless, the required release matrix above was rerun
on installed 0.1.20, including recovery, migrations, lifecycle and maintenance.
Earlier observations stay versioned as historical evidence.

These observations do not promise atomic UID-bound reads, guaranteed restart
notification/detection timing, request cancellation, crash durability, transactional
disk guarantees, gap-free history or a cap on transient/download/total process memory.
The budget is retained original UTF-8 text only. Scope remains Freelens **1.10.3**,
one Pod/container, bounded current-instance snapshots. No streaming, previous-instance
or multi-Pod merging, public distribution or broader host support was added.

Pre-existing untracked `.gitignore`, `ralph`, `docs/ralph.md`, unrelated scratch and
runtime `.ralph` data are excluded from this ticket's commits. Published history
is retained; the operator handles pushing subsequent commits.
