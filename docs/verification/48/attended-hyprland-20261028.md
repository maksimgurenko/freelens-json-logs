# Find #48: attended pointer checks on the user's Hyprland session

On 2026-10-28 the user explicitly requested: “try to run those in my hyprland
session on workspace 7.” This is a fresh attended session under
[the UI policy](../../agents/ui-verification.md). Native input ended after the
checks below. No continuing unattended desktop permission is inferred.

The current package remains `freelens-readable-logs@0.1.34`, SHA-256
`0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`.
[Installed asset hashes and runtime](host/attended-hyprland-20261028/pointer-results.json)
match the local main, renderer and worker. No production source or package changed.

## Environment and scope

A disposable Freelens profile ran on workspace 7 of the user's actual Hyprland
compositor, using native Wayland and the current Freelens 1.10.3 runtime. The
existing user-profile Freelens window on workspace 3 was not used for the test.
The fixture contains 120 records in a separately owned Kubernetes namespace.
[Manifest, fixture identity, exact commands and source hashes](host/attended-hyprland-20261028/manifest.json)
and compressed driver sources retain the verification scaffolding. The raw host
log remains in local scratch rather than the documentation commit.

The native route was an owned Linux uinput pointer/keyboard → the user's
Hyprland/Wayland seat → installed Electron → the real log frame. It is a virtual
input device, with no physical-hardware provenance claim. The attended guard
checked workspace 7, Freelens focus and the exact test PID before input actions.
`FREELENS_UI_MODE=attended` was set only on individual commands. The stale inherited
compositor signature was replaced with the live systemd user-session values.

## Passed behavior

The first four results are in [the native pointer report](host/attended-hyprland-20261028/pointer-results.json):

- Native clicks open and close Find. The log frame observes trusted pointerdown,
  pointerup and click events, and gains real document focus.
- Native wheel input moves the log viewport from scroll position 596.875 to 0.
  A trusted wheel event reaches a log row. This is a basic wheel check, not every
  pending-reveal or following/Pause variant.
- Dragging selects exactly `row 2 upstream`, preserves the inspected-record state,
  and Ctrl+C produces the exact selected UTF-8 bytes on the real system clipboard.
- Native Ctrl+F seeds Find with that selected source; Escape closes Find.

[The completed refresh-retention check](host/attended-hyprland-20261028/native-selection-refresh.json)
uses that same native-created selection. A production Refresh action is activated
through the DOM, and a target-scoped observational Node HTTP hook records a real
200 log response completing. Selected text, anchor/focus nodes and both offsets
remain identical. The observer is restored exactly afterward. This verifies
native-selection retention through a real refresh, without claiming a native
pointer click on the Refresh control.

## Failed setup and measurement attempts

The launch wrapper's child did not inherit the requested silent workspace rule.
The test window initially mapped on workspace 2; it was explicitly moved to 7
before native verification. [Placement evidence](host/attended-hyprland-20261028/workspace-placement.json)
retains the actual focus/workspace transitions. This was attended work; no claim
of an uninterrupted desktop is made.

The first native Find click failed because the root-window “extension successfully
installed” notification covered the Find button. [Hit testing](host/attended-hyprland-20261028/opener-hit-test.json)
and [the screenshot](host/attended-hyprland-20261028/current.png) identify that overlay.
[The original failed run](host/attended-hyprland-20261028/pointer-first-blocked-by-toast.json)
is retained. Native dismissal of the owned install notification allows subsequent
clicks into the log frame. This establishes the blocker in this attended run;
the older isolated virtual-pointer run was not rerun or retroactively passed.

[The next attempt](host/attended-hyprland-20261028/pointer-wheel-distance-first.json)
delivered a trusted wheel event and moved the viewport, but incorrectly expected
one large wheel event to reach the beginning. The driver now sends a bounded
sequence while observing progress. No product threshold or behavior changed.

The final combined driver's first four groups pass, but its refresh group fails
because browser Network tracing does not observe the Node HTTP request path.
That failed observation remains in `pointer-results.json`; it is not relabelled
as a fully passing suite. The separately recorded observational HTTP check above
establishes actual refresh completion and retention.

## Cleanup and remaining acceptance

Each native pass restores its starting pointer position. Clipboard contents are
restored after the copying pass only when the current contents still equal the
test-owned copy. The final copying pass reports successful restoration. Later
window/focus restoration can move the pointer; no whole-session pointer equality
claim is made.

[Cleanup](host/attended-hyprland-20261028/cleanup.json) records normal test-host exit
code 0, removal of the owned profile, and UID/label-checked deletion of the owned
namespace. The original terminal and workspace 2 are restored. The user-profile
Freelens window and unrelated fixtures are preserved.

These results add a real-session native layer for basic pointer controls, wheel
scrolling, source drag/copy/Find seeding and refresh retention in this fixture.
They do not complete all D01–D16 native permutations. Multiline/foreign/oversized
selection cases, selection/highlights through resize, pending/manual-scroll
variants, complete IME behavior, foreign-menu/other-window shortcut ownership and
remaining native history/mode/edge cases stay unverified. Windows/macOS remain
excluded. The DOM/listener resource issue remains accepted/deferred; no resource
investigation was performed. Original broad acceptance checkboxes remain unchanged.
