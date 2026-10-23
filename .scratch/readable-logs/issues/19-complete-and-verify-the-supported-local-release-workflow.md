# 19: Complete and verify the supported local release workflow

**Status:** ready-for-agent

**Blocked by:** [13: Handle container and Pod lifecycle changes](13-handle-container-and-pod-lifecycle-changes.md), [14: Inspect and copy complete records](14-inspect-and-copy-complete-records.md), [15: Navigate changing logs with scrolling and Find](15-navigate-changing-logs-with-scrolling-and-find.md), [17: Select formatting profiles automatically](17-select-formatting-profiles-automatically.md), [18: Recover safely from unusable configuration](18-recover-safely-from-unusable-configuration.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/19

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Install and maintain the completed first release reliably on the maintainer's Freelens 1.10.3 environment, with real profiles/preferences preserved through updates and recorded production acceptance evidence. This ticket completes the local release workflow and resolves any integration defects found by the accepted gates; it is not public distribution.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [accepted local maintenance procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [readable records and parsing fallbacks](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [ ] From a clean checkout, run the documented locked dependency install, type-check, tests, build and packaging commands; inspect the installable tarball and run that actual package. Record exact commands/results, runtime/package-manager versions and the production package revision.

- [ ] Use Extensions from a fresh main window before opening any cluster. If a cluster was opened, fully quit/reopen once before maintenance. For updates explicitly uninstall the old package, wait for removal, then install the new tarball once; require no post-install restart, overwrite/reinstall prompt or silent repeated attempt.

- [ ] After installation/update, verify actual packaged version, Enabled state, Pod-details header action beside native Logs, correct cluster/namespace/Pod UID/container navigation and usable logs. Enabled alone is insufficient.

- [ ] Verify complete real profiles, global-default/matching order/enabled states and global inspection layout across full quit/reopen and explicit uninstall/install update. Verify agreed temporary-state resets and supported schema migrations when relevant; do not substitute a string marker for configuration evidence.

- [ ] Verify disable/uninstall removes the extension's contributions, invalidates pending work and retains its settings. Document and exercise explicit settings removal affecting only this extension, including its documented backup handling.

- [ ] Run the accepted real-host matrix for container switches, hide/minimize/leave/reopen, observed restart, deletion/replacement, empty/malformed/oversized output, an actual access-denied response and a transient failure. Verify outdated retained records, stopped automatic refresh, explicit recovery and no stale target exposure. An invalid-container 400 is not denial evidence.

- [ ] Complete the accepted retention and preservation matrix: 1,000-line and more-than-tail inputs, UTF-8 near/over 5 MiB, repeated lines, oversized newest record and complete-line suffix/notice behavior. Confirm exact clipboard originals, all inspection layouts, Find/scroll behavior and profile Save/Cancel against the accepted interactions/native workflow.

- [ ] Measure five warmed runs on the maintainer's current machine in Freelens 1.10.3 using representative bounded windows, targeting a usable view within one second after response completion and Pause/navigation response within 100 ms. Record network wait separately and resolve material integration/performance defects before declaring the acceptance gate complete.

- [ ] Record full-configuration corrupt/newer-data preservation and confirmed backed-up reset, including failure to preserve a backup. Keep evidence tied to the production package revision and distinguish observed outcomes from host API limitations.

- [ ] Document the supported local install/update/disable/uninstall/reset/removal workflow and its limitations. Keep the release limited to Freelens 1.10.3, one Pod/container and current-instance bounded snapshots; do not add public distribution, streaming, multi-Pod merging or other excluded features.


## Execution record

Selected as the lowest eligible ticket after local #13, #14, #15, #17 and #18
were done with committed evidence. Assigned GitHub #19 to `@me` before work.
The first release-validation pass built a clean `git archive` of 606f036 with
Node 24.18.0/npm 11.16.0: all 100 tests/typecheck/package checks pass and the
0.1.18 tarball reproduces c0ceaf4926465439ab8cdb678648311cf621b9da1a988f33ab6c8ebc20c6551b.
The current 0.1.18 host has passed real fixture retention, clipboard/layout/Find
checks and two sets of five warmed performance measurements. Version 0.1.19
retains the production runtime source and stable identities, with new versioned
entry paths and an exact project-local toolchain invocation in the packaged guide.
Release-level installation and final validation are still in progress; no
unchecked acceptance criterion is claimed complete by this checkpoint.

### Operator feedback: refresh flicker and empty Bottom inspector

The user reported a brief box containing “snapshot” above the log area and
clarified that Bottom Inspection must occupy no space without a selected record.
The supplied screenshot `/tmp/codex-clipboard-DRvxxX.png` was inspected.
On installed 0.1.19, `refresh-flicker.js` captured three automatic-refresh banner
insertions and a 44.99 px change in log-area top/height; rows stayed at 1,000.
A temporary extension-only style hiding only transient notices reduced both
changes to zero, isolating the in-flow loading banner. `bottom-inspector.js`
also fails on the existing empty Bottom placeholder. These red-capable actual
host probes are retained under `docs/verification/19/`.
The 0.1.20 candidate moves routine loading/waiting feedback to a fixed-width
existing update-status slot, marks the records region busy for accessibility,
and renders Bottom Inspection only for a valid selected record. Side, saved
Bottom preference, selection/copy behavior, error and slow notices remain.
Actual packaged fix validation is still required before completion.
