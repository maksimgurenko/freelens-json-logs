# #45: source-safe highlights and hidden-match inspection

Implemented **Highlight matches and inspect hidden match sources** on
`implementation/find`, against pre-implementation/review HEAD
`02c4dbd9539ad70943604b28ea843a9102dfa0ef`. #45 was the lowest eligible
unfinished local ticket; #43 is locally done with committed evidence. Claimed
before implementation with `gh issue edit 45 --add-assignee @me`. Live full
#36/#37/#38/#40 bodies/comments match the cached authority
([comparison](authority-check.json)). No issue comments/closure, push, merge,
PR, release or installed-host operation.

Authority: the [accepted literal-only plan at d02b7e7](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md),
the [rendering decision](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783),
the [shared matching contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710),
and [independent inspection/state traces](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).
Literal-only and black/no-counter corrections govern older design examples.
No parsing, retention, acquisition, profile selection or Pause contract changed.

## Original criteria and evidence

| Criterion | Implementation and verification |
| --- | --- |
| Stable source nodes and complete bounded fragments | `FindSourceText` renders consecutive exact slices, at most 8,192 UTF-16 units, without splitting surrogate pairs or inserting text separators. Rows retain shared occurrence keys. `FindHighlights` owns a revision-specific source/text-node index. Pure and mounted checks cover cross-fragment offsets, unchanged-node identity, retained real DOM selection/focus, full-source selection and one complete 5 MiB source. |
| Shared original offsets and provenance | All ranges come through the existing production main/worker and shared matcher. Exact application/message source nodes are indexed; pretty JSON is deliberately unindexed, with no decoded offsets projected into it or guessed field paths. Raw transport prefixes remain outside indexed application spans. Current Find uses an outline and active text marks; inspection, keyboard focus and native selection remain separate. |
| Visible interest and shared bounds | Geometry clips original-source fragments to current visible spans, including horizontal scrolling and nested inspector scrollers. Whole-source non-overlap remains worker-owned. Active visible content orders interests; reply allocation distributes the 4,096 slots across sources, and DOM allocation distributes 1,024 shared slots across viewport/inspector presentations. Only current input/index/interest/ranges are retained. Dense/late-record/late-source browser checks and pure matcher tests exercise caps without losing exact membership. |
| Independent decoration feedback/recovery | `FindRanges` owns its interest/deadline/failure latch, separate from exact `FindMatching`. Failure preserves counts, ordinal and enabled navigation; refresh cannot retry it. Retry highlights uses current inputs/interest. Controlled tests reject obsolete interests/failures, expire attempts and dispose timers; browser tests inject an SDK decoration failure and verify explicit recovery. |
| Truthful hidden-source links | Underlined generated `Match in original text` opens exact Application text; `Match in extracted message` opens the new exact Extracted message tab. Both preserve Raw/Readable, independent Find result/reading state and the existing original-copy adapter. Source hints use exact record provenance, never field-path guesses. |
| Selection provenance and generated labels | Source fragments preserve real DOM Range selection. Generated hint/badge labels use CSS-generated text with `user-select: none`, outside source nodes. Inspector application/transport/extracted-message sources are exact. All fields validates the complete selected interval against aligned application tokens or the explicit active message; generated indentation, decoded non-message values and invalid cross-fragment concatenations are rejected. Valid original slices in escaped tokens and decoded active messages remain eligible. Foreign/multi-record/multiline/generated-label cases remain rejected. Query/highlight/identical-snapshot checks retain source nodes, selection and DOM focus. |
| Presentation and owner lifecycle | Presentation changes replace the index/interest, while scroll/resize/font readiness coalesce visible-interest measurement. Inactivity clears indices/ranges; closure removes observers, listeners, animation frames, styles and Custom Highlight registrations. Shared request IDs preserve main's monotonic sequence across exact/range work. Decoration status renders no longer restore the viewport on every React render; content/layout updates and separately validated reveals preserve ordinary following/Pause. |
| Production browser matrix | [Mounted browser checks](browser-final.txt) cover D07/D08/D12/D13, actual 999/1,000/1,001-line and under/at/over 5 MiB retention, a complete single 5 MiB source, dense/late ranges, escaped/decoded-only content, Unicode fragments, full-source selection and four widths, together with prior state/history/profile/restart/following regressions. The bridge uses built versioned production CommonJS main/renderer and actual Node workers with SDK/OS stand-ins. |

## Reproduction and environment

