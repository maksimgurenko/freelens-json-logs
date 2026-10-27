# Find #48: bounded native attempt finished; partial acceptance

Branch `implementation/find`; review baseline
`5982a321d720669f0272e09f272499a79eb9c8fc`. Ticket #48 only. The user's
2026-10-27 direction authorized a bounded unattended Linux pass in a genuinely
separate session. It did not authorize native activity on the user's desktop.
The attempt and the explicitly requested narrow lifecycle fix are finished;
do not automatically repeat native capability setup/checks.

[Current report](native-isolated.md), [matrix](matrix.md), and
[review](review-native-isolated.md) record the evidence and limits.
Current package: `freelens-readable-logs@0.1.34`, SHA-256
`0648bbe51fcf6eee4f43d0ba0a55f42b870019966df45646d92293762c60a250`.
The previous `995f1cf5` artifact/results are preserved. Only main changed;
renderer and worker hashes match. Do not silently promote old whole-package results.

Private virtual keyboard groups pass typing/refinement/replacement/correction,
paste/cut/Undo/Redo, exact modifiers/AltGraph, Ctrl+F/G/Shift+G/Enter variants,
history/Find Escape and opener return. Real inspector copy buttons produce exact
Application text/Transport line on the private clipboard; the actual Profiles
sample editor retains shortcut ownership. No physical hardware claim.

Native BrowserWindow API hide/show, minimize/restore, auxiliary focus/resize/return
and close pass. Close→quit initially failed because visibility disposal re-read
`window.webContents` after native destruction. A narrow retained-emitter fix has
red-before-green public-boundary regression, typecheck, 250 tests, packed checks
and reproducible builds. The new package's isolated close→quit exits normally:
7 worker starts/exits, peak one, zero live, closed/empty service ownership/watch.
The original failure and erroneous blur-worker oracle remain recorded separately.
OS blur alone is not viewer inactivity under the accepted contract.

Exact remaining Linux evidence:

- Pointer-delivered control actions, drag source selection/copy/selected-text seed,
  source selection retained through refresh, wheel/manual-scroll behavior and
  selection/mark preservation through native resize.
- Full trusted native IME composition/commit/Enter/clear/cancel/late completion.
  Input-method-v2 activated with trusted preedit and query commit, but observed
  composition-end was untrusted; full acceptance was not established.
- Foreign host-menu/transient Escape ownership, shortcut exclusion while another
  native window owns focus, native mode/history recall and edge-direction variants,
  and native pending-completion focus return.
- Physical-device/contrast evidence is not established by the virtual devices.

Windows/macOS are excluded and explicitly unverified. The DOM/listener resource
issue remains [accepted/deferred](../../find-resource-investigation.md#accepted-deferral):
no resource attribution, timing controls, stock-display investigation or soaks.
Historical failed measurements and thresholds are intact.

Both private hosts/displays/profiles/runtimes and the owned UID-checked namespace
are cleaned. User desktop observers record repeated notifications of one unchanged
focus address, no observed focus-address/workspace/window transition and equal
pointer endpoints; no user-desktop native input/window/clipboard activity.
Original dirty files/settings and unrelated fixtures are preserved.

Report **blocked** for the remaining evidence, keeping broad original criteria
unchecked. No automatic retry, push, PR, merge, GitHub message/closure or release.
