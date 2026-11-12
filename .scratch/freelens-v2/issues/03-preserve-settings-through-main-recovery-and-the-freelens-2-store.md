# 03: Preserve settings through main recovery and the Freelens 2 store

**Status:** ready-for-agent

**GitHub:** [#60](https://github.com/maksimgurenko/freelens-json-logs/issues/60)

**Blocked by:** [02: Decouple the viewer from the SDK for Freelens 2](02-decouple-the-viewer-from-the-sdk-for-freelens-2.md) ([#59](https://github.com/maksimgurenko/freelens-json-logs/issues/59)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 3.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Make formatting profiles and inspection preference work through a browser-safe preferences interface and the released Freelens 2 store binding. Keep settings inspection, exact backup/reset and filesystem work in main.

## Acceptance criteria

- [ ] Main inspects saved bytes before constructing/loading a writable SDK store. Renderer obtains recovery status before normal store binding and has no Node/Electron dependency in its preferences or recovery access.
- [ ] Invalid or unsupported settings retain their original bytes and inhibit ordinary saving/synchronization. Logs remain usable with built-in Default and Side inspection until recovery succeeds; fallback never writes defaults over unusable data.
- [ ] Confirmed reset creates an exclusive, verified exact backup before replacing settings. Cancellation, backup failure and changed-source detection preserve original bytes and inhibit saving. Success restores defaults and saving without restart, changing log originals or changing Pause; backups are not pruned automatically.
- [ ] Keep configuration validation, supported schema migration, profile transformations, defaults and recovery in one implementation with a narrow SDK binding. Use the stable freelens-readable-logs-v2 package/store identity and readable-logs configuration name.
- [ ] Main and renderer store synchronization attach on every successful activation. Disable/re-enable produces exactly the expected live subscriptions; a new edit after re-enable synchronizes normally. A retained syncing shortcut cannot skip reattachment after disposal.
- [ ] Exercise binding subscriptions/reattachment and shared valid/invalid/unsupported/schema, profile, recovery, cancellation, exact-backup and failure-preservation cases against the released SDK context.
- [ ] Verify the renderer settings boundary excludes Node/Electron. Actual main/renderer/disk persistence through full quit/reopen and disable/re-enable remains required by final application evaluation.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
