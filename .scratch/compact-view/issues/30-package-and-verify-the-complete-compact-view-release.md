# 30: Package and verify the complete compact-view release

**Status:** done

**Blocked by:** [26: Select and copy log text without changing inspection](26-select-and-copy-log-text-without-changing-inspection.md), [29: Add scoped keyboard shortcuts and shortcut help](29-add-scoped-keyboard-shortcuts-and-shortcut-help.md), [28: Support mouse Back safely inside Freelens](28-support-mouse-back-safely-inside-freelens.md)

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/30

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Deliver a reproducible packaged compact-view release that works as one complete Readable logs workflow in Freelens 1.10.3. Validate the combined accepted layout, local navigation, selection and shortcut behavior, preserve the established data/configuration contracts, and make actual platform coverage and remaining limits explicit.

## Acceptance criteria

- [x] Run the repository checks appropriate to the final implementation and build/package checks against the pinned supported host. Produce an identifiable reproducible package using the established local release/update procedure and stable package/store/configuration identities.
- [x] Exercise the actual installed package from the real Pod Readable logs entry: accepted B controls, on-demand Find, pitch-black Readable/Raw canvases including empty space, compact footer, long labels/narrow windows and accessible focus, with no page-wide overflow or routine-refresh log-area jumps.
- [x] Verify Inline/Side/Bottom inspection, global saved preference, no reserved pane without a valid selected record, content tabs, exact Application text/Transport line clipboard copies, drag selection across records, the complete badge exclusion and immediate click/keyboard inspection with the accepted multi-click tradeoff.
- [x] Exercise the full accepted navigation graph and combined states: dirty and saved Profiles, global default/order changes, delete/reset confirmations, reset already in progress, Find plus inspector, focus fallback after record removal, retained query/presentation/viewport, native/local Back and Forward and no discarded-draft resurrection.
- [x] Verify all accepted shortcuts and help against visible actions, including valid/invalid/failed/absent-draft Save, empty/retained Find queries, match wraparound/recomputation, To bottom while paused, menus/selects/IME and ordinary text editing/selection. Preserve host Back/Forward, reload, command palette and native dock ownership.
- [x] Retain genuine packaged-host evidence for physical mouse Back delivery and cancellation, owning window/frame/focus and prevention of double navigation. Include native Logs/search mounted with stale selection and Escape capture/bubble coexistence. Do not substitute browser fixtures or synthetic events for native gates; any unsupported boundary remains explicit and blocks claiming that required behavior works.
- [x] Preserve existing snapshot/UTF-8 bounds, parsing/original content, refresh/pause/error recovery, container/Pod lifecycle, visibility/teardown, profile selection, persistence/migration/reset/backup, clipboard and responsiveness contracts. Validate affected regressions and the established representative warmed responsiveness cases on the final package, separating network wait from usable-view and interaction timings.
- [x] Document native Linux, Windows and macOS coverage separately and mark unavailable platforms unverified rather than inferring support from modifier unit tests. Separate final-package evidence from older packages, browser demonstrations and source-only inferences.
- [x] Update the supported local workflow/limit documentation for the completed feature. Preserve user configuration, clipboard and shared fixtures during checks; isolate and clean up owned test data. On Hyprland keep Freelens on workspace 7, use background interaction where possible and restore the prior user workspace/focus immediately after any native focus-dependent check.
- [x] Keep this increment within Freelens 1.10.3 and the existing single-Pod/container bounded-log contract. Do not change parsing, retention, refresh/lifecycle, profile selection or persistence schema to implement the compact view, and do not merge disposable prototype/research code wholesale.


## Operator validation context

Before packaged-host input checks, read `docs/verification/26/README.md` and
`docs/verification/26/continuation/host.mjs` for the tested Playwright input path,
frame coordinates, notification hit-testing and earlier driver failures. Use the
newer desktop restoration in `docs/verification/27/desktop.py` and read that
verification report: it handles restoring the underlying workspace when the prior
focused window is on a special workspace. Keep this ticket's original native and
physical evidence gates.


For native host shortcut checks, also read `docs/verification/28/README.md`,
which distinguishes OS-input accelerator tests from CDP key dispatch.

For clipboard audits, read `docs/verification/29/README.md` and `audit.py` in
that verification directory. Preserve newer unrelated clipboard content between
probes; verify preservation against each probe's immediate snapshot instead of
rewinding to the start-of-task baseline.

