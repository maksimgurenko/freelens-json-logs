# Find: final design draft

Status: final design draft, 2026-10-25. Ready for implementation planning;
production implementation and packaged-host verification are pending.

This is the historical design snapshot. The later
[literal Find implementation plan](find-implementation-plan.md) governs literal-only
scope, appearance corrections and current completion/acceptance limits.

This is the implementation reference for the reviewed search design. It
supersedes [the exploratory draft](search-improvements.md).

## Chosen direction

Find starts from the selected or deliberately focused reading row. With no
reading row, a new search starts at the beginning of **all retained logs**,
regardless of scroll position. Typing refines the query without advancing past
a result that still matches. Up/down and the existing shortcuts navigate between
matching records.

The prototype checkboxes were evaluation controls. The chosen behaviors become
permanent product behavior; **do not ship the options sidebar, presets, guided
examples, simulation controls or state-debug panel**. There is no global search
preferences screen or set of 21 production switches.

The three matching buttons in Find remain runtime query controls: Match case,
Whole words and Regular expression. They start off in a new viewer. Search text,
these mode flags, history and the active result are temporary viewer state.

The reviewed screenshots are the source of the choices:

- [Chosen behaviors](assets/search-selected-behaviors.png).
- [Complete Find bar](assets/search-find-bar.png).

