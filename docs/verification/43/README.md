# #43: reading-row origins, refinement and live Find intents

Implemented **Search from the reading row and preserve refinement position** on
`implementation/find`, from recorded pre-implementation/review HEAD
`62e309c57f359486083058ab032db09d46a7ff62`. #43 was the lowest eligible local
ticket; #42 is locally done with committed production SDK/worker evidence.
Claimed before implementation with `gh issue edit 43 --add-assignee @me`.
Live #43 and full #36/#37/#38/#40 bodies/comments matched the cached sources.
No issue comments/closure, push, merge, PR, release or host installation.

Authority: the [accepted literal-only plan at d02b7e7](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md),
the [state decision and 13 traces](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921),
[execution contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710)
and [reviewed design](https://github.com/maksimgurenko/freelens-json-logs/blob/a774370c71193b4e3603bab9eee83189fb38c67b/docs/design/search-final-design.md).
The literal-only and black/no-counter exceptions govern older design examples.

## Implemented behavior and original criteria

| Original criterion | Implementation and evidence |
| --- | --- |
| Independent reading, inspection, active result, candidate, position and browser selection | `src/core/find-state.ts` owns occurrence references and intents independently of the existing inspector and DOM. Deliberate activation/Tab-focus rebases reading; generic/programmatic focus, Find reveals and scrolling do not. Pure tests plus mounted independent inspector/reading and focus-return cases. |
| Inclusive new-query origin; pre-insertion replacement | New queries seek from the retained reading occurrence or the beginning. `src/core/find-editing.ts` observes native pre-insertion selection. Shared-prefix **and identical-text** full replacement start a new sequence; partial paste and mode changes refine. Pure and mounted regressions cover each. |
| Stable refinement, zero-hit correction, strict/inclusive navigation and feedback | The 64 → 73 → Next 82 → typo → correction 82 trace passes; full replacement returns to 73. Latest surviving position and candidate remain separate from the displayed result. Initial Previous addresses the final hit; inclusive reading navigation, both wraps and one-hit feedback pass. |
| Independent current matching, selection and reveal validity | Complete input keys remain owned by the existing async matching client. Selection and reveal permissions have independent live identities; manual scroll cancels only reveal. Dismissal, inspection close, Profiles, inactivity and context changes cancel affected intents. Current counts can settle without choosing a result. Reveals resolve the current occurrence and row rectangle at execution via `LogViewport.show`. |
| Maintenance and presentation stability; following/Pause | Refresh/duplicate/eviction tests retain only current matching occurrences and never substitute a new hit. A zero-hit query gaining matches waits for navigation. Actual profile UI changes remove/restore decoded hits without fetching or choosing replacements. Raw/wrap changes preserve the matching key. Existing viewport, following, Pause and lifecycle checks pass. |
| Inspection close/deselection and suppressed restoration | Closing inspector A retains independent reading B and valid Find state. Closing/deselecting its own reading occurrence clears that anchor before focus return. Delayed current completion cannot reopen the inspector, choose a canceled result or scroll. |
| Native edit transactions and composition | No caret rewrite, preventDefault editing or replacement undo stack. Pre-composition selection is captured; one committed composition evaluates once; duplicate/late completion and composition Enter are guarded. Pure and mounted event tests cover partial paste, cut/empty, Undo/Redo classification across empty, identical replacement and caret retention on navigation. Physical OS editing/IME is explicitly unverified below. |
| Clear/Close/dismissal/shortcut contracts | Clear retains open/focused Find, flags, inspection, reading and viewport, clearing only query-derived state/intents. Close retains valid temporary query/flags/results and returns to the saved opener with local fallback. Existing one-layer dismissal, exact-modifier, foreign-editor, IME/AltGraph and inactive ownership guards are retained; full shortcut/dismissal suites pass. History/seeding remain #44. |
| Compact accessible separate Find bar | Real SDK Material Icons `keyboard_arrow_up/down`, 21 px; accessible names, pressed/disabled states, visible focus, separate count and coalesced polite status. Width checks at 260/390/700/1440 preserve the black canvas and separate bar. No counters, regex control or preference storage added. |
| Pure transitions and mounted production regressions | [Focused tests](focused-tests.txt): **15/15**. [Full suite](full-tests.txt): **233/233**. [Mounted production renderer](browser-final.txt): **23 grouped checks**, zero errors, one real worker start/exit and zero remaining worker/owner listeners. Relevant D01–D06, D09–D11 and D13–D16 paths are covered at these seams. Existing #41/#42 tests cover stale keys/errors, duplicates and observed restarts; history/decoration/marks/physical-platform portions stay with #44–#48. |

## Reproduction

From this checkout, with `FREELENS_UI_MODE` unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-state.test.ts tests/find-editing.test.ts tests/find-client.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node scripts/verify-find-identity.mjs
node scripts/verify-find-execution.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node scripts/verify-find-resources.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/43/package-sha256.txt
```

[Environment](environment.json): Node **24.18.0**, npm **11.16.0**, Linux;
Freelens SDK/core pin **1.10.3**. Package/store `freelens-readable-logs@0.1.34`,
configuration/page `readable-logs`, schema **3**, versioned CommonJS main/renderer
and standalone trusted worker paths are unchanged. Builds use the preserved dirty
dependency/local-development inputs; this is not a clean release checkout.
[Locked install](npm-ci.txt), [typecheck](typecheck.txt), [desktop policy guards](ui-guards.txt),
[packed check](package-check.txt) and [two-build reproducibility](reproducibility.txt) pass.
The final package SHA-256 is recorded in [package-sha256.txt](package-sha256.txt).
Strict package checks execute the packed worker outside the checkout and load
the packed CommonJS exports without adding runtime dependencies or weakening allowlists.

[Actual worker scheduler](actual-worker.json): 20 cycles, 441 requests, 41 actual
starts/exits, peak one worker and zero live workers. The production-mounted
renderer uses the actual built main service/worker through the packed HTTP test
bridge; SDK/Electron/OS boundaries are stand-ins, not a real installed host.

[Resource workload](resource-smoke.txt): preserved thresholds and all assertions
pass for **40 core/main + 40 renderer cycles**, with 40 worker starts/exits, peak
one, zero retained workers/sender/app listeners, bounded heap/DOM/listeners/disk,
and no browser storage. The disposable adapter adds only the current Electron
shutdown/SDK/Icon doubles and production worker bridge. Original pre-existing
smoke source, CI and dependency files are preserved for #47.
**Original `test:smoke` still fails** at its old Electron double's missing `app.on`
([failure](original-smoke.txt)); this is the already recorded #42 baseline failure,
not a passing check or a new #43 production failure.

## Red controls, reviews and limitations

TDD used the accepted pure-transition and mounted-renderer seams.
`state-red.txt`/`intent-red.txt`/`editing-red.txt` precede their new implementations.
`browser-position-red.txt` reproduces the old viewer choosing row **2** instead
of reading-origin row **73**. Review caught identical select-all replacement:
`identical-replacement-red.txt` and `browser-identical-red.txt` reproduce it;
the final pure/mounted checks pass after fixing both the transaction classifier
and React's same-value `onChange` deduplication.

Retained earlier fixture failures are not passing product evidence: `browser-red.txt`
had a disabled Clear precondition; `browser-profile.txt` used a newline in a
single-line input and was corrected to a decoded Unicode escape fixture.
`browser-expanded*.txt` retain intermediate runs, including the discovery that
unfocused Chromium may update `activeElement` without delivering focus events.
The final keyboard-focus boundary test explicitly dispatches synthetic focus/input
events; it does not fake `document.hasFocus`, force a window forward or bypass
the shared shortcut/dismissal guards. No physical paste/Undo/IME assertion follows
from those events. `pre-review-comparison.txt` is a failed hash comparison across
a source rename, not a same-source reproducibility result; final reproducibility
compares two builds of the same final production source.

[Independent Standards and Spec review](review.md): both axes have zero unresolved
findings. Reviews include the nonempty current ticket diff against the recorded
HEAD; one naming judgment and one same-text replacement defect were corrected.

[Prestart preservation](prestart-preservation.json) verifies all six original
tracked dirty files retain their exact hashes. Untracked resource/design/Ralph/
scratch work remains in place and is excluded from this ticket commit. Only the
runner-written #42 Status change may accompany this related ticket.

No installed-host operation, native window/input/pointer action, system clipboard
write, fake `document.hasFocus()` or native desktop focus change was performed. Background headless DOM
selection and clipboard-adapter payload tests do not establish physical selection
or system clipboard behavior. Native keyboard/focus/paste/Undo/IME/clipboard,
Windows/macOS and new installed-package acceptance remain #48/downstream gates.
No release acceptance is claimed. #44 history/seeding, #45 text decorations and
hidden-source actions, #46 measured marks and #47 resource/CI integration remain
separate unfinished tickets.
