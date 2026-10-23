# Ticket 11 verification

Verified on **2026-10-22** against the production **freelens-readable-logs 0.1.1**
package. This is ticket 11's single-snapshot milestone, not first-release approval
for the later refresh, lifecycle, inspection, profile or release tickets.

Package SHA-256:
`6ca722794aca142c7992a90fbc0e405b30902a48e1f4c9e3df169b911d3de2da`.
The package is reproducible from the sources and lockfile in the commit containing
this evidence. Both installed entry-point hashes match the rebuilt outputs:
[package/runtime identity](package-runtime-identity.json). No prototype branch was
merged or modified.

## Build and automated verification

The build ran with **Node 24.18.0 / npm 11.16.0**, rather than the machine's default
Node 26. The toolchain was installed locally under the untracked
`.scratch/readable-logs/toolchain` directory; no global agent configuration changed.
The installed host reports Freelens **1.10.3**, Electron **41.10.0**, Node **24.18.0**
and Chrome **146.0.7680.216** ([host versions](before-install.json)).

From this checkout, the recorded commands were the commands in
[the build guide](../../local-development.md), with the local Node/npm directories
prepended to PATH for each command:

| Command | Evidence and result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` | [Locked clean install](locked-install.txt); success. SDK transitive deprecation notices are recorded. |
| `npm run typecheck` | [Type-check](typecheck.txt); success against pinned SDK/core 1.10.3, strict project types. SDK published declarations use the tagged example's `node10` resolution. |
| `npm test` | [Tests](tests.txt); **16 passed, 0 failed**. Node's typeless-module warning concerns source tests; shipped entries are CommonJS. |
| `npm run package` | [Build/pack](package.txt); five tarball files. |
| `npm run check:package` | [Inspection](package-check.txt); exact file allowlist, no bundled host libraries, packed CommonJS default-export loading, and host-style page `observer` wrapping all pass. |
| Rebuild after another clean locked install | SHA-256 stayed `6ca722…de2da`, matching the actual installed package and both installed entry points. |

Automated fixtures cover Default aliases and fallthrough, exact paths, unknown and
numeric levels without inference, explicit-zone timestamps/local display, all
original fields/whitespace/Unicode/CR, blank and terminal-LF rules, escaped versus
separate multiline input, 1,000 and 1,001 lines, repeated lines, UTF-8 near/exactly/
over 5 MiB, complete-line suffix retention and an oversized newest record. They
also cover regular-only initial container selection, explicit selection when no
regular container exists, initial request errors, UID mismatch and late-result
suppression on disposal. No real no-regular-container Pod is claimed; that branch
is a pure-core fixture.

## Installation observation and limits

[Fresh host](fresh-host.json) records full exit of the preceding process family,
a fresh main window on workspace 7, and unchanged user workspace/focus. The final
launch set **only that process's** `TMPDIR` to
`/home/max/.cache/freelens-readable-logs/tmp`, on the same filesystem as the extension
directory. [Before installation](before-install.json) shows Extensions with no
cluster frame or installed package. The tarball was submitted through Install
**once** ([action](install-action.json)); [completion](installed.json) shows 0.1.1,
Enabled and successful installation before any cluster opened.

After opening the cluster, all observations below ran under main PID **2118398**,
unchanged from before this successful installation. **There was no post-install
restart and no filesystem discovery nudge for the accepted 0.1.1 run.** The process
and entry-point identity is recorded independently in
[package/runtime identity](package-runtime-identity.json).

Earlier development attempts are not passing maintenance evidence. The initial
page registration incorrectly applied `observer` before the host did;
[the host rejected double wrapping](navigation-diagnosis.json). The package now
lets the host wrap the page and the packed-entry check covers that registration
pattern. A subsequent request to hide details after navigation was also removed.

Some 0.1.0/0.1.1 attempts with the default `/tmp` failed after extraction, before
installer/discovery activity; see [failed replacement](failed-replacement.json)
and [timeout log](failed-replacement-log.txt). Failed attempts were stopped and
recorded, not treated as success based on files or Enabled. Only this extension's
failed directory was quarantined locally during recovery; unrelated extensions,
settings and cluster resources were not removed. An out-and-back directory move
made one failed package discoverable ([diagnostic](watch-diagnostic.json)); that
run is **excluded** from accepted installation evidence. Both
[cross-filesystem](watcher-cross-filesystem.json) and
[same-filesystem](watcher-same-filesystem.json) isolated watcher probes detected
the file. Therefore these probes do **not** establish the cause of the host's
missed discovery, nor does one successful local-TMPDIR installation establish
unconditional reliability with other environments. The exact successful launch
is documented in the build guide. The accepted fresh-main-window, one-click and
no-post-install-restart sequence was retained.

The earlier explicit uninstall/wait step is recorded in
[uninstall completion](uninstall-before-final-install.json) and
[settled removal](removal-settled.json). The final recovery started without the
failed package rather than overwriting an installed version. Full settings/update
acceptance belongs to ticket 19; this milestone has no persisted configuration.

## Actual packaged host observations

| Scenario | Observed evidence |
| --- | --- |
| Pod details header | [Toolbar capture](header-toolbar.png), derived from [full screenshot](header.png), and [DOM/context](header.json) show Readable logs immediately after native Logs and before Edit in `.KubeObjectMenu.toolbar`. This is a header action, not only a row menu. |
| Correct target | [Click](header-click.json) opens `/extension/freelens-readable-logs/readable-logs` with cluster `770814298afe692457d07d8b15d6b8d3`, namespace `readable-logs-spike`, Pod `single-json`, UID `0035d4f0-23c6-4e7d-93b2-c1d13a41cb92`. [Viewer](single-json.json), [screenshot](single-json.png) and [final view](final-view.json) show container `json` and built-in Default. The regular-container annotation is honored. |
| Intact timestamped JSON | [Independent public API observation](public-json-snapshot.json) returns the exact fixture JSON with transport timestamp `2026-10-22T03:18:05.925898198Z`; the actual viewer shows INFO and `freelens-json-logs-spike`, displaying local America/Cancun time. The separate API observation is not claimed as an interception of the package request. Adapter source plus matching installed bundle hashes establish the exact `container`, `tailLines:1000`, `timestamps:true`, `follow:false`, `previous:false`, no-cursor query. |
| Real bounded window | [1,000 rows](bounded-1000.json) and [screenshot](bounded-1000.png) from `changing-logs/json`, in returned order, with a scrollable records region. Byte-boundary cases remain automated fixtures rather than claimed live host measurements. |
| Mixed input | The temporary [fixture](fixtures.yaml) emitted twelve lines. [Host result](mixed.json), [screenshot](mixed.png) and [independent exact original response](public-mixed-snapshot.json) show JSON with Unicode and explicit-zone application time, spaced plain text, malformed JSON, arrays/scalars, a blank record, separate stack-trace lines, an escaped newline in one message, numeric level 30 and literal-key DEBUG precedence. All **12** records are represented. |
| Genuine empty success | Switching `single-json` to `empty` clears the one-record window and shows `No logs returned for empty`, zero records, with no omission/error notice: [result](empty.json), [screenshot](empty.png). |
| Initial failure | The temporary waiting Pod's regular container returns an actual Kubernetes `PodInitializing` failure. The package shows `Unable to read logs` with the container/Pod explanation, rather than empty output: [result](initial-error.json), [screenshot](initial-error.png). This is **not** access-denial evidence. |

An early public-API wrapper did not intercept package requests (the empty
`requests` arrays in some snapshots are not request counts). It was
[restored](probe-restored.json). No API replacement or test hook remains active.

Screenshots were visually inspected. The first header capture preceded the drawer
animation and was replaced by a settled capture after dismissing the installation
notification. Other screenshots show the existing native Logs dock below the
extension-owned page; the black region belongs to that pre-existing dock and is
not a missing extension surface. No user dock was closed. The scoped design
detector reported no findings. No independent design or performance approval is
claimed by that mechanical check.

## Preserved session and remaining scope

Only the two uniquely named ticket-11 Pods were created; both were
[deleted](fixture-cleanup.txt). The [remaining fixtures](remaining-fixtures.json)
are the original `single-json` and `changing-logs`, still Running with their
original UIDs. Freelens remains on workspace 7, with 0.1.1 installed and the known
single JSON fixture open for the supervisor. The user workspace/focus was preserved
through every launch. Quarantined failed artifacts and toolchain/runtime files
remain untracked under `.scratch`; they are not package contents or committed
runtime `.ralph` data.

There is no automatic refresh, request timeout/cancellation, target watch,
clipboard/Raw inspection, configurable profiles or durable settings in this
milestone. Those retain their original ticket boundaries. The retained-text budget
does not bound downloads or total memory; UID checking before a request is not an
atomic UID-bound log read. Full real-denial/transient-error recovery, lifecycle,
retention in the live host and the five warmed responsiveness runs remain the
later tickets' acceptance work.
