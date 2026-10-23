# 17: Select formatting profiles automatically

**Status:** ready-for-agent

**Blocked by:** [16: Create and save formatting profiles](16-create-and-save-formatting-profiles.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/17

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Automatically use the appropriate saved formatting profile for a container, while making the precedence of manual choice, matching order and global default predictable and editable.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Allow saved exact namespace, Pod-label key/value and container-name conditions, an enabled-for-matching state and user-controlled matching order through ordinary controls.

- [x] All configured conditions are conjunctive and case-sensitive, including label keys/values. Missing required labels fail; omitted conditions impose no restriction. Exclude regex, wildcards, Pod-name and cluster conditions.

- [x] Choose the current manual profile first; otherwise choose the first enabled profile with configured conditions that all match; otherwise choose the global default. A conditionless profile never auto-matches.

- [x] Disabling matching does not prevent manual or global-default selection. Global-default status does not change matching order, and renaming preserves identity/order/references.

- [x] Reevaluate against the current target and saved selection settings. Clearing manual choice, deleting a selected/default profile, or changing target follows the authoritative Auto/fallback rules; show the resulting active profile and reformat retained records without fetching logs.

- [x] Persist conditions, enabled states, matching order and global-default selection alongside formatting profiles and saved viewer preferences across normal full quit/reopen.

- [x] Add deterministic tests for exact conjunctions, missing labels, ordering, conditionless/disabled profiles, manual/matching/default precedence, rename/delete and context resets. Demonstrate different target conditions and saved ordering in the packaged host, including reformatting with no additional log request.


## Implementation and verification — 2026-10-22 local / 2026-10-23 UTC

Implemented production **freelens-readable-logs 0.1.17** on the current
implementation branch. [GitHub claim](../../../docs/verification/17/claim.json)
confirms assignment to `@me`; no comments, closure or external messages were sent.

Each checked original criterion is mapped to implementation and observed evidence
in [the ticket 17 report](../../../docs/verification/17/README.md).

- Ordinary staged exact namespace/container and repeatable Pod-label controls,
  enabled state and immediate saved matching order: [final editor assertions](../../../docs/verification/17/final-editor.json),
  [editor screenshot](../../../docs/verification/17/editor.png) and
  [label controls](../../../docs/verification/17/matching.png).
- Exact conjunction, missing/case-sensitive keys and values, omitted conditions:
  [deterministic fixtures](../../../tests/matching.test.ts), actual
  [label value case](../../../docs/verification/17/final-label-value-case.json),
  [key case](../../../docs/verification/17/final-label-key-case.json),
  [missing required label](../../../docs/verification/17/final-label-missing.json),
  and [broader conditions](../../../docs/verification/17/final-manual-and-enable.json).
  Each negative label case follows a positively observed match, avoiding stale
  metadata assumptions. No regex/wildcard/Pod-name/cluster matching is exposed.
- Manual > first enabled conditional match in user order > global default:
  final editor proves precedence, enabled conditionless exclusion, disabled manual
  use, Auto clearing, reorder and stable-ID rename/global references.
  [Container checks](../../../docs/verification/17/final-container-reset.json)
  prove a disabled profile remains selectable as global default.
- Reevaluate on actual target/settings/observed metadata changes:
  [second namespace/Pod](../../../docs/verification/17/final-other-acceptance.json),
  container checks and [deletion fallbacks](../../../docs/verification/17/profile-cleanup.json).
  Auto label and active profile show the resulting formatter. Editor, ordering,
  matching, manual and deletion actions make **zero observed additional log
  requests** while paused and retain both exact originals. Metadata observations
  are not instantaneous notifications.
- Schema **3** persists conditions/enabled state, profile array order, stable IDs,
  global default and Bottom Inspection using matching main/renderer stores with
  main-owned writes. Explicit tested schema 1/2 migrations retain older valid
  configuration. [Complete configuration before Quit](../../../docs/verification/17/prepare-restart.json)
  equals [after normal full quit/reopen](../../../docs/verification/17/final-after-restart.json);
  all original processes exited and a new main PID started. Manual and unfinished
  matching draft reset. [Explicit uninstall/install update](../../../docs/verification/17/update-preserved.json)
  also preserves real matching settings.
- Node **24.18.0** / npm **11.16.0**, locked installation, strict TypeScript,
  **93 passing tests**, package inspection/CommonJS loading, identical rebuilt
  tarball and [installed file hashes](../../../docs/verification/17/installed-identity.json)
  pass. Final package SHA-256:
  `6ee6a140e204cae8a250db845ca43a28373de62df646529a160393eb98627c13`.

All final functional and restart checks use actual Freelens **1.10.3** with the
packaged **0.1.17** extension. The final update uses fresh-main-window maintenance,
explicit uninstall/wait/single-install, process-local polling/TMPDIR and no
post-install restart to obtain installation acceptance. Earlier `.16` host-probe
failures and their corrected observations remain recorded separately; none counts
as acceptance. The scoped independent UI review returned **ship**, no material
fixes; its design record and final captures are in the report.

Only ticket-created profiles and the two owned fixture namespaces were removed.
Shared fixture UIDs/restart counts remain unchanged. Final host is paused on
shared `single-json/json`, Auto/Default, Bottom Inspection, with no instrumentation.
Freelens stays on workspace **7** and native operations restore prior workspace/focus.
Pre-existing `.gitignore`, `ralph`, `docs/ralph.md`, unrelated scratch files and
runtime `.ralph` data remain uncommitted. The runner's prior ticket 16 Status
change is retained. No ticket 17 criterion is deferred.
