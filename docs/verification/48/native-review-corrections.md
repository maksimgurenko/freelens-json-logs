# Independent review corrections and final package

Review baseline stays `e41520ea01e1badaa07c4adc731e080db9f8aca6`. Original requirements
and artifacts were supplied to independent Standards/Spec reviewers before parent
conclusions. Both findings below were resolved in a fresh genuinely separate session,
with the resource deferral and platform exclusions unchanged.

## Distinguishable native IME replacement

The initial whole-input IME case began at result 2: a wrong refinement could also
have produced 2. Its partial case appended at End rather than replacing a selected
interval. Those recorded passes established transactions, but not the full requested
classification. They remain preserved with this correction.

[Fresh native cases](host/native-ime-replacement-20261028/native-reviewed-completion.json)
use actual pre-insertion selection and different independently expected results:

- Reading row 64, query `upstream`, candidate 82: native Ctrl+A selects `[0,8)`;
  native preedit `up` → `upstream` commits once, seeks anew from 64 and finds **73**.
  Refinement would incorrectly retain 82. No matching request is issued in preedit.
- Candidate 82: native End/Shift+Left×6 selects suffix `[2,8)`; IME replaces it with
  `stream`, retaining exact `upstream` and **82**. Treating it as a whole replacement
  would incorrectly choose 73. One committed matching request is observed.

No DOM composition/selection injection or fake focus. Existing final six-group IME
results retain their event trust/Enter/Japanese/cancel/Clear scope and exact late-event
limits. The new cases supply the previously missing discriminating native oracles.

## Actual contrast failure, regression and narrow fix

The original light-host [screenshot](host/native-completion-20261028/native-selection-highlights.png)
and JSON record `rgb(34,34,34)` text on black. Recording styles was not a passing
contrast check; the initial D07 acceptance overclaim is corrected here.

A new regression at the existing mounted production-renderer/CSS seam applies light
and dark host color variables and independently calculates foreground/background
contrast for ordinary, inspected and native-selection text, while requiring the
black canvas. [Red](host/native-ime-replacement-20261028/contrast-red.txt) fails with
`light: ordinary log text lacks contrast on black canvas` before the production fix.
The minimum 4.5 ratio is a focused readability oracle, not a claim of a complete
accessibility audit.

Production changes only the existing `.rl-row` palette: readable foreground, secondary,
inspection/hover and selection colors on the already-required black canvas. The scope
ends at rows, so Inline inspector/toolbar colors keep the host theme. No geometry,
parsing, matching, input, identity, acquisition, copying or resource mechanism changes.

[Green production browser](host/native-ime-replacement-20261028/contrast-green-browser.txt)
passes both theme configurations and the full existing browser suite. The fresh
installed light-theme [native case](host/native-ime-replacement-20261028/native-reviewed-completion.json)
passes ratios **16.64 ordinary, 10.94 inspected/hovered, 7.04 native selection**.
Native drag/exact private clipboard and Custom Highlights remain correct.
[Fresh screenshot](host/native-ime-replacement-20261028/native-contrast-selection.png)
shows readable ordinary records alongside native selection.

Final package: `freelens-readable-logs@0.1.34`, SHA-256
**`15f99148d56a5b6100b929ff79c5d9b3680c9186a36dc5d5e08706bfed67749b`**.
[Fresh identity](host/native-ime-replacement-20261028/package-identity.json) matches
all installed assets. [Comparison](host/native-ime-replacement-20261028/asset-comparison.json)
proves main/worker bytes unchanged and renderer bytes identical after substituting
only the embedded CSS string. Earlier `0648bbe5` native functional evidence retains
its exact artifact scope; it is not called a whole-package repetition.

## Harness cleanup and verification

Standards found setup could throw after spawning input helpers, before callers
received the cleanup object; a failed final probe could skip CDP close. Setup now
owns cleanup for every synchronous/async prerequisite failure, waits for owned input
children and closes transports unconditionally. [Failure-path probe](host/native-ime-replacement-20261028/harness-cleanup.json)
removes only the owned identity prerequisite temporarily and observes expected ENOENT
with no remaining input PIDs; independently closes the private page transport and
proves final probing fails while both input children still exit. Its intentionally
failed-probe JSON remains failed; the cleanup oracle passes. The IME comment now
accurately discloses its Enter keyboard grab. New desktop observer capture redacts
unrelated titles before writing them.

Final [typecheck](host/native-ime-replacement-20261028/typecheck.txt.gz),
[250 tests](host/native-ime-replacement-20261028/tests.txt),
[six UI guards](host/native-ime-replacement-20261028/ui-guards.txt), packed checks and
[two-build reproducibility](host/native-ime-replacement-20261028/reproducibility.json)
pass. The full browser suite above includes the new meaningful regression. No resource
smoke/soak/attribution was repeated. [Source hashes](host/native-ime-replacement-20261028/tooling.json)
identify final harness/CSS/test changes separately from the earlier checkpoint.

Fresh host exits **0**, [shutdown](host/native-ime-replacement-20261028/shutdown-clean.json)
records zero live execution and closed/empty ownership/watch, and
[cleanup](host/native-ime-replacement-20261028/cleanup.json) removes all private PIDs,
profile/runtime and UID/label-checked namespace. Original dirty glossary/docs and
manifest/lock hashes still match. [Desktop observation](host/native-ime-replacement-20261028/desktop-summary.json)
records one notification over 163.29 seconds; pointer endpoints differ, so no
unchanged interval is claimed. Native actions remain entirely private.
