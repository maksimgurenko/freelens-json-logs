# Linux native acceptance completion for #48

Baseline: `e41520ea01e1badaa07c4adc731e080db9f8aca6`, branch `implementation/find`.
Selected **#48 Verify production Find against the acceptance matrix**, with #47
done locally; claimed #48 without a GitHub message. The current user direction
supersedes the earlier operator time cap. This report reconciles the four remaining
Linux native groups; it does not reopen the accepted resource deferral or claim
Windows/macOS coverage.

## Final reviewed correction

[Independent-review corrections](native-review-corrections.md) strengthen the native
whole/selected-partial IME oracles and resolve an actual light-theme contrast failure.
Final package is **`15f99148d56a5b6100b929ff79c5d9b3680c9186a36dc5d5e08706bfed67749b`**;
only row CSS changed. The original 37 groups below retain their `0648bbe5` scope;
three fresh native groups establish the corrections on the new installed package.
The initially recorded contrast styles were a failed readability observation,
not passing contrast acceptance. Full closure uses the correction report.

## Artifact and route

The fresh [installed identity](host/native-completion-20261028/package-identity.json)
is `freelens-readable-logs@0.1.34`, SHA-256
`0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`.
All three installed assets equal the current local assets. Freelens 1.10.3,
Electron 41.10.0/Chromium 146.0.7680.216, Node 24.18.0/npm 11.16.0.
[Live bodies/full comments](host/native-completion-20261028/authority.json)
and [comparison](host/native-completion-20261028/authority-comparison.json) match
cached #36/#37/#38/#40/#48. The accepted literal plan and original criteria govern.

Every native action used the fresh `/tmp/fd-14yhcw_r/wayland-1`, compositor PID
2547875, host PID 2548140 and disposable profile, on private workspace 7.
The headless labwc → nested Hyprland session reuses the documented modified
Aquamarine diagnostic; it is not stock compositor or physical hardware evidence.
`isolatedInput()` checks runtime ownership/mode, exact socket, compositor executable,
PID/environment/instance, owned profile/window and separation from the live systemd
user compositor before actions. Input environments omit DISPLAY and DBus.
`FREELENS_UI_MODE` stayed unset. No global `/dev/uinput`, attended helper, user
clipboard, native desktop operation, `Page.bringToFront`, fake focus or host patch.

The persistent `zwlr_virtual_pointer_v1` pointer uses the measured 1280×720,
scale-1 output. `wtype` supplies compositor-local virtual keyboard input and a
persistent seat. `wl-paste` reads only that session's clipboard. Native resizes and
auxiliary focus use exact owned Electron BrowserWindow IDs after private-session
proof. DOM navigation and scrolling are explicitly fixture setup; Range objects
measure text geometry and never set the document selection. All tested selections
are delivered by the compositor pointer. [Tool sources/builds/hashes](host/native-completion-20261028/tooling.json)
and [every native command/environment](host/native-completion-20261028/native-commands.jsonl.gz)
make this distinction inspectable.

## Four completed groups

The [scenario ledger](native-completion-ledger.md) maps original requirements,
independent expected behavior, preconditions, routes, exact JSON cases and limits.
A pass in a mixed-result file applies only to its named case.

- **Selection:** Inline/Side/Bottom, Readable/Raw, Application/Transport/Extracted
  message/All fields, decoded pretty-field provenance, multiline, multi-record,
  300-code-point and 256/257-astral boundaries, foreign/outside-viewer and generated
  text. Valid sources copy/seed exact text; invalid seeds and existing queries
  remain unchanged; drags do not inspect/deselect. Native hidden-source actions
  preserve representation/result. An actual HTTP 200/end refresh preserves native
  selection text, identical nodes and offsets; the HTTP wrapper is restored.
- **Pending/resize:** actual production worker successes are held at the existing
  SDK delivery seam. Native wheel, Close/Escape Find and Close/Escape inspection
  preserve cancellation while current count data can remain useful. The corrected
  wheel test proves movement **2489 → 2106 before release, then 2106 afterward**;
  following becomes Scrolled away and Pause remains independent. Held range delivery
  cannot restore an old viewport/focus. Native tiled resize retains exact selection
  nodes/offsets, visible Custom Highlights and all four measured matching marks.
- **Menus/focus/history:** actual Freelens dock Menu, native select, disclosure,
  shortcut transient and history each dismiss one layer. An actual production
  Profiles Sample logs editor owns editing shortcuts. An auxiliary OS-focused
  window receives trusted keyboard commands without changing the main viewer.
  Native first/last/initial Previous, both wraps, zero/one-hit, reading row/refinement,
  deliberate Tab row intent, seven-entry mode-tuple MRU/recall, outside dismissal,
  clear history and vanished-opener viewport fallback pass.
- **IME:** actual `zwp_input_method_v2` preedit/commit, whole replacement, partial
  refinement/correction, cancel, Clear with delayed preedit cancellation and Japanese
  text pass. An actual compositor Enter is captured by the input-method keyboard
  grab and commits once without Find navigation. Match-call observations prove no
  preedit search and one full replacement/Enter commit evaluation.

