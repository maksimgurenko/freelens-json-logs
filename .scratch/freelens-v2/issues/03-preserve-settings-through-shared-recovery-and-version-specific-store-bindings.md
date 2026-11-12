# 03: Preserve settings through shared recovery and version-specific store bindings

**Status:** ready-for-agent

**GitHub:** [#60](https://github.com/maksimgurenko/freelens-json-logs/issues/60)

**Blocked by:** [02: Run the existing viewer through shared contracts and a Freelens 1 adapter](02-run-the-existing-viewer-through-shared-contracts-and-a-freelens-1-adapter.md) ([#59](https://github.com/maksimgurenko/freelens-json-logs/issues/59)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 3.

## What to build

Use one settings implementation for formatting profiles and inspection preference, with main-process recovery and narrow SDK bindings for both versions. Preserve saved bytes on failure and restore synchronization after every activation.

Constraints: [Architecture and settings ownership](https://github.com/maksimgurenko/freelens-json-logs/issues/53#issuecomment-6537476137), [Independent store identities](https://github.com/maksimgurenko/freelens-json-logs/issues/54#issuecomment-6535659523). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Main inspects saved bytes before constructing/loading a writable SDK store. Renderer obtains recovery status before normal store binding and uses browser-safe preferences/recovery access with no Node/Electron dependency.
- [ ] Invalid or unsupported settings retain their original bytes and inhibit ordinary saving/synchronization. Logs remain usable with built-in Default and Side inspection until recovery succeeds; fallback must not write defaults over unusable data.
- [ ] Confirmed reset creates an exclusive, verified exact backup before replacing settings. Cancellation, backup failure and changed-source detection preserve original bytes and inhibit saving. Success restores defaults and saving without restart, changing log originals or changing Pause; backups are not pruned automatically.
- [ ] Configuration validation, supported schema migration, profile transformations, defaults and recovery have one shared implementation. Only actual SDK/store differences live in the two bindings. Preserve v1 identity/settings location; v2 uses its separate stable store namespace with the same configuration name.
- [ ] Both process bindings attach synchronization on every successful activation. Disable/re-enable produces exactly the expected live subscriptions, and a new edit after re-enable synchronizes normally; no retained syncing shortcut may skip reattachment after disposal.
- [ ] The same binding/subscription contract assertions run for both SDK contexts. Shared valid/invalid/unsupported/schema, profile, recovery, cancellation, exact-backup and failure-preservation cases pass, with meaningful negative coverage.
- [ ] Verify the renderer settings boundary now excludes Node/Electron. Full main/renderer/disk persistence through actual application quit/reopen and disable/re-enable remains required in the final application-evaluation ticket.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
