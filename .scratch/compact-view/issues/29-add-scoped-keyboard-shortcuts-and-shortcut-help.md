# 29: Add scoped keyboard shortcuts and shortcut help

**Status:** ready-for-agent

**Blocked by:** [27: Return from local contexts with predictable Escape and focus](27-return-from-local-contexts-with-predictable-escape-and-focus.md)

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/29

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Let users find records, save profile drafts and return to the bottom through the accepted familiar shortcuts, with discoverable hints and a dismissible shortcut reference. Route commands only within the active local context that owns them, using the same actions as the visible controls.

## Acceptance criteria

- [x] Use Ctrl on Linux/Windows and Cmd on macOS as the actual primary modifier; do not accept Ctrl and Meta interchangeably. Require the exact modifier combination and preserve AltGraph, IME/composition, text-editing, selection and native menu ownership.
- [x] Primary+F reveals the local Find row and focuses/selects its retained query in active log-reading context, including toolbar, viewport and inspector. Exclude Profiles, recovery confirmations and foreign editing controls.
- [x] Enter/Shift+Enter navigate next/previous only in the local Find input. Primary+G and Primary+Shift+G repeat next/previous in owned log-reading context, including Find input: reveal/focus hidden Find and use the retained query, or only open/focus Find if there is no query. Exclude other editables and foreign editors.
- [x] Keep first/next/previous/wrapped/no-match behavior, the established literal Find predicate/count and recomputation after record/profile changes consistent with the visible controls. Hiding Find retains only the temporary per-view query, not persistent settings.
- [x] Primary+S owns only an existing active Profiles draft, including its own input/textarea fields, and invokes the same validation/save action as Save profile. Valid saves stay in Profiles; invalid/failed saves display the existing error and retain the draft without browser Save UI. With no active draft there is no local Save action. Cover unchanged drafts, failures and held-key suppression.
- [x] Ctrl+End on Linux/Windows and Cmd+Down on macOS invoke To bottom only when the log viewport or a row owns focus. Follow the retained window without implicitly resuming paused requests. Exclude inspector text, other editables and Shift-modified selection commands.
- [x] Use the accepted one-layer Escape/focus behavior for the new shortcut reference. Ignore held-key repeats for Save, Escape and Back; consume only commands actually owned by the active, visible extension context, and dispose listeners on view/extension teardown.
- [x] Show applicable shortcut hints through control tooltips/accessibility labels and a small Shortcuts entry in the existing display-options menu. Its dismissible reference adds no permanent control band and restores focus to its opener.
- [x] Preserve host primary+[ / primary+], primary+R and primary+Shift+P. Add no new Pause/Resume, snapshot Refresh, Raw, timestamp, wrap, profile-entry or inspection-layout shortcuts, F3 aliases or Alt+Left local command in this increment.
- [x] Verify Find with native Logs/search mounted and stale native-log selection so only the intended local Find takes focus and native state is not accidentally changed. Check host/dock focus, inactive views, native menus/selects/IME, exact/wrong/extra modifiers, ordinary editing, Tab/Shift+Tab and native button activation in packaged Freelens.
- [x] Record Linux/Windows Ctrl and macOS Cmd verification separately, including an appropriate non-US/AltGraph/composition case. Mark unavailable native platforms unverified; parameterized/browser modifier tests do not establish OS-level behavior. During Hyprland checks keep Freelens on workspace 7 and restore user workspace/focus immediately after any focus-dependent check.

## Operator validation context

Before packaged-host input checks, read `docs/verification/26/README.md` and
`docs/verification/26/continuation/host.mjs` for the tested Playwright input path,
frame coordinates, notification hit-testing and earlier driver failures. Use the
newer desktop restoration in `docs/verification/27/desktop.py` and read that
verification report: it handles restoring the underlying workspace when the prior
focused window is on a special workspace. Keep this ticket's original native and
physical evidence gates.


