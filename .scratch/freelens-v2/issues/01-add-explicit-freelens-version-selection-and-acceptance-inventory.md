# 01: Add explicit Freelens-version selection and acceptance inventory

**Status:** ready-for-agent

**GitHub:** [#58](https://github.com/maksimgurenko/freelens-json-logs/issues/58)

**Blocked by:** None (can start immediately).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 1.

## What to build

Make every version-sensitive operation deliberately select Freelens 1 or 2, with isolated reproducible dependency contexts and outputs. Establish the complete behavioral inventory and application-evaluation inputs that later tickets use, while keeping the existing Freelens 1 baseline usable.

Constraints: [Support and packaging](https://github.com/maksimgurenko/freelens-json-logs/issues/54#issuecomment-6535659523), [Verification matrix](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Require `--freelens-version 1|2` for dependency/type selection, build/package inspection, browser checks, package-dependent worker/resource checks and application evaluation. Shared-logic tests run once without a selector. Each invocation selects one version; orchestration explicitly invokes both.
- [ ] Missing or unknown selectors, conflicting arguments/configuration, absent required paths and known dependency/build/artifact mismatches fail preflight before side effects. Selection never falls back to an installed SDK, working directory, executable path or running debug endpoint.
- [ ] Each version resolves separately pinned SDK, matching React/MobX types, lock information and toolchain deterministically, without using the other version's dependency context. Output and versioned resource selection are separate and deterministic; both artifacts retain one common extension release number.
- [ ] Define evaluation configuration for the selected version, explicit executable and expected full application identity, extension archive/manifest/release/hashes, source/build/dependency/toolchain provenance, and owned evidence/profile/private-session/debug locations. Validate required inputs before launch or installation; later helpers must compare observed identities rather than reinterpret the selection.
- [ ] Inventory uniquely named required behavioral cases against the entire baseline specification and accepted matrix. Each case records its layer, shared or version-specific definition, required targets/gate and passed/failed/unperformed evidence status. Include every required case, including unperformed and version-specific cases.
- [ ] Record reuse as shared cases run once plus shared cases parameterized across both versions, divided by all required unique behavioral cases, counting each definition once. Prepare overall and per-layer counts; the final result must exceed 50%. File/helper counts and repeated executions cannot satisfy this measure.
- [ ] Verify positive and negative selector/context cases and keep the existing v1 baseline usable. Clearly record that complete v2 compilation/loading, final package acceptance and actual application parity are gates of later tickets.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
