# 05: Complete released Freelens 2 integration and renderer checks

**Status:** ready-for-agent

**GitHub:** [#62](https://github.com/maksimgurenko/freelens-json-logs/issues/62)

**Blocked by:** [04: Adapt Find transport and await shared lifecycle cleanup](04-adapt-find-transport-and-await-shared-lifecycle-cleanup.md) ([#61](https://github.com/maksimgurenko/freelens-json-logs/issues/61)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 5.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Complete the readable log viewer on released Freelens 2, including SDK logs/metadata, application-owned libraries, input ownership, asynchronous original-copy and focus-independent view eligibility.

## Acceptance criteria

- [ ] Compile ESM main/renderer composition against the pinned released SDK and matching library types. Keep one viewer/core/settings/lifecycle implementation, the Pod-header action and a separate correctly registered page.
- [ ] The target/log adapter supplies plain cluster/Pod UID/container/instance metadata, regular/init/ephemeral choices and specified bounded current-instance log reads. Only an actual not-found response becomes null; authorization/network failures remain errors. Preserve stale-target and restart semantics.
- [ ] Use application-owned React, React DOM, JSX runtime, MobX and bindings through the released API, with matching compile-time types. Bundle metadata excludes independent runtime copies and obsolete SDK/global-loader dependencies.
- [ ] Asynchronous clipboard writes preserve exact selected original application text or transport line. Await completion before success feedback, retain failure feedback on rejection and prevent late completion from changing feedback for another record or a closed view.
- [ ] Supply early keyboard capture and foreign-menu/dialog observations, including required pre-dispatch menu state. Shared policy retains shortcut/modifier, editable/IME/AltGraph, Escape and Back ownership; do not rewrite application DOM or native Logs search/selection.
- [ ] Eligibility is separate from keyboard ownership: eligible unfocused views continue; hidden/minimized/inactive routes stop and invalidate work; return fetches fresh data in automatic mode and preserves Pause. Every observation exposes and honors disposal.
- [ ] Complete transitive import and browser-bundling guards, including type-only edges: renderer has no SDK/main/Node/Electron imports or implicit shims, contracts stay environment-neutral and core stays independent.
- [ ] Run meaningful existing browser and adapter assertions with the v2 production bundle/library context for presentation, profiles, inspection, Find, target/error normalization, clipboard completion/failure, eligibility/input and disposal. These checks remain distinct from actual application/native evidence.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
