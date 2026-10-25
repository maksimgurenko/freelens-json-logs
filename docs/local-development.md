# Build and install Readable logs

This production implementation includes bounded snapshots, automatic refresh,
Pause/Resume, explicit recovery and Pod/container lifecycle handling (GitHub #11–13).
Ticket #14 adds complete-record inspection in Inline, Side and Bottom layouts,
Raw presentation, exact original clipboard actions and a saved global Inspection
preference. Ticket #15 adds bottom following, anchored scroll position and literal Find navigation.
Ticket #16 adds staged formatting profiles, sample previews, manual selection and a saved global default. Ticket #17 adds exact target matching and saved precedence. Ticket #18 adds preserved fallback and confirmed backed-up settings recovery.
The accepted GitHub #8 contract and its linked resolutions govern implementation.

Supported host: **Freelens 1.10.3 only**, currently tested on Arch Linux/Wayland.
Build toolchain: **Node 24.18.0, npm 11.16.0, TypeScript 5.9.3, esbuild 0.28.2**.
The SDK and its core dependency are pinned to 1.10.3; `package-lock.json` pins the
complete build tree. Use Node 24 as required by the SDK, rather than the machine's
Node 26. `.nvmrc` records the build version; no global agent configuration changes
are required.

From a clean checkout with that toolchain on PATH:

```sh
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
npm run package
npm run check:package
tar -tzf dist/freelens-readable-logs-0.1.33.tgz
sha256sum dist/freelens-readable-logs-0.1.33.tgz
```

The locked esbuild platform package supplies its binary without install scripts.
The test command executes TypeScript using Node's type stripping; no host is
launched. Build metadata under `dist/build-meta.json` shows only project inputs
and tiny host-global bindings. `check:package` inspects the actual tarball,
asserts its allowlisted files and host-only dependencies, and loads its packed
CommonJS default exports with stub host globals. This is a packaging test;
real host verification is recorded separately under `docs/verification/11/` and
`docs/verification/12/`. Ticket 13 records automated checks, earlier installation failures and the
production lifecycle matrix separately under `docs/verification/13/`.
Running the same build twice yields the same tarball bytes with this toolchain.

On this development machine the existing toolchain is project-local. The scratch
`.bin` directory alone does not select Node 24. Use the Node binary directory and
invoke the matching npm CLI explicitly:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
```

Stable package identifier: **freelens-readable-logs**. Stable `storeName`:
**freelens-readable-logs**. Page ID: **readable-logs**. These identifiers remain
stable across updates. Versioned CommonJS entry paths prevent host module-cache
reuse when updating a different package version.

## Configuration and temporary state

The matching main/renderer `Common.Store.ExtensionStore` uses config name
**readable-logs**, under the stable package/store name above. On this host its file
is `~/.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json`.
Main owns durable writes; renderer changes synchronize through the host store.
Schema **3** stores `schemaVersion: 3`, `viewer.inspection` (initially `"side"`),
`profiles` (independent named rules with stable IDs), and `globalDefault` (initially
`"default"`). Valid schema 1 Inspection settings migrate explicitly to schema 3
with no saved profiles and built-in Default selected. Valid schema 2 profiles
migrate explicitly with matching disabled and no conditions, preserving IDs,
order, rules and default. Unsupported versions or
invalid data inhibit editing; the viewer reports the problem and uses built-in
Default and Side. Before constructing either SDK store, the extension reads and validates saved
configuration. Corrupt JSON, unreadable files, invalid configuration and unsupported
schemas keep built-in Default and Side available, with a visible explanation. Neither
SDK synchronization nor ordinary preference/profile editing starts in fallback; the
original is preserved, including host-owned migration metadata. Main owns durable writes through the matching renderer store.

Raw mode, selected record, content tab, timestamps and word wrap are temporary.
New views start Readable, without selection, with timestamps on and wrap off.
Bottom Inspection opens when a record is selected and occupies no space when
selection is cleared or leaves the recent window; the saved Bottom preference
remains selected. Side and Inline also reserve no inspector space without a selection. Selecting a row never pauses automatic updates. If the selected exact record
leaves the recent window, selection clears; Pause keeps the current window for
inspection. All fields includes extracted/hidden fields. Copy application text
and Copy transport line use retained originals, including their original spacing,
JSON escapes and timestamp precision; the pretty All fields view is not an exact
JSON serialization of the received text.

A normal full quit/reopen restores Inspection. Uninstall retains this extension's
settings. To remove only its settings explicitly, quit Freelens and remove only
`~/.config/Freelens/extension-store/freelens-readable-logs/`. Backups are retained with the extension settings; the explicit directory removal
also removes those backups. To keep them, move only this extension's `backups/` folder
to your chosen location before removal. Do not remove the shared `extension-store` directory.

## Supported local maintenance

The validation launch uses a process-local temporary directory on the same
filesystem as `~/.freelens/extensions`:

```sh
mkdir -p "$HOME/.cache/freelens-readable-logs/tmp"
CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100 \
  TMPDIR="$HOME/.cache/freelens-readable-logs/tmp" /usr/bin/freelens
```

These variables apply only to this host process. Filesystem polling is required
by the observed validation launch: two event-watcher installs failed discovery,
then the polling launch discovered and installed the package. The underlying
event-watcher failure remains unestablished. It does
not change Freelens code or global configuration. Earlier install attempts on
this machine timed out after extraction without discovery; filesystem probes
alone did not establish their cause. Keep a failed install distinct from a
successful install and record the exact environment. The debug port used by
verification tooling is optional and is not an extension runtime requirement.

Follow [the accepted procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618):

1. Use a fresh main window and open **Extensions before any cluster**. If a
   cluster has been opened in the session, fully quit/reopen Freelens first.
   This requires at most one pre-maintenance restart.
2. For an update, **Uninstall** the old package and wait for removal to finish,
   retaining its saved extension settings. Install the new tarball via the form
   **once** and wait. Do not use the overwrite/reinstallation prompt.
3. Check version **0.1.33** and Enabled, then open the cluster. Open a Pod's details
   header and click the **Readable logs** icon beside the native actions. Verify
   cluster, namespace, Pod UID, container, the expected active profile and usable logs.
   Do not restart after installation as a substitute for passing this check.
4. Enable/disable/uninstall maintenance also uses the fresh-main-window state.
   A failed or cycling install is a failure: stop and retain diagnostic evidence.

The installed viewer requests current-instance logs with `container`,
`tailLines: 1000`, `timestamps: true`, `follow: false`, `previous: false`; no
cursor, streaming, previous-instance or multi-Pod logs are requested. The default
annotation applies only to regular containers. With none, select explicitly.

The viewer retains the latest complete-line suffix within **5 MiB UTF-8 original
transport text**, counting each original LF terminator, including a final LF if
present. LF separators are not part of the per-record transport line; CR and all
other source characters stay intact. A final LF does not add a record; additional
blank lines do. More-than-tail responses are also bounded to the newest 1,000
records. Omissions and an oversized newest record are distinct from empty logs.
The budget bounds retained original text, not download size, transient response
memory, parsed-object overhead or total process memory. The public convenience
API completes the full response and offers no per-request cancellation handle.

Default numeric timestamp units are unset and severity mappings are empty:
numbers remain visible as levels and do not imply a severity; numeric timestamps
do not imply seconds or milliseconds. Application timestamp candidates require
RFC 3339 with an explicit zone; display uses the computer's local timezone.
Original precision, JSON whitespace and all parsed fields remain in core state.
Raw inspection and clipboard controls are subsequent ticket work.

Routine loading/waiting feedback uses the fixed update-status area in
the compact footer, without inserting a banner above the log window on every read.
The records region exposes its busy state to accessibility tools; slow requests
and failures retain their explicit notices.

An active selected target fetches immediately, then three seconds after each
successful request settles. Snapshots replace the window, preserving repeated
lines. Pause freezes the window and rejects pending results immediately. Refresh
fetches once while paused; Resume fetches fresh data and restores automatic mode.
A slow notice appears after 15 seconds without timing out or cancelling the read.
Only one read per target may be outstanding, including invalidated reads from a
departed view: a fresh same-target request waits for settlement. Different targets
can proceed independently. Repeated Refresh actions coalesce rather than queue.

A genuine empty success clears the window and continues automatic updates.
Failures retain the last successful window, mark it outdated, explain the host
error and stop automatic updates. Retry is explicit; successful Retry restores
automatic mode unless paused. Failed Retry never starts a retry loop.

Metadata UID is checked before the first read. While displayed, supported
`podsApi.get` observations run without overlap, three seconds after each metadata
request settles, including while logs are paused. They update the regular/init/
ephemeral choices and compare the selected container's restart count and known
container ID. An observed restart clears old records, invalidates pending log
results and preserves the refresh mode and temporary profile selection. Automatic
mode requests the current instance; Pause waits for Refresh/Resume. A same-target
outstanding log read must still settle first.

An observed Pod 404 or different UID permanently stops that view. Retained records
are marked outdated under the original UID; Retry and target controls cannot
silently follow the replacement. Reopen from the current Pod to start a new view.
A metadata denial or network error is an error, never evidence of deletion.
These observations are not an atomic UID-bound log read or guaranteed restart
notification. Changes can occur between observations and a name-addressed read.
No previous-instance records are requested or merged.

Document visibility handles native minimize. The main process observes the owning window's
URL and native hide/minimize/restore events through Electron's public API, then
relays visibility through extension-scoped IPC, since
CSS-hidden cached cluster frames retain document visibility and intersection. Losing keyboard focus alone does not suspend polling.
Hidden views invalidate pending log/metadata observations and stop their timers;
returning automatic views fetch fresh data, while Pause remains paused. A container
change clears the old window, returns temporary selection to Auto and starts an
automatic view when active. Close/leave/disable discards view state; reopening
starts fresh. The current viewer uses the saved matching and default rules in
Auto. Lifecycle tests cover the temporary manual-selection state boundary;
saved-profile and matching evidence is recorded in tickets 16 and 17.

Lifecycle checks and their observation limits are recorded against the installed
production bundle hashes in the ticket 13 verification report.

The entry filenames include the package version. Freelens 1.10.3 retains Node
module cache during uninstall/install; unique version paths load the updated main
and renderer code without clearing host caches or requiring a post-install restart.
Electron is supplied by the host and stays external to both bundles.

## Compact workspace

The single toolbar keeps target context, container/profile selection, **Edit profiles**,
Pause/Resume, Refresh and Find available. Open **Log target details** for full
names and technical identifiers. **Display options** contains Readable/Raw,
timestamps, wrap and the saved global Inspection layout. Related groups wrap
in narrower windows. Readable and Raw use a black canvas, including empty space.

Find opens a temporary row. **Close Find** hides the row while retaining its
query and current match for this view; reopening does not filter the window or
make a request. A new view starts with Find closed and its query empty.

## Selecting and copying log text

Drag through Readable or Raw rows to select text without opening or changing
inspection. The additional-field count badge is interface metadata and is excluded
from row selection/copy; application data named `fields` stays intact. A normal
click inspects immediately, including within previously selected text, as do Enter
and Space on a focused row. The first
click of a double/triple-click may inspect before word/line selection exists.
The inspector's Copy application text and Copy transport line actions retain the
exact originals. Selecting text or inspecting a record does not pause updates;
use Pause when you want to keep the current recent log window.

## Scroll position and Find

New views follow output at the bottom. Scrolling away preserves the first visible
record and its pixel offset across the observed ordered overlap between snapshots,
including repeated exact transport lines. A visible notice reports when that
anchor leaves the recent window; **To bottom** resumes following. No history is
merged. Equal repeated whole windows cannot reveal unseen additions of identical
lines without a server cursor; the longest observed suffix/prefix overlap is used.

Find searches the exact application text or the active extracted message using
case-insensitive literal substrings. The counter and Previous/Next use the same
record list, once per record, and wrap without filtering rows. Enter moves next;
Shift+Enter moves previous. The outlined row is the current result, independently
of inspection selection. Hidden original fields and decoded message escapes are
searchable; the Kubernetes timestamp prefix is excluded even in Raw mode. When
a current match leaves the window the counter shows 0 of the new total until
navigation selects another result. Empty queries have no results.

Find, timestamps and word wrap stay local to the view and reset on reopening.
They do not fetch logs or change Pause. Refresh while paused updates once and
recomputes both matches and scroll position. Formatting changes use the same
formatted record array as Find, without changing retained originals.


## Formatting profiles

Use **Profiles**, select a saved profile and choose **Edit**, or **Duplicate** any
profile (including read-only **Default**) to make independent rules. Rename in
the staged name field. Enter one exact slash path per line, in priority order.
Dots are literal; `~1` escapes a slash, `~0` a tilde; `/items/0/code` selects the
first array element. There is no recursive or wildcard search. Configured lists
replace defaults. Empty message/time/level lists mean exact application text,
Kubernetes time and no extracted level respectively. Missing paths are valid.

Inline fields display in configured order; hidden fields win, including hidden
children of inline objects. Extracted leaves are omitted from additional data;
All fields and both exact originals remain complete. Numeric timestamps need an
explicit seconds/milliseconds choice; numeric strings remain invalid timestamps.
Severity mappings distinguish numbers from text, compare text ignoring case,
and precede built-in normalization. No numeric meaning is inferred.

Paste sample logs for a preview of up to 20 lines. **Save profile** applies a valid
draft; **Cancel draft** or **Back to logs** discards unfinished edits. Specific errors
block Save. Preview samples and drafts never persist. Editing or reformatting
retained logs makes no log request and Find recomputes using the active message.

The viewer's **Profile** selector offers **Auto** and explicit manual choices.
Auto uses the first enabled matching profile in saved order, then the global default. Manual choice belongs to the current cluster/Pod UID/container view
and clears on Auto, container/target change, close or full restart. Selecting a
profile does not pause updates. Global default is saved in **Profiles**. Deleting
a manually selected profile returns that view to Auto; deleting the global
default restores built-in Default. Rename retains ID, references and order.
Uninstall retains profiles and Inspection. See `docs/verification/16/` for actual
packaged editor, request-observation and full normal-quit/reopen evidence.
Import/export, custom templates and executable user code are excluded.

## Automatic profile selection

In **Profiles**, Edit a saved profile to configure **Enabled for matching**,
**Match namespace**, **Match container name** and ordinary **Add label condition**
key/value inputs. Save applies the draft; Cancel discards it. Empty namespace or
container omits that restriction. Label values may be empty; required keys must
exist. Every configured condition compares exactly and case-sensitively. There
is no regex, wildcard, Pod-name or cluster matching. A conditionless profile
never auto-matches. Disabling matching leaves manual/global-default use available.

**Matching order** lists saved profiles in precedence order. **Move up/down**
saves immediately; the first enabled profile with all conditions matching wins
in Auto, otherwise the global default applies. Manual choice always wins. The
selector's Auto label and Active profile show the result. Global-default status
does not rearrange order; stable IDs preserve rename references. Deleting a
manual profile returns to Auto; deleting the global default restores built-in
Default, with matching still taking precedence.

Current Pod labels come from the existing UID-checked metadata observations,
including while paused. Observed label changes, saved rules, order, enabled state
and Auto/manual changes reformat retained records without a log read. Metadata
observations are not instantaneous notifications. Target/container changes clear
manual choice; container restarts preserve it. Schema 3 persists each profile's
`matching.enabled` and `matching.conditions` (`namespace?`, `container?`, `labels`
key/value list); profile array order is the saved matching order. Main remains
the durable writer. See `docs/verification/17/` for packaged-host and normal
full-quit/reopen evidence.

## Recovering unusable settings

When saved settings cannot be used, the viewer shows **Settings recovery** with
its error and exact settings path. Logs remain usable with built-in Default and
Side inspection; saved profile and preference edits are unavailable. The stable
settings identity is unchanged: package/store `freelens-readable-logs`, config
`readable-logs`, schema 3. Host-owned `__internal__` migration metadata is allowed
but never makes an unknown application schema migratable.

1. Choose **Reset settings…** in the recovery notice. Review which settings will
   be replaced. **Cancel reset** changes nothing and creates no backup.
2. Choose **Back up and reset** to confirm. Main creates an exclusive backup in
   `~/.config/Freelens/extension-store/freelens-readable-logs/backups/`, named
   `readable-logs-<UTC timestamp>-<UUID>.json`. It verifies the original bytes
   before replacing the configuration. Backup files are never automatically pruned.
3. If backup creation/read/verification fails (including unreadable source data),
   the original remains unchanged, saving stays inhibited, and the viewer reports
   the failure. Correct the file/directory access or backup obstruction and retry
   explicitly. The extension does not repair permissions or discard a failed backup.
4. On success the notice shows the exact backup path. All saved profiles, order,
   matching/default references and Inspection return to built-in defaults. Normal
   saving resumes immediately, without a host restart. Existing log originals and
   Pause are unaffected. Use Profiles or Inspection to save new settings normally.

To restore a backup manually, fully quit Freelens, preserve the current file if
needed, then copy the desired backup to this extension's `readable-logs.json` and
reopen. An unusable backup will correctly return to fallback. For complete explicit
settings removal, fully quit Freelens and remove only
`~/.config/Freelens/extension-store/freelens-readable-logs/`, including its backups;
keep every other extension's directory. Uninstall alone retains this directory.
No crash durability or transactional disk guarantees are promised.


## Local return and dismissal

**Back to logs** leaves Profiles and discards its unfinished draft. **Cancel draft**
stays in Profiles; **Save profile** applies valid changes explicitly. Saved profile,
global-default and matching-order changes survive returning to logs.

Escape dismisses one layer: an open menu/disclosure, then a delete/reset
confirmation, then Profiles. In logs it hides Find (retaining the query), then
closes inspection on the next press. Bare logs have no local Escape navigation.
Native selects, menus and composition keep their input ownership; holding Escape
does not dismiss additional layers. Reset already in progress continues and cannot
be canceled by dismissal. Closing controls follow the same focus transitions:
Find and Profiles restore their opener, inspection restores its retained row or a
surviving log control. Local panels add no host page-history entries and do not
pause automatic updates. Mouse Back in Profiles uses the same local dismissal actions. A nested confirmation
or open disclosure takes priority; returning discards only the unfinished draft.
The handler owns only an active, focused extension region and the pointer gesture
begun there. In logs, and over host/dock areas, Back keeps host history ownership.
Native keyboard/menu/top-bar Back and Forward remain host-owned. Local panels do
not create history entries; host Forward never restores an unfinished local draft.
Physical delivery/cancellation evidence is platform-specific under
`docs/verification/28/`; Windows and macOS remain unverified. The shortcut reference and bindings below use the same local ownership rules.


## Local keyboard shortcuts

Use Ctrl on Linux/Windows and Cmd on macOS. In the active logs toolbar,
viewport or inspector, primary+F reveals Find and selects its retained query.
Enter/Shift+Enter move next/previous only in Find; primary+G/primary+Shift+G
repeat the same navigation, revealing Find if needed. Other editing controls
keep their input ownership. Primary+S saves an active Profiles draft through the
same validation as Save profile. Invalid or failed saves retain the draft.
Ctrl+End (Linux/Windows) or Cmd+Down (macOS), with a log row or viewport focused,
follows the retained window without resuming paused requests.

Display options → Shortcuts opens a temporary reference; Close or Escape dismisses
it and restores Display options focus. Control tooltips show relevant bindings.
Host Back/Forward, reload and command palette retain their host meanings. Platform
verification and native input boundaries are recorded under `docs/verification/29/`.


## Compact-view release verification

The combined layout, selection, local return, mouse Back and shortcut workflow is
verified against one exact installed package under `docs/verification/30/`. Read
that report for the current completion state and package hash; earlier ticket
reports describe their own package versions. Physical mouse evidence from an
earlier package does not establish the final package gate.

Linux checks use Freelens 1.10.3 on Hyprland/Wayland. Windows and macOS remain
unverified. Linux OS IME/AltGraph coverage is also unverified; composition and
modifier guard tests alone do not establish native input behavior. The local
workflow adds no global shortcuts or settings and retains the existing bounded
single-Pod/container, schema 3 and explicit recovery contracts.
