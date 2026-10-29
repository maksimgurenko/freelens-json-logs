# Literal Find: implementation and acceptance plan

## Current completion and accepted limits — 2026-10-28

Literal Find implementation and Linux acceptance are complete; the
[acceptance matrix](../verification/48/matrix.md) and
[reviewed native completion](../verification/48/native-review-corrections.md)
record the evidence. Windows/macOS tests are planned soon but deferred to a
future task; both platforms remain explicitly unverified and do not block closing
this implementation increment. The planning handoff below retains its original
scope; this completion note supersedes its then-pending acceptance status.

[PR publication corrections](../verification/48/pr-49-ci.md) record the unchanged
Pod-metadata regression/fix, final package identity and CI browser selection.

### Resource investigation TLDR

Freelens 1.10.3 leaves a 660-second fallback timer running after a Kubernetes
watch is aborted, retaining two listeners per watch; cancelling only that timer
prevented growth in two diagnostic controls.
A separate comparison of 100 open/close cycles per viewer, using fresh host
profiles and the same actively logging Pod with Find unopened, recorded zero
DOM-node, listener or document growth in every measured sample for both Readable
logs and the default viewer.
The resource follow-up is closed as an accepted host limitation, with no
production host fix or complete attribution of the historical Find spikes;
original failures and thresholds remain preserved in the
[investigation evidence](../verification/48/resource-reopened-20261028.md) and
[comparison report](../verification/48/resource-comparison-20261028.md).

## Original accepted planning handoff — 2026-10-26

