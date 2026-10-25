# 28: Support mouse Back safely inside Freelens

**Status:** ready-for-agent

**Blocked by:** [27: Return from local contexts with predictable Escape and focus](27-return-from-local-contexts-with-predictable-escape-and-focus.md)

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/28

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Make a physical mouse Back gesture return from local Profiles contexts without also leaving Readable logs, while preserving ordinary host Back/Forward outside that local context. Use the accepted local navigation actions and establish actual delivery/cancellation inside supported Freelens before claiming this works.

## Acceptance criteria

- [x] In Profiles, physical mouse Back dismisses a nested confirmation first; otherwise it returns to logs and discards only the unfinished draft. Saved profile/default/order changes remain, and the query, presentation and surviving viewport/record selection are preserved.
- [x] One physical gesture causes exactly one intended transition: it cannot both dismiss/return locally and navigate the host. Ignore repeated Back input where applicable and retain transient menu/confirmation priority.
- [x] From log-reading context, mouse Back retains normal Freelens page-history meaning even when Find or inspection is open. Preserve native host keyboard/menu/top-bar Back and Forward ownership, including platform-primary+[ and platform-primary+].
- [x] Any local Forward entry reopens Profiles from saved state without resurrecting a discarded draft. Keep Find/inspection outside navigation history; do not fabricate host entries, rewrite host history state or use popstate correction loops to trap navigation.
- [x] Determine the actual physical event path on the packaged Freelens 1.10.3 host: DOM pointer/mouse/auxclick, native command and/or history traversal. Establish owning native window, cluster frame, active view, focus and cancellation timing rather than assuming DOM button 3 is delivered or sufficient.
- [x] Scope any supported input handler or narrow relay to the owning active window/frame and local context, and detach it on view/extension teardown. Gestures over host sidebar, native dock, other windows and inactive/cached views retain their normal ownership.
- [x] Verify physical mouse Back and native/local Back/Forward with clean and dirty Profiles, confirmations/menus, a previously visited host page, and pointer/focus over extension versus host/dock regions. Include double-navigation detection and state/focus restoration. Browser history demos and synthetic DOM events do not satisfy this gate.
- [x] If supported boundaries cannot safely deliver and consume the required gesture, record a reproducible limitation and blocker before claiming mouse Back works. Keep the visible local Back/Escape path available; do not silently patch host internals or introduce a global native override.
- [x] Record exact host/OS input evidence and separate Linux, Windows and macOS results. Report an unavailable platform as unverified. For local Hyprland validation, keep Freelens on workspace 7 and preserve the user workspace/focus, restoring it immediately after any check requiring focus.

## Operator validation context

Before packaged-host input checks, read `docs/verification/26/README.md` and
`docs/verification/26/continuation/host.mjs` for the tested Playwright input path,
frame coordinates, notification hit-testing and earlier driver failures. Use the
newer desktop restoration in `docs/verification/27/desktop.py` and read that
verification report: it handles restoring the underlying workspace when the prior
focused window is on a special workspace. Keep this ticket's original native and
physical evidence gates.

## Specification and evidence

Accepted [Back/Forward policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015), [native input gates](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804) and [pinned input research](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755). The research establishes distinct delivery paths and no public local-Back interception registration; it does not establish physical input delivery on any platform.


## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest numbered eligible ready ticket; local #27 was done with
committed evidence. GitHub #28 was assigned to `@me` before implementation and
remains open. Only #28 was implemented on `implementation/compact-view`. Read the
full original requirements, #21–24 resolutions, pinned input research and linked
first-release contract; no prototype/research branch was merged.

**All nine original criteria are satisfied.** Production package
**freelens-readable-logs 0.1.28**, actual **Freelens 1.10.3 / Electron 41.10.0**,
Arch Linux / Hyprland / Wayland. Tarball SHA-256:
`7adfc42ba480daaf2fe8dc8bad1c90dcd62a6c3b95b3c99d1fc30fc48c32f487`.
Installed manifest, versioned CommonJS bundles and packaged guide match the build.

[Complete report and original-criterion mapping](../../../docs/verification/28/README.md)
records the exact package, commands, physical device/native/DOM correlation,
passing checks, retained failures, platform limits and restoration.

- Seven final-package cases use the user's real USB G305 BTN_SIDE press/release,
  coordinated by the supervisor's explicitly requested Dunst notifications:
  dirty/clean Profiles, delete confirmation, owned disclosure, logs with Find
  and inspection, native dock, and parent-frame host/sidebar. Every case restores
  actual prior workspace/focus/pointer immediately; Freelens remains on workspace 7.
- The physical path includes native `browser-backward`, native back mouse events,
  DOM button 3 and Chromium history traversal. Canceling auxclick alone failed in
  0.1.27; scoped mouseup cancellation plus one auxclick action passes in 0.1.28.
  Local cases have one intended action and no history movement. Host/dock/log
  cases have exactly one native step and no local return. Earlier versions and
  failures remain identified separately; synthetic events are not physical proof.
- Saved profile edits/default/order and retained query/selection/viewport survive
  local return; unfinished drafts do not reappear. Actual OS-injected Ctrl+[
  and Ctrl+] (not physical keyboard provenance), native menu callbacks and trusted
  real top-bar clicks preserve host Back/Forward. No local Forward/history entries,
  history-state rewriting, native override or main-process input relay is added.
- Supplemental duplicate delivery changes no local/history state. A genuinely
  unfocused window and real inactive cached frame decline forced DOM input.
  Actual view teardown removes all five root mouse listeners; extension teardown
  uses the same disposer. The production handler never observes other applications.
- Documented Node 24.18.0/npm 11.16.0 clean locked install, strict TypeScript,
  all 100 tests, actual tarball/CommonJS inspection and byte-identical rebuild
  pass. Final design scan has no findings. Data/request/configuration/clipboard
  contracts and stable package/store/config/page identities/schema are unchanged.
- Final activation uses fresh main → Extensions before cluster → explicit
  uninstall/wait → single install → Enabled → actual Pod header and usable logs.
  Process-local polling and same-filesystem TMPDIR are recorded; no discovery
  failure or post-install restart substitutes for activation.
- Original application configuration, clipboard content/formats, native dock
  state and shared fixture UIDs/restarts are preserved/restored. Only owned test
  profile IDs were removed; no Kubernetes fixture was created or mutated. All
  test listeners/helpers and owned virtual input devices are removed. Optional
  process-local loopback debugging transport remains available for later checks.

Windows and macOS are unavailable and **unverified**. The runner owns Status.
Only this ticket and the authorized runner-written completed #27 Status update
are committed. Prior scratch/untracked setup/runtime data and unrelated work are
preserved. No GitHub comments/closures, messages, pushes, merges, releases or
global agent/model changes were performed.