## Specification and evidence

The [final compact-view acceptance contract](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804), [layout](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104), [navigation/selection policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015) and [native input research](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755) define this increment. Preserve the [existing first-release contract](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620). Final integration evidence complements the feature tickets; it does not turn their unverified native gates into completed checks.


## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest eligible ready ticket; local #26/#28/#29 were done with
committed evidence. Assigned GitHub #30 to @me before implementation; it remains
open. All ten original criteria above are satisfied on final **0.1.33** in
**Freelens 1.10.3 / Electron 41.10.0**, Linux / Hyprland / Wayland.

Tarball: `dist/freelens-readable-logs-0.1.33.tgz`, SHA-256
`185d22ff0f4e83c527c2c7b6d7f23773bc0ddb876e684495d23da2e0cf78dfa2`.
Installed manifest, versioned CommonJS bundles and packaged guide match the build.
Node 24.18.0/npm 11.16.0 locked install, strict TypeScript, all **105 tests**,
actual tarball/CommonJS inspection and byte-identical rebuild pass.

Integration caught a genuine 0.1.32 Back defect: pressing in non-focusable Profiles
space moved focus to BODY, causing the release guard to reject the latched gesture.
The final source accepts that local pointer focus placeholder while retaining
foreign-focus, active/visible owning-context and blur/leave guards. Four regression
tests and an installed trusted-pointer reproduction go red before/green after.
No parsing, retention, refresh/lifecycle, profile-selection, clipboard or schema
change implements the compact view; stable identities/SDK pins remain.

Seven final-package physical G305 cases pass USB/native/DOM/history correlation:
`physical-dirty-02`, clean, confirmation, disclosure, logs, dock and parent host.
Owned cases cancel release and make one local transition without history movement;
native cases remain uncanceled and traverse exactly once. The actual dock hit was
its **ResizingAnchor vertical leading**, not the tab; current height/vertical
reference/tabs are preserved. Every recorder restores actual workspace/focus/pointer
and local configuration. Failed 0.1.32 `physical-dirty-01-*` and the separate
restoration tolerance failure remain failed evidence; no actor is inferred from
the old cursor drift. Five unarmed restoration rehearsals pass.

Final 0.1.33 matrices cover B/Find/black canvases/long labels/narrow widths, all
inspection modes, 24 real drags, 12 badge cases, 72 immediate/delayed original-copy
actions, complete navigation/reset graph, dirty/saved/default/order state, real
record eviction/focus fallback, Save paths, native stale-search coexistence, menus,
selects, editing, host accelerators, inactive views, teardown and actual native
Back/unmount/Forward without draft resurrection. Real retention/UTF-8, 403/socket
errors, explicit recovery, slow/busy and minimize Auto/Pause checks pass. Two sets
of five warmed runs pass: worst response/Pause/navigation **207.4/50.0/29.2 ms**,
with network wait separated. Earlier 0.1.32 failures/results remain versioned.

Isolated real Wayland IME preedit and **OS uinput Ctrl+S/Escape** preserve the draft;
exact native-protocol commit and ordinary Save afterward pass. Fresh process exit/
reopen and driver inventory rule out queued synthetic cases. Observed
`compositionend.isTrusted=false` remains an explicit boundary, never native proof.
Earlier mixed CDP-Escape labeling is corrected in a separate retained provenance
record. Windows/macOS and OS AltGraph remain unavailable/unverified, separately
from tested Linux Ctrl/Russian/Wayland input and supplemental modifier tests.

Fresh-main Extensions-first uninstall/wait/single-install activation succeeds
without a post-install restart. Later normal quits verify IME isolation, actual
backed-up reset and complete saved profile/default/Inspection persistence. Original
configuration, immediate per-probe clipboard snapshots, dock and shared UIDs/
restarts are preserved; owned namespace/profiles/backup/input helpers are removed.
Freelens stays on 7; actual prior desktop is restored after native checks.

Full criterion mapping, commands, package identity, provenance, failures, platform
limits and cleanup: [verification report](../../../docs/verification/30/README.md).
Only #30 work plus the authorized runner-written completed #29 Status update are
included. Prior scratch/untracked work and runtime `.ralph` remain outside. No
GitHub comments/closures, external-service messages, push, merge or publication
occurred; the supervisor's local notifications were explicitly authorized.