From this checkout, with `FREELENS_UI_MODE` unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-fields-selection.test.ts tests/find-ranges.test.ts tests/find-client.test.ts tests/find-matcher.test.ts tests/find-presentation.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
FIND_PRESENTATION_SCREENSHOTS=docs/verification/45 node scripts/verify-find-identity.mjs
node scripts/verify-find-execution.mjs
node scripts/verify-find-resources.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/45/package-sha256.txt
```

[Environment](environment.json): project-local Node **24.18.0**, npm **11.16.0**,
Linux x64. Freelens SDK/core/host pin **1.10.3**; stable package/store
`freelens-readable-logs@0.1.34`, configuration/page `readable-logs`, schema **3**.
Versioned CommonJS main/renderer and standalone trusted worker remain intact.

[Locked install](npm-ci.txt), [typecheck](typecheck.txt), [98/98 focused tests](focused-tests.txt),
[242/242 full tests](full-tests.txt), [6/6 desktop guard tests](ui-guards.txt),
[packed CommonJS/worker check](package-check.txt) and [two-build reproducibility](reproducibility.txt)
pass. Strict allowlists and host globals remain intact; the actual packed worker
loads outside the checkout with no runtime package dependencies. Exact package
SHA-256 is `eb7634a6b3f81f75813c106f25495f3560c075b2116f9c73dd8acbc6ddf3c56c`
([record](package-sha256.txt)); [bundle hashes](bundle-sha256.txt) identify the
main, renderer and trusted worker. The package includes preserved dirty manifest/
dependency/documentation inputs; this is not a clean release checkout.

The [production browser run](browser-final.txt) has **40 grouped observations**,
zero uncaught errors, six actual worker starts/exits, peak one and zero remaining
workers/sender/app listeners; it asserts zero retained Custom Highlight registrations
after unmount. The [built-worker check](actual-worker.json) completes 20 scheduler
cycles / 441 requests / 41 actual starts/exits, peak one and zero remaining.
The [final adapted resource check](resource-smoke-final.txt) passes 40 core/main
and 40 renderer lifecycles with the preserved heap/external/RSS, DOM/listener/
document, disk/settings and zero browser-storage assertions. It records 40 worker
starts/exits, peak one and zero remaining worker/owner/app listeners. These use
disposable processes, current SDK/OS stand-ins and real built assets; they do not
operate the installed host or shared settings/fixtures.

## Browser appearance, development controls and limits

The capture runner serves pinned SDK Roboto/Material Icons and waits for fonts.
Inspected production-renderer captures at [260 px](presentation-260.png),
[390 px](presentation-390.png), [700 px](presentation-700.png) and
[1,440 px](presentation-1440.png) show the hint beside the message when it fits,
wrapping below at 260, black canvas, no counters and a separate compact Find bar.
[Mechanical UI detector](ui-detector.json) reports no findings.

TDD red controls precede source-fragment implementation
([fragments-red.txt](fragments-red.txt)), hidden-source actions
([browser-hidden-red.txt](browser-hidden-red.txt)), fair bounded range allocation
([fair-ranges-red.txt](fair-ranges-red.txt)) and the range controller
([ranges-red.txt](ranges-red.txt)). Intermediate failed browser/typecheck logs
retain development evidence: test helpers needed to address fragmented Text nodes,
restore an explicitly selected inspector tab and count matching work separately
from decoration. The stronger late-visible check exposed decoration feedback
undoing a pending scroll through unconditional viewport restoration. Its failing
diagnostic and subsequent production fix are retained; failed checks are not
reported as passes. Text command logs normalize trailing whitespace for Git.

[Independent Standards and Spec reviews](review.md) are pinned to the recorded
starting HEAD and include the staged ticket diff. All findings were corrected and
independently rechecked, including pretty-field provenance and cross-fragment
selection. [Fields provenance red](fields-selection-red.txt) and
[slice red](fields-slice-red.txt)/[green](fields-slice-green.txt) retain the
additional regression controls.

The original pre-existing `npm run test:smoke` still fails because its old Electron
double lacks `app.on` ([original-smoke.txt](original-smoke.txt)). This is the
recorded #42/#43/#44 baseline failure. #47 owns deliberate integration of those
preserved untracked smoke/CI/dependency inputs. The current disposable adapter
runs their workloads with current SDK stand-ins and actual production assets,
leaving the original files unchanged; it is a distinct resource check.

No native window activation/restart/minimize/restore, desktop input injection,
pointer movement, clipboard write, fake focus or shared-guard bypass occurred.
Headless DOM focus/selection and clipboard-adapter payload tests do not prove
physical input or clipboard delivery. The unfocused headless document does not
activate `:focus-visible`; the distinct CSS rule is implemented, while physical
focus styling remains unverified. Actual installed-host Custom Highlights,
native/IME/platform acceptance and Windows/macOS remain #48. No release acceptance
is claimed. #46 measured marks and #47 package/resource/CI integration remain
separate tickets.

The dirty glossary, CI, manifest/lockfile, local-development/index docs and untracked
resource-smoke sources retain their prestart hashes
([preservation record](prestart-preservation.json)); old scratch/design/Ralph data
and `.gitignore` remain excluded. Only the runner-written #44 Status update may
accompany this related ticket's changes. [Final hash comparison](prestart-preservation-check.txt)
confirms all ten preserved inputs still match.
