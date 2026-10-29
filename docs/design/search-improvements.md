# Search from the current reading position

Status: exploratory draft, 2026-10-25. Superseded by
[Find: final design draft](search-final-design.md). This document preserves the
exploration and is not the implementation reference.

[Interactive browser prototype, 2026-10-25](http://127.0.0.1:8088/freelens-search-prototype/):
all search options can be toggled individually, with Current behavior and Proposed
defaults presets. It lives on the throwaway `prototype/search-improvements`
branch. Match navigation uses the native Freelens up/down icons, as requested.

## Why change Find

When investigating a failure, a reader often selects a record, inspects it, and
then searches for the next related event. Find should continue that investigation
from the record they are reading. Restarting at the oldest matching record loses
their place and makes repeated searches unnecessarily expensive.

**Proposed default: search from the current row, include that row if it matches,
and move forward through records in display order.** Previous searches backward.
Keep surrounding records visible so readers can understand what happened between
matches.

For example, suppose `timeout` appears in records 120, 400, 730 and 900:

| Reader's action | Proposed result |
| --- | --- |
| Select record 700, open Find, type `timeout` | Record 730, shown as `3 of 4 matching records`. |
| Select record 730, start that search | Stay on 730; it already matches. |
| Press Next from 730 | Record 900. |
| Press Previous from 730 | Record 400. |
| Press Next from 900 | Record 120, with `Wrapped to beginning`. |
| Select record 700 while the query remains, then press Previous | Record 400. |

Record numbers here are one-based positions in the current recent log window,
not durable identifiers.

## What the code does today

Checked against the working source on 2026-10-25:

- [`changeQuery` in `viewer.tsx`](../../src/renderer/viewer.tsx) always takes
  `findMatches(...)[0]` and requests a scroll to it, on every input change.
- The viewer's `cursor` is a Find-result position. Selecting an inspection row
  does not update it. `navigateMatch` therefore has no reading-row origin.
- [`moveMatch` in `navigation.ts`](../../src/core/navigation.ts) uses the first
  match for forward navigation without a current match, and the last for backward
  navigation. Neither fallback receives the selected or visible row.
- Find is literal and case-insensitive. It searches application text OR the
  active extracted message, counts each matching record once, and excludes the
  timestamp added by Kubernetes. Hidden JSON fields can match through application
  text. Readable/Raw does not change this predicate.
- The active matching row has a treatment in
  [`viewer.css`](../../src/renderer/viewer.css); the matching substrings and other
  matching rows are not highlighted.
- [`LogViewport.show`](../../src/renderer/log-viewport.ts) places a result at the
  top of the scroller, even when it was already visible. Find and the viewport
  already retain positions across observed snapshot overlap.

The existing [navigation tests](../../tests/navigation.test.ts) establish the
predicate, record-level count, wrapping and overlap behavior. They do not exercise
search relative to a selected row.

## Preserve the existing workflow

Help readers trace container output with familiar controls and a stable reading
position. Keep the existing compact toolbar,
on-demand Find bar, black log canvas and configurable inspector layouts.

The accepted [navigation policy, issue 22](https://github.com/maksimgurenko/freelens-json-logs/issues/22)
and [shortcut contract, issue 29](https://github.com/maksimgurenko/freelens-json-logs/issues/29)
were checked on 2026-10-25. Preserve these constraints:

- Find keeps all records visible. Inspection and text selection remain separate
  actions. Finding a record does not open or replace the inspector.
- Ctrl/Cmd+F opens Find; Enter/Shift+Enter in its input and Ctrl/Cmd+G / Shift+G
  navigate. Visible buttons and shortcuts call the same actions.
- Closing Find retains its temporary per-view query and current match. Escape
  closes Find before inspection; native transients keep their existing priority.
- Profiles, foreign editors, native menus, IME/composition and inactive views keep
  their input ownership. Add no new shortcut aliases in the first increment.
- Search does not implicitly pause/resume requests, fetch older logs or create
  host-history entries. Its scope remains the retained recent log window, currently
  at most 1,000 records and 5 MiB of original text.

Issue 29 preserved the previous first-match behavior. This draft deliberately
proposes changing that initial-position rule; it is not authority to revise the
accepted issue or its verification evidence without a new decision.

## Proposed interaction contract

### 1. Separate reading position from search result

Use three small concepts internally; these are proposed design terms:

| Concept | Meaning |
| --- | --- |
| Reading row | The row the user most recently deliberately focused or activated in the log list. An existing inspected row supplies it when no more recent row interaction exists. |
| Search origin | A retained row reference captured before focus moves into Find. It stays fixed while the user edits the query. |
| Active match | The matching record reached by a query preview or a navigation command. It can differ from the inspected row. |

Opening Find must capture context before focusing/selecting the input. Resolve a
new origin from the most recent deliberate row interaction, then the inspected
record. With no selected or focused reading row, start at the beginning of all
retained logs, regardless of scroll position. With an empty window, leave the
origin unset. Include-current-row applies only when a reading row exists; it
must not skip the first retained record when there is no row anchor.

Pointer position alone, an arbitrary DOM text caret and a selected row in native
Lens Logs are not origins. A direct row click or keyboard row interaction can
relocate the origin even if the query has not changed. Programmatic focus
restoration must not be mistaken for a new user row interaction.

A selected row anchors new searches even when the viewport is scrolled elsewhere.
Clicking that row again explicitly deselects it and clears its reading/search
anchor. Return focus to the viewport; with no chosen row, a new search starts
at the beginning of all retained logs. A pending query may update counts, but
must not reopen inspection or restore an old active result. This does not change how an existing
query is refined: retain its active match while that record still matches.

### 2. Preview from a stable origin while typing

Starting a new query finds the first matching record **at or after the origin**.
If none exists there, wrap once to the beginning and report it. While refining
that query, keep the active result if it still matches; otherwise seek from the
captured origin. The origin does not follow intermediate previews.

Clearing/retyping a word or replacing the whole selected query starts a new
search from the selected reading row, or the beginning of retained logs after
deselection.
It does not inherit the previous query's active result. While a row is selected,
that row takes precedence over the top of the currently visible viewport.

For example, starting at record 700 and typing `t` → `time` → `timeout` must
resolve every preview from 700. An early broad query must not move the origin to
record 120 and make the more precise query continue from there.

A query-edit sequence begins when typing starts after opening Find, a navigation
command, or a deliberate row relocation. If the user navigated to record 900 and
then begins refining the query, 900 becomes the origin for that edit sequence.
Subsequent keystrokes keep it fixed. No idle timer changes the origin.

- Empty query: clear match decorations and result state; keep the viewport where
  it is. Do not resume following output.
- No matches: show `No matching records in retained logs`; keep the viewport and
  inspector steady. Do not scroll to the beginning or turn this into a log error.
- Clearing and retyping starts a new query from the selected reading row, or the
  beginning of retained logs when the row has been deselected.
- Do not navigate during IME composition; preview the committed query afterward.

### 3. Make Next and Previous relative to where the user is

| Situation | Next | Previous |
| --- | --- | --- |
| Active match, no later deliberate row relocation | Next distinct matching record | Previous distinct matching record |
| User deliberately focused/activated another row | First match at or after that row | Last match at or before that row |
| Query exists, but there is no active match | Resolve from retained origin using the same inclusive rule | Resolve backward from retained origin using the same inclusive rule |
| No query | Open/focus Find without moving | Open/focus Find without moving |

After choosing an inclusive initial match, the next command advances strictly
beyond it. A deliberate row relocation clears the old active-match designation
without scrolling; retain all-match decorations and show `N matching records ·
start from current row` until a command or query edit resolves the next result.

Wrap in either direction, with inline status `Wrapped to beginning` or `Wrapped
to end`. Keep the ordinal global to the current matching-record list; do not
renumber results relative to the origin. With one matching record, repeated
navigation stays there and reports `Only matching record`.

### 4. Reveal a result without throwing away context

- Keep the query input focused while navigating.
- If the active row is fully visible, leave vertical and horizontal scroll
  positions unchanged.
- If it is outside the viewport, reveal it with a small amount of neighboring
  context where space allows. Tall wrapped rows only need their beginning visible.
  Avoid smooth animated scrolling during repeated navigation.
- Moving to a result stops tail-follow, including a result at the bottom. Automatic
  requests continue. **To bottom** explicitly resumes following; closing Find does
  not restore it implicitly. Merely opening Find does not change following state.
- Preserve the independent inspected record and ordinary drag-to-select/copy.
  Match decoration must never become browser text selection.

### 5. Retain context when Find closes and logs refresh

Reopening Find with an unchanged query and no deliberate row relocation restores
the current result and selects the query text without scrolling. A new row
interaction takes precedence over that old result on the next navigation or
query edit. Returning from Profiles follows the same rule.

| Change | Proposed behavior |
| --- | --- |
| Automatic or explicit snapshot refresh | Recompute matches/count and map surviving origin/active result through observed ordered overlap. Do not request a result scroll. Existing viewport following/anchoring still applies. |
| New matching output arrives | Update the count. Keep the active result; do not jump to new output because it matches. |
| Previously empty search gains matches | Show `N matching records · choose Next or Previous`; wait for user navigation. |
| Active result expires | Clear only that result; report `Current match left retained logs`. Keep surviving origin and viewport state. |
| Origin expires | Clear that reference; on the next explicit search action use a surviving reading row, otherwise the beginning of retained logs. Do not reuse its old numeric index. |
| Active profile changes | Recompute the existing application-text OR extracted-message predicate. Retain the active result if it still matches; otherwise clear it without jumping. |
| Readable/Raw, timestamp visibility, wrap or inspection layout changes | Preserve query and result identity. Recompute presentation/decorations; do not navigate. |
| Container/target changes, observed container restart, or new viewer | Reset origin, active result and query so one container instance cannot position a search in another. |

Use the existing ordered-overlap mapping, not text equality alone or a newly
invented globally unique record ID. Repeated identical transport lines must keep
their observed occurrence. Without established overlap, discard the search
reference and wait for the next explicit action. Identical whole windows cannot
reveal unobserved additions of identical lines; this design inherits that limit
and does not promise stronger record identity.

## Other search patterns worth implementing

These priorities are recommendations for this viewer, rather than a claim that
every familiar search feature belongs in the first release.

| Pattern | Practical use | Recommendation and tradeoff |
| --- | --- | --- |
| Highlight all matches, with a distinct active result | Scan where `timeout` appears while retaining surrounding events. | Next increment. Mark visible matching substrings and matching rows; keep active result, keyboard focus and inspected-row treatments distinguishable without relying only on color. |
| Explain matches in hidden content | A request ID matches original JSON but is absent from the readable message. | Next increment. Show `Match in original text` on the active row when no displayed searchable text explains the hit; offer `Show application text`. Opening it explicitly selects that record in the existing inspector. Keep annotations out of copied log text. |
| Seed Find from selected text | Select a request ID, then find its later events without copy/paste. | Next increment. Seed only an empty query from a short, single-line selection wholly inside one record in this viewer or its inspector. Never overwrite a retained query or use host/global selection. Suggested cap: 256 Unicode code points. |
| Match case | Distinguish identifiers such as `OrderID` and `orderId`. | Optional after the core fix. Explicit `Match case` toggle, off by default and temporary per view. Show its state accessibly; keep literal search as the default. |
| Message-only search scope | Avoid matches that occur only in large JSON payloads. | Optional. An explicit `Application text + message` / `Message only` scope can reduce noise; the first preserves the existing OR predicate. Show the active scope and use one predicate for count/navigation/highlighting. Message-only means the active extracted message, independent of Raw/Readable. |
| Only matching records, with context | Follow one request through a noisy container. | Separate filter design. Label the action **Filter**, show the number hidden and provide Clear filter. Context rows can retain causality, but complicate anchoring and counts. Do not silently turn Find into a filter. |
| Search history | Repeat several request IDs or errors within one investigation. | Later, if needed. Temporary per-view history first. Persistent history adds settings and retains potentially sensitive log terms; it needs a deliberate product decision. |
| Regular expressions and whole-word matching | Search alternate error names or distinguish `id` from `order_id`. | Defer. Regex needs invalid-pattern feedback and execution limits; bounded input alone does not prevent pathological execution. Whole-word boundaries need a definition for Unicode, JSON paths and identifiers. Neither addresses the reported positioning problem. |
| Match marks on a scrollbar | See clusters of matches before navigating. | Defer until highlighting proves insufficient. Adds visual clutter and a separate mapping from variable-height rows to scroll positions. |

Keep navigation at **one stop per matching record**, even if the query occurs
several times in its message and original JSON. Highlighting multiple occurrences
must not inflate the record count. Occurrence-level navigation would be a separate
behavior decision.

## Layout and feedback

Keep the existing Find bar and controls.

Use native Freelens Material Icons `keyboard_arrow_up` for Previous and
`keyboard_arrow_down` for Next, retaining accessible names, disabled states and
shortcut tooltips. The prototype embeds the same icon font used by the native
log search; visible text buttons are replaced by those icons.

A typical state is:

```text
Find [ timeout                         ]  1 of 12 matching records
     [up icon] [down icon] [Close]        Wrapped to beginning
```

The sketch shows content hierarchy, not a required extra control row. At wider
sizes the controls fit on one line; at narrow widths they wrap in logical tab
order. Preserve usable query width, visible close/navigation actions and status
text without horizontal page overflow.

Describe the bounded scope near the input: `Search retained logs`. Empty results
must not imply that the entire container's history was searched. Keep wrap,
no-match and expired-result feedback in one local polite status area. Coalesce
typing announcements; do not announce every matching record or move focus to
status text. A wrap notice lasts until the next search interaction, rather than
being cleared by background refresh.

## Implementation boundaries and risks

- Extend the pure navigation logic with origin-aware seeking and an explicit
  outcome: result, wrap direction, no result or only result. Preserve one shared
  matching predicate for counting and navigation.
- Keep event ownership, origin capture, edit-sequence boundaries and inspector
  state in the viewer. Do not solve this using `window.find()` or the host's
  native Find state; the searchable application content differs from rendered DOM.
- Let `LogViewport` support a context-preserving result reveal. Its first visible
  retained row is a scroll anchor, not a fallback search origin. Tail-follow must
  become explicit for search
  navigation rather than inferred solely from proximity to the bottom.
- Keep row references tied to their source snapshot, with overlap mapping on
  replacement. Cancel pending result reveals on query clearing and instance/view
  reset; an old render must not apply a stale scroll request.
- For later substring highlighting, do not assume offsets in lowercased Unicode
  strings map directly to original strings. Original JSON escapes and decoded
  messages are separate searchable representations. Preserve exact original text,
  text selection and copy; never render log content as HTML.
- A single retained record can contain much of the 5 MiB budget. Bound visual
  decoration work/DOM growth separately from exact record matching and counts.
  Check performance with long records and dense matches before choosing a
  highlighting mechanism supported by the pinned host.

## Suggested delivery

1. **Repair positioning:** reading-row origin, stable incremental preview,
   inclusive initial seek, directional repeat, reveal behavior, wrap/no-match
   feedback and snapshot/instance handling. Preserve the predicate and shortcuts.
2. **Make results easier to understand:** highlighting of matching rows and text,
   hidden-content explanation and selected-text seeding. Decide whether match-case
   and message-only scope earn their extra controls after trying the first step.
3. **Consider larger workflows separately:** filtering with surrounding context,
   history, regex and scrollbar marks. None blocks the positioning fix.

## Acceptance scenarios for implementation

| Scenario | Required observation |
| --- | --- |
| Selected row near the end; earlier and later hits exist | First query preview starts at the selected row, never at the oldest hit merely because it is first. |
| Selected row itself matches | It is the initial result; Next moves beyond it. |
| No selection; keyboard row focus or a scrolled viewport | Use a deliberately focused row, otherwise the beginning of all retained logs, regardless of scroll position. |
| Query is refined and shortened, including an intermediate no-match query | All previews use the same edit origin. Clearing the input does not scroll. |
| User navigates, then edits the query | Begin the new edit sequence at the active result. |
| User clicks another row with retained query | Next/Previous resolve around that row, independently of the old active result. |
| Both directions cross a boundary; only one hit exists | Correct wrap status/ordinal; one hit is reported without apparent movement. |
| Active row already visible; offscreen and tall wrapped results | No unnecessary scroll; offscreen reveal retains useful context. |
| Query matches only a hidden field or decoded escaped message | Count and navigation preserve the existing predicate in both Readable and Raw. |
| Background refresh adds, retains or evicts repeated lines | Counts update, surviving occurrences map correctly, and search causes no unsolicited scroll. Expired references do not select another record by index. |
| Profile changes, container changes and observed restart | Reformat without jumping; reset search across instance/target boundaries. |
| Find closes/reopens, or Profiles opens/returns | Retain query/result when valid, preserve inspector and Pause state, and honor subsequent deliberate row relocation. |
| Search reaches the newest row during automatic updates | Following stays off until To bottom; requests continue. Opening Find alone does not stop following. |
| Find shortcuts coexist with native Logs, editors, menus and composition | Existing local ownership and Escape order remain intact; no duplicate host action. |

Use pure tests for seeking/edit transitions and overlap, plus renderer/viewport
integration checks for row-origin capture and requested scrolls. Any packaged
Freelens verification must follow the current
[UI verification workflow](../agents/ui-verification.md): background CDP on
workspace 7, preserving user focus, workspace and pointer. Native attended-input
checks require the documented explicit opt-in. Report unavailable platforms and
unperformed native input checks as unverified.

## Pattern references

These official docs informed the options above; they do not establish this
viewer's proposed origin policy. The recommendations are a synthesis for the
bounded container-log workflow. All links were checked on 2026-10-25.

| Source | Displayed date | Relevant pattern |
| --- | --- | --- |
| [VS Code: Basic editing](https://code.visualstudio.com/docs/editing/codebasics#find-and-replace) | 2026-10-21 | Selection seeding, query history, search scope and explicit case/whole-word/regex options. |
| [Firefox: Find in page](https://support.mozilla.org/en-US/kb/search-contents-current-page-text-or-links) | Relative update shown as `4 weeks ago`; exact date not established | Incremental search, ordinal/total feedback, distinct active/all-match highlighting and explicit options. |
| [Chrome DevTools: Console reference](https://developer.chrome.com/docs/devtools/console/reference#search) | Last updated 2019-04-18 UTC | Separate log search and filtering controls; directional results, case and regex options. |
| [Microsoft: Windows Terminal search](https://learn.microsoft.com/en-us/windows/terminal/search) | Last updated 2025-11-12 | Directional search, pane-local scope and explicit case matching. Its default bottom-up direction is an alternative, not the proposed default here. |

## Decision to confirm

The principal draft choice is **including the origin row on the initial search**.
The alternative is to start strictly after/before it. Including it makes query
refinement stable and lets a reader confirm the record they already selected;
subsequent Next/Previous commands still advance. The positioning fix can ship
independently of the optional patterns above once this behavior is agreed.
