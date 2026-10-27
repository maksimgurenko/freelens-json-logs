# #46: measured scrollbar match marks

Implemented **Navigate scrollbar match marks using measured geometry** on
`implementation/find`, starting at/reviewed against
`7e6485536b3fec58b6c4b9f17592167b658bc74d` ([record](review-base.txt)).
This was the lowest eligible unfinished local ticket; #43 is locally done with
committed evidence. Claimed before implementation with
`gh issue edit 46 --add-assignee @me`. Full live #36/#37/#38/#40/#46 bodies and
comments match their cached originals ([comparison](authority-check.json)).
No tracker comments/closure, push, merge, PR, release or installed-host operation.

Authority is the [accepted literal-only plan at d02b7e7](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md),
the [measured geometry decision](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783)
and [occurrence/reveal state contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).
Literal-only, black/no-counter and separate-toolbar corrections prevail over
older design examples. Parsing, snapshot acquisition, retention, profile
selection, exact original-copy actions and explicit Pause remain unchanged.

## Original acceptance criteria and evidence

| Criterion | Implementation and verification |
| --- | --- |
| Complete ordered matching list and actual row geometry | `FindMarks` receives exact matching occurrence refs, independently of highlight ranges/coverage/failure. It measures current row rectangles in content coordinates after React layout. Numeric DOM row indices are resolved only in the current immutable window; groups retain occurrence refs. Pure slot tests and browser checks retain all 1,000 exact members under decoration caps/failure. |
| Coalesced invalidation and current reveal | One scheduled animation frame coalesces invalidations. Current-row/scroller ResizeObservers, scoped child/text/style/class MutationObserver, window resize, font loading/readiness and accepted viewer updates cover retention, wrap, inspection expansion, representation/profile and generated content growth. Each measurement replaces current geometry; there is no historical geometry cache. The shared viewport resolves an occurrence to its current row/rectangle at actual reveal. Browser checks cover long/wrapped/expanded/hidden-source rows, font loading, resize and synchronous growth before the pending measurement. |
| Seven-pixel groups, complete cycling and active distinction | Pure `groupFindMarks` retains all members in retained order in seven-pixel slots. Named native buttons describe group population/cycling. Repeated clicks traverse every member and wrap. `aria-current` and a thicker bordered mark distinguish the active group without relying on color. Browser checks cycle an entire group, account for every member, and verify the active border/state. |
| Shared explicit navigation and independent state | `FindPosition.navigate` accepts a direction or an exact matching occurrence through the same result/candidate/search-position/reveal path. Viewer navigation also shares history commitment and focus-to-Find behavior. No row activation/inspection/reading event is dispatched. Pure and browser tests verify preserved reading row, inspector and Pause, exact history commitment and ordinary top-aligned reveal. |
| Canceled and expired actions, following, anchors and selection | Clear/dismissal/inactivity/profile entry remove mark controls; removed buttons lose their listeners. Current refs/membership are validated before action. A layout-only regroup captures the original live target before remeasurement, even when groups split/merge. Evicted references cannot address equal-looking new rows. Mounted regressions include stale replies/intents, manual-scroll cancellation, retained anchors, bottom following and unchanged DOM source selection; mark-specific checks add dismissal, eviction, regrouping and refresh selection. |
| Disposal and compact appearance | Viewer cleanup disconnects both geometry observers, removes font/resize/button listeners, cancels the frame and releases current groups/inputs. Browser teardown asserts zero retained Mutation/Resize observers and animation frames across all viewer owners. The rail stays beside the log scrollbar, outside selectable source text; black canvas, no counters and the existing compact toolbar/Find bar remain. Resource cycles retain the previous memory/DOM/listener/disk/storage bounds. |
| Pure and real production-browser integration | [Focused tests](focused-tests.txt), [mounted browser run](browser-regroup-green.txt) and [four captures](marks-260.png) cover grouped cycling, long/wrapped/expanded rows, fonts, resize, retention, current-result marks, stale geometry and final #45 hints/highlights. Buttons have native keyboard semantics, accessible names and focus styling; no page overflow at 260/390/700/1,440 CSS pixels. Packed-host and physical/platform checks remain the later acceptance gate. |

## Reproduction and outcomes

