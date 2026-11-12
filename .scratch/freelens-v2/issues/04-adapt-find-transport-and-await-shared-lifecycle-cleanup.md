# 04: Adapt Find transport and await shared lifecycle cleanup

**Status:** ready-for-agent

**GitHub:** [#61](https://github.com/maksimgurenko/freelens-json-logs/issues/61)

**Blocked by:** [03: Preserve settings through main recovery and the Freelens 2 store](03-preserve-settings-through-main-recovery-and-the-freelens-2-store.md) ([#60](https://github.com/maksimgurenko/freelens-json-logs/issues/60)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 4.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Connect the existing Find implementation to released Freelens 2 IPC while retaining authoritative main-process ownership, bounded worker execution and correct cleanup across page and application lifetimes.

## Acceptance criteria

- [ ] Replace raw renderer channel calls with typed semantic open, submit, cancel, setActive and close operations translated to the released SDK IPC. Open yields an opaque owner token; submit returns untrusted reply data for shared validation; controls/close are asynchronous. Wire names and payload rules have one definition.
- [ ] Keep registration validation, complete input/reply identity, request/revision tracking, pending-registration cancellation, stale success/failure rejection and idempotent disposal in common behavior code. The whole-attempt deadline starts before registration/startup/dispatch.
- [ ] Main receives authoritative SDK sender/frame identity, preserving original numeric frame identity and actual frame-tree membership. Reject foreign owner tokens and handle document navigation/render-process loss without trusting renderer-asserted identity.
- [ ] Resolve the versioned CommonJS worker resource from the ESM main entrypoint and retain its package-version handshake. Execution, factories and resource paths are supplied explicitly; no renderer Node/Electron access is introduced.
- [ ] Distinguish view unmount, document/frame loss, renderer loss, extension disable/re-enable and application quit. Release owned listeners/observers/timers with idempotent, awaitable cleanup. Worker replacement and retirement await actual exit, not just the return from terminate.
- [ ] Activation/deactivation keeps settings preflight before writable store/service initialization. Re-enable restores exactly the intended live bindings. Uncancellable log reads retain the runtime-level pool lifetime, reject departed results and release entries on settlement.
- [ ] Client/service/execution and lifecycle tests cover pending registration, cancellation/replacement, deadlines, foreign tokens, stale successes/failures and repeated disposal. Real-worker checks observe handshake and actual exit using the generated v2 resource; complete compatibility refusal is checked with packaging.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
