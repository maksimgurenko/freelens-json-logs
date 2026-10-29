# #48: bounded unattended Linux native pass

Baseline/review pin: `5982a321d720669f0272e09f272499a79eb9c8fc` on
`implementation/find`. Selected **Verify production Find against the acceptance
matrix**, with #47 done locally, and claimed #48 before work. [Live authority](host/native-isolated/authority.json)
matches the cached full bodies/comments for #36/#37/#38/#40/#48. The accepted
literal-only plan remains unchanged. The user's 2026-10-27 direction explicitly
authorizes separate-session native checks without attendance. No desktop native
activity or resource investigation was authorized or performed.

## Outcome and artifact scopes

This is a partial acceptance checkpoint. Pointer-based source selection/retention,
wheel input, complete native IME transactions and some foreign-menu/focus cases
remain unverified. Broad ticket criteria remain unchecked. Windows/macOS are
excluded and explicitly unverified. Stop after this bounded attempt; no publication.

The initial package was `freelens-readable-logs@0.1.34`, SHA-256
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.
[Its installed identity](host/native-isolated/package-identity.json) and every
original failed result remain intact. A copy of that tarball is retained in
[scratch](host/native-isolated/original-package-preserved.json).

Native close followed by quit exposed a concrete visibility-disposal bug, outside
the resource deferral. The supervisor explicitly authorized its narrow fix and
one affected final-package verification within the original deadline. The current
final package is **SHA-256 `0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`**,
still version 0.1.34. [Fresh fixed installation](host/native-close-fixed/package-identity.json)
matches all local assets. [Asset comparison](host/native-close-fixed/asset-comparison.json)
proves only the main bundle changed; renderer and trusted worker bytes are identical.
Earlier keyboard/copy/IME results belong to the initial package, with that explicit
unchanged-renderer/worker relationship. They are not fresh whole-package repetitions.

## Isolation, tools and budget

Reused `prepare.py`, `display.py`, `launch.py` and `private-session.mjs`, extracted
labwc and the existing private modified Aquamarine diagnostic. No system install,
stock-display investigation, host/CSP/ASAR modification, global input device,
attended helper, shared guard change or fake document focus. FREELENS_UI_MODE was
unset throughout. The original private runtime was `/tmp/fd-07r3z4rz`; the
user-authorized fixed-package follow-up used fresh `/tmp/fd-flt0h7pf`, a new profile
and a distinct compositor/PID. Both used private workspace 7.

`native-input.mjs` checks the pinned fresh runtime/socket/compositor against each
run's budget and the systemd user desktop, checks exact host PID/profile and owned
workspace-7 clients, and constructs a small input environment without DISPLAY or
DBus variables. Keyboard, pointer, IME and clipboard tools connect only to that
private Wayland socket. Owned native window operations validate `privateSession`
before acting on the exact captured BrowserWindow ID. Restore is part of the same
owned hide/minimize operation. Quit after destruction verifies the prior close
result and main PID/profile/socket instead of requiring a now-absent mapped window.

[Tool sources, hashes and build commands](host/native-isolated/native-tooling.json),
[initial commands](host/native-isolated/commands.json),
[fixed-package commands](host/native-close-fixed/commands.json), the initial run's
`native-commands.jsonl` and fixed native-window result preserve routes and sanitized
environments. The fixed native API route does not create a keyboard-command log. Node
24.18.0/npm 11.16.0 are project-local. Host: Freelens 1.10.3/Electron 41.10.0,
Wayland. Temporary C tools use the private virtual-pointer and input-method-v2
protocols; historical #30 sources were references, not attended executables.

The original native deadline was **17:43:17 UTC**. [Initial budget](host/native-isolated/budget.json)
and [fixed verification budget](host/native-close-fixed/budget.json) retain that
same deadline. Native execution and normal fixed-host exit finished before it.
The follow-up was requested for changed main code, not an automatic rerun of the
unsupported pointer/IME gates. No further native capability investigation followed.