Status: accepted implementation handoff. The maintainer answered **“yes”** to
the live planning-readiness question on 2026-10-26.
Prepared 2026-10-26 for
[Agree the Find implementation plan and acceptance gates](https://github.com/maksimgurenko/freelens-json-logs/issues/39),
the final decision in
[Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).
No production implementation or release is accepted by this document.

## Authority and scope

Implement literal-only Find with Match case and Whole words. Query punctuation
is ordinary text; omit the `.*` button. Preserve the existing black (`#000`)
log canvas, absence of line counters, compact toolbar and separate on-demand
Find bar. Hidden-match links sit beside the message where possible and wrap
below when necessary. Prototype controls, gutters, colors and presets do not ship.

The following linked resolutions hold the decisions; this plan indexes and
orders their implementation rather than copying their specifications:

| Authority | What the implementer must take from it |
| --- | --- |
| [Reviewed Find design and acceptance cases](https://github.com/maksimgurenko/freelens-json-logs/blob/a774370c71193b4e3603bab9eee83189fb38c67b/docs/design/search-final-design.md) | Product behavior, compact bar, accessibility and the 21 reviewed choices. Apply the literal-only and appearance exceptions above. |
| [Define Find state, reading anchors and occurrence identity](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921) | Shared observed-occurrence references, event table, separate matching/selection/reveal validity, input/history transactions, instance signal and all 13 acceptance traces. Replace its three-mode references with the two retained flags. |
| [Choose Find matching semantics and resource budgets](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710) | Literal Unicode semantics, complete request/reply identities, main-owned Node workers, cancellation/recovery, numeric limits and trusted worker packaging. Supersedes earlier regex/utility recommendations. |
| [Validate text-safe highlights, hidden matches and scrollbar marks](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783) | Accepted CSS Custom Highlights direction, source mapping, rendering limits, hidden-source actions, appearance and measured mark geometry. |
| [Prove main-owned Find execution in an isolated Freelens host](https://github.com/maksimgurenko/freelens-json-logs/issues/40#issuecomment-6421719705) | Actual loader/SDK/frame-ownership feasibility and lifecycle evidence, including the failed frame-deletion listener and corrected membership safeguard. |

Do not change parsing, profile selection, snapshot acquisition, retention,
ordinary following, explicit Pause or exact original-copy contracts. Find keeps
all records visible. Search state and history remain temporary per viewer/context;
there is no preference store, global shortcut expansion or new row-navigation
scheme. Use the glossary's reading row, record occurrence, refinement candidate
and search position as distinct concepts.

## Integration boundaries

Source audit baseline:
[`c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528`](https://github.com/maksimgurenko/freelens-json-logs/tree/c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528).
The primary checkout's tracked production source matches that baseline. Its
uncommitted glossary, CI, package and resource-smoke work is separate; preserve
it when integrating. This planning branch intentionally imports none of it.

| Owner / current seam | Required responsibility and migration |
| --- | --- |
| Pure core: [navigation](../../src/core/navigation.ts), [inspection](../../src/core/inspection.ts), [records](../../src/core/records.ts), [profiles](../../src/core/profiles.ts) | One overlap-based occurrence mapping and reference lookup for every consumer; pure seeks, matching/ranges, query-event/state transitions and history. Replace inspection's occurrence-from-end identity. Keep parsing and formatting contracts intact. New module names may follow repository conventions. |
| Session/adapter: [SnapshotSession](../../src/core/session.ts), [snapshot retention](../../src/core/snapshot.ts), [Freelens adapter](../../src/adapter/freelens.ts) | Publish the observed container-instance epoch before accepting replacement data. Preserve guarded requests, status observation, Pause and manual-profile behavior. Do not reuse the private request generation as instance identity. |
| Main extension: [main](../../src/main.ts) and extension-scoped SDK service | Own worker assets, frame-bound viewer registration, input validation, execution scheduling/deadlines and actual termination/disposal. Existing visibility broadcasts are not sufficient authentication for Find control. |
| Renderer extension: [entry/lifecycle](../../src/renderer/index.tsx) and SDK client | Register/dispose clients with viewer and extension lifetimes; carry current identities and cancel inactive owners. The existing page key includes Pod UID but does not reset state for same-container restarts. |
| Viewer: [Viewer and RecordInspector](../../src/renderer/viewer.tsx), [shortcuts](../../src/renderer/local-shortcuts.ts), [dismissal](../../src/renderer/local-dismissal.ts), [local back](../../src/renderer/local-back.ts) | Own independent reading/inspection/Find state, explicit user intents, input transactions, focus return and history. Replace synchronous `findMatches`, first-hit-on-every-edit behavior and the numeric `requestedMatch` ref with the agreed asynchronous controller. |
| Viewport/presentation: [LogViewport](../../src/renderer/log-viewport.ts), [viewer styles](../../src/renderer/viewer.css) | Consume still-live occurrence reveals, resolve rows at execution, retain ordinary following/anchors, measure real geometry and own source-node indices, Custom Highlights, visible range interest and marks. Current code renders every retained row; a virtual-list rewrite is not required. |
| Original content: inspector, [inspection core](../../src/core/inspection.ts), [clipboard adapter](../../src/adapter/clipboard.ts) | Keep Transport line/Application text copy exact; add the explicit Extracted message representation using the active extracted string. Generated labels never become searchable/copyable log text. |
| Build/checks: [build](../../scripts/build.mjs), [packed checks](../../scripts/check-package.mjs), [CI](../../.github/workflows/ci.yml) | Build a versioned trusted worker from the same pure matcher, include it in the tarball and strict allowlist, and execute the packed asset in checks. Preserve host-supplied React/MobX and absence of runtime package dependencies. |

The identity migration is substantive: `[start, x, end]` to `[x, end, x]` must
keep the old `x` at index 0 for inspection, reading, Find, DOM rows and viewport
anchoring. No consumer may recover an expired reference by text equality or a
saved numeric row index. Identical windows retain observed IDs; invisible
identical additions cannot be inferred.

## Contracts to carry across those boundaries

- Exact matching searches application text OR active extracted message, excludes
  Kubernetes timestamps, and returns every matching record once in retained
  order. Share the escaped-literal matcher between exact results and ranges;
  never run a second presentation predicate. Preserve original UTF-16 offsets
  and source provenance, Unicode simple/common folding, original-code-point
  `L`/`N`/underscore neighbors and left-to-right non-overlap. Query-only folding
  must not alter whole-word neighbor categories, including U+0345.
- Carry viewer, target, observed-instance, window, extracted-message and query
  revisions end to end, plus request, worker-generation and range-interest
  identity. Reject stale failures as well as successes. Bind main ownership to
  the actual requesting webContents and frame/process-routing identity, not a
  renderer token or cluster ID alone. Validate inputs before allocation/execution
  and replies/range bounds before applying them.
- Matching data can remain useful after dismissal, but only independent live
  selection/reveal intents may choose or scroll a result. Snapshot/profile
  maintenance never chooses a replacement hit. Manual scroll, dismissal,
  Profiles, inactivity and context changes invalidate affected intents; they
  never replay on return. Resolve the occurrence and current geometry at reveal
  execution, without animated travel or an implicit inspector action.
- Expose the session's explicit observed-instance epoch. Known restart-count
  changes or differing known IDs reset Find, including while paused. Missing
  metadata is not a restart; first-known metadata establishes a baseline and
  count-then-ID arrival must not reset twice. Pod UID replacement remains a
  terminal/outdated old target, requiring a fresh viewer context. Metadata and
  name-addressed log reads remain non-atomic.
- Keep native input editing. Capture pre-insertion selection for whole-input
  replacement and IME transactions; evaluate once on composition commit.
  Distinguish new query, refinement, mode change and Undo/Redo as specified in
  the state resolution. Capture eligible selections before moving focus: one
  record/inspector, actual log text, single line, at most 256 Unicode code points,
  empty input only. Seeding does not choose a reading row.
- History is a maximum of seven distinct exact text/two-flag tuples, MRU and
  memory-only. Commit on eligible explicit navigation or Close Find; include
  completed valid zero-hit searches and exclude pending/error/composing input.
  Recall is a new search, without a saved cursor. Honor one-layer Escape,
  eligible local Ctrl/Cmd+F and G/Shift+G, Enter/Shift+Enter, exact modifiers,
  IME/AltGraph guards and programmatic-focus suppression.

| Bound / lifecycle | Accepted implementation requirement |
| --- | --- |
| Input | Existing 1,000-record / 5 MiB original UTF-8 retention; at most 16,384 UTF-16 query units. Preserve and explain oversized input without executing/truncating it. |
| Pending/time | Pending immediately, navigation disabled; `Searching…` after 100 ms. Expire at 1,000 ms including startup, invalidate immediately and cancel actual execution. Start renderer timers before dispatch and main supervision before startup/posting; stages do not renew an attempt's allowance. |
| Execution | One lazy reusable Node worker per active viewer needing matching; one running operation and newest replacement descriptor. Cancel superseded work, wait for actual exit before replacing it, and prioritize exact matching over viewport-range churn. |
| Failure/recovery | Local, latched feedback; logs/query remain available. Explicit edit or Retry recovers on current data without replaying an old reveal. Refresh alone never retries a failed search. No retry loop or silent execution fallback. Decoration failure preserves valid exact matching/history eligibility. |
| Output/DOM | At most 4,096 ranges per reply and 1,024 DOM highlight ranges shared by viewport/inspector. Cap during enumeration/allocation, report coverage, and retain complete exact record counts/provenance/navigation/marks. |
| Text/interest | Stable occurrence-keyed unchanged source nodes; presentation-revision source index; fragments at most 8,192 UTF-16 units without splitting surrogate pairs or adding copy line breaks. Request currently visible source spans, prioritizing active content and distributing remaining decoration slots. Preserve whole-source enumeration for fragment intersections. |
| Hidden sources | Underlined `Match in original text` opens Application text; `Match in extracted message` opens the exact Extracted message source. Preserve viewer representation and independent reading/result state. Never guess a field path or project decoded offsets into escaped JSON. |
| Geometry | Measure actual row positions after accepted layout; invalidate on retention, wrap, resize, inspection expansion, profile/representation changes and fonts. Group coincident marks in seven-pixel slots, retaining all ordered members and cycling on repeated clicks. Use the complete matching-record list. |
| Disposal/storage | Release workers on inactivity/closure, disposed target owner/frame, extension deactivation and shutdown, including idle/startup cases. Preserve temporary Find state during inactivity. Idempotently remove bindings, timers, listeners, indices, observers and animation frames; await actual exit. Retain only current immutable inputs and newest replacement, no unbounded caches or persisted log/query history. |

The standalone worker is trusted build output resolved relative to the installed
main module, read by main and passed to `Worker(..., { eval: true })`; user query
text is data. It has no DOM/host globals/runtime package dependency. Reuse the
demonstrated SDK seam and actual-frame membership safeguard; the failed
`render-frame-deleted` assumption and experimental 50 ms sweep are not production
API guarantees or selected timing budgets. No host/CSP patch is needed.

## Ordered production work

These are implementation units, not new Wayfinder decision tickets. Each unit
must leave its own checks passing before its dependents integrate.

| Unit | Depends on | Independently verifiable result |
| --- | --- | --- |
| 1. Shared occurrence/context foundation | Existing retention/session contracts | Core mapping/lookup used by inspection and viewport; explicit instance epoch and stale-log guards. Duplicate/eviction/restart tests pass before Find integration. |
| 2. Pure literal matching and protocol | Accepted matching resolution; can proceed alongside unit 1 | One matcher for exact records/provenance and bounded source ranges; all four mode combinations, Unicode and retention fixtures; validated request/reply schema and trusted worker build asset. |
| 3. Main-owned execution and renderer client | Units 1–2 | Real packed worker exercised via SDK ownership; latest-only replacement, deadline/failure state, foreign-frame rejection and actual-exit cleanup. Test startup cancellation and late termination. |
| 4. Viewer state and local input | Units 1–3 | Pure transition/intent tests and mounted Find UI implement all state traces, input/history/focus/dismissal rules and honest status. Remove old first-hit and saved-index paths. |
| 5. Presentation, inspector and geometry | Units 1–4; source-index helpers can be developed earlier | Stable text, source-safe Custom Highlights, visible interest/coverage, hidden-source links and exact inspector representation; measured grouped marks and validated top-aligned reveals integrated with following/Pause. |
| 6. Package, regression and resource integration | Units 1–5 | Existing checks stay green; packed worker loads from non-host CWD; deterministic package bytes; smoke workloads include worker/range/input churn and complete cleanup. |
| 7. Production acceptance | Unit 6 | Evidence from the integrated production package, background host checks, explicitly arranged native checks and Windows/macOS runs. Record remaining failures/unperformed checks; do not infer release acceptance from planning. |

If implementation evidence invalidates a chosen mechanism or product behavior,
stop that change and open a precise planning question under the map. Do not
silently introduce a fallback, relax exact counts/copy, or merge experiment code
as a substitute for production integration.

## Acceptance matrix

Every in-scope row in the reviewed design is mapped below. **Core** means pure
logic/state tests with controlled clocks/workers where needed. **Browser** means
the production renderer in real headless Chromium, not only the disposable demo.
**Host** means the actual packed production extension through SDK/renderer in
Freelens 1.10.3. **Native/platform** identifies checks still requiring an attended
or separate graphical session and/or Windows/macOS. A test double cannot satisfy
its later evidence layer.

| Reviewed case | Core | Browser | Host | Native/platform |
| --- | --- | --- | --- | --- |
| D01: Choose row, scroll elsewhere, start/replace | Inclusive origin/new-sequence seek | Deliberate activation vs scroll/focus restoration | Real viewer reveal from current occurrence | Keyboard row intent/focus |
| D02: Deselect while scrolled down | No-anchor starts at retained beginning | Deselect/inspector close cannot recreate anchor | First retained match, global ordinal | Real click/deselection |
| D03: First-record hit; initial Previous | First/last edge sentinels | Both direction controls | Real scroll position irrelevant | Local repeat shortcuts |
| D04: Type `upstream` progressively | Candidate preserved while matching | Input/composition does not advance on each edit | Integrated async refinement | Native editing/IME |
| D05: Next, no-match suffix, correction | Candidate survives temporary zero hits | Restores latest successful result | Out-of-order replies cannot restore another query | Keyboard navigation/editing |
| D06: Clear/retype/full replacement | New/refinement classification; shared prefix | Pre-insertion select-all/paste/cut/undo/composition | Clear during pending evaluation | Native paste/undo/IME |
| D07: Text marks; no all-row shading | Source offsets/non-overlap/coverage | Stable nodes, all visible marks within cap, distinct active/inspection/focus treatments | Custom Highlights support and exact source integration | Drag selection/copy/contrast checks |
| D08: Hidden/or decoded-only hit | OR/count-once/source provenance | Both inline underlined links, correct inspector source, wrapping | Active profile string and original-copy paths | Physical selection/clipboard |
| D09: Empty/zero/one/wrap | Count/ordinal/seek/history/status | Clear/disabled states and polite wrap feedback | No clear/zero-hit scroll | Focus and actual shortcuts |
| D10: Toggle modes; recall history | Four literal mode combinations; seven exact tuples | Pressed states/history/empty state/recall | Matching/ranges/marks share current key | Ctrl/Cmd behavior on each platform |
| D11: Clear during evaluation | Pending/deadline/replacement/stale acceptance | Editable query and no stale reveal | Actual stop/exit, explicit recovery | Responsive real editing |
| D12: Valid/foreign/multiline selection seed | Eligibility, 256-code-point limit, existing query preserved | Real text selection/provenance before focus; labels excluded | Row and all relevant inspector sources | Physical selection and clipboard isolation |
| D13: Refresh/repeats/new hits/eviction | Shared overlap, expire refs, maintenance never seeks | Unchanged nodes/selection/focus; newly gained hits wait | Real snapshot/profile/restart integration | Physical retained selection |
| D14: Deselect/close inspector while pending | Separate data vs selection/reveal validity | No reopened inspector/anchor/focus effect | Delayed current/stale success/failure | Native focus return |
| D15: Scroll/follow/resize/newest result | Intent cancellation independent of Pause/follow | Geometry/marks and explicit following preserved | Mounted LogViewport and snapshot updates | Wheel/resize/native window lifecycle |
| D16: Clear/Close/history/Escape | One-layer dismissal and history eligibility | Popover/outside-click/opener/fallback order | No host-history movement or inactive ownership | Native menus, editors, IME/AltGraph and OS focus |

D10 excludes the former regex toggle. D11 keeps cancellation/clear/deadline
coverage; invalid user patterns, zero-width regex and hostile regex are out of
scope. Do not implement those branches to satisfy the older design text.

Additional mandatory regressions expand the matrix rather than replacing it:

- Run all **13 state-resolution traces**: refinement/origin; edges/wrap;
  deliberate row focus; independent inspector/anchor; delayed completion after
  dismissal; stale success/failure keys; scroll/dismissal cancellation; duplicate
  occurrence mapping; refresh/profile maintenance; pre-edit/IME/undo; seed/history/
  Escape; observed restarts; geometry/selection/following. Core tests model each
  transition; browser/host checks exercise the corresponding real boundary.
- Match fixtures: empty/whitespace/punctuation, 16,384/16,385 units, K/kelvin,
  sigma/final sigma, sharp-s versus SS, composed/decomposed accents, astral/lone
  surrogates, supplementary word neighbors, marks/connectors and U+0345 on both
  sides. Assert exact original offsets and non-overlap across fragments.
- Retention fixtures: actual `retainSnapshot` at/under/over 1,000 records and
  5 MiB, one 5 MiB record, dense counts, duplicate sources, escaped/decoded-only
  content and late-window/late-source visible ranges. A capped/failed decoration
  reply must preserve every exact matching record, ordinal and mark member.
- Controlled stalls/clocks: pending feedback, whole-attempt timeout including
  startup, late exit, one newest replacement, no overlapping worker, stale error,
  range-interest churn and matching priority. Retry uses current data and never
  replays selection; refresh cannot restart latched failure. Confirm no history
  commitment for unfinished/error input, but valid counts can commit while
  decoration remains incomplete.
- Real lifecycle/ownership: root and cluster frames sharing webContents reject
  each other's tokens; frame removal, same-frame owner replacement, idle/active
  inactivity, viewer close, disable/uninstall, reactivation and shutdown remove
  actual workers/owners/listeners. A rejected request alone is not proof of exit.
- Rendering: full long-source selection contains no synthetic line breaks;
  unchanged source nodes survive query/refresh; caps and unavailable decoration
  give truthful incomplete feedback; later visible ranges remain reachable.
  Grouped marks retain/cycle all members, resolve current geometry and focus Find.
  Check 260/390/700/1,440 CSS-pixel widths, font readiness, layout changes and
  black/no-counter appearance. Preserve accessible names, pressed/disabled states,
  visible focus, polite coalesced status and non-color distinctions.

## Existing verification and package checks

Use the pinned `.nvmrc` Node 24.18.0 / npm 11.16.0 toolchain. Run:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
npm run package
npm run check:package
```

Preserve CI's locked dependencies, tag/version/release-note checks, supported-host
pinning, strict tarball contents, host-global module checks, two-build SHA-256
reproducibility and verified release assets. Extend build metadata/allowlists and
packed-runtime checks for the worker instead of weakening them. Load the actual
unpacked asset independently of CWD; assert its version, pure matcher behavior,
termination and absence of runtime/DOM/host dependencies. No package installation,
version bump, tag, release or PR is part of this planning session.

The primary checkout also contains in-progress `npm run test:smoke`,
`scripts/resource-smoke.mjs`, `tests/smoke/`, `docs/resource-smoke.md`, the
`react-dom` development dependency/lockfile and its CI step. They are not in
the audit baseline or this isolated planning branch. Preserve/integrate that
work before relying on the smoke command; do not silently replace the dirty
manifest/lockfile/CI with baseline copies. Run the smoke command with Chromium
available and retain its current heap/external/RSS, DOM/listener/document,
disk-footprint/settings and zero browser-storage checks. Extend its production
workloads to include real worker startup/cancellation, query/profile/window and
viewport-interest churn, closure and reactivation. Count workers/threads/owners
and assert no retained backlog, timers, highlight indices or range registries.

Headless smoke stand-ins remain distinct from an actual-host soak. In the
installed host, repeat active/idle viewer and extension lifecycles, report warm
baselines and retained growth for RAM/disk/thread/listener resources, verify
actual exit and remove owned test data/processes. Observe integrated end-to-end
matching/decoration and input responsiveness at both retention bounds; keep
startup, IPC, worker and DOM measurements separate. Do not add medians from
different harnesses or infer worst-case latency from small samples.

## Evidence limits and readiness

Existing evidence establishes feasibility and accepted direction:

- [Actual host report](https://github.com/maksimgurenko/freelens-json-logs/blob/25bc0526100024c088bfd99911f6ebbb7330da0c/docs/research/find-main-host.md): pinned loader/SDK/frame ownership and cleanup in isolated graphical runs; not the pending production package.
- [Corrected original-neighbor addendum](https://github.com/maksimgurenko/freelens-json-logs/blob/a1524f4984334390b0602a2f12f9154878d2b5b7/docs/research/find-original-neighbors-addendum.md): 49 semantic regressions and corrected headless literal matrix; all 64 tested 16,384-unit evaluations complete. The corrected matcher has not newly been installed in Freelens. The 100/1,000 ms policies are accepted operating limits, not hard real-time guarantees.
- [Accepted rendering report](https://github.com/maksimgurenko/freelens-json-logs/blob/dbf2251/docs/research/find-rendering.md): 94 original browser checks and separate appearance/hint corrections; prototype transport and timing samples do not accept production state, host rendering, clipboard or physical input. Its final desktop snapshots differed and do not prove an uninterrupted desktop interval.

All production matrix checks above remain execution gates, including packaged
Custom Highlights/source geometry and frame lifecycle, real resource/soak
behavior, physical selection/copy/clipboard and native input/window ownership.
Plan Windows/macOS runs for the same matching/worker/package, primary-modifier,
IME, selection, focus and lifecycle contracts; Linux evidence does not cover them.
Record unperformed checks as unverified and retain any resulting release limits.

Read [UI verification guidance](../agents/ui-verification.md) before host checks.
Use background CDP through `scripts/host-cdp.mjs` on workspace 7, preserving the
user's focus, workspace and pointer throughout. Do not raise windows, fake focus
or use native input to make background assertions pass. Arrange a fresh attended
session before native desktop checks, with command-scoped
`FREELENS_UI_MODE=attended`, or use a separate graphical session. No earlier
attended approval carries forward.

The maintainer confirmed that this handoff gives an implementer enough direction
without inventing new product or architectural policy, with the listed checks
remaining as execution gates. No additional in-scope decision emerged, and the
map has no remaining unspecific areas. The final ticket records this accepted
artifact and the live readiness verdict. Planning is complete; implementation,
merging disposable evidence and production release acceptance remain separate.
