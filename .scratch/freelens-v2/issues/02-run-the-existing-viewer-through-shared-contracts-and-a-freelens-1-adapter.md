# 02: Run the existing viewer through shared contracts and a Freelens 1 adapter

**Status:** ready-for-agent

**GitHub:** [#59](https://github.com/maksimgurenko/freelens-json-logs/issues/59)

**Blocked by:** [01: Add explicit Freelens-version selection and acceptance inventory](01-add-explicit-freelens-version-selection-and-acceptance-inventory.md) ([#58](https://github.com/maksimgurenko/freelens-json-logs/issues/58)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 2.

## What to build

Keep the existing Freelens 1 Pod-header action and separate readable log viewer working through one shared viewer and explicit application capabilities. Establish the adapter seam needed for Freelens 2 without duplicating core behavior or the viewer.

Constraints: [Architecture](https://github.com/maksimgurenko/freelens-json-logs/issues/53#issuecomment-6537476137). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Separate SDK entrypoints, Pod action/page registration, navigation and SDK model conversion from the shared viewer and policy. SDK objects stop at the adapter; shared snapshot/target/preferences interfaces use the accepted plain-data contracts.
- [ ] Preserve parsing, recent-window/session policy, occurrence identity, profile selection, inspection, reading/following and Find behavior through the existing shared implementation and v1 adapter. Meaningful shared regression assertions, v1 compilation and production-renderer checks pass.
- [ ] Keep one shared viewer, profile editor, recovery presentation, Find client and lifecycle policy. Application UI adaptation uses only the accepted narrow Icon slot, Pod-header MenuItem/navigation and plain registered Page wrapper; do not add the extra observer wrapper rejected by the v2 runtime experiment.
- [ ] Move the environment-neutral Find clock contract into core. Shared contracts cannot depend outward on process runtimes or SDKs, including through type-only imports; neither version adapter may import the other.
- [ ] Keep one unsettled-log-request pool per renderer runtime/module instance across close/reopen and disable/re-enable. Success and failure both release entries. A successor view waits for an outstanding same-target operation, discards its result and requests fresh logs; other targets remain independent.
- [ ] Preserve generation rejection on Pause/departure/replacement, plus restart-specific occurrence/Find reset and Pause/manual-profile/following rules. Cover these behaviors through shared interfaces without duplicating suites by application version.
- [ ] Add transitive source/import checks protecting the completed boundaries, including type-only edges and wrong-adapter reachability. Explicitly identify the combined settings and raw Find IPC edges scheduled for the next two tickets as incomplete; do not claim final renderer isolation before they are removed.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
