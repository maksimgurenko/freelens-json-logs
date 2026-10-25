# UI verification without desktop interruptions

Use background CDP for unattended work, including Ralph loops. Keep the real
Freelens window on workspace 7 and leave the user's workspace, focus and pointer
alone throughout each check. `scripts/host-cdp.mjs` evaluates probes and takes
screenshots through the opt-in localhost debugging port without raising the
window. The ticket 25–30 `desktop.py capture` and `probe` actions now use this
background path too. A silently launched host uses workspace `7 silent` and
`no_initial_focus=true`.

Background probes may inspect or interact with the renderer. Keep host window
activation, minimize/restore, desktop input injection and clipboard-dependent
checks for an attended session. Never use `Page.bringToFront`, compositor focus
commands, cursor movement or a fake `document.hasFocus()` to make an unattended
test pass. A focus-dependent check that cannot run in the background stays
deferred; record that limitation instead of claiming native coverage.

## Attended native checks

Arrange a test session with the user before running real keyboard/mouse,
minimize/restore, restart or physical-input checks on this desktop. Have the user
focus Freelens on workspace 7 first. Set `FREELENS_UI_MODE=attended` only on the
individual command for that agreed session. Keep it unset in Ralph, tmux and the
shell environment. Previous approval of one session does not enable future
unattended runs.

The shared Python/JavaScript guards refuse native entry points by default and
check that Freelens is already focused on workspace 7 before starting. Current
CDP transports also gate `Page.bringToFront`. Ticket scripts invoked through
`desktop.py script`, `input` or `focus` require attended mode until explicitly
adapted for background operation. Historical desktop-mutating helpers are gated
as well; saved evidence describes their original runs, not this new policy.
Probes that manipulate native host windows start with `// @ui-attended`;
`host-cdp.mjs` checks that marker before opening a connection. Mark any new
native window probe the same way.

During an attended session, keep focus-dependent checks short and restore any
owned pointer/window state immediately afterward. End the session when the user
resumes other work. Fully unattended native desktop coverage requires a separate
graphical session; background DOM/CDP results alone do not establish it.

## Regression check

Run `python3 -m unittest discover -s tests -p ui_desktop_test.py -v`. It exercises
the actual ticket wrappers against a fake desktop and checks that background
capture/probes never dispatch focus changes or invoke native pointer restoration.

On 2026-10-25, this check reproduced the old screenshot helper's unconditional
focus request before the fix. After the fix, three screenshots and a read-only
DOM probe ran against the installed host while Hyprland's event socket reported
zero focus/workspace events. Workspace 1, the focused browser window and cursor
coordinates were identical before and afterward. The DOM reported
`document.hasFocus() === false`; focus was not simulated. Native-input and native
window gates were checked with fake transports/devices, without foreground tests.