For native host shortcut checks, also read `docs/verification/28/README.md`,
which distinguishes OS-input accelerator tests from CDP key dispatch.

## Specification and evidence

The [accepted shortcut table, focus rules and acceptance gates](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804) are authoritative. Use the [navigation/selection policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015) and [pinned host/input constraints](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755); source-only conflict analysis is not packaged-runtime evidence.


## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest eligible ready ticket on `implementation/compact-view`;
local #27 is done with committed evidence. GitHub #29 was assigned to @me before
implementation and remains open. Only #29 is implemented in this session.

Production adds exact platform-primary shortcut routing, shared Find/Save/To
bottom actions, control hints and a temporary Shortcuts reference. An early,
frame-local dispatcher registered at extension activation prevents the measured
native Logs capture conflict while guarded callbacks retain active-view/focus
ownership. View callbacks/listeners are disposed on teardown; the dispatcher is
removed on extension deactivation. Inspector/reference text can retain local
focus without an extra Tab stop. Data, refresh/lifecycle, clipboard adapter,
profile-selection algorithm and configuration contracts are unchanged.

Final package: `freelens-readable-logs` **0.1.31**,
`dist/freelens-readable-logs-0.1.31.tgz`, SHA-256
`0d1fb960c9a5febab23537e466fdff72b0e001faa91c7262659c981e60f7e3cc`.
Installed Freelens **1.10.3**, Electron **41.10.0**, Linux/Hyprland/Wayland.
Manifest, versioned CommonJS entries and packaged guide match the build. Stable
package/store/config/page identities, schema 3 and SDK/core pins are retained.

All eleven original criteria above are satisfied. Full numbered mapping,
commands, input provenance, retained failures and limitations are in
[the verification report](../../../docs/verification/29/README.md).

- Criteria 1–4: `case-scope.json`, `case-logs.json`, `find-conflict.json`,
  `inspector-pointer.json`, `editing.json`, and the automated navigation/modifier
  tests. Native stale-selection Find passes before and after host reload.
- Criterion 5: `case-profiles.json` covers valid, unchanged, absent, invalid,
  controlled adapter failure, own input/textarea and held Save paths.
- Criteria 6–8: `case-logs.json`, `case-reference.json`, `visual.json`,
  `lifecycle.json`, `host-focus.json`, `inactive.json` and installed screenshots.
- Criterion 9: actual OS Back/Forward indices, palette and host reload in
  `lifecycle.json`; intentional unbound commands stay outside the parser.
- Criteria 10–11: packaged native/dock/search/menu/select/input matrices,
  Russian-layout key delivery, `platforms.json` and `*-desktop.json` restoration.
  Windows/macOS, live OS IME and OS AltGraph remain explicitly unverified;
  supplemental parameterized/DOM checks are not OS claims.

Node 24.18.0/npm 11.16.0 locked install, strict TypeScript, all **101 tests**,
actual tarball/CommonJS inspection, byte-identical locked rebuild and mechanical
UI scan pass. Final activation follows fresh main → Extensions → uninstall/wait →
single install → Enabled → actual Pod header → usable records, with process-local
polling and same-filesystem TMPDIR. No failed discovery or post-install restart
substituted for successful activation. Later native reload checks preserve its
host meaning and reopen the original target through the actual header action.

Original configuration, shared Pod UIDs/restarts, native dock tabs, owned virtual
device cleanup and actual workspace/focus restoration pass. Freelens stays on 7.
Clipboard baseline drift is recorded without attribution: newer unknown user
content is retained. The final copy/paste probe snapshots that newer content and
restores the identical buffer hash; no unrelated clipboard text is recorded.

Earlier native capture/focus bugs and preliminary driver/assertion/restoration
failures remain separately documented. No prototype/research branch was merged.
Previous scratch, unrelated untracked work and runtime `.ralph` data are preserved.
No GitHub comments/closures, external messages, push, merge or release occurred.
