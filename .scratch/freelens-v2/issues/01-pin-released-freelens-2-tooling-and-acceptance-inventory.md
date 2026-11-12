# 01: Pin released Freelens 2 tooling and acceptance inventory

**Status:** ready-for-agent

**GitHub:** [#58](https://github.com/maksimgurenko/freelens-json-logs/issues/58)

**Blocked by:** None (can start immediately).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 1.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Establish one reproducible development and evaluation target for the released Freelens 2 application, with matching SDK/library types, deterministic outputs and a complete inventory of required behavior.

## Acceptance criteria

- [ ] Pin the application target to released Freelens 2.0.0 at upstream commit b9b53e16056578c5407312eba5823a089972f6d5 and the extension SDK to 2.0.0. Resolve matching React/MobX types, dependency lock information and toolchain deterministically. Record exact resolved versions instead of inheriting an unrelated installed SDK.
- [ ] Build, typecheck, package, browser, worker and resource commands use this single platform configuration and deterministic versioned resources/output. Shared algorithm and state tests run once. Commands require no multi-platform version selector or separate application-version dependency environments.
- [ ] Missing paths, conflicting evaluation inputs and known SDK/build/artifact mismatches fail preflight before launch or installation. A working directory, historical executable path or running debug endpoint cannot silently change the target.
- [ ] Define local evaluation configuration identifying the explicit executable and expected full application identity, extension archive/manifest/release/hashes, source/build/dependency/toolchain provenance and owned evidence/profile/private-session/debug locations. Later helpers compare observed identities with those inputs.
- [ ] Inventory uniquely named required behavioral cases against every section of the baseline specification and the v2 integration boundaries. Each case records its layer, required verification gate and passed/failed/unperformed evidence status. Required unperformed cases remain visible.
- [ ] Reuse the existing algorithm, state, viewer and resource scenarios where their behavior remains applicable, adding coverage for distinct released-SDK/runtime differences. Acceptance depends on complete behavioral coverage; no cross-version case-percentage calculation is required.
- [ ] Verify configuration resolution and positive/negative preflight cases. Record that full application integration, reproducible final packaging and actual application acceptance remain later gates.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
