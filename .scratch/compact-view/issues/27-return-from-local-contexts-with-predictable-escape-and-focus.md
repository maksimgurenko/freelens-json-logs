# 27: Return from local contexts with predictable Escape and focus

**Status:** ready-for-agent

**Blocked by:** [25: Deliver the compact black log workspace](25-deliver-the-compact-black-log-workspace.md)

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/27

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Make local return and dismissal predictable throughout Readable logs, Profiles, Find, inspection and settings recovery. A single Escape dismisses exactly one owned context, and leaving Profiles discards only unfinished work while keeping saved changes and the surviving log-reading state. Mouse Back delivery is a separate dependent integration ticket.

## Acceptance criteria

- [x] Provide a clear Back to logs action in Profiles, alongside separate explicit Save and Cancel draft actions. Returning from Profiles discards the unfinished draft without autosaving or asking for an additional discard confirmation; saved profile edits, global default and matching order remain saved.
- [x] Resolve owned menus, dropdowns, autocomplete/native select/IME interactions and confirmations before other navigation. One Escape closes only the topmost owned interaction. It must not also return from Profiles, close another panel or trigger a second host action after an earlier capture listener.
- [x] Escape in a delete/reset confirmation cancels only that confirmation and restores focus appropriately. In Profiles without a higher-priority interaction, Escape returns to logs even from ordinary draft fields.
- [x] In the log-reading context, Escape hides Find first and retains its query; a subsequent Escape closes inspection. Bare logs have no local Escape navigation action. The visible close controls use the same state/focus transitions.
- [x] A reset already in progress is not represented as canceled by Escape or dismissal. Preserve its progress, existing success/failure behavior, backup requirements and original-settings safety guarantees.
- [x] After local dismissal, restore focus to the opener or nearest surviving local control. Closing inspection focuses its originating retained record when available; if that record has left the recent log window, choose a surviving log control rather than a stale node.
- [x] Returning to logs preserves the per-view query, presentation and surviving viewport/record selection. Opening Profiles or closing a local context does not implicitly pause automatic refresh; existing bounded-window removal and anchor-loss rules still apply.
- [x] Find, inspection content tabs, Readable/Raw and recovery contexts add no host page-history entries. Keep host entry/exit navigation separate from local dismissal and do not fabricate host-history entries for panel state.
- [x] Escape handling is scoped to the active, visible extension context and appropriate focus owner, ignores held-key repeats and composition/transient ownership, and is removed on teardown. Keep Tab/Shift+Tab, native activation and unrelated editing available.
- [x] Exercise every accepted local graph edge with dirty drafts, saved settings, nested delete/reset confirmations, Find plus inspector, reset already pending and disappearing records. Verify one-layer Escape against real Freelens capture/bubble handlers and native menus/selects; distinguish browser tests from packaged-host evidence.

## Operator validation context

Before packaged-host input checks, read `docs/verification/26/README.md` and
`docs/verification/26/continuation/host.mjs`. They record the tested Playwright
input path, earlier driver failures, owning-frame coordinates, notification
hit-testing, and pointer/workspace/focus restoration. Start from the tested
helpers and keep this ticket's original native and physical evidence gates.

## Specification and evidence

Accepted [view graph, Escape order and state-preservation policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015), [final shortcut/focus contract](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804) and [host input constraints](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755). The compact workspace dependency supplies the actual Find/display/disclosure surfaces whose ownership is resolved here.


## Implementation and verification evidence

All ten original criteria above are satisfied on installed `freelens-readable-logs
0.1.26` in Freelens 1.10.3, Arch Linux / Hyprland / Wayland (2026-10-25 UTC).
Selected as the lowest eligible local ticket; #25 and #26 have committed evidence.
Assigned GitHub #27 to @me before implementation; GitHub remains open.

The complete criterion-by-criterion mapping, commands, retained failures, input
provenance and restored-state evidence are in
[docs/verification/27/README.md](../../../docs/verification/27/README.md).
The ticket and its production changes/evidence are committed together.

- Criteria 1, 3, 6, 7: `case-profiles.json`, `extra.json`, `disk-save.json`; real saved profile,
  default/order, dirty draft, explicit Cancel/Back, deletion and focus cases.
- Criteria 2, 9, 10: `case-transient.json`, `case-scope.json`, `guard-hidden.json`,
  `teardown.json`; real host Menu capture, native select popup, native dock scope,
  held-key/composition guard and disposed key/composition listeners.
- Criteria 4, 6, 8: `case-logs.json`; Find-before-inspection, retained query,
  Inline/Side/Bottom originating-row focus, visible close and unchanged history.
- Criteria 5, 10: `recovery.json`; corrupt startup in both stores, cancellation,
  actual backup failure with unchanged source, noncancelable pending real reset,
  exact backup/success and focus preserved after the user moves it while pending.
- Criteria 6, 7, 10: `automatic.json`, `expiry-before.json`, `emit.json`,
  `expiry-after.json`; automatic real reads while Profiles is open, retained
  selected original and actual eviction with surviving-control focus fallback.
- All: strict TypeScript, 100 tests (zero failures/skips), locked Node 24.18.0 /
  npm 11.16.0 build, CommonJS/tarball checks, byte-identical rebuild, actual fresh
  uninstall/wait/single-install activation, `identity.json` and source hashes.

Tarball SHA-256:
`0e3843633c0ed6d8a6c2dc6b1effb2681f89dcaa122be9f978fca8c7d776ac63`.
Entries: `out/main-0.1.26.js`, `out/renderer-0.1.26.js`. Stable package/store
`freelens-readable-logs`, page/config `readable-logs`, schema 3 and host 1.10.3.

Native-host input uses trusted Playwright Chromium delivery in actual Electron.
No physical hardware provenance is claimed. Windows/macOS and OS IME are
unavailable/unverified; composition and inactive-frame injections are explicitly
supplemental. Physical mouse Back remains #28's separate required gate. No local
history was fabricated and no new shortcuts beyond contextual Escape were added.

Final user application configuration and shared log view are restored; test
backups/obstruction and owned Kubernetes namespace are removed; shared fixture
UIDs/restart counts are unchanged. Clipboard was untouched. Freelens remains on
workspace 7, with the actual preceding workspace/focus restored after each final
native check. Runtime .ralph and unrelated files stay out of the commit.
