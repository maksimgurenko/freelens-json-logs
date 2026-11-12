# 04: Adapt Find transport and await shared lifecycle cleanup

**Status:** ready-for-agent

**GitHub:** [#61](https://github.com/maksimgurenko/freelens-json-logs/issues/61)

**Blocked by:** [03: Preserve settings through shared recovery and version-specific store bindings](03-preserve-settings-through-shared-recovery-and-version-specific-store-bindings.md) ([#60](https://github.com/maksimgurenko/freelens-json-logs/issues/60)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 4.

## What to build

Keep Find behavior and resource ownership in one shared implementation while each application translates semantic transport operations. Cancellation, stale delivery, reactivation and teardown remain correct across renderer and main-process boundaries.

Constraints: [Semantic transport and lifecycle ownership](https://github.com/maksimgurenko/freelens-json-logs/issues/53#issuecomment-6537476137), [Verification gates](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Replace shared renderer raw-channel calls with typed semantic open, submit, cancel, setActive and close operations. Open yields an opaque owner token; submit returns untrusted reply data for shared validation; controls/close are asynchronous. Wire names and payload rules remain shared definitions.
- [ ] Keep registration validation, complete input/reply identity, request/revision tracking, cancellation while registration is pending, stale success/failure rejection and idempotent disposal in shared code. The whole-attempt deadline still starts before registration/startup/dispatch.
- [ ] Main receives authoritative SDK sender/frame identity, preserving original numeric frame identity and actual frame-tree membership. Reject foreign owner tokens and handle document navigation/render-process loss without trusting renderer-asserted identity.
- [ ] Inject versioned worker factories/resource locations at composition. Keep one trusted CommonJS worker program and the package-version handshake; v1 CommonJS and v2 ESM entrypoints resolve their matching resources.
- [ ] Distinguish view unmount, document/frame loss, renderer loss, extension disable/re-enable and application quit. Cleanup releases owned listeners/observers/timers and is idempotent and awaitable. Worker replacement and retirement await actual exit, not just the return from terminate.
- [ ] Shared activation/deactivation keeps settings preflight before writable store/service initialization. Re-enable restores exactly the intended live bindings. Uncancellable log reads retain the agreed runtime-level pool lifetime, reject departed results and release their pool entries on settlement.
- [ ] Shared client/service/execution and lifecycle tests cover pending registration, cancellation/replacement, deadlines, foreign tokens, stale successes/failures and repeated disposal. Real-worker checks observe handshake and actual exit with selected resources; final complete compatibility refusal is checked with packaging.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