## Passed checks by actual route

| Check | Route and evidence |
| --- | --- |
| Progressive typing; full replacement; refinement; no-match correction | `wtype` `zwp_virtual_keyboard_v1`, native Tab focus. [Five keyboard groups](host/native-isolated/native-keyboard.json) pass with trusted observed keyboard/input events. |
| Paste, cut, Undo, Redo; crossing empty | Virtual keyboard plus compositor-local `wl-copy`/`wl-paste`. Exact private clipboard payloads; native `beforeinput`/`input` routes. Same keyboard evidence. |
| Ctrl+F/G/Shift+G, Enter/Shift+Enter and exact modifiers | Virtual keyboard. Ctrl+Alt+G, Ctrl+Shift+F and Ctrl+Enter do not navigate; a trusted AltGraph-modified event is observed and rejected. This is a virtual keymap, not a physical keyboard/layout claim. |
| History popover, one-layer Escape, Find opener return | Native Tab/Enter/Escape and Ctrl+F. History closes first; Find remains, then closes to its opener and reopens with retained query. |
| Keyboard row activation and inspector dismissal | Native Tab/Enter/Escape. [Copy/editor groups](host/native-isolated/native-copy-editor.json) inspect row 0 and close it. This does not establish pointer selection. |
| Exact Application text and Transport line clipboard actions | Native keyboard activates actual production inspector buttons; private `wl-paste` equals independent `kubectl logs --timestamps` originals, including timestamp precision and JSON spacing. |
| Foreign editor ownership within production Profiles | Actual Sample logs textarea retains Ctrl+F/G and focus while log Find is hidden; Escape returns to logs. No saved profile edit or foreign DOM fixture. |
| Hide/show, minimize/restore, native close | Electron BrowserWindow native API in the proven private session, exact owned window ID. [Initial](host/native-isolated/native-window-lifecycle.json) and [fixed](host/native-close-fixed/native-window-lifecycle.json) evidence observes visibility/minimized state, actual worker exit and query preservation. No OS-button click claim. |
| Auxiliary native window focus and resize/return | Fixed-package native API route: auxiliary owns OS focus, main width changes 1238 → 720 → 1238, return focus/query and absence of an active result persist, auxiliary is destroyed. This does not prove wheel or selection/mark preservation during resize. |
| Close → quit and complete main service disposal | [Fixed shutdown](host/native-close-fixed/shutdown-clean.json): 7 worker starts/exits, peak one, zero live, closed service and empty owner/retiring/opening/sender maps/watch. Host exits normally with code 0 before display teardown. SDK handlers listed at will-quit are not claimed removed at that instant. |

## Failed setups, limited results and oracle correction

Two pointer-dependent setup drivers failed before usable input focus/delivery.
[Without a persistent seat](host/native-isolated/native-acceptance-setup-failed.json),
the private window lacked keyboard focus. [With a persistent keyboard](host/native-isolated/native-acceptance-focus-setup-failed.json),
the pointer still did not open Find. Later groups in those aborted setups lack
their preconditions and are unperformed, not product failures. The first loose
modifier assertion reported pass despite an unfocused body; it is invalid and
superseded by the focused keyboard group's positive native proof. Both failed
driver snapshots/output and command logs remain. The working independent keyboard
route uses Tab, keeps one virtual device attached, and allows the keymap to arrive
before sending keys. No hardware provenance is inferred.

[Pointer/IME results](host/native-isolated/native-surfaces.json): the pointer
protocol connects and moves the isolated compositor cursor, but its Clear click
does not reach the production control. Dependent drag/copy/selected-text seeding
and wheel checks were not reached. **Unverified**, with no further pointer investigation.

