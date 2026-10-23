# 19: Complete and verify the supported local release workflow

**Status:** done

**Blocked by:** [13: Handle container and Pod lifecycle changes](13-handle-container-and-pod-lifecycle-changes.md), [14: Inspect and copy complete records](14-inspect-and-copy-complete-records.md), [15: Navigate changing logs with scrolling and Find](15-navigate-changing-logs-with-scrolling-and-find.md), [17: Select formatting profiles automatically](17-select-formatting-profiles-automatically.md), [18: Recover safely from unusable configuration](18-recover-safely-from-unusable-configuration.md)

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/19

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

Install and maintain the completed first release reliably on the maintainer's Freelens 1.10.3 environment, with real profiles/preferences preserved through updates and recorded production acceptance evidence. This ticket completes the local release workflow and resolves any integration defects found by the accepted gates; it is not public distribution.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [accepted local maintenance procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618); [accepted viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [formatting profiles and selection rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832); [readable records and parsing fallbacks](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] From a clean checkout, run the documented locked dependency install, type-check, tests, build and packaging commands; inspect the installable tarball and run that actual package. Record exact commands/results, runtime/package-manager versions and the production package revision.

- [x] Use Extensions from a fresh main window before opening any cluster. If a cluster was opened, fully quit/reopen once before maintenance. For updates explicitly uninstall the old package, wait for removal, then install the new tarball once; require no post-install restart, overwrite/reinstall prompt or silent repeated attempt.

- [x] After installation/update, verify actual packaged version, Enabled state, Pod-details header action beside native Logs, correct cluster/namespace/Pod UID/container navigation and usable logs. Enabled alone is insufficient.

- [x] Verify complete real profiles, global-default/matching order/enabled states and global inspection layout across full quit/reopen and explicit uninstall/install update. Verify agreed temporary-state resets and supported schema migrations when relevant; do not substitute a string marker for configuration evidence.

- [x] Verify disable/uninstall removes the extension's contributions, invalidates pending work and retains its settings. Document and exercise explicit settings removal affecting only this extension, including its documented backup handling.

- [x] Run the accepted real-host matrix for container switches, hide/minimize/leave/reopen, observed restart, deletion/replacement, empty/malformed/oversized output, an actual access-denied response and a transient failure. Verify outdated retained records, stopped automatic refresh, explicit recovery and no stale target exposure. An invalid-container 400 is not denial evidence.

- [x] Complete the accepted retention and preservation matrix: 1,000-line and more-than-tail inputs, UTF-8 near/over 5 MiB, repeated lines, oversized newest record and complete-line suffix/notice behavior. Confirm exact clipboard originals, all inspection layouts, Find/scroll behavior and profile Save/Cancel against the accepted interactions/native workflow.

- [x] Measure five warmed runs on the maintainer's current machine in Freelens 1.10.3 using representative bounded windows, targeting a usable view within one second after response completion and Pause/navigation response within 100 ms. Record network wait separately and resolve material integration/performance defects before declaring the acceptance gate complete.

- [x] Record full-configuration corrupt/newer-data preservation and confirmed backed-up reset, including failure to preserve a backup. Keep evidence tied to the production package revision and distinguish observed outcomes from host API limitations.

- [x] Document the supported local install/update/disable/uninstall/reset/removal workflow and its limitations. Keep the release limited to Freelens 1.10.3, one Pod/container and current-instance bounded snapshots; do not add public distribution, streaming, multi-Pod merging or other excluded features.


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
At that checkpoint release-level installation and final validation were still in
progress. The final verification record below supersedes that checkpoint.

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
The packaged fix validation was pending at that checkpoint and is completed below.

## Final verification — all original criteria satisfied

Production **freelens-readable-logs 0.1.20**, actual **Freelens 1.10.3**, source
revision **b9521a4041d216820fa5851ee2dea5b7256b1b60**. The implementation commits
and published history are preserved; this completion commit adds the complete
verification record and checked original criteria. The Ralph runner owns Status.
GitHub #19 remains assigned/open for maintainer review; no comments or closure.

