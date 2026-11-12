# 02: Decouple the viewer from the SDK for Freelens 2

**Status:** ready-for-agent

**GitHub:** [#59](https://github.com/maksimgurenko/freelens-json-logs/issues/59)

**Blocked by:** [01: Pin released Freelens 2 tooling and acceptance inventory](01-pin-released-freelens-2-tooling-and-acceptance-inventory.md) ([#58](https://github.com/maksimgurenko/freelens-json-logs/issues/58)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 2.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Prepare the existing readable log viewer for the released Freelens 2 API by separating application registration and SDK model conversion from browser-safe presentation and behavior. Keep the Pod-header action and separate viewer page.

## Acceptance criteria

- [ ] Separate SDK entrypoints, Pod action/page registration, navigation and SDK model conversion from the viewer and policy. SDK objects stop at this boundary; target/log/preferences interfaces expose the accepted plain-data capabilities.
- [ ] Keep parsing, recent-window/session policy, occurrence identity, profiles, inspection, reading/following and Find behavior in one implementation. Run meaningful existing shared regression assertions and the extracted viewer harness with the pinned v2 library/type context.
- [ ] Use a narrow Icon slot and a plain registered Page wrapper with the released API registration types. Keep viewer controls, profile editor, recovery presentation, Find client and lifecycle policy together; avoid the extra observer wrapper that failed in the earlier feasibility experiment.
- [ ] Move the environment-neutral Find clock contract into core. Core and plain-data contracts cannot depend outward on SDK, React/MobX, DOM, Node/Electron or main-process types, including through type-only imports.
- [ ] Keep one unsettled-log-request pool per renderer runtime/module instance across close/reopen and disable/re-enable. Success and failure both release entries. Reopening the same target waits for its outstanding operation, discards that response and requests fresh logs; other targets proceed independently.
- [ ] Preserve generation rejection after Pause/departure/replacement and restart-specific occurrence/Find reset with the existing Pause/manual-profile/following rules. Cover these behaviors through the same interfaces without copying the existing suites.
- [ ] Add transitive import checks for completed boundaries, including type-only edges. Identify the combined settings and raw Find IPC edges scheduled for the next two tickets as incomplete; complete browser isolation is a later gate.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
