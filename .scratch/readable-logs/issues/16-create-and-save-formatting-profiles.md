# 16: Create and save formatting profiles

**Status:** done

**Blocked by:** [11: Open a bounded Readable logs snapshot](11-open-a-bounded-readable-logs-snapshot.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/16

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Create independent named formatting profiles in Freelens, preview edits against sample logs, save valid changes, and select them manually or as the global default. Saved profiles persist; draft editing and reformatting never fetch new logs or alter original records.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [readable records and parsing fallbacks](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935); [live host-integration evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/7#issuecomment-6332133294). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Keep built-in Default read-only and available as the recovery/global fallback. Allow independent duplication, editing, rename and delete; enforce nonempty unique names with Default reserved. Use stable identities so renaming preserves references and order.

- [x] Provide ordinary staged controls and sample preview, without requiring JSON editing. Save applies only a valid draft; Cancel discards it. Specific validation errors block Save and leave the saved profile active. Preview samples and unfinished drafts do not persist.

- [x] Support ordered exact slash-path candidates, escaped slash/tilde segments and zero-based array indexes. Dots are literal key characters; there is no recursive/wildcard search. Configured lists replace defaults; missing well-formed paths and empty lists follow the authoritative fallback rules.

- [x] Support ordered inline and hidden fields with hidden precedence, including descendants inside inline objects. Do not repeat extracted leaves or hide extracted message/time/level; preserve unconsumed siblings, complete objects and both exact originals.

- [x] Support explicit unset/seconds/milliseconds numeric timestamp interpretation and explicit numeric/textual severity mappings. Keep numeric and textual sources distinct, compare textual mapping keys case-insensitively, and apply explicit mappings before built-in normalization without guessing numeric meanings.

- [x] Offer manual selection and Auto plus a global-default choice. Manual selection belongs only to the current cluster/identified Pod/container view and clears on Auto, context change, close or restart. Deleting a manual selection returns the affected view to Auto; deleting the global default restores built-in Default.

- [x] Persist saved profiles, stable identities and global-default choice in the single versioned extension-owned configuration using matching main/renderer stores with main-owned writes. Cooperate with saved viewer preferences and preserve the documented package/store identity.

- [x] Save or selection changes reformat retained records immediately without a log request, preserving originals and notifying formatting-dependent viewer behavior such as Find. Editing one profile never changes an independent duplicate.

- [x] Automated fixtures cover the authoritative field-path, fallback, hidden/inline, numeric interpretation, validation, Save/Cancel, rename/delete/default/manual and preservation cases. Demonstrate the editor/manual selection and real profiles surviving full host quit/reopen; automatic target matching is delivered separately.

- [x] Keep import/export, custom row templates and executable user code outside this release.


## Implementation and verification — 2026-10-22 local / 2026-10-23 UTC

Implemented in production **freelens-readable-logs 0.1.15** on the current
implementation branch. GitHub #16 was assigned to `@me` before work; no GitHub
comments, issue closure or external messages were sent. Operator commit
`3f374a0` is preserved.

Each checked original criterion is mapped individually to code and observed
evidence in [the ticket 16 verification report](../../../docs/verification/16/README.md).

- Read-only Default, independent duplicates, unique/reserved names and stable-ID
  rename/delete: [automated fixtures](../../../tests/profiles.test.ts),
  [actual editor](../../../docs/verification/16/editor.json) and
  [global/manual deletion fallback](../../../docs/verification/16/profile-cleanup.json).
- Ordinary draft controls, specific errors, preview, Save/Cancel and no draft/sample
  persistence: [editor assertions](../../../docs/verification/16/editor.json),
  [editor](../../../docs/verification/16/editor.png),
  [validation](../../../docs/verification/16/validation.png) and
  [restart reset](../../../docs/verification/16/after-restart.json).
- Exact ordered paths, escaping/indexes, configured-list replacement and fallback:
  all accepted cases in `tests/profiles.test.ts`; actual saved `/event/text`,
  `/a~1b`, `/a~0b`, `/items/0/code` rules appear in `editor.json`.
- Ordered inline/hidden fields and unmodified complete/original data: pure
  fixtures and [active Save/inspection](../../../docs/verification/16/active-save.json).
- Explicit numeric units and distinct numeric/text severity sources: pure fixtures
  and two complete host profiles with seconds/milliseconds and number/text `30`
  mappings, producing real INFO/WARN rows.
- Manual/Auto/global default and context clearing: editor/deletion checks,
  [real container changes](../../../docs/verification/16/context-reset.json),
  [close/reopen](../../../docs/verification/16/reopen-view.json) and normal restart.
- Matching main/renderer stores preserve stable identities in schema 2 alongside
  Bottom Inspection, with explicit tested schema-1 migration.
  [Accepted explicit update](../../../docs/verification/16/update-configuration-preserved.json)
  and [full normal quit/reopen](../../../docs/verification/16/after-restart.json)
  preserve complete real configuration.
- Local reformatting/selection/Save makes **zero observed extension log requests**
  in `editor.json` and `active-save.json`, while both exact originals remain
  equal. Find uses the active formatter and recomputes; decoded-message-only
  matching is covered by automated fixtures and original-text matching by the UI.
- Node **24.18.0** / npm **11.16.0** locked install, strict TypeScript, **85 passing
  tests**, package inspection/CommonJS loading and reproducible build pass.
  [Installed bundle hashes](../../../docs/verification/16/installed-identity.json)
  match the checkout. Final package SHA-256:
  `d349429ce818f178598d34e335b48293b63113fff36e3882a5317d09c6a3722c`.
- No import/export, custom row templates, executable user code or target-matching
  implementation was added. Matching remains #17; backed-up reset remains #18;
  the full release/performance gate remains #19.

All final functional, update and normal-restart acceptance uses actual Freelens
**1.10.3** and the packaged **0.1.15** extension. The accepted fresh-main-window,
explicit uninstall/wait/single-install procedure needed no post-install restart.
Process-local polling/TMPDIR was retained; no host internals or global agent
configuration changed. Failed preliminary probes are preserved and explained in
the report, not counted as passes. The independent UI review's sole contrast
fix is resolved at **16.18:1**, with its scoped **ship** verdict recorded.

Native operations ran on workspace **7**, silently launched/restored and immediately
restored the user's prior workspace/focus. The owned fixture namespace and only
ticket-created profiles were removed; shared fixture UIDs/restart counts are
unchanged. Final host is paused on shared `single-json/json`, Auto/Default,
Bottom inspection, with no instrumentation and normal temporary defaults.
Pre-existing `.gitignore`, `ralph`, `docs/ralph.md` and runtime `.ralph` data remain
uncommitted. No criterion is deferred from this ticket.
