# Readable logs behavioral specification

This is the regression contract for the implemented extension on **Freelens
1.10.3**. Use the [glossary](../GLOSSARY.md) for domain terms and the
[user guide](usage.md) for controls and examples. Linux acceptance is complete
within the [validation limits](#validation-limits) below.

## Records and original content

- One transport line produces one record in received order. Preserve blank lines,
  CR, whitespace and Unicode; remove LF separators without adding a record for a
  final terminator. Never join stack traces. Escaped JSON newlines stay in one record.
- Separate only a validated Kubernetes timestamp and its one separator. Preserve
  exact transport line, application text and complete parsed object independently.
  Parse objects only; other inputs remain application text. Render content as text.
- Built-in Default tries message `/message`, `/msg`; time `/timestamp`, `/time`,
  `/@timestamp`; level `/level`, `/severity`, `/log.level`, `/log/level`, in order.
  Messages must be nonblank strings; keep surrounding whitespace. Unusable messages
  fall back to application text. Unknown usable levels do not fall through.
- Application time requires RFC 3339 with timezone or explicit numeric
  seconds/milliseconds. Numeric strings imply no numeric time. Fall back to
  Kubernetes time, then no time. Display local time; originals retain precision.
  Recognized severities normalize to TRACE, DEBUG, INFO, WARN, ERROR or FATAL;
  infer no severity from numbers.

## Recent window and lifecycle

The viewer addresses one cluster, identified Pod and named container. Distinguish
regular, init and ephemeral containers. Initially honor a valid default-container
annotation among regular containers, otherwise choose the first regular container;
without one, wait for an explicit choice.

Reads request the current instance with `tailLines: 1000`, `timestamps: true`,
`follow: false` and `previous: false`. Each successful snapshot replaces the
recent window. Retain only its newest complete-line suffix within **1,000
records and 5 MiB of original UTF-8 transport text**, counting original LF
terminators. An oversized newest record cannot be replaced with older records.
Report omission/oversize separately from a genuinely empty successful response.

| Event | Required behavior |
| --- | --- |
| Active automatic view | Read immediately, then three seconds after each successful read settles. Routine busy feedback does not shift the log viewport. |
| Pause / Refresh / Resume | Pause retains records, rejects pending results and suspends automatic reads. Refresh reads once while remaining paused; repeated actions coalesce. Resume reads fresh data and restores automatic updates. |
| Slow or failed read | Explain a pending read after 15 seconds without claiming transport timeout/cancellation. Failure retains outdated records and stops automatic updates. Retry is explicit; success restores automatic mode unless paused. |
| Hidden/inactive view | Invalidate pending observations and stop polling. Return fetches fresh data in automatic mode; Pause stays paused. Losing keyboard focus alone does not suspend polling. |
| Container change | Clear old records and temporary manual profile choice; start an automatic view when active. |
| Observed container restart | Clear records and invalidate old results. Preserve Pause/automatic mode, manual profile choice and following; reset Find state. A paused view waits for Refresh/Resume. |
| Pod 404 or different UID | Permanently stop the old view and mark retained records outdated under its original target. Reopening from the current Pod creates a new view; Retry cannot silently follow a replacement. |
| Leave/close/disable/uninstall | Invalidate departed work and discard temporary view state. Reopening starts fresh. Disable/uninstall removes extension contributions while retaining saved settings. |

Allow one outstanding read per target, including invalidated reads from departed
views. Same-target reads wait for settlement; other targets proceed independently.
The host exposes no per-request cancellation handle: invalidation rejects delivery.

Observe UID-checked Pod metadata independently every three seconds after settlement,
without overlap, including while paused. Update choices, labels and restart data.
Changed known restart counts/container IDs signal a new instance; first-known values
establish a baseline. One restart must not reset twice. Metadata errors do not prove
deletion; observations and name-addressed log reads are not atomic.

## Occurrence identity, reading and inspection

Preserve occurrences through the longest observed suffix/prefix overlap of exact
transport lines. Reading, inspection, Find and viewport anchoring share that
identity. In `[start, x, end]` → `[x, end, x]`, the surviving old `x` is the first
one. Expired references cannot revive through equal text or reused indices.
Identical windows cannot reveal unseen identical additions.

Start following the bottom. Scrolling away preserves the first visible surviving
occurrence and pixel offset through refresh; report its eviction. To bottom restores
following without resuming Pause. Resize preserves explicit following. Inspection,
Find and reformatting do not pause reads.

Inline, Side and Bottom inspection reserve no space without a selected record.
Row click, Enter or Space toggles inspection; drag selection does not. The first
click of a double/triple-click may inspect before selection exists. Eviction clears
inspection while preserving the layout preference.

All fields contains the complete object, including hidden/extracted fields, or
application text for non-object input. Original-copy actions preserve exact text;
pretty All fields is not the original serialization. Raw shows original text, with
Kubernetes time controlled by Show timestamps. Wrap changes presentation only.
Generated labels/badges stay out of selected log text; data named `fields` stays intact.

## Formatting and saved settings

Built-in Default is read-only; duplicates are independent. Ordered exact slash paths
replace defaults: dots are literal, `~1` escapes slash, `~0` escapes tilde, and array
indices are allowed. No recursive/wildcard lookup. Empty message/time/level lists
mean application text/Kubernetes time/no extracted level; missing paths are valid.

Inline fields follow configured order. Hidden fields, including descendants of
inline objects, win in additional compact data. Omit extracted leaves there, but
never suppress extracted message/time/level or redact fallback text. Severity
mappings distinguish numbers from text, compare text ignoring case and precede
built-in normalization.

Edits are staged. Valid Save applies the whole draft; invalid/failed Save retains
it. Cancel/return discards unfinished edits. Preview uses at most 20 sample lines.
Drafts and samples never persist. Editing/previewing/reformatting issues no log
request and does not change Pause.

Choose this view's manual profile, otherwise the first enabled matching profile in
saved order, otherwise the global default. Namespace, container and Pod-label
conditions all compare exactly and case-sensitively. Required labels must exist;
empty label values are valid. Conditionless profiles never auto-match. Disabled
matching permits manual/default use. No other matching types are provided.
Observed label/rule/order changes reevaluate Auto without a log read.

Rename preserves profile identity and references. Order/default changes save
immediately. Deleting a manually selected profile returns the view to Auto;
deleting the global default restores built-in Default. Manual choice clears on
Auto, target/container change, close or restart of the application; an observed
container restart preserves it.

Profiles, matching rules/order, global default and Inspection survive normal full
quit/reopen and extension updates/uninstall. Valid earlier settings migrate
explicitly. New views
otherwise start Readable, timestamps on, wrap off, automatic updates, no selected
record and empty closed Find. Do not persist logs, queries, history, drafts or
samples. The [maintenance guide](local-development.md#configuration-and-temporary-state)
defines the durable settings format and location.

Unusable settings preserve original bytes, explain the problem and inhibit normal saving.
Logs remain usable with built-in Default and Side inspection. Reset requires
confirmation and an exclusive, verified exact backup before replacement.
Cancellation/backup failure preserves the original and inhibits saving. Success
restores defaults and saving without restart or changes to log originals/Pause.
Do not prune backups automatically; no crash-durability/transactional guarantee.

## Find matching and position

Find is **literal only**, with Match case and Whole words initially off. Search
application text **or** the active extracted message, including hidden compact
data, excluding Kubernetes time. Count each matching record once in retained order.
Counts, navigation, highlights and scrollbar marks share this predicate; every row
remains visible.

Ignore case through Unicode simple/common folding without locale or accent
normalization: `K` matches Kelvin sign, sigma matches final sigma, `SS` does not match
sharp-s. Whole-word boundaries reject adjacent original Unicode letters, numbers or
underscore. Enumerate non-overlapping matches left-to-right across the whole source,
preserving original offsets across rendered fragments.

Keep reading row, search position, refinement candidate, active Find result,
inspection and native text selection distinct:

- A new query starts inclusively from the deliberately selected/focused reading
  row, otherwise from the beginning of all retained logs. Scroll position, hover
  and programmatic focus restoration do not create a reading row.
- Clear/retype, whole-input replacement, selection seeding and history recall start
  new sequences. Classify whole replacement from pre-insertion selection, even with
  a shared prefix. Partial edits refine; Undo/Redo keep editing semantics. Retain the
  latest successful candidate while it matches, including after a zero-hit typo;
  otherwise seek from the latest search position. Typing does not advance it.
- Choosing a different reading row rebases navigation inclusively without
  inspecting a Find result. Inspecting/deselecting the active result preserves
  its ordinal and candidate while cancelling its old reveal. Closing inspection
  clears its reading anchor but preserves an independent successful search
  position for further refinement.
- Next/Previous move strictly from an active result and wrap with local feedback.
  Without an active result, seek inclusively from the reading row; without either,
  Next starts at the first match and Previous at the last, regardless of scroll.
  One match stays active with one-match feedback. Navigation keeps Find focus.
- Clear removes query, result, decorations and pending reveal, keeping Find open,
  inspection, scroll position and history. Close hides Find and removes text
  highlights, the active-result outline, hidden-match links and scrollbar marks
  while retaining query, flags and surviving result. Refresh and late replies
  cannot restore decorations while closed; reopening shows current decorations.
  Closing restores the opener or a surviving local fallback without creating a
  reading anchor.

## Find maintenance and bounded work

Refresh retains surviving active results without a search-induced jump. Clear and
explain expired results; new matches wait for explicit navigation. Profile changes
reevaluate extracted-message matching without fetching: retain a valid result,
otherwise clear it without choosing another. Layout, Raw/Readable, timestamps,
wrap and unchanged metadata/settings do not change matching.

While changed/new records are evaluated, unchanged surviving source text keeps its
known count membership and active ordinal. Keep its hidden-match links, marks and
valid connected highlights while Find is open. Navigation waits for complete current
results. Retained source nodes, selection and focus survive refresh;
source/query/mode/context changes and eviction invalidate affected data.

Highlight visible text without shading every matching row. Keep active result,
inspection, native selection and focus distinguishable and readable on the black
log canvas under light/dark host themes.
Decorations do not alter copied text or become selection. Hidden original-only hits
offer **Match in original text**, opening Application text; decoded-only hits offer
**Match in extracted message**, opening that source. Preserve Raw/Readable and the
independent active result; never guess a field or project decoded offsets into originals.

Marks use actual row geometry after wrapping, expansion and resize. Coincident marks
group while retaining all ordered occurrences; repeated activation
cycles them, preserving progress when the last activated occurrence survives regrouping.
Activation chooses a Find result and returns Find focus without inspection. Reveal
uses current geometry, may align at the top and does not animate travel.

Manual scroll cancels pending reveal. Dismissal, Profiles, inactivity, context change
and disposal invalidate affected intent. Current counts may still update, but late
success/failure cannot restore an old query, origin, inspector, focus or scroll.
Other viewers/documents cannot control this viewer's work.

| Bound or failure | Contract |
| --- | --- |
| Query length | At most 16,384 UTF-16 units; preserve and explain larger input without truncating or executing it. |
| Pending/deadline | Busy immediately; visible Searching feedback after 100 ms; navigation disabled. A 1,000 ms whole-attempt deadline includes registration/startup/dispatch, invalidates delivery and cancels execution. These are operating limits, not hard real-time guarantees. |
| Work replacement | Bound execution to one worker and running operation per active viewer plus the newest replacement; cancel obsolete execution and await actual exit before replacement. Exact matching takes priority over decoration churn. |
| Search failure | Keep logs/query available with latched local feedback. Recover by explicit edit or Retry on current data, without replaying an old reveal. Refresh alone does not retry; no retry loop or silent execution fallback. |
| Decoration | At most 4,096 returned ranges per operation and 1,024 painted ranges shared by viewport/inspector. Explain pending/incomplete/unavailable decoration while preserving exact counts, navigation, marks and valid history. Later visible content remains reachable. Decoration retry is independent. |
| Teardown/inactivity | Release owned execution, timers, listeners, observers, animation frames and highlight registrations; reject stale successes and failures. Inactivity retains temporary Find state, while target/container/observed-instance changes and viewer teardown reset it. |

## Local input and temporary history

Seed only empty Find, before focus moves, from actual single-line log text in one
record/inspector, at most **256 Unicode code points**. Ignore generated, foreign,
multiline, multi-record and oversized selections. Seeding chooses no reading row.
IME preedit suspends matching/navigation; commit evaluates once, cancellation
restores committed state, and Clear prevents a late composition transaction from
restoring input. Later ordinary native insertion remains editable.

History is memory-only per viewer: seven distinct exact text/two-flag tuples,
newest first. Commit completed valid input on eligible navigation or Close,
including zero-hit queries on Close. Exclude empty, pending, composing, oversized,
failed and stale input. Recall restores flags as a new search without a saved cursor.

Ctrl+F/G/Shift+G on Linux and Enter/Shift+Enter in Find invoke the visible actions
in eligible local reading context. Exact modifiers, IME/AltGraph guards, native
menus, editors, Profiles and inactive viewers retain input ownership. Primary+S
saves the active Profiles draft through normal validation. The local end shortcut
follows the window without resuming Pause. Controls expose accessible names,
pressed/disabled states, visible focus and polite coalesced status; statuses do not
take focus or rely on color alone. Platform bindings are in the
[shortcut reference](local-development.md#local-keyboard-shortcuts).

Escape dismisses one layer at a time: transient/menu, confirmation, Profiles;
in logs, Find before inspection. Held Escape does not dismiss multiple layers.
Dismissal restores the opener or a surviving local control; a reset in progress
continues. Mouse Back in focused active Profiles uses the same local dismissal
order and discards unfinished drafts on return. Logs, host/dock areas and native
Back/Forward keep host-history ownership. Local panels add no history entries;
Forward cannot resurrect a discarded draft. No global shortcuts are installed.

## Validation limits

Linux Find acceptance is complete on Freelens 1.10.3 with Arch Linux/Wayland.
Installed-host, headless production-renderer, real-worker and native-session checks
have distinct scopes. Native selection, clipboard, keyboard, menus, resize and IME
used an isolated graphical session with a diagnostic compositor and virtual local
input. This covers the tested routes, not stock-compositor or physical-device
provenance, general IME candidate UI or OS AltGraph coverage. Native IME cancellation
and late DOM composition suppression were separate checks.

The latest refresh/highlight and inspection fixes have production-renderer and
focused installed DOM/CDP coverage. They do not add a fresh complete native-input
pass or native latency measurements. **Windows and macOS remain explicitly
unverified; their suites are deferred to a future task.**

The retained-text budget does not bound downloads, transient memory, parsed objects
or total host memory. Installed-host resource work is accepted as a host limitation:
an aborted Freelens watch can retain a fallback timer/listeners. Clean viewer
open/close comparisons kept Find unopened and do not clear earlier failed Find
measurements, prove indefinite stability or attribute every historical spike. No
production host fix is claimed. The [resource smoke guide](resource-smoke.md) defines
the separate isolated regression tripwires and budgets.

Permanent regression anchors include [record parsing](../tests/records.test.ts),
[snapshot retention](../tests/snapshot.test.ts), [lifecycle](../tests/lifecycle.test.ts),
[profiles](../tests/profiles.test.ts), [settings recovery](../tests/recovery.test.ts),
[occurrences](../tests/occurrences.test.ts), [Find state](../tests/find-state.test.ts),
[literal matching](../tests/find-matcher.test.ts), [production renderer](../tests/find-identity-browser.jsx)
and [refresh/scroll performance](../tests/find-performance-browser.jsx).
