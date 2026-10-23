# 15: Navigate changing logs with scrolling and Find

**Status:** ready-for-agent

**Blocked by:** [12: Refresh, pause, and recover from request failures](12-refresh-pause-and-recover-from-request-failures.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/15

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Scan a changing recent log window using familiar scrolling, bottom following and Find navigation, without silently losing position or filtering rows. Keep display toggles and the search query temporary to the current view.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Follow new output when already at the bottom. When scrolled away, preserve a surviving visible anchor across snapshot replacement, including repeated identical records; visibly indicate when that anchor has left the bounded window and provide To bottom.

- [x] Use case-insensitive literal substring matching against exact application text or extracted message, excluding the Kubernetes timestamp prefix. Use precisely the same predicate for match counts and navigation, counting each matching record once.

- [x] Previous/Next wrap through matching records without filtering rows. Original application-text fields remain searchable even when hidden from compact presentation; provide neither regex nor a case toggle.

- [x] Recompute matches when the accepted window or active formatting changes, and handle an empty query/no matches without incorrect counts or navigation.

- [x] Provide timestamps and word-wrap controls. Newly opened views start with timestamps on, word wrap off and an empty Find query; these controls/query do not persist as global preferences or profile properties.

- [x] Keep scroll and Find behavior compatible with Pause, one-off paused Refresh and later profile reformatting without triggering extra log requests.

- [x] Add meaningful interaction tests for bottom following, preserved/lost anchors, repeated records, wrapping navigation, counter consistency, decoded-message matching, exclusion of transport-only timestamp text, and view-state reset. Compare packaged behavior with the accepted walkthrough and real native Logs workflow.



## Implementation and verification evidence

Implemented GitHub #15 on `implementation/readable-logs` as production package
`freelens-readable-logs@0.1.12`. Claimed GitHub #15 by assigning `@me` before work;
GitHub remains open without comments. The local #12 dependency is done with
committed evidence. No other ticket was implemented and no prototype worktree
was modified or merged. The runner owns the Status update.

Full commands, artifacts, defects found, observed outcomes and limitations:
[Ticket 15 verification](../../../docs/verification/15/README.md).

Original acceptance criteria, in order:

1. `LogViewport` captures the first visible row and pixel offset; exact ordered
   overlap maps the surviving occurrence across bounded snapshot replacement.
   `scroll.json` observes real bottom following, repeated application records,
   an anchor shifting 150 to 110 after tail eviction with <0.3px offset change,
   lost-anchor notice, To bottom and later automatic following. Viewport tests
   separately cover repeated exact transport lines and synchronous React renders.
2. `findMatches` supplies a single case-insensitive literal predicate for count
   and navigation over exact application text or the active extracted message,
   once per matching record. `find.json` observes decoded Unicode, hidden original
   fields, literal punctuation and exclusion of a real Kubernetes timestamp.
3. Packaged Previous/Next wrap through indexes 29/30, Enter/Shift+Enter navigate,
   and all 180 rows remain present. Hidden fields remain searchable; no regex or
   case toggle exists. `native-check.json` exercises real native Logs search and
   arrows beside the extension, with six results in each and no row filtering.
4. `scroll.json` observes hidden-field matches recomputed from 238 to 1,000 after
   an accepted paused Refresh. `find.json` covers empty/no matches. Unit fixtures
   change the extracted message while retaining originals; presentation and Find
   share the same formatted-record input. Live saved-profile switching is later
   ticket work, not claimed here.
5. Timestamps/wrap controls remain temporary. `reset-before.json` records query,
   timestamps off, wrap/Raw on and byte-identical saved settings; `reset-after.json`
   records a reopened actual view with empty Find, timestamps on, wrap/Raw off,
   no selection and automatic mode. No new global/profile settings were added.
6. Scoped real Node HTTP observation records zero extension log requests during
   paused Find/navigation/Raw/timestamp/wrap operations. Each paused Refresh in
   `run-scroll.mjs` asserts exactly one real read and continued Pause. Local
   formatting/navigation logic has no host/request dependency.
7. Node 24.18.0/npm 11.16.0 clean locked installation, strict TypeScript, all
   **72 tests**, package/tarball checks and reproducible rebuild pass. The actual
   installed 0.1.12 main/renderer hashes match checkout; the accepted single-install
   maintenance path ran under main PID 2365693 with no post-install restart.
   Actual native comparison screenshots and probes pass; independent finish review
   reports `ship`. The initial stale version label, synchronous scroll bug and
   failed probe selectors are recorded separately from final passing evidence.

Final package SHA-256:
`915ad8041753829218e3177abd074cb30b4741d95e2b059787b612fbaacfe9bd`.

Owned fixture namespace was removed; shared Pod UIDs/restarts, original native
logs tabs, desktop workspace/focus, settings and unrelated state were preserved.
Transport observation wrappers were removed. The installed viewer is left paused
on the shared single-json fixture. This ticket does not claim profile-editor or
full-release performance acceptance.
