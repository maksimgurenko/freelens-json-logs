# 18: Recover safely from unusable configuration

**Status:** ready-for-agent

**Blocked by:** [16: Create and save formatting profiles](16-create-and-save-formatting-profiles.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/18

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Continue viewing logs with built-in defaults when saved configuration is corrupt, unreadable or from an unsupported newer schema, and offer an explicit safe reset that preserves a backup before replacing any original data.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [live host-integration evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/7#issuecomment-6332133294). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Validate versioned saved configuration before applying it. Report corrupt/unreadable/unsupported-newer data clearly and allow built-in-default viewing without silently repairing, resetting or overwriting the original.

- [x] Prevent startup synchronization and incidental profile/preference writes from replacing preserved unusable data while in fallback mode.

- [x] Require user confirmation for an explicit reset and preserve a backup before replacement. If backup preservation fails, leave the original data unchanged and report the failure.

- [x] After successful backed-up reset, restore usable built-in defaults and normal saving without retaining stale profile/default/order references.

- [x] Document stable settings and backup identities/locations, reset steps and the separate explicit settings-removal procedure. Do not promise crash durability or transactional disk guarantees.

- [x] Support older schema versions through explicit tested migrations when such formats exist; the initial schema need not invent historical formats. Unsupported future data must never be treated as an older migratable format.

- [x] Test corrupt data, unreadable data, newer schemas, canceled reset, failed backup and successful reset, checking preservation of original bytes and inhibition of automatic overwrites. Exercise recovery against controlled extension-only data in the real host and record results.



## Implementation and verification — 2026-10-22 local / 2026-10-23 UTC

Implemented production **freelens-readable-logs 0.1.18** on the current
implementation branch. GitHub #18 is assigned to `@me`; no comments, issue
closure or external messages were sent. Local dependency #16 is done with its
committed implementation/evidence.

Each original criterion is mapped to implementation and observed evidence in
[the ticket 18 report](../../../docs/verification/18/README.md).

- **Validation and preserved fallback:** both processes inspect the extension's
  saved bytes before SDK/Conf initialization. Actual packaged-host
  [corrupt](../../../docs/verification/18/corrupt-preservation.json),
  [unsupported schema 999](../../../docs/verification/18/future-preservation.json)
  and [unreadable](../../../docs/verification/18/unreadable-preservation.json)
  cases retain real log viewing with built-in Default/Side. Startup hashes and
  [original-byte comparison](../../../docs/verification/18/unreadable-original-preserved.json)
  establish preservation, including full profiles, matching order/default,
  host migration metadata and unknown future data.
- **No incidental overwrites:** those host probes exercise disabled ordinary
  controls and direct incidental mutators/incoming sync on the actual extension
  store. Pure store tests assert no SDK start, unchanged serialized reference,
  and rejection of profile/preference/default/order writes in fallback.
- **Confirmed reset and failed backup:** inline confirmation, Cancel focus and
  byte-preserving cancellation are exercised. A real controlled `EEXIST` backup
  obstruction [fails safely](../../../docs/verification/18/corrupt-backup-failed.json),
  as does the mode-000 `EACCES` source. Neither replaces original bytes or escapes
  fallback. There is no automatic permission repair or retry.
- **Successful reset:** actual [corrupt](../../../docs/verification/18/corrupt-reset.json),
  [future](../../../docs/verification/18/future-reset.json) and
  [unreadable](../../../docs/verification/18/unreadable-reset.json) recovery each
  verifies an exclusive exact backup before replacement, clears stale
  profiles/order/default references, restores Default/Side and saves a fresh
  profile/default/Inspection without restarting or losing paused actual logs.
  [Backup byte comparisons and cleanup](../../../docs/verification/18/backup-verification-and-cleanup.json)
  retain exact evidence copies locally.
- **Documentation:** the [packaged development guide](../../../docs/local-development.md#recovering-unusable-settings)
  records stable settings/backup names and locations, confirmation, cancellation,
  failure/retry, manual restore, uninstall retention and the separate explicit
  extension-only removal procedure including backups. No crash durability or
  transactional disk guarantees are promised.
- **Migrations:** real-host [schema 1](../../../docs/verification/18/migration1.json)
  and [schema 2](../../../docs/verification/18/migration2.json) retain Inspection
  and complete existing profiles/rules/IDs/order/default as applicable. Schema 2
  introduces disabled/no-condition matching; the next normal Save writes schema 3.
  Unsupported future data is never migrated. Deterministic tests cover both.
- **Build and host gate:** Node 24.18.0/npm 11.16.0 locked install, strict
  TypeScript, **100 passing tests**, packaging/CommonJS inspection and repeated
  byte-identical tarball build all pass. The actual installed main/renderer/guide
  [hashes match](../../../docs/verification/18/installed-identity.json).
  The accepted fresh-main-window explicit uninstall/wait/single-install update
  passed Enabled/version, actual Pod-header action, correct target and real logs
  without a post-install restart. Package SHA-256:
  `c0ceaf4926465439ab8cdb678648311cf621b9da1a988f33ab6c8ebc20c6551b`.

The report retains and excludes the initial workspace-placement/focus deviations
from final acceptance; corrected unreadable and migration checks verify workspace
7 and restored prior focus. Final cleanup restores the original application
configuration and extension file inventory, removing only ticket-created test
backups after preserving evidence. No cluster resource or unrelated configuration
was modified. Freelens remains usable, paused on shared `single-json/json`.
Pre-existing setup files, runtime `.ralph` data and unrelated scratch remain
uncommitted. The runner's earlier #17 Status change is preserved.
