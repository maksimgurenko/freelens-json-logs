# 46: Navigate scrollbar match marks using measured geometry

**Status:** ready-for-agent
**Blocked by:** [43: Search from the reading row and preserve refinement position](43-search-from-the-reading-row-and-preserve-refinement-position.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/46

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Show where every matching record lies beside the log scrollbar, even with wrapped or expanded rows. Let readers jump through coincident marks without opening inspection or losing normal following and Pause behavior.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [Measured geometry and grouped-mark contract](https://github.com/maksimgurenko/freelens-json-logs/issues/38#issuecomment-6431065783), [Occurrence-based navigation and reveal contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).

## Acceptance criteria

- [x] Use the complete ordered matching-record list, independent of returned highlight ranges or decoration failure. Measure actual occurrence-row geometry after accepted layout; do not infer equal row heights or retain numeric indices as cross-snapshot identity.
- [x] Coalesce measurements and invalidate after retention/eviction, wrap, resize, inline inspection, representation/profile changes, generated presentation growth and font readiness. Resolve current occurrence and current geometry when executing a live reveal.
- [x] Group coincident positions into seven-pixel slots while retaining all members in retained order. Repeated clicks cycle every member; distinguish a group containing the active result without relying on color alone.
- [x] A mark action uses the same explicit Find-navigation event as next/previous, updates result/candidate/search position, requests the ordinary top-aligned reveal and focuses Find. It does not open inspection, choose a reading row or change Pause. History commitment follows the shared event when history is integrated.
- [x] Canceled/dismissed/superseded reveals never replay, and evicted references cannot jump to another equal-looking row. Normal viewport following, manual-scroll cancellation, retained anchors and text selection remain intact.
- [x] Dispose geometry observers, animation frames, listeners and mark state with their viewer and avoid an unbounded geometry cache. Preserve the existing black log canvas, no counters and compact presentation.
- [x] Pure and real production-browser checks cover grouped-member cycling, long/wrapped/expanded rows, fonts, resize, retention, stale geometry and current-result marks, with accessible interaction and no page overflow. Integration checks cover the final hidden-source and highlight layout from the parallel rendering ticket; packed-host evidence remains a later acceptance gate.

## Local verification evidence

Implemented on `implementation/find`, starting at/reviewed against
`7e6485536b3fec58b6c4b9f17592167b658bc74d`; claimed with
`gh issue edit 46 --add-assignee @me` before implementation. Live full #36/#37/#38/#40
and #46 authority matches cached sources. Original acceptance text above is unchanged.

- Complete ordered exact matching refs feed measured current occurrence-row geometry,
  independent of capped/failed decorations. Pure seven-pixel grouping retains every
  member; repeated actions cycle all members. Current groups expose `aria-current`
  and a bordered mark, plus native named buttons.
- Viewer-scoped Resize/Mutation observers, accepted layout updates, fonts and a
  coalesced animation frame invalidate current geometry. Mark actions share explicit
  Find navigation/history/focus and current top-aligned occurrence reveals; preserve
  reading row, inspection, Pause, following and real DOM selection.
- Bounded browser tests cover 1,000 exact members, grouped cycling, hidden/highlight
  layout, long/wrapped/expanded records, fonts, resize, synchronous growth/regrouping,
  retention/eviction, dismissed actions, selection and 260/390/700/1,440px widths.
  Teardown asserts zero retained geometry observers/frames and highlight registrations.
- Project-local Node 24.18.0/npm 11.16.0: typecheck, 11 focused tests, 244 full tests,
  six desktop guards, mounted production browser (46 grouped observations), actual
  built-worker lifecycle, adapted 40-cycle resource workloads, strict packed checks
  and two-build SHA-256 reproducibility pass. Stable package/store/config/schema and
  versioned CommonJS/worker identity remain intact.
- Independent Standards review: no findings. Independent Spec review: one click-time
  regrouping correctness finding, reproduced red and fixed; independent recheck has
  no remaining finding. Review is pinned to starting HEAD and includes staged diff.
- Preserved original `npm run test:smoke` still fails on its pre-existing Electron
  double's missing `app.on`; #47 owns integration. The separate adapted resource run
  passes with real workers and unchanged original smoke/CI/dependency files.
- Evidence, exact commands/environment, package/bundle hashes, red/green controls,
  reviews and preserved-user-file hashes: [verification report](../../../docs/verification/46/README.md).
  No host window/native/clipboard action occurred. Installed-host geometry/native
  input/IME/clipboard and Windows/macOS remain #48; this is implementation completion,
  not release acceptance. No GitHub comment/closure, push, merge, PR or release.
