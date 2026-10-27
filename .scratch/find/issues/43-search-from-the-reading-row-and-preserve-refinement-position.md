# 43: Search from the reading row and preserve refinement position

**Status:** ready-for-agent
**Blocked by:** [42: Run literal Find through owned, cancellable workers](42-run-literal-find-through-owned-cancellable-workers.md)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/43

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Make Find continue from the record the reader deliberately chose, retain a still-matching result while the query is refined, and navigate without stale jumps. Preserve native editing and distinguish Clear, Close Find, inspection and ordinary viewport following.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [State, input and reveal contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921), [Matching status and recovery contract](https://github.com/maksimgurenko/freelens-json-logs/issues/36#issuecomment-6429176710).

## Acceptance criteria

- [x] Keep reading row, inspection, active Find result, refinement candidate, search position and browser selection independent. Only deliberate existing row activation/keyboard focus establishes a reading row; hover, scrolling, programmatic focus return and Find reveals do not. Add no new row-navigation scheme.
- [x] A new nonempty query starts inclusively from the chosen reading row, otherwise the beginning of all retained logs regardless of scroll. Whole-input replacement uses pre-insertion selection, including shared-prefix replacements; partial edits and mode toggles refine. Clearing/cutting to empty ends the edit sequence.
- [x] Refinement retains a matching candidate and preserves the last successful candidate/position through temporary zero hits. If it no longer matches, seek from the latest surviving search position. Explicit next/previous is strict from an active result and inclusive from a new reading row; otherwise start at the first/last match. Report wrap and one-hit feedback.
- [x] Current matching data may update without granting selection or scroll permission. Use separately live selection/reveal intents, resolve the occurrence and geometry when executing a reveal and discard obsolete successes/failures. Manual scrolling, dismissal, Profiles, inactivity and context changes cancel affected intents without replay on return.
- [x] Refresh and profile maintenance retain only surviving still-matching results, update counts without choosing replacements and wait for explicit navigation when a zero-hit query gains matches. Presentation changes preserve search identity. Search never fetches, pauses or resumes logs or introduces a special follow lock.
- [x] Deselecting/closing inspection clears only the reading anchor belonging to that occurrence, preserves independent valid anchors/results and restores focus without recreating an anchor. Pending matching cannot reopen inspection, resurrect a deselected origin or perform an old scroll.
- [x] Preserve native caret, selection, paste and Undo/Redo. Capture whole-input replacement before composition, evaluate once on committed composition and guard duplicate/late composition completion. Composition Enter never navigates; Undo/Redo refines except when crossing an empty value.
- [x] Clear keeps Find open/focused, inspection, reading row, scroll, flags and history while removing query/results/decorations/intents. Close retains temporary valid query/flags/results, cancels pending reveals and restores the opener with local fallback. Existing transient/Find/inspection dismissal order, local exact-modifier shortcuts and IME/AltGraph/foreign-editor/inactive-view guards remain intact.
- [x] Provide the compact on-demand Find bar, native up/down icons, accessible names/pressed/disabled states, visible focus and polite coalesced count/status feedback. Preserve the black canvas, absence of line counters and separation from the main toolbar.
- [x] Exercise the relevant accepted state traces and reviewed D01-D06, D09-D11 and D13-D16 cases through pure transition tests and the real mounted production renderer, including out-of-order completion, selection/focus restoration and following/Pause regressions. Existing checks remain green.

## Local verification evidence

Implemented on `implementation/find` from recorded pre-implementation/review HEAD
`62e309c57f359486083058ab032db09d46a7ff62`. Claimed before implementation with
`gh issue edit 43 --add-assignee @me`; live #43 and full #36/#37/#38/#40
comments match the cached authority. No issue comment/closure or publication.

Criterion-by-criterion evidence, commands, environment/package identity, red
controls, resource measurements and limits: [verification report](../../../docs/verification/43/README.md).

- Pure `FindPosition` separates reading row, result, candidate, position and live
  selection/reveal permissions. Pure `FindEditing` classifies native pre-insertion
  replacement, partial edits, Undo/Redo and one composition transaction.
- Mounted **production** CommonJS renderer with actual built main/worker bridge:
  **23 grouped checks**, zero browser errors, one worker start/exit, none retained.
  Includes inclusive reading origin, strict/inclusive navigation, refinement/typo
  correction, identical/shared-prefix replacement, partial paste/cut/Undo/Redo
  transaction classification, caret/focus/selection retention, pending deselection,
  manual-scroll cancellation, profiles/presentation/maintenance and restart checks.
- Pinned Node 24.18.0/npm 11.16.0 locked install and typecheck pass. **15/15** focused
  tests, **233/233** full tests and **6/6** desktop-policy tests pass. Native focus
  delivery is not inferred from synthetic DOM focus/input events.
- Actual built worker/scheduler: 20 cycles, 441 requests, 41 actual starts/exits,
  peak one, zero live. Strict tarball/CommonJS/packed-worker and final two-build
  reproducibility checks pass for `freelens-readable-logs@0.1.34`; identities,
  schema 3, host 1.10.3 and package allowlists remain unchanged.
- Preserved resource workloads pass through the existing disposable adapter:
  **40 core/main + 40 renderer cycles**, 40 worker starts/exits, no retained
  worker/owner/app listeners, bounded memory/DOM/disk and zero browser storage.
  Original unintegrated `test:smoke` remains failed at its old Electron double's
  missing `app.on`, as recorded in #42; #47 owns integrating those preserved files.
- Independent [Standards/Spec review](../../../docs/verification/43/review.md):
  zero unresolved findings. One naming judgment and identical-text full-replacement
  defect were fixed with pure and mounted red/green evidence.
- Original dirty file hashes are unchanged. Runtime/unrelated untracked work is
  excluded; only runner-written #42 Status may accompany this related commit.
- Unverified downstream gates: installed-host acceptance of this new renderer,
  physical/native editing/IME/focus/selection/clipboard, Windows/macOS and release
  acceptance. No desktop activation, pointer/native input or system clipboard
  operations, `document.hasFocus` override or shared-guard bypass were used.
  #44 history/seeding, #45 decorations/hidden actions, #46 marks, #47 integration
  and #48 final acceptance remain separate tickets.
