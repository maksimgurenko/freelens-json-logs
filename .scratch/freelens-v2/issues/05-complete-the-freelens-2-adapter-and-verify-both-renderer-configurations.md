# 05: Complete the Freelens 2 adapter and verify both renderer configurations

**Status:** ready-for-agent

**GitHub:** [#62](https://github.com/maksimgurenko/freelens-json-logs/issues/62)

**Blocked by:** [04: Adapt Find transport and await shared lifecycle cleanup](04-adapt-find-transport-and-await-shared-lifecycle-cleanup.md) ([#61](https://github.com/maksimgurenko/freelens-json-logs/issues/61)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 5.

## What to build

Run the same viewer and behavior implementation against both application versions, completing Freelens 2 ESM composition and preserving Freelens 1 behavior. Application-specific logs, reactivity, input, clipboard and eligibility enter through the accepted interfaces.

Constraints: [Architecture and application capabilities](https://github.com/maksimgurenko/freelens-json-logs/issues/53#issuecomment-6537476137), [Library identity and formats](https://github.com/maksimgurenko/freelens-json-logs/issues/54#issuecomment-6535659523), [Shared assertions](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Both separately pinned SDK/library type contexts compile the same shared source. Finish v2 ESM entrypoint composition and the v1 adapter without duplicating the viewer/core/settings/lifecycle implementation; retain the Pod-header action and separate registered page.
- [ ] Both target/log adapters supply plain cluster/Pod UID/container/instance metadata, regular/init/ephemeral choices and specified bounded current-instance log reads. Only an actual not-found response becomes null; authorization/network failures remain errors. Preserve stale-target and restart semantics.
- [ ] Use the matching application-owned React, React DOM, MobX and bindings, with selected matching types. Verify bundle metadata excludes independent runtime copies, the other adapter and wrong SDK context.
- [ ] Asynchronous clipboard operations write exact selected original application text or transport line. Await completion before success feedback, preserve failure feedback on rejection and prevent late completion from changing feedback for another record or a closed view.
- [ ] Adapters provide early keyboard capture and foreign-menu/dialog observations, including required pre-dispatch menu state. Shared policy retains shortcut/modifier, editable/IME/AltGraph, Escape and Back ownership; do not rewrite application DOM or native Logs search/selection.
- [ ] Eligibility is separate from keyboard ownership: eligible unfocused views continue; hidden/minimized/inactive routes stop and invalidate work; return fetches fresh data in automatic mode and preserves Pause. Every observation exposes and honors disposal.
- [ ] Complete transitive dependency checks, including type-only edges, and browser-oriented bundling guards: shared renderer has no SDK/main/Node/Electron imports or implicit shims, contracts stay environment-neutral, core stays independent, and only the selected adapter is reachable.
- [ ] Run the same meaningful browser and adapter assertions for both selected production-renderer/library contexts, covering presentation, profiles, inspection, Find, target/error normalization, clipboard completion/failure, eligibility/input and disposal. These checks remain distinct from final actual-application/native evidence.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
