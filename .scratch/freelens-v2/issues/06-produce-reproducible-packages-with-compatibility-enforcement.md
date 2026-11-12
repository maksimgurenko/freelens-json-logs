# 06: Produce reproducible packages with compatibility enforcement

**Status:** ready-for-agent

**GitHub:** [#63](https://github.com/maksimgurenko/freelens-json-logs/issues/63)

**Blocked by:** [05: Complete the Freelens 2 adapter and verify both renderer configurations](05-complete-the-freelens-2-adapter-and-verify-both-renderer-configurations.md) ([#62](https://github.com/maksimgurenko/freelens-json-logs/issues/62)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 6.

## What to build

Produce separate installable Freelens 1 and Freelens 2 artifacts from the shared implementation. Each package has the correct stable settings identity and resources, warns on untested compatible applications and refuses known incompatible combinations before normal startup.

Constraints: [Support and packaging policy](https://github.com/maksimgurenko/freelens-json-logs/issues/54#issuecomment-6535659523), [Package verification matrix](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Generate the v1 package/store identity freelens-readable-logs and v2 identity freelens-readable-logs-v2 with one common extension release number. Preserve v1 installed identity/settings location, keep independent settings namespaces and the common readable-logs configuration name.
- [ ] Use CommonJS v1 main/renderer entrypoints and ESM v2 main/renderer entrypoints, with correctly referenced versioned main/renderer/CommonJS worker resources in isolated outputs. Worker handshakes and manifest resources agree with the release.
- [ ] Each explicit target produces byte-reproducible archives under its pinned recipe. Inspect exact archive contents, identity/formats, matching adapter/SDK and resources; exclude wrong-version code and independent application-library copies. Exercise packed entrypoints and the actual packed worker outside checkout-dependent assumptions.
- [ ] Anchor manifest engines to 1.10.3 and 2.0.1-0 respectively, applying the accepted full-runtime-version/range/prerelease policy rather than treating the anchors as an exact-version allowlist. Untested in-range applications with required interfaces may run with a compatibility warning; allowing execution is not a new support claim.
- [ ] Wrong packages, applications outside the declared compatible range and missing required interfaces refuse normal operation with actionable feedback before extension-owned settings initialization, page registration or worker startup. Adapter selection stays fixed by the artifact; no automatic cross-adapter fallback.
- [ ] Controlled tests cover supported, untested-compatible, out-of-range, wrong-package and missing-interface behavior, including absence of normal startup side effects on refusal. A runtime version string does not certify a source commit; exact build provenance belongs in evaluation evidence.
- [ ] Final correct-package loading and applicable wrong-package refusal remain actual-application gates. Record a real loader discovery/loading refusal where it occurs rather than bypassing it to manufacture extension execution.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