Commands ran from this checkout, with `FREELENS_UI_MODE` unset, using the
documented project-local toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-marks.test.ts tests/find-state.test.ts tests/viewport.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
FIND_MARKS_SCREENSHOTS=docs/verification/46 node scripts/verify-find-identity.mjs
node scripts/verify-find-identity.mjs
node scripts/verify-find-execution.mjs
node scripts/verify-find-resources.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
sha256sum out/main-0.1.34.js out/renderer-0.1.34.js out/find-worker-0.1.34.js
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/46/package-sha256.txt
node /home/max/dotfiles/agents/.agents/skills/impeccable/scripts/context.mjs --target src/renderer/viewer.tsx
node /home/max/dotfiles/agents/.agents/skills/impeccable/scripts/detect.mjs --json src/renderer/viewer.css src/renderer/viewer.tsx src/renderer/find-marks.ts
```

[Environment](environment.json): Node **24.18.0**, [npm **11.16.0**](npm-version.txt),
Linux x64. SDK/core/host pin **1.10.3**. Stable package/store
`freelens-readable-logs@0.1.34`, page/configuration `readable-logs`, schema **3**.
The browser identifies its actual version in the mounted-run JSON. Versioned
CommonJS entry points, trusted worker asset and strict package allowlists remain.
The package includes preserved dirty manifest/dependency/documentation inputs;
this is not a clean release checkout.

[Locked install](npm-ci.txt), [typecheck](typecheck-regroup.txt),
[11/11 focused tests](focused-tests.txt), [244/244 full tests](full-tests.txt),
[6/6 UI guard tests](ui-guards.txt), [packed runtime checks](package-check.txt)
and [two-build reproducibility](reproducibility.txt) pass. Package identity is
recorded by [SHA-256](package-sha256.txt); [bundle hashes](bundle-sha256.txt)
identify the exact main, renderer and worker. Packed worker checks execute from
outside the checkout, with no runtime dependencies or DOM/host globals.

The final mounted browser run records **46 grouped observations**, three actual
worker starts/exits, peak one and zero remaining workers. It uses actual built
production CommonJS main/renderer,
real Chromium layout, CSS Custom Highlights and Node workers; SDK/OS services
are explicit stand-ins. It asserts zero uncaught errors, zero remaining worker/
owner listeners, Custom Highlight registrations, geometry observers and frames.
[Actual worker verification](actual-worker.json) separately completes 20 scheduler
cycles / 441 requests, with 41 actual starts/exits, peak one and zero remaining.
[Final adapted resource verification](resource-smoke-final.txt) passes the
preserved 40 core/main and 40 renderer lifecycle workloads with heap/external/RSS,
DOM/listener/document, disk/settings and zero browser-storage bounds. It records
40 actual worker starts/exits, peak one and zero remaining worker/owner/app
listeners. These isolated checks do not operate shared settings or fixtures.

The original preserved `npm run test:smoke` **fails** because its Electron double
lacks `app.on` ([output](original-smoke.txt)), the same baseline failure documented
under #42–45. #47 owns integrating that pre-existing smoke/CI/dependency work.
The passing resource adapter executes those workloads in a disposable copy with
current SDK stand-ins; the original untracked sources remain byte-identical.

## Development controls, review and evidence limits

Red controls precede pure grouping ([red](marks-red.txt)/[green](marks-green.txt)),
exact occurrence navigation ([red](navigation-red.txt)/[green](navigation-green.txt))
and the first mounted marks ([red](browser-red.txt)). Intermediate logs preserve
two harness issues: the new test initially left Find open before the existing
hidden-history check; the pre-existing timeout gate could capture an earlier
composition request. It is now optionally bound to its intended query. These
failures are not claimed as passes.

The split-group regression fails before the final fix
([red](browser-regroup-red.txt)) and passes afterward
([green](browser-regroup-green.txt)). It grows a row before the scheduled geometry
frame, then activates the still-live original group. The handler captures that
same occurrence before regrouping and validates it afterward. Dismissed, obsolete
and evicted actions still fail current eligibility checks. [Independent reviews](review.md)
are pinned to the starting HEAD and include the staged current-ticket diff.

Inspected captures at [260](marks-260.png), [390](marks-390.png),
[700](marks-700.png) and [1,440](marks-1440.png) show the black canvas, adjacent
compact mark rail and bordered active mark. [Mechanical detector](ui-detector.json)
reports no findings. Seven-pixel desktop rail slots are the accepted geometry,
not a newly introduced mobile interaction model. Physical keyboard focus styling,
native input/IME, wheel input, system clipboard delivery and Windows/macOS remain
unverified. DOM focus/selection and simulated browser actions do not prove them.
Actual installed-host/package geometry and resource soak remain #48; no release
acceptance is claimed by completing this implementation ticket.

No native window activation/restart/minimize/restore, native input injection,
pointer movement, clipboard write, `Page.bringToFront`, fake focus or shared-guard
bypass occurred. Tests used disposable headless browsers/processes. Only owned
temporary resources were removed; unrelated host/dock/desktop state was untouched.

Dirty glossary, CI, manifest/lockfile, local-development/index docs and untracked
resource-smoke files preserve their [prestart hashes](prestart-preservation.json).
Old scratch/design/Ralph data and `.gitignore` stay excluded. Only the runner's
#45 Status update may accompany this related ticket. The final hash comparison
is [recorded separately](prestart-preservation-check.txt).
