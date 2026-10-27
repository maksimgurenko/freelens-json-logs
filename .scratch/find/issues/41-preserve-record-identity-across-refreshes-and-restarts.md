# 41: Preserve record identity across refreshes and restarts

**Status:** done
**Blocked by:** None (can start immediately)
**GitHub:** https://github.com/maksimgurenko/freelens-json-logs/issues/41

## Parent

Part of [Map: Find technical implementation plan](https://github.com/maksimgurenko/freelens-json-logs/issues/33).

## What to build

Keep inspection, the reading row, Find and the viewport attached to the same observed record occurrence as snapshots change. Expire references that leave the recent log window, and reset the Find context when an observed container instance changes. This is the prerequisite prefactoring for the new Find behavior.

Follow the [accepted literal Find implementation and acceptance plan](https://github.com/maksimgurenko/freelens-json-logs/blob/d02b7e7c19c8e48b1cde714f0a23813b40374824/docs/design/find-implementation-plan.md). Literal-only scope and its appearance corrections take precedence over the earlier design draft; retain the existing black canvas and absence of line counters.

Canonical decisions for this slice: [State and occurrence contract](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).

## Acceptance criteria

- [x] One context-qualified occurrence mapping and lookup is used by inspection, Find, reading state, rendered row identity and viewport anchoring. Use the longest exact old-suffix/new-prefix transport-line overlap without merging or deduplicating records.
- [x] The transition [start, x, end] to [x, end, x] keeps the old x at the first new position for every consumer. Eviction and zero overlap expire references; neither equal text nor a saved row index can redirect an expired reference. Identical complete windows retain observed identities without claiming unseen identical additions.
- [x] Publish a monotonic observed-instance epoch before accepting replacement data. Selected-container changes, unequal known restart counts and differing known container IDs invalidate the prior context, including while paused. First-known or missing metadata is not a restart; count-then-ID arrival does not reset twice.
- [x] Observed context changes clear temporary Find query, flags, history, origins, candidate/result and pending intents as those states become available. Stale log or Find completions cannot alter the newer instance. Pod UID replacement remains a terminal/outdated old target and requires a fresh viewer.
- [x] Keep existing parsing, retention limits, snapshot acquisition, manual profile choice, explicit Pause, normal following and exact original-copy behavior.
- [x] Add meaningful pure/session and mounted-renderer regressions for duplicate mapping, retained inspection/viewport position, eviction, repeated restarts, paused restarts and stale completions, covering the relevant accepted state traces. Existing checks remain green.

## Blocked by

None (can start immediately).

## Local verification evidence

Implemented and verified locally on `implementation/find` from recorded pre-implementation
HEAD `c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528`. GitHub #41 was claimed before implementation;
no GitHub comments/closure or publication performed.

Full criterion-by-criterion evidence, exact reproduction commands, environment, package identity,
resource measurements and limitations: [verification report](../../../docs/verification/41/README.md).

- Shared occurrence mapping and lookup: `src/core/occurrences.ts`; session owns one immutable
  map, consumed by inspection, current Find cursor/reveal, stable React row keys and viewport.
  The public reference seam is also the required basis for the later independent reading state.
- Duplicate/eviction/context regressions: `tests/occurrences.test.ts`, inspection/navigation/viewport
  tests, and the real mounted production renderer in `tests/find-identity-browser.jsx`.
  Retained row DOM focus and browser selection survive duplicate/identical replacement;
  equal text never revives expired references. `browser-red.txt` retains the reproduced original bug.
- Epoch/restarts/staleness: `tests/lifecycle.test.ts` plus browser checks cover repeated and paused
  same-container restarts, missing/first-known metadata, count-then-ID, known differing IDs,
  publication before replacement reads, old-instance successes/failures and terminal Pod UID changes.
  Existing temporary query/result/inspection/reveal reset at the context boundary. Flags/history,
  independent reading/origin/candidate state and async Find completion do not yet exist; their
  implementation/reset tests remain in the dependent tickets rather than being claimed here.
- Pinned Node 24.18.0/npm 11.16.0 locked install and typecheck passed; full unit/state suite
  **115/115**, desktop-policy suite **6/6**, mounted-browser **9 grouped checks** with no errors.
- Existing resource smoke passed **40 core/main + 40 mounted-renderer cycles** with bounded
  memory/disk and no DOM/listener/document growth or persisted browser storage.
- Strict package check and two-build reproducibility passed for `freelens-readable-logs@0.1.34`:
  SHA-256 `f23d1a7738cc0cd9a9377a11174e9ae0a70dd520723f2c3356f4c1732f8891ea`.
  Package/store `freelens-readable-logs`, config/page `readable-logs`, schema 3 and host 1.10.3
  remain unchanged. Built against the preserved dirty working inputs, not a clean release checkout.
- Independent code-review axes: **0 remaining Standards/Spec findings**; one review-source
  documentation correction was applied. Spec reviewer reran **44/44** focused tests.
  See [review](../../../docs/verification/41/review.md).
- Prestart tracked dirty files retain their exact original hashes and are excluded from this
  ticket commit. Existing untracked resources/design/Ralph/scratch work is preserved.
- Unverified downstream gates: packed-host/native/physical clipboard/IME, installed-host soak,
  Windows/macOS and future worker execution/packaging. No desktop focus/pointer/window or
  clipboard operations were used. These limitations do not imply complete Find/release acceptance.
