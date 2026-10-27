# 45: Highlight matches and inspect hidden match sources

**Status:** ready-for-agent
**Blocked by:** [43: Search from the reading row and preserve refinement position](43-search-from-the-reading-row-and-preserve-refinement-position.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/45

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Mark matching text without changing the log content or disrupting selection. When a hit is hidden by the current representation, offer a truthful inline link that opens the exact original or extracted source while preserving the independent reading row and Find result.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Accepted rendering and hidden-source contract](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783), [Shared matcher and range contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710), [Independent inspection and Find state](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).

## Acceptance criteria

- [x] Use CSS Custom Highlights/native Ranges over stable occurrence-keyed source nodes and a presentation-revision source index. Query/refresh updates do not replace unchanged source text. Preserve complete long-record text using fragments at most 8,192 UTF-16 units without splitting surrogate pairs, adding synthetic copy line breaks or paginating records.
- [x] Use the shared matcher's original-source offsets and provenance, never a second presentation predicate, decoded offsets projected into JSON, guessed field paths or log HTML. Visible matching text is marked without shading every matching row; active Find, inspection, keyboard focus and browser selection remain distinguishable.
- [x] Request current visible source spans, prioritizing visible active content and distributing remaining decoration slots. Cap enumeration/allocation at 4,096 ranges per reply and 1,024 DOM highlight ranges shared by viewport and inspector. Preserve whole-source non-overlap across fragments and report incomplete coverage. Late visible hits request their own ranges rather than being limited to a global initial sample.
- [x] Decoration pending/failure or caps leave exact counts, ordinals, navigation, history eligibility and full mark membership valid. Expose useful incomplete-highlight feedback and explicit recovery without enumerating every offscreen range or retaining an unbounded source/range cache.
- [x] Underlined clickable Match in original text opens Application text; Match in extracted message opens an explicit Extracted message representation containing the exact active extracted string. Place hints beside the message where possible and wrap below when needed. Preserve Raw/Readable, independent reading/active-result state and exact Application text/Transport line copy.
- [x] Keep generated hints, field badges and status labels outside selected/copied log text. Selection seeding uses actual source provenance across all inspector representations. Retained real DOM selections and focus survive query/highlight and unchanged-snapshot updates.
- [x] Invalidate source/range interest on relevant presentation changes and dispose indices, highlight registrations, listeners and pending work with their owner. Preserve the pitch-black canvas, no line counters, separate compact Find bar, accessibility and ordinary following/Pause.
- [x] Production-renderer browser tests cover reviewed D07/D08/D12/D13, actual retained-window limits, one 5 MiB source, dense/late visible ranges, escaped/decoded-only and Unicode fragment cases, full-source selection and 260/390/700/1,440 CSS-pixel widths. Experimental rendering evidence does not substitute for later packed-host Custom Highlights or physical clipboard checks.

## Local verification evidence

Implemented and verified on `implementation/find`, with review pinned to pre-implementation HEAD `02c4dbd9539ad70943604b28ea843a9102dfa0ef`.

- Full criterion mapping, exact reproduction commands, environment, package identity, development controls and limits: [ticket 45 verification](../../../docs/verification/45/README.md).
- Project-local Node 24.18.0 / npm 11.16.0: locked install, typecheck, 98 focused tests, all 242 tests and six desktop guard tests pass.
- Mounted production main/renderer + actual worker: 40 grouped observations, zero browser errors, shared 1,024 DOM cap, dense/late ranges, exact retained-window bounds and full 5 MiB selection, Unicode fragments, hidden sources, All fields source provenance, selection/focus stability, four widths, following/Pause and prior state/history regressions. Six worker starts/exits, peak one, zero remaining; Custom Highlight registrations disposed.
- Actual built-worker check: 20 cycles, 441 requests, 41 starts/exits, peak one, zero remaining. Final adapted resource smoke: 40 core/main and 40 renderer cycles, bounded retained resources, 40 starts/exits, no worker/owner/app listener leaks or browser storage.
- Strict packed CommonJS/worker checks and two-build byte reproducibility pass. Package/store `freelens-readable-logs@0.1.34`, host pin 1.10.3, configuration/page `readable-logs`, schema 3 preserved. Tarball SHA-256 `eb7634a6b3f81f75813c106f25495f3560c075b2116f9c73dd8acbc6ddf3c56c`.
- Independent Standards/Spec reviews completed; all findings fixed and independently rechecked. Pretty All fields validates complete selections against actual sources, including across presentation fragments, while preserving genuine original and extracted-message selections.
- Original pre-existing `npm run test:smoke` remains failing due to its old Electron double lacking `app.on`; its source inputs remain preserved for deliberate integration in #47. The adapted disposable workload passes and is reported separately.
- No installed-host/native/clipboard or Windows/macOS acceptance claimed; those remain #48. No native focus/window/pointer/input changes, fake focus or guard bypass. User prestart inputs retain all recorded hashes; unrelated work is excluded. No comments/closure, push, merge, PR or release.

The ticket implementation, satisfied original checkboxes and evidence are committed together; the Ralph done report records the resulting commit hash.
