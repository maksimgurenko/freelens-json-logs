# 07: Run Freelens 2 CI and guarded local evaluation helpers

**Status:** ready-for-agent

**GitHub:** [#64](https://github.com/maksimgurenko/freelens-json-logs/issues/64)

**Blocked by:** [06: Produce one reproducible Freelens 2 package with compatibility checks](06-produce-one-reproducible-freelens-2-package-with-compatibility-checks.md) ([#63](https://github.com/maksimgurenko/freelens-json-logs/issues/63)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 7.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Run the existing behavioral scenarios and package/resource checks for the single released Freelens 2 target, with guarded local evaluation commands and a complete evidence ledger.

## Acceptance criteria

- [ ] CI runs algorithms/state/policy, pinned v2 typechecking, transitive dependency guards, adapter/browser assertions, generated real-worker/resource workloads, package inspection and reproducibility. Build/check commands use one deterministic v2 configuration.
- [ ] Reuse existing behavioral definitions, fixtures and assertions where applicable, adding coverage for distinct SDK/runtime differences. Tests accompany their implementation changes; this ticket consolidates orchestration. Do not add duplicated suites or a cross-version reuse quota.
- [ ] Update retained helpers that assume historical executable/package versions, obsolete globals/loaders, output/resource paths, ticket/run guards or endpoints. Runners that build inputs use the pinned v2 context and deterministic outputs.
- [ ] Evaluation helpers validate executable/full identity, extension archive/manifest/resources/hashes, released-source build provenance and owned evidence/profile/display/debug/frame configuration before mutation. Preserve PID/profile/socket/session/frame isolation guards. After launch, observed identities must match configuration; mismatches fail.
- [ ] Follow the Linux UI playbook for guarded private-session routes and background CDP. Preserve user focus, workspace, pointer and clipboard throughout, keep actual Freelens windows on workspace 7 and clean up only owned resources. Read the maintained playbook before UI work, installation/restart or setup troubleshooting.
- [ ] Complete the uniquely named behavioral-case ledger against every required specification section and v2 integration boundary. Each case records its layer, required gate and passed/failed/unperformed evidence. Missing required cases cannot disappear from acceptance reporting.
- [ ] Preserve existing isolated resource-smoke thresholds and failure signals. Carry documented resource and diagnostic-compositor/input limits accurately; fixture evidence cannot establish that an application limitation is fixed.
- [ ] Verify the v2 CI configuration and local helper preflight/identity failure cases. Retain failed runs beside corrected evidence. CI/browser stand-ins do not satisfy final actual application acceptance.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
