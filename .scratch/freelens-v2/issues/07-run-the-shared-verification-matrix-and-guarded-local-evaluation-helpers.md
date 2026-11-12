# 07: Run the shared verification matrix and guarded local evaluation helpers

**Status:** ready-for-agent

**GitHub:** [#64](https://github.com/maksimgurenko/freelens-json-logs/issues/64)

**Blocked by:** [06: Produce reproducible packages with compatibility enforcement](06-produce-reproducible-packages-with-compatibility-enforcement.md) ([#63](https://github.com/maksimgurenko/freelens-json-logs/issues/63)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 7.

## What to build

Make the common verification scenarios reusable across both selected applications and packages, with CI coverage and guarded local evaluation commands. Report case-based reuse and preserve the isolation and failure signals of existing tools.

Constraints: [Execution matrix, selectors and reuse](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435), [Accepted implementation sequencing](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] CI runs shared algorithms/state/policy once and an explicit Freelens 1/Freelens 2 matrix for types, transitive dependency checks, common adapter/browser assertions, selected real-worker/resource workloads, package inspection and reproducibility. Each invocation selects exactly one version.
- [ ] Reuse behavioral definitions, fixtures and assertions; supply only version-specific SDK/library/adapter/resource/package setup. Do not duplicate suites or weaken common assertions. Tests are added with their implementation changes; this ticket consolidates orchestration rather than postponing them.
- [ ] Parameterize retained helpers that assume fixed executables, historical package releases, v1 globals/loaders, output/resource paths, ticket/run guards or endpoints. Runners that build their own inputs use the selected context and deterministic output selection.
- [ ] Local evaluation helpers validate selected version, executable/full identity, extension archive/manifest/resources/hashes, build provenance and owned evidence/profile/display/debug/frame configuration before mutation. Preserve existing PID/profile/socket/session/frame isolation guards. After launch, observed identities must match configuration; mismatches fail rather than change the selected version.
- [ ] Follow the Linux UI playbook for guarded private-session routes and background CDP. Preserve user focus, workspace, pointer and clipboard throughout, keep actual Freelens windows on workspace 7, and clean up only owned resources. Read the maintained playbook before UI work, installation/restart or setup troubleshooting.
- [ ] Complete the unique behavioral-case ledger against every required specification section and compatibility addition. Report overall and per-layer shared/specific counts and evidence status; reuse exceeds 50% under the accepted denominator including required unperformed/version-specific cases. Keep file/helper/execution counts separately labeled.
- [ ] Both selected built configurations preserve existing isolated resource-smoke thresholds and failure signals. Retain the accepted SDK watch/timer limitation and scoped diagnostic-compositor/input limits, without representing them as fixed or reopening deferred coverage.
- [ ] Verify the two CI configurations and local helper preflight/identity failures. Record scenario results as passed, failed or unperformed with evidence, retaining corrected runs beside failures. CI/browser stand-ins do not satisfy the final actual-application acceptance gate.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
