# 06: Produce one reproducible Freelens 2 package with compatibility checks

**Status:** ready-for-agent

**GitHub:** [#63](https://github.com/maksimgurenko/freelens-json-logs/issues/63)

**Blocked by:** [05: Complete released Freelens 2 integration and renderer checks](05-complete-released-freelens-2-integration-and-renderer-checks.md) ([#62](https://github.com/maksimgurenko/freelens-json-logs/issues/62)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 6.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Produce one installable package for released Freelens 2 with stable settings identity, correct ESM entrypoints and worker resources, reproducible bytes and clear incompatible-runtime behavior.

## Acceptance criteria

- [ ] Generate one package with stable package/store identity freelens-readable-logs-v2 and readable-logs configuration name. Manifest, SDK context and all versioned resources agree with its extension release.
- [ ] Ship ESM main/renderer entrypoints and the matching versioned CommonJS Find worker. Resolve worker resources from ESM correctly and preserve the worker handshake.
- [ ] Produce byte-reproducible archive output under the pinned recipe. Inspect exact archive contents, manifest/identity/formats, released SDK mapping and resources; exclude obsolete runtime bindings and independent application-library copies. Exercise packed entrypoints and the actual packed worker outside checkout-dependent assumptions.
- [ ] Set the manifest compatibility anchor to released 2.0.0 and enforce the declared compatible major/range using the full runtime version and required interfaces. Untested compatible runtimes may run with a warning; this does not expand the validated support claim or require an exact-version allowlist.
- [ ] Out-of-range runtimes or missing required interfaces refuse normal operation with actionable feedback before extension-owned settings initialization, page registration or worker startup.
- [ ] Controlled tests cover the validated runtime, untested-compatible versions, out-of-range versions and missing interfaces, including absence of normal startup side effects on refusal. Exact source/build provenance is recorded in evaluation evidence.
- [ ] Correct-package loading remains an actual application gate. Where loader discovery/loading itself rejects an incompatible artifact, record that real refusal without bypassing it to manufacture extension execution; fixtures cover unavailable incompatible-runtime combinations.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
