# 14: Inspect and copy complete records

**Status:** ready-for-agent

**Blocked by:** [11: Open a bounded Readable logs snapshot](11-open-a-bounded-readable-logs-snapshot.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/14

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Inspect a selected record's complete data in any of the three accepted layouts, switch to Raw view, and copy either exact original representation. Keep the layout choice across host restarts without saving temporary record/Raw state.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [readable records and parsing fallbacks](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935); [live host-integration evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/7#issuecomment-6332133294). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Provide compact time/level/message rows and additional-field inspection following the accepted interactions and native Logs conventions. Keep every parsed field and original representation accessible; presentation extraction/hiding never deletes or rewrites original data.

- [x] Offer Inline expansion, Side inspector and Bottom inspector, initially Side. Switching layout preserves the selected record, and selecting a record does not silently pause updates.

- [x] Save Inspection as one global viewer preference separate from formatting profiles, using the versioned extension-owned configuration and main-owned durable writes through matching main/renderer stores. Observe the same saved choice across views and restore it after full quit/reopen.

- [x] Provide Raw view and clearly distinguished Application-text and Transport-line inspection/copy actions. Copy the retained originals rather than reconstructed JSON or reformatted timestamps.

- [x] A newly opened view starts with Raw off. Selected records and other temporary inspection state do not become saved profile configuration.

- [x] Verify clipboard round trips in actual Freelens/Electron for original spacing/indentation, blank content where applicable, Unicode, JSON escapes and precise Kubernetes timestamps. Add interaction tests for layout switching, complete-data preservation and exact copy payloads.

- [x] Record host evidence for all three layouts, Raw behavior, selected-record preservation and global layout persistence across a normal full quit/reopen.


## Implementation and verification evidence

Implemented on the current `implementation/readable-logs` branch; GitHub #14
claimed by assigning `@me`. No GitHub comments, closure, messages or disposable
worktree edits were made.

- Compact rows now select a complete record for Inline, Side or Bottom inspection;
  initial Side is a saved global preference. All fields preserves extracted and
  additional data, while Application text and Transport line use retained originals.
- Matching main/renderer `Common.Store.ExtensionStore` instances persist schema 1
  `viewer.inspection`, under stable store `freelens-readable-logs`, config
  `readable-logs`. Raw, record selection and content tabs remain temporary.
- Exact clipboard access uses Electron in the adapter. The 0.1.9 production package
  passed fourteen actual Electron clipboard round trips over real Kubernetes
  originals, including original JSON spacing, indentation, blanks, Unicode, JSON
  escapes and precise transport timestamps.
- All three rendered layouts retain the selected record. Keyboard selection and
  automatic refresh were verified together with an extension-only bounded-query
  HTTP 200; selecting does not pause. Each layout was observed on disk.
- A normal File > Quit exited every original host process. A new main PID restored
  Bottom Inspection; a fresh view reset Raw/selection/wrap and enabled timestamps
  and automatic updates. A separate target view reused the global preference.
- Clean locked install, strict TypeScript, 63 automated tests, build/pack, tarball
  inspection, host dependency externalization and byte-identical rebuild all pass.
  Installed main/renderer and packaged guide hashes match this checkout.

Evidence index: [ticket 14 verification](../../../docs/verification/14/README.md).
It maps each original checkbox to commands, actual host observations, screenshots
and executable probes. It also records failed installation attempts, the corrected
SDK metadata handling and invalid preliminary probes without claiming those runs
as passing acceptance. Successful maintenance used the accepted fresh-main,
explicit-uninstall/install procedure with process-local filesystem polling; no
post-install restart was needed. Full profiles/recovery/release gates remain with
their own tickets.

Final tarball SHA-256:
`e791cf6558da20203706e1e7bcb39df7a0718ad20c8963a90e5d2a3283ab6547`.
