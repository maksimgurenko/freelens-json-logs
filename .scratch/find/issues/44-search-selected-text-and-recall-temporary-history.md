# 44: Search selected text and recall temporary history

**Status:** ready-for-agent
**Blocked by:** [43: Search from the reading row and preserve refinement position](43-search-from-the-reading-row-and-preserve-refinement-position.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/44

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Allow a short selection of actual log text to seed empty Find, and let the reader recall the current viewer's recent searches with their matching flags. Keep queries temporary and preserve native selection, focus and dismissal behavior.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Selection, input and history contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).

## Acceptance criteria

- [x] Capture eligible selection before opening Find moves focus. Seed only an empty input from actual log text within one record or its inspector, single-line and at most 256 Unicode code points. Ignore foreign, multi-record, multiline and generated-label selections; leave an existing query unchanged.
- [x] Seeding preserves Match case and Whole words and does not choose the selected source record as a reading row. Its new query starts from the existing reading context using the same event contract as typing.
- [x] Maintain at most seven distinct exact nonempty text/two-flag tuples, MRU and memory-only per viewer/context. Commit on eligible explicit navigation or Close Find, including Escape; completed valid zero-hit queries can commit on close. Pending, composing, oversized, failed and timed-out input never commits later merely because unfinished work returns. Decoration incompleteness does not block valid history.
- [x] Recall restores text and both flags as a new query from the current reading row or retained beginning, with no historical cursor. Opening/closing Find, Profiles and temporary inactivity preserve valid history; target/observed-instance changes and teardown reset it. Nothing is persisted or shared between contexts.
- [x] The history clock provides a useful empty state, recall and Clear history. Recall closes the popover and focuses Find; Escape/outside click dismisses one layer and returns focus to the clock. Clear history leaves the current query intact.
- [x] Use the shared explicit-navigation event for history commitment so buttons, keyboard navigation and later scrollbar actions have identical eligibility. Verify tuple deduplication, capacity, valid zero hits, skipped unfinished/error queries and recall origin.
- [x] Pure tests and real-browser production-renderer checks cover reviewed D10/D12/D16 and the corresponding state traces, including actual source selection, generated-label exclusion, Unicode selection length, existing-query preservation and focus order. Preserve exact original-copy behavior; physical clipboard/native-input acceptance remains in production verification.

## Local verification evidence

Implemented on `implementation/find` from recorded pre-implementation/review
HEAD `c9656e844f5b7a22772777b4c10270c82951b291`. Claimed before work with
`gh issue edit 44 --add-assignee @me`; live issue and applicable full decisions
matched the cached authority. Original acceptance text above is preserved.

Evidence: [verification report](../../../docs/verification/44/README.md),
[review](../../../docs/verification/44/review.md),
[environment](../../../docs/verification/44/environment.json),
[prestart preservation](../../../docs/verification/44/prestart-preservation.json).

- Real source Range selection is captured before pointer focus; keyboard opening
  samples the current Range. Eligibility is one row/inspector, actual source text,
  single-line and <=256 Unicode code points. Existing query, both flags and the
  independent reading origin are preserved. Abandoned pointer capture and context
  reset regressions pass.
- At most seven exact text/two-flag tuples, MRU, per-viewer/context memory only.
  Action-time completed/current matching gates explicit navigation and Close Find,
  including the existing Escape dismissal route. Ready zero hits can commit on
  close; composing/pending/oversized/failed/timed-out/stale inputs never commit
  later because completion returned. Decoration is independent.
- Recall uses current reading context with both flags and no saved cursor.
  Find/Profiles/inactivity preserve history; observed restart/container changes
  and teardown reset it. Useful empty state, recall/Clear history and local
  one-layer outside dismissal/focus are covered; foreign host focus is preserved.
- Pinned Node 24.18.0/npm 11.16.0: typecheck, 11 focused tests, all 237 full tests,
  six desktop-policy checks, 30 production-mounted browser observations/checks,
  actual worker lifecycle, strict packed runtime checks and two-build SHA-256
  reproducibility pass. Exact package/bundle identity and commands are in the report.
- Adapted preserved resource workloads pass 40 core/main +40 renderer cycles,
  including open-popover teardown, 40 worker starts/exits and zero workers/owners/
  app listeners remaining. Original pre-existing `test:smoke` still fails at its
  old Electron double's missing `app.on`; this known #42/#43 baseline remains
  explicitly failed, with integration owned by #47. Original smoke/CI/dependencies
  and unrelated dirty files are hash-preserved and unstaged.
- Background headless Chromium only; no installed-host/native-window/input/pointer
  action, clipboard write, fake focus or UI-guard bypass. Unfocused real-browser
  Escape remains host-owned; pure dismissal ordering and DOM focus evidence do
  not establish native delivery. Physical input/clipboard, Windows/macOS and
  installed-production/release acceptance remain #48. No release acceptance,
  issue comment/closure, push, merge, PR or release is claimed.