The [browser prototype](http://127.0.0.1:8088/freelens-search-prototype/) is supporting
interaction evidence on `prototype/search-improvements`, through `c77d94f`.
Its exploratory presets are not the chosen product configuration.

## What ships

This table records all 21 prototype switches so omitted experiments cannot
silently become production requirements. On/off describes the reviewed choice,
not a production checkbox.

| Prototype control | Choice | Final behavior |
| --- | --- | --- |
| Start from current row | On | Use the selected/focused reading row; otherwise start at the beginning of retained logs. |
| Include current row | On | An initial forward or backward seek includes the reading row if it matches. |
| Keep origin while typing | Off | When a result stops matching, seek from the latest search position. A result that still matches stays active. |
| Wrap around | On | Next/Previous wrap at either end of the matching-record list. |
| Explain wrapping | On | Show local beginning/end wrap feedback. |
| Keep visible context | Off | Use the ordinary result reveal, aligning a newly revealed result with the top of the log scroller. No extra context-preserving reveal mode. |
| Search while typing | On | Update matches as the query is edited, after composition commits. |
| Match case | Off initially | Available through the `Aa` button. |
| Whole words | Off initially | Available through the underlined `ab` button. |
| Regular expression | Off initially | Available through the `.*` button. |
| Message only | Off | Search application text OR the active extracted message. No message-only scope control. |
| Highlight every matching row | Off | Do not shade every matching row. Keep a distinct active-result treatment. |
| Highlight matching text | On | Mark matching text throughout the visible presentation, independently of row selection. |
| Explain hidden matches | On | Explain hits absent from the displayed text and offer the relevant record representation. |
| Only matching records | Off | Find leaves every retained record visible. No filter mode. |
| Keep neighboring records | Off | No filtered-context feature or context-row count control. |
| Match marks on scrollbar | On | Show matching-record locations and allow jumping to them. |
| Search selected text | On | Fill an empty Find from a short selection of actual log text. |
| Temporary search history | On | Keep a bounded in-memory list for the current viewer. |
| Keep result across updates | On | Retain surviving results while recomputing matches/counts, without a search-induced scroll. |
| Keep search separate from following | Off | Use normal viewport following rules; do not force a special Find-follow lock. |

## Find bar

Keep the extension's compact toolbar and on-demand Find row. Use the control
order shown in the reviewed bar:

```text
[ search text                         ordinal / total  clear ]
[ up ] [ down ] [ Aa ] [ ab ] [ .* ] [ history ] [ close ]
```

This is one bar at ordinary widths; the sketch separates the input from its
buttons for readability. At narrow widths it can wrap in the same logical order
without horizontal page overflow. Do not add the prototype's permanent sidebar
or another configuration band.

| Control | Behavior |
| --- | --- |
| Search input | Literal, case-insensitive text initially. Keep native caret, selection, copy/paste and composition behavior. |
| Ordinal / total | Count matching **records**, once each; use the active record's global ordinal. Three occurrences within one record still count as one record. |
| Clear inside the input | Clear the query, active result, decorations and pending reveal. Keep Find open and focused, keep inspection and scroll position, and leave history available. |
| Up | Previous matching record. Use native Freelens Material Icons `keyboard_arrow_up` at the native 21px size. |
| Down | Next matching record. Use `keyboard_arrow_down` at the same size. |
| `Aa` | Toggle case-sensitive matching; expose pressed state and an accessible name. |
| Underlined `ab` | Toggle whole-word matching; expose pressed state and an accessible name. |
| `.*` | Toggle regular expressions; expose pressed state and an accessible name. |
| History clock | Open the current viewer's recent searches; show a useful empty state before any searches are recorded. |
| Close outside the input | Hide Find while retaining the query, mode flags and surviving active result. Restore focus to its opener. |

All reviewed buttons are present in the normal Find bar. Off-by-default matching
modes remain clickable. Clear is disabled for an empty query; navigation is
disabled for an empty query, a pending evaluation, no matches or an invalid/timed
out pattern. Labels/tooltips distinguish **Clear search** from **Close Find**.

Use a small local status area for `Search retained logs`, no-match feedback,
invalid/slow regex feedback, wrap feedback and expired-result feedback. Keep the
query editable after an error. Do not imply that omitted container history was
searched.

## Position, query edits and navigation

Keep three distinct states: the reading row chosen by the user, the origin used
for resolving a query, and the active Find result. Inspection, browser text
selection, keyboard focus and a Find highlight must remain distinguishable.

### Starting or replacing a query

1. Capture a selected or deliberately focused reading row before moving focus
   into Find. Hover, pointer location, native Lens selection and programmatic
   focus restoration do not create a reading anchor.
2. If a reading row exists, seek inclusively from it. Otherwise seek from the
   beginning of all retained logs. Scrolling alone cannot substitute the first
   visible row for either rule.
3. A new query includes clearing/retyping, replacing the entire selected input,
   choosing a history entry, or seeding the empty input from selected text.
   These actions do not inherit the previous query's active match.

Detect whole-input replacement using the selection before insertion. Comparing
prefixes is insufficient: replacing `response` with `request` is a new query even
though both start with `r`.

### Refining an existing query

- Keep the active record if it still matches. Adding a character is not Next.
- Keep the last successful refinement candidate across a temporary no-match
  edit. Correcting a typo can restore that result if it matches again.
- If the candidate no longer matches, seek from the latest search position;
  the fixed-original-origin experiment is not part of this design.
- Do not use an idle timer to change the meaning of editing.
- Clearing the input ends the edit sequence. The next word starts from the
  reading row, or from the beginning when no row is chosen.

For example, in the prototype with row 64 chosen, `up` reaches row 73. Typing
`ups` through `upstream` stays on 73. Explicit Next reaches 82. A temporary
`upstreamx` followed by correction restores 82. Replacing the entire word starts
a new search from row 64.

### Changing the reading row

A deliberate row activation or keyboard focus relocates the reading anchor.
Keep the query and match count, but resolve navigation or a new query relative
to the chosen row. Finding a record does not select it for inspection.

Clicking the selected row again deselects it, closes inspection and clears that
reading/search anchor. Focus returns to the viewport. With no reading row, a new
search starts from all retained logs. Closing inspection also clears its reading
anchor; an independent active Find result may remain for continued refinement.
Guard focus restoration so it cannot recreate an anchor that was just cleared.

Pending evaluations may update valid counts, but cannot restore a deselected
origin, reopen inspection or apply an obsolete scroll request.

### Explicit navigation

- With an active match, Up/Down move strictly to the preceding/following matching
  record. With a newly chosen reading row and no active match, the first seek is
  inclusive of that row.
- With no reading row or active match, Down starts at the first matching record
  and Up at the last. The viewport's current position is irrelevant.
- Wrap in both directions. Report `Wrapped to beginning` or `Wrapped to end`
  locally, keeping the ordinal global. With one hit, stay there and report
  `Only matching record`.
- Keep Find input focus during navigation. Clicking a scrollbar match mark
  selects that Find result and returns focus to Find; it does not inspect it.

## Matching, highlighting and hidden content

Search the recent log window: at most 1,000 records and 5 MiB of original text
under the current retention contract. Match application text OR the active
extracted message. Exclude the timestamp added by Kubernetes. Readable/Raw and
formatting profiles do not change this scope; changing the extracted message can
change the decoded-message part of the predicate.

Use one matching definition for counts, navigation, substring decorations and
scrollbar marks. Original JSON keys and values are searchable: `request` can
match `requestId` even when the displayed message contains neither word.

Matching modes are independent query controls. Whole-word boundaries treat
Unicode letters, numbers and underscore as word characters. In literal mode,
regex punctuation is ordinary text. Regex mode needs explicit invalid-pattern
feedback, cancellation of obsolete work, and a bounded evaluation outside the
UI thread. Zero-width matches count the record without drawing empty highlights.
Choose and validate the execution budget against the retained-window bounds;
the prototype's timeout is not a measured production performance target.

Highlight all visible matching occurrences without shading every matching row.
Give the active result a separate row treatment, compatible with inspection and
keyboard-focus indicators. Preserve exact log text and ordinary drag selection;
decorations must not turn into browser text selection.

When the current representation hides a hit, explain why. A readable message
with a match only in application text shows `Match in original text` with an
action to open that record's Application text tab. If Raw cannot display a hit
that exists only in the decoded message, explain that representation instead.
Do not silently change the displayed mode or guess a field path from string
offsets. Activating the explanation explicitly opens the relevant record in the
existing inspector, preserving the independent active Find result.

Generated hints, field-count badges and other interface labels stay out of
selected/copied log text. Original-copy actions remain exact. Do not derive
original-string offsets by blindly lowercasing Unicode text, and do not render
log content as HTML.

Place match marks beside the log scrollbar using actual row positions, including
wrapped or expanded rows. Distinguish the active mark. Dense matches may share a
visual position; navigation/counts must still include every matching record.

## Selected text and history

**Search selected text** seeds only an empty input, captured before opening Find
changes focus. Accept a single-line selection of actual log text inside one
record or its inspector, up to 256 Unicode code points. Ignore generated labels,
multi-record selections and selections from another surface. Keep an existing
query unchanged. This feature sets the query; it does not restrict search to the
selected text.

**History** is in-memory per viewer, with up to seven distinct committed queries,
newest first. Record a query on explicit navigation or closing Find, rather than
recording each keystroke. Keep the text and its three matching-mode flags together
so recall reproduces how it was interpreted. Do not retain a historical cursor:
recall is a new search from the current reading row or the beginning.

The history popover supports choosing an entry, a no-history state and Clear
history. Dismiss it with Escape or an outside click and return keyboard focus
to the clock button. Do not write queries/history to disk or share them between
targets. The permanent product choices above need no search-preferences storage.

## Refresh, following and lifecycle

Surviving results and reading anchors retain their observed record occurrence
across snapshot replacement. Use the existing ordered-overlap contract, not a
numeric index reused for another record or text equality alone. Identical whole
windows cannot reveal unobserved additions of identical lines; do not promise
stronger identity than the retention model provides.

- Refresh recomputes counts and decorations while retaining a surviving active
  result. New matches do not trigger a result jump.
- If a previously empty search gains matches, update its count and wait for
  explicit navigation. If the active result expires, clear it and explain why.
- If a reading origin expires, discard it. The next new search uses a surviving
  chosen row, otherwise the beginning of retained logs.
- Profile changes re-evaluate the predicate without a fetch. Retain a result
  that still matches; otherwise clear it without an unsolicited jump.
- Raw/Readable, wrapping, timestamps and inspection layout preserve query and
  result identity. Refresh must preserve retained text selection and focus.
- New target/container/instance or viewer teardown resets query, modes, history,
  origins and results. Hiding Find or visiting Profiles retains them while valid.

The special Find-follow lock was not selected. Keep ordinary viewport behavior:
following is possible at the bottom, scrolling away stops it, and To bottom
restores it. Search does not pause/resume requests. Following output can move
the viewport during refresh; search matching itself must not request a jump.
Closing Find does not implicitly change following, and resize preserves an
explicit following state.

The selected ordinary result reveal can align the result at the top of the log
scroller; the context-preserving reveal experiment is excluded. Avoid animated
travel between results. All reveal requests must be scoped to the live query and
target, and canceled when cleared, superseded or disposed.

## Keyboard, accessibility and host ownership

Keep the established local shortcuts: Ctrl/Cmd+F opens Find and selects its
retained query, Enter/Shift+Enter navigate inside the Find input, and
Ctrl/Cmd+G / Shift+G repeat navigation in eligible local log-reading context.
Visible controls call the same actions. Use the platform's actual primary
modifier, exact modifier combinations, and the existing IME/AltGraph guards.

Keep native menus, other editors, Profiles and inactive viewers outside Find's
ownership. A popover/transient dismisses before Find; Find dismisses before
inspection. One Escape produces one dismissal. Closing or clearing local search
does not navigate host history, and restoring focus is not a row activation.

Provide names, pressed states, tooltips, focus indicators and useful disabled
states for every button. Announce concise count/error/wrap changes politely,
coalescing typing updates. Do not move focus to status messages or rely on color
alone to distinguish current result, selection and keyboard focus.

## Acceptance cases

| Case | Required result |
| --- | --- |
| Select a row, scroll elsewhere, start or replace a query | Resolve from the chosen row, including it if it matches. |
| Deselect the row, remain scrolled down, search `payment` in the prototype fixture | Find row 2, `1 / 11`; not row 58, `8 / 11`. |
| No reading row, query matches the first retained record | Include that record. Initial Previous starts at the final match. |
| Type `upstream` one character at a time | A result that still matches does not advance between keystrokes. |
| Navigate, add a no-match suffix, then correct it | Restore the last matching refinement candidate when still retained. |
| Clear/retype or select the whole input and type `request` | Start from the reading row, otherwise the beginning; do not inherit the prior result. |
| Text highlighting on, row-wide highlighting absent | Every visible occurrence is marked; only the active result has its Find-row treatment. |
| Match occurs only in hidden/or decoded content | Correct count and navigation, plus a truthful explanation and working inspector action. |
| Empty query, no hits, one hit, wrap in either direction | Correct count/disabled states/feedback; no unintended scroll on clearing or no hits. |
| Toggle Aa, whole-word or regex; recall a history entry | Counts/navigation/decorations agree; states are visible and no query is lost. |
| Invalid, slow or zero-width regex; query cleared during evaluation | Responsive input, useful feedback, correct record count and no stale reveal. |
| Existing query plus selected log text, or a foreign/multiline selection | Retain the query or ignore the invalid seed. A valid empty-input seed works. |
| Refresh with repeated lines, new matches and eviction | Preserve surviving occurrences, focus and text selection; expire references safely. |
| Deselect or close inspection during a pending evaluation | No resurrected reading anchor, reopened inspector or obsolete scroll. |
| Scroll away from following; resize; search near the newest record | Honor ordinary viewport following and explicit Pause independently. |
| Clear, Close Find, history popover and Escape | Distinct actions and correct focus/dismissal order. |

Use the current [UI verification workflow](../agents/ui-verification.md) for
packaged acceptance: background CDP on workspace 7 preserving user focus,
workspace and pointer. Native attended-input checks require its explicit opt-in.
Prototype/browser observations do not establish packaged Freelens, clipboard,
OS shortcut or cross-platform acceptance. Mark unperformed checks as unverified.

Keep the existing module boundaries: pure matching/navigation logic, viewer state
and host input ownership, and log-viewport reveal/retention. Bound decoration work
for long records and dense matches separately from exact matching/counts. The
throwaway prototype is evidence, not production code to merge wholesale.
