# Ticket 27 — local return, one-layer Escape and focus

All ten original criteria are satisfied on **freelens-readable-logs 0.1.26** in
**Freelens 1.10.3**, Arch Linux / Hyprland / Wayland, 2026-10-25 UTC.
Only #27 was selected on `implementation/compact-view`: local #25 and #26 were
done with committed evidence, and #27 was the lowest eligible ticket. It was
[assigned to @me](assignment.json) before implementation. GitHub remains open.

## Authority and production changes

Read `AGENTS.md`, tracker/domain guidance, `GLOSSARY.md`, the development guide,
verification reports 18/19/25/26 and the tested #26 transport/focus helpers before
editing or host checks. Read the original #27 requirements and the complete
resolutions for [layout B #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input research #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[final contract #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and the linked [first-release contract #8](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620).
The pinned research artifact at `cc989fa3a94d400672e51f72a913f50034aec176` and
installed/source Menu/Dialog handlers were inspected. No disposable branch was merged.
This extends the existing accepted B surface without changing its layout.

`local-dismissal.ts` resolves one local layer before executing it: disclosures,
confirmations, Profiles, Find, then inspection. Held Escape is consumed without
executing another layer. The handler requires the active native-window/cluster
visibility, local focus, visible root, unmodified Escape and no composition.
It yields to native popups and host dialogs. Its MutationObserver observes pinned
host transient DOM; it never rewrites host state or installs a host override.
Freelens Menu closes in earlier window capture without canceling the key. Caching
its pre-dispatch presence prevents that same Escape from also leaving Profiles.
Listeners and observation are disposed with the existing view/extension lifecycle.

Profiles has explicit **Back to logs**, **Save profile** and **Cancel draft**.
Returning unmounts only its draft/editor; the log session and surviving state stay
mounted. Shared close actions restore the Find/Profiles opener or retained row,
with a log-control fallback after row removal. Confirmed deletion focuses the
surviving Profiles heading. A pending reset consumes Escape without pretending to
cancel; its eventual completion preserves focus the user moved while waiting.
No host-history entries, parsing, retention, request/lifecycle, profile-selection,
clipboard implementation or persistence schema changed.

## Exact final package and automated checks

Tarball: `dist/freelens-readable-logs-0.1.26.tgz`.
SHA-256: `0e3843633c0ed6d8a6c2dc6b1effb2681f89dcaa122be9f978fca8c7d776ac63`.

[Installed identity](identity.json) compares the actual manifest, both bundles and
packaged guide byte-for-byte with the built inputs. Entry names are
`out/main-0.1.26.js` and `out/renderer-0.1.26.js`; package/store
`freelens-readable-logs`, config/page `readable-logs`, schema 3, SDK/core 1.10.3 and
host-provided CommonJS dependencies remain stable. [Source hashes](source-identity.json)
identify final inputs; the completion report supplies their commit.

Exact commands, from this checkout:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.26.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/27/package.sha256
```

[Node 24.18.0/npm 11.16.0](toolchain.txt), [locked install](locked-install.txt),
[TypeScript](typecheck.txt), [all 100 tests, zero failures/skips](tests.txt),
[packaging](package.txt), [tarball/CommonJS checks](package-check.txt), and
[byte-identical rebuild](reproducible.txt) pass. The existing automated suite
covers preserved data/request/configuration contracts; the committed native-host
scripts below exercise the new behavior at the actual event boundary. The final
[mechanical design scan](design-detector.json) has no findings. Visual inspection
of [Profiles](profiles.png) and [restored logs](restored-shared-view.png) preserves
the incumbent styling. Full release/performance integration remains #30.

## Original criteria and final-package evidence

| Criterion | Passing evidence |
| --- | --- |
| 1. Back, separate Save/Cancel draft; retain saved edits/default/order | [Profiles matrix](case-profiles.json) saves two real profiles, changes default/order, edits a dirty draft, returns by Escape and visible Back, reopens without the draft, and verifies the saved configuration. [Durable settings](disk-save.json) also match both saved profiles, their order and global default after draft exit; the unfinished name never reaches disk. Explicit Cancel stays in Profiles. |
| 2. Transient/confirmation priority; one Escape and no second host action | [Transient matrix](case-transient.json) opens the real native dock Menu, returns focus to Profiles while it remains open, and sends trusted Escape. Earlier host capture closes only Menu; the next press returns. Both local disclosures close ahead of Find/inspection. The real select popup consumes its first Escape before any DOM key event; Profiles returns only on the next. |
| 3. Delete/reset cancellation, ordinary draft fields | [Profiles](case-profiles.json) cancels Delete with Escape and Keep, restoring Delete focus; Escape from a draft textarea returns. [Recovery](recovery.json) checks Cancel/Escape from actual recovery, restoring the Reset opener while Profiles remains. [Additional graph checks](extra.json) confirm successful deletion and surviving focus. |
| 4. Find before inspector; retain query; shared visible transitions | [All Inline/Side/Bottom cases](case-logs.json) close Find first, preserve its query and inspector, close inspection next and focus its retained originating row; bare logs stay. Visible close buttons have the same results. |
| 5. Pending reset, backup and failure guarantees | [Recovery](recovery.json) starts from corrupt bytes loaded by both production stores. Actual backup obstruction causes failure with unchanged bytes. A deferred call to the real reset IPC leaves progress/disabled Cancel visible through Escape and local return; releasing it performs the actual reset and verifies an exact original backup. It also verifies focus moved while pending is preserved. No fake reset result is substituted. |
| 6. Opener/retained-row focus and expired-row fallback | [Profiles](case-profiles.json), [all inspection layouts](case-logs.json), [successful deletion](extra.json), [reset](recovery.json), and [real eviction](expiry-after.json). Eviction removes the inspected original while its inspector owns focus; the pane collapses and focus lands on the surviving log viewport. |
| 7. Query/presentation/viewport/selection and automatic updates | [Profiles](case-profiles.json) preserves the pixel scroll position, query, selection and paused mode. [Nondefault presentation](extra.json) retains Raw, timestamps off, wrap on and Transport line tab. [Automatic case](automatic.json) observes a further real HTTP 200 while an unfinished Profiles draft is open, returns with the surviving original selected, and remains automatic. |
| 8. No local host-history entries | All four [case scripts](cases.mjs) assert identical URL/history length after their transitions, including presentation/content tabs and Find. [Recovery](recovery.json) uses attached state only. Actual host leave/reentry is separate; no history API or correction loop was introduced. |
| 9. Active/visible/focus scope, repeat/composition guards and disposal | [Held key](case-profiles.json), [native dock and Shift+Escape](case-scope.json), [native transient ownership](case-transient.json), [genuinely inactive cached frame](guard-hidden.json), and [listener teardown](teardown.json). CDP listener inspection records one key/composition listener before unmount and zero afterward. Tab/Shift+Tab and [native Space activation](extra.json) pass. Composition injection is explicitly supplemental, as noted below. |
| 10. Graph edges and actual host capture/bubble/native-select coexistence | The final-package matrices above cover dirty/saved drafts, default/order, delete/reset cancellation and success/failure, pending reset, Find plus inspector, disappeared records and host entry/exit. Trusted events in each case record their actual target and delivery. These are installed Electron checks, separate from browser fixtures and source inference. |

## Actual installation and input provenance

Final 0.1.26 used [normal Quit with every old PID exited](preliminary-special-workspace-quit.json),
[fresh main launch](fresh-update-0.1.26-desktop.json), [Extensions before any cluster](extensions.json),
[Uninstall](uninstall.json), [confirmation](confirm-uninstall.json), [stable removal](removal.json),
[one Install submission](install.json), [Enabled 0.1.26](installed.json),
[cluster](open-cluster.json), [current target](show-fixture.json), [actual Pod header](header.json)
and [1,000 usable real records](setup.json). No discovery failure or post-install
restart established activation. The later [recovery restart](recovery-start.json)
is controlled invalid-settings preparation after that successful activation.

Every launch uses only process-local `CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100`
and same-filesystem `TMPDIR=/home/max/.cache/freelens-readable-logs/tmp`.
Mapped windows are verified/corrected to workspace 7 before interaction.
The optional localhost CDP endpoint is verification transport, not a runtime requirement.

`host.mjs` starts from #26's tested Playwright 1.64.1 driver, installed separately
under `.scratch/compact-view/26/browser-driver`. It creates trusted Chromium key
and pointer delivery in the installed Electron frame. Native select popup Escape
never reaches DOM; real Menu capture runs before the extension root. No physical
hardware or OS IME provenance is inferred from those results. [Platform coverage](platforms.json)
reports Linux packaged-host coverage, unavailable/unverified Windows and macOS,
and no available fcitx/ibus runtime. The composition sequence and forced delivery
into an inactive cached frame are supplemental DOM guard checks, not OS IME or
physical-input evidence. Physical mouse Back remains the explicit, separate #28 gate.

Reproduction after fixture creation, actual installation/entry and `setup`/`prepare`:

```sh
CV26_PLAYWRIGHT=1 PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/27/desktop.py script case-profiles docs/verification/27/cases.mjs profiles
```

Use `logs`, `transient` or `scope` for the other cases. The recovery script requires
both stores to have loaded `controlled-corrupt.txt` during the documented normal
fixture restart. It creates/removes only its own backup obstruction and verifies
backup bytes before deleting its own backup. `emit.py` appends only to the owned
Pod's real stdout for eviction. These helpers fail on assertion/transport errors;
they never replace real log bodies with fixture responses.

## Retained failures and cleanup

Earlier 0.1.25 output remains under [early-0.1.25/](early-0.1.25/), with its own
package/hash/installed identity. It is not relabeled as final 0.1.26 evidence.

- [Initial baseline](early-0.1.25/preliminary-baseline-no-backups.json) assumed a
  backup directory existed; its corrected reader handles absence. The original
  settings snapshot had already been safely copied and was retained.
- [Initial Profiles run](early-0.1.25/preliminary-case-profiles.json) had a hidden
  Find baseline because this package's install notification covered its button.
  The corrected driver dismisses only this package's maintenance notifications
  and asserts Find is actually open before preparing its state.
- [First recovery experiment](early-0.1.25/preliminary-valid-main-recovery.json)
  put only the renderer in fallback. Main correctly refused to reset usable settings.
  Final checks load the actual corrupt file in both stores and use real IPC.
- [Deletion regression](early-0.1.25/extra.json) established BODY focus after the
  confirmation's focused button was removed. Final [0.1.26](extra.json) focuses the
  surviving Profiles heading, and also passes the nondefault presentation checks.
- [Additional durable-settings probe](preliminary-disk-save.json) initially targeted a Move button above the scrolled viewport. Its finally block restored settings; the corrected driver scrolls the control into view and [passes](disk-save.json).
- [Pre-maintenance desktop assertion](preliminary-special-workspace-quit.json)
  caught focus restoration to a special-workspace window while its underlying
  regular workspace remained changed. Every old host PID had exited; this was not
  a discovery/activation failure. [Correction](pre-maintenance-special-correction.json)
  and `desktop.py` restore the regular workspace separately using
  `hl.dsp.focus({workspace=id})`, then the actual focused window. A first attempted
  `hl.dsp.workspace(...)` was rejected by this Lua API and had no dispatch effect.
  All final focus-dependent case records after correction match both workspace
  and focused-window identities, including the special workspace case.

[Cleanup](cleanup.json) restores the complete original application configuration:
Inline, no saved profiles, built-in Default. Only host-owned version migration
metadata advances to 0.1.26. Test backups/obstruction are removed after exact byte
verification, and the temporary backup-success notice is cleared. Tests use no
clipboard writes or copy/paste gestures. No clipboard data was read into evidence.

[Final review](final-review.json) and [capture](restored-shared-view.png) leave the
original shared `single-json/json` view paused, Readable, with new-view defaults,
no query/selected record/empty inspector, the same three native dock tabs and no
transport/store test helper. [Desktop restoration](restored-shared-view-desktop.json)
keeps Freelens on workspace 7 and restores the actual prior workspace/focus.
[Owned namespace removal](fixture-cleanup.txt) and [unchanged shared UIDs/restarts](shared-preserved.json)
confirm fixture cleanup. Kubeconfig, shared resources and unrelated settings remain intact.

Only this ticket's production changes/evidence and the authorized runner-written
Status update for completed #26 are committed. Prior scratch, other local tickets,
untracked `.gitignore`, `ralph`, `docs/ralph.md` and runtime `.ralph` remain outside.
No comments, closures, messages, pushes, merges, releases or global model/settings
changes were made.