The [verification report](../../../docs/verification/19/README.md) maps all ten
original criteria to exact commands/results and versioned real-host observations:

1. A fresh `git archive` build with **Node 24.18.0 / npm 11.16.0**, locked install,
   strict TypeScript, **100 passing tests**, actual tarball/CommonJS inspection,
   identical second build and installed main/renderer/guide hashes. Final tarball
   SHA-256 **8dfd57b2489b87d8434144d83c7c7a44b7f67726f18f13fa0b637b77fa9c9de7**.
2. Both real updates and a clean install after explicit settings removal use
   fresh-main Extensions, explicit uninstall/wait, exactly one Install submission
   and working logs before any later independent persistence/maintenance restart.
3. Actual 0.1.20 Enabled row, native Logs/Readable logs sibling header actions,
   correct cluster/namespace/Pod UID/container and actual usable output.
4. Three complete real profiles, rules, enabled/matching conditions/order, global
   default and Bottom preference survive explicit update and a full normal quit.
   Every old PID exits. Manual/Raw/selection/Find/wrap/timestamps/draft/sample reset.
   Actual schema 1 and three-profile schema 2 migrations pass on 0.1.20.
5. Disable and uninstall remove both the Pod action and page; complete settings
   and backup hashes survive. Current deterministic disposal/deferred tests plus
   actual late-response rejection prove invalidation without claiming cancellation.
   Fresh-main maintenance has no active viewer request. Explicit removal touches
   only this extension's directory, preserves its backups outside that directory,
   and leaves other extension-store hashes identical.
6. Latest-package real matrix passes for all container kinds, hiding/return,
   native minimize/restore in both modes, leave/reopen with a genuine late 403,
   observed restarts in Auto/Pause, actual deletion/404 and a different-UID
   replacement. Old targets stay attributed/stopped; real empty, malformed,
   oversized, Kubernetes Forbidden and socket-refusal cases remain distinct.
   Errors retain outdated originals, stop automatic reads and recover explicitly.
7. Exact-byte retention/originals pass at 1,000/more-than-tail, near/over 5 MiB UTF-8,
   repeated records and oversized newest input. Eighteen real clipboard comparisons,
   all layouts, literal Find/wrapping, surviving/lost anchors, To bottom and following
   pass. Save/Cancel/preview and full configuration evidence use actual controls.
8. Two sets of five warmed 0.1.20 runs pass. Worst response-through-paint opportunity
   **191.6 ms**, Pause **46.1 ms**, navigation **30.8 ms**; network wait is separate.
9. Full corrupt/newer configurations are preserved through startup, incidental
   writes and cancellation. Actual backup obstruction leaves original bytes intact.
   Confirmed resets preserve exact original backups and restore ordinary saving.
10. The packaged local guide records stable identities, supported toolchain,
    process-local polling/TMPDIR, install/update/disable/uninstall, backup/reset/
    explicit removal and whole-response/UID/retention limitations. No excluded
    streaming, multi-Pod/previous-instance behavior or public distribution was added.

The two user UI reports are also completed in actual 0.1.20:

- The transient snapshot banner caused **44.99 px** log-area movement. The same
  red-capable real-refresh probe now measures **zero** banner flashes/movement;
  quiet loading remains accessible and the actual 15-second slow notice still works.
- Bottom Inspection occupies **no space** without a selection, opens on selection,
  collapses on Close or when its record leaves the bounded window, and retains the
  saved Bottom choice. Side guidance remains unchanged. Before/after probes and
  captures are linked in the report; the supplied screenshot was inspected.

Cleanup restores the original application configuration (no profiles, global
Default, Bottom), retaining only the host-owned version metadata update. Only
`readable-logs-ticket-19` is deleted; shared Pod UIDs/restart counts are unchanged.
All test transport/store helpers are absent. Freelens stays open on workspace 7,
paused on original `single-json/json`, Readable/default view state with Bottom
collapsed. Current workspace/focus is preserved by the final native check.
Pre-existing untracked setup, unrelated scratch and runtime `.ralph` data are
excluded from commits. Failed probe artifacts remain identified and are not
counted as acceptance. The operator handles pushing subsequent completed commits.
