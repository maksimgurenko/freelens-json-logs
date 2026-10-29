# PR #49: three-angle review and independent verification

Reviewed base `c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528` through
`f200114ffcd97f73bf4e22ded807eab4f47fc658`. Three independent agents received the
original requirements and artifacts with `fork_turns=none`; a fourth agent then
challenged their compiled claims in an isolated checkout before any fix.

## Original review axes

| Angle | Original report | Findings |
| --- | --- | --- |
| Correctness/state | [Report](pr-49-review/review-correctness.md) | One P2: inspector Close loses a successful refinement origin |
| Lifecycle/security/standards | [Report](pr-49-review/review-lifecycle-security.md) | One P2: pending registration crosses document navigation |
| Specification/UI | [Report](pr-49-review/review-spec-ui.md) | One P2: Inspection layout restarts matching and cancels pending selection |

The [compiled reports](pr-49-review/compiled-findings.md) retain the separate
angles. No additional hard standards violation or independently actionable smell
was established. These initial reports are claims; the independent verification
below supplies the final assessment.

## Independent verdicts and fixes

All three claims were **confirmed**, and all three proposed fixes were subsequently
**verified**. [Original-head verification](pr-49-review/verified-findings.md) and
[fix revalidation](pr-49-review/fix-revalidation.md) retain commands, controls,
failed expected-behavior tests, evidence limits and source/bundle hashes.

- **R1:** Inspect row64, match it with `up`, close inspection, then refine to `ups`
  matching rows20/70. The original code selected20; it now selects70. Closing
  inspection preserves a successful candidate's search position while still
  clearing reading-only origins and cancelling older selection/reveal intents.
  Zero-hit refinement and new-query/pending-close counter-controls pass.
- **R2:** The original same-ID navigation premise was not observed in pinned
  Electron41/Chromium146. Real IPC proved a different mechanism: the captured
  `WebFrameMain` object follows the replacement document even when routing IDs
  change. Main registration now snapshots numeric IDs before awaiting retirement
  and guards pending document lifetime with temporary observers. Four obsolete
  main/subframe navigation/reload registrations are rejected; six no-navigation,
  hash and sibling-navigation controls succeed. Listener/binding cleanup passes
  in all ten actual-runtime scenarios and queued/loss/disposal unit controls.
- **R3:** Side/Bottom/Inline and settings synchronization can recreate formatting
  objects without changing searchable text. Matching now retains equal message
  vectors by value, preserving the live query/reveal. Mounted tests verify all
  three layouts and a serialized settings echo issue only one request and select
  row73. Real extracted-content changes still run maintenance without fetching
  logs or implicitly selecting a replacement result.

## Validation and package

The root checkout passes **254 unit/state tests**, the complete mounted browser
suite, typecheck, six desktop-policy checks, actual-worker verification, strict
package checks and two-build reproducibility. [Unit output](pr-49-review/all-fixes-unit.txt),
[browser output](pr-49-review/browser-green.json), [typecheck](pr-49-review/all-fixes-typecheck.txt),
[desktop guards](pr-49-review/all-fixes-ui-guards.txt), [package checksum](pr-49-review/package-sha256.txt).
Permanent regressions are in `tests/find-state.test.ts`, `tests/find-service.test.ts`
and `tests/find-identity-browser.jsx`.

The fourth agent independently passed 37 focused unit cases, strict mounted
regressions with layout/settings/content controls, ten real Electron IPC/frame
scenarios, typecheck and diff checks against byte-identical proposed production
fixes. The Electron fixture uses an unattached headless WebContentsView and a
controlled Worker; it does not run installed Freelens or create a BrowserWindow.

Corrected `freelens-readable-logs@0.1.34` SHA-256:
`464a74d21919ba77cb92a7735340a037a4cb32745f9dd7c274929bfe56a2a043`.
Earlier package/native evidence retains its original artifact scope. This adds
focused core, mounted-renderer and Electron-boundary proof, not fresh full native
input or clipboard acceptance. Windows/macOS remain unverified future work; the
accepted/closed host resource follow-up is unchanged. Current CI is visible in
[PR #49 checks](https://github.com/maksimgurenko/freelens-json-logs/pull/49/checks).

Patch artifacts are archived as gzip files without changing their uncompressed
bytes. Decompress them before replay; recorded patch hashes refer to those
uncompressed bytes. Original-head probes assert the old behavior and are
preserved as evidence; permanent regressions assert the corrected behavior.