The genuine input-method-v2 driver registered and activated; trusted
`compositionstart`, `compositionupdate` and composing input delivered Japanese
preedit, and the query became `あ` on commit. However observed `compositionend`
had `isTrusted:false`. The probe did not inject DOM composition events, but the
end-to-end trusted commit oracle failed. Full IME composition/Enter commit,
clear-during-composition/cancel/late completion remain **unverified**. No flag or
host restart was used to extend IME capability.

The original auxiliary-window harness incorrectly expected worker exit on OS
blur alone. The accepted #36 lifetime contract releases execution on *viewer
inactivity*; #37 keeps focus independent from valid matching data. Existing
`watchWindowVisibility` explicitly excludes blur, and selected-cluster plus
`!document.hidden` determines active state. [Offline reconciliation](host/native-isolated/window-oracle-reconciliation.json)
preserves the failed result and asserts the recorded focus/size/state facts without
a native rerun. The fixed-package check uses the corrected oracle. The initial
main window was already blurred at the auxiliary check's start; no earlier
focused-to-blurred transition is claimed.

## Narrow production fix and validation

After the initial native close, `onDeactivate()` threw `Object has been destroyed`
at `watchWindowVisibility` unsubscribe: accessing `window.webContents` after
BrowserWindow destruction fails before subscription cleanup completes. The
[original log](host/native-isolated/host.log.gz) and missing shutdown-clean snapshot
are retained. Later private display teardown produces a fatal Wayland broken pipe
and host exit -4; that exit is not a passing normal shutdown.

The disposer now retains the original webContents emitter at subscription time
and removes navigation listeners from that same emitter. No exception swallowing,
visibility semantics change or resource mechanism change. The authorized public
visibility-disposal regression reproduces Electron's throwing getter after close:
[red](host/native-isolated/visibility-regression-red.txt), then
[27 green lifecycle tests](host/native-isolated/visibility-regression-green.txt).

Pinned [typecheck](host/native-isolated/typecheck-output.txt.gz),
[250 full tests](host/native-isolated/tests-fixed-output.txt),
[six desktop guards](host/native-isolated/ui-guards-output.txt),
[packed main/worker checks](host/native-isolated/package-fixed-check.txt) and
[two reproducible builds](host/native-isolated/reproducibility-fixed.json) pass.
Only affected native visibility/window/close→quit routes were rerun on the fresh
package. Renderer-only browser acceptance, unrelated functional checks and resource
smokes/soaks were not repeated. Existing evidence retains its artifact and layer.

## Cleanup, desktop observation and remaining gate

[Initial cleanup](host/native-isolated/cleanup.json) and
[fixed cleanup](host/native-close-fixed/cleanup.json) remove the owned profiles and
runtimes after their processes exit; the original UID/label-checked namespace is
absent. The fixed check only reads the shared single-json fixture. No owned native
input process remains. User glossary/docs/manifest/lock/settings hashes are unchanged;
unrelated fixtures and build caches remain.

Continuous user-desktop observers record [6,795 notifications](host/native-isolated/desktop-summary.json)
over ~680 seconds and [877 notifications](host/native-close-fixed/desktop-summary.json)
over ~88 seconds. Every notification repeats the same active-window address;
there are no observed focus-address transitions or workspace/window notifications.
Focus/workspace/client sets and pointer endpoints match. This is **not zero
notifications** and pointer equality is endpoint-only. No user-desktop native
input, window operation or clipboard access was dispatched.

Remaining Linux subchecks: native pointer selection/drag/copy and selected-text
seeding/retention through refresh, wheel/manual-scroll behavior, selection/marks
through native resize, full trusted IME transactions, foreign host-menu/transient
Escape ownership, and shortcut exclusion while another native window owns focus.
Hardware provenance and physical-device contrast review are not established by
virtual devices. Windows/macOS remain excluded/unverified. The DOM/listener
resource issue remains accepted/deferred with historical failures intact.

[Independent review](review-native-isolated.md) covers this checkpoint against the
recorded baseline, including the uncommitted ticket diff. No push, PR, issue comment,
closure, merge or release. Report blocked for the precise remaining evidence gates.