## IME trust and late-completion limits

Native start/update/composing input are trusted; observed `compositionend` is
untrusted. No event flag was rewritten. An observational JavaScript
`dispatchEvent` wrapper recorded **zero composition dispatch calls** and was
restored. [Exact-version Chromium source](host/native-completion-20261028/ime-native-provenance.json)
constructs composition-end through scoped native event dispatch; that route differs
from ordinary start/update dispatch. This explains a native route without inventing
an acceptance requirement that every event's flag be true. The source explanation
is an inference corroborated by protocol/event observations, not a modified host.

Clear's native pointer focus transition completes the existing composition before
the Clear action; a delayed native preedit cancellation leaves the field empty.
The existing installed [late composition-end regression](host/functional-final/composition-clear.json)
separately verifies suppression of a late DOM transaction. We do not relabel it as
a late native composition-end that this browser route did not emit.

The preserved [old-serial experiment](host/native-completion-20261028/native-ime-late-serial-first.json)
sent a commit using serial 11 after serial 15. This private compositor still delivered
**trusted non-composing `insertText`**, creating a fresh `stale` query. Its expected
empty-query oracle failed. That is not observed resurrection by `compositionend`;
ordinary native insertion remains editable under the original contract. The same
attempt's Japanese case depended on keyboard delivery after releasing the test IME
grab and did not establish its precondition. Final independent IME ordering places
Enter/grab last; all six groups pass, including Japanese replacement before the grab.
No requirement to discard every later native insertion was added.

## Preserved failures and corrections

Earlier failures are retained with their own verdicts. The one-shot virtual pointer
moved the cursor without delivering clicks. A persistent pointer with native seat
focus delivers trusted events. The owned installation toast was removed in that
working setup; it is not claimed as the sole cause of the isolated pointer failure.

Bottom's small inspector pane auto-scrolled during a drag near its edge; centering
individual selected glyphs inside clipping panes establishes exact native selection.
The oversized source initially had an off-output start; its actual selected interval
is now scrolled into view. The real host sidebar is draggable, so it was not a valid
text-selection precondition. The final foreign source is an explicitly labelled,
removed selectable span outside the viewer, not a claim about a production editor.
Generated hint text is CSS-generated/unselectable; an actual inspector heading
provides selectable generated-text rejection evidence.

The first wheel attempt was downward at the bottom: no movement occurred and the
reply revealed row 2. That failed oracle remains. The passing replacement requires
settled native motion away from the boundary, without relaxing no-late-jump.
History Clear initially had an occluded click; native Tab/Enter establishes the real
button focus. Find's vanished-opener attempt initially reused an already-open bar;
the corrected case actually opens closed Find from a subsequently removed inspector
tab. The first host-menu driver incorrectly expected a foreign dock icon to own
Find's next Escape; the corrected route returns to a real eligible Find control.

## Validation and cleanup

[Typecheck](host/native-completion-20261028/typecheck.txt.gz), [250 tests](host/native-completion-20261028/tests.txt),
[six desktop guards](host/native-completion-20261028/ui-guards.txt), C compilation
with `-Wall -Wextra`, syntax checks for every new driver and `git diff --check` pass.
No production source/package change was made during this initial checkpoint; the subsequent reviewed contrast fix and new package are recorded above.
Renderer/worker/package/resource suites were not repeated without a changed source
or concern; the resource issue remains accepted/deferred with every failed result
and threshold intact.

Normal host exit is **0**. [Shutdown](host/native-completion-20261028/shutdown-clean.json)
records 19 starts/19 actual worker exits, peak one, zero live, closed service and
empty owner/retiring/opening/sender maps/watch. SDK handlers visible at will-quit
and unrelated process resource handles are not claimed zero at that instant.
[Cleanup](host/native-completion-20261028/cleanup.json) removes the UID/label-checked
namespace, owned profile and runtime after all owned PIDs exit; no process retains
the private runtime. Instrumented SDK/HTTP/dispatch boundaries are restored.
Dirty glossary/docs and manifest/lock hashes are unchanged; unrelated work remains.

The [read-only desktop observer](host/native-completion-20261028/real-desktop.json.gz)
records **441 notifications over 1253.27 seconds**, including **31 focus-address
transitions, 23 workspace notifications, two opened windows and one close**.
[Summary](host/native-completion-20261028/desktop-summary.json) retains different
before/after focus/workspace/pointer/client sets. This was observed user activity,
separate from the private test route; **no unchanged interval is claimed**. Unrelated
real-window titles are redacted, retaining timestamps, addresses/classes/workspaces,
event kinds and counts. No restore operation was sent to the user desktop.

The four remaining Linux groups are covered with these exact route limits.
Windows/macOS remain excluded/unverified. No physical-hardware provenance is claimed
or invented as an additional gate. No publication, PR, push, issue comment/closure
or resource investigation. Independent reviews are recorded in
[the review](review-native-completion.md).
