# Ticket 30 — compact-view integration release

All ten original criteria are satisfied on **freelens-readable-logs 0.1.33**,
**Freelens 1.10.3 / Electron 41.10.0**, Arch Linux / Hyprland / Wayland,
2026-10-25 UTC. Windows and macOS remain **unverified**, as required for unavailable
native platforms. Linux OS AltGraph is unverified. The measured Wayland IME path
and its event-trust boundary are described separately below. No release was published.

Only #30 was selected, on `implementation/compact-view`; local #26/#28/#29 were
already done with committed evidence. [Assignment](assignment.json) records the
claim to @me before implementation. GitHub remains open. Read AGENTS.md, tracker/
domain guidance, GLOSSARY.md, the development guide and reports 19/25/26/27/28/29,
including tested transport, focus and clipboard helpers.

The full resolutions for [layout B #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input research #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[acceptance #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and [first release #8](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620)
remain authoritative. The pinned `cc989fa3` research artifact was inspected. Compared
accepted B `variantB()` and toolbar/canvas/footer rules in the available `a293e92`
prototype worktree. No disposable source was merged.

## Exact package and automated results

- Tarball `dist/freelens-readable-logs-0.1.33.tgz`.
- SHA-256 `185d22ff0f4e83c527c2c7b6d7f23773bc0ddb876e684495d23da2e0cf78dfa2`.
- [Final installed identity](final-identity.json) compares the manifest,
  `out/main-0.1.33.js`, `out/renderer-0.1.33.js` and packaged guide byte-for-byte.
- Package/store `freelens-readable-logs`, page/config `readable-logs`, schema 3,
  SDK/core 1.10.3 and host-external dependencies remain stable.
- [Toolchain](toolchain.txt), [locked install](locked-install.txt),
  [strict TypeScript](typecheck.txt), [105 tests, zero failures/skips](tests.txt),
  [package](package.txt), [actual tarball/CommonJS inspection](package-check.txt)
  and [byte-identical rebuild](reproducible.txt) pass.
- [Source hashes](source-identity.json) and [runtime scope](runtime-source-scope.json)
  distinguish the Back correction from unchanged parser, bounds, requests, lifecycle,
  clipboard, profile-selection and persistence code. The completion report supplies
  the commit.

Commands from the repository:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum --check docs/verification/30/package.sha256
```

Final activation uses [normal pre-maintenance Quit/all old PIDs exited](fresh-maintenance-0-1-33.json),
[silent fresh launch](fresh-maintenance-0-1-33-launch-desktop.json),
[Extensions before any cluster](extensions.json), [Uninstall](uninstall.json),
[confirmation](confirm-uninstall.json), [stable removal](removal.json),
[one Install submission](install.json), [Enabled 0.1.33](installed.json),
[cluster](open-cluster.json), [actual Pod header](header.json) and
[usable records](usable.json). No discovery failure or post-install restart
substituted for activation. Later full quits are explicitly isolated IME,
controlled recovery and persistence checks after successful activation. All launches
use process-local polling and same-filesystem TMPDIR; debugging ports are optional
verification transport.

## Original criteria and final-package evidence

All links in this table target **0.1.33** results. Older results live under
[early-0.1.32/](early-0.1.32/) and remain identified separately.

| Criterion | Final evidence |
| --- | --- |
| 1. Checks, reproducible package and stable identity | Build, tarball, installed identity and successful activation above. |
| 2. Accepted B, temporary Find, black canvases/footer/long labels/narrow/focus/quiet refresh | [Layout/Find](layout-layout-find.json), [six mode/layout cases](layout-mode-layout-matrix.json), [1600–360 px long-label matrix](layout-widths.json), [genuine empty canvas](layout-empty-scene.json), [zero routine-refresh movement](release-refresh-flicker.json), [visual/reference](visual.json), [restored view](final-view.png). Width constraints apply to the installed renderer, not another OS or native-window-size claim. |
| 3. Inspection/preference/originals/selection/badge/immediate activation | Six `gesture-*` results below: 24 trusted pointer drags, 12 badge cases and 72 actual original-copy actions compared immediately and after 100 ms. [Old-selection plain-click regression](selection-click-0.1.33.json), all content tabs/modes and [full saved preference/profile/default across Quit](reopened-persistence-check.json). |
| 4. Complete navigation/combined states and no discarded-draft resurrection | [Profiles/default/order](graph-profiles.json), [Find/inspector/focus](graph-logs.json), [native Menu/select Escape](graph-transient.json), [scope](graph-scope.json), [nondefault presentation/deletion](extra.json), [automatic updates during draft](automatic.json), [actual failed backup/pending reset/success](recovery.json), [real record eviction/focus fallback](expiry-after.json), [native history/reload](lifecycle.json), and [actual OS Back → viewer unmount → Forward → no draft resurrection](native-draft-forward.json). Local surfaces add no host-history entries. |
| 5. Shortcuts/help/action equivalence and native ownership | [Logs](case-logs.json), [valid/invalid/failed/absent/held Save](case-profiles.json), [scope/non-US](case-scope.json), [reference](case-reference.json), [native stale-selection Find](find-conflict.json), [inspector text](inspector-pointer.json), [editing/copy/paste](editing.json), [host focus](host-focus.json), [inactive cached frame](inactive.json), [host accelerators/teardown](lifecycle.json), and isolated [real Wayland IME + OS Save/Escape](ime.json). Input provenance and the untrusted end event are separated below. |
| 6. Genuine physical final-package Back and native coexistence | [Seven-case USB/native/DOM correlation](physical-summary.json), [exact dock target/geometry audit](dock-geometry-audit.json), stale-selection Find and actual capture/bubble Menu/select graph above. [Final cleanup](cleanup.json) passes. Failed 0.1.32 dirty-01 is excluded. |
| 7. Preserved first-release contracts, affected regressions and warmed timing | All 105 deterministic tests; [retention/UTF-8/originals](release-retention.json); actual [Kubernetes 403](release-denied.json), [socket failure](release-offline.json), [15-second slow/quiet busy/Pause](release-busy-slow.json); [native minimize Auto](minimize-auto-hidden.json) / [return](minimize-auto-returned.json) and [Pause](minimize-paused-hidden.json) / [return](minimize-paused-returned.json); recovery/persistence/eviction and two five-run performance sets below. Unchanged module hashes are not promoted to new native lifecycle/migration observations. |
| 8. Separate native platforms and evidence classes | [Platforms](platforms.json): Linux Ctrl/Russian/Wayland provenance; Windows/macOS unavailable/unverified. Modifier unit tests and forced DOM guards are supplemental. OS AltGraph remains unverified. |
| 9. Supported workflow, limits and preservation/cleanup | Packaged development guide updated; [original configuration, immediate clipboard snapshots, helper/device, dock and fixture audit](cleanup.json), [unchanged shared UIDs/restarts](shared-preserved.json), [owned namespace deletion](fixture-cleanup.txt), [final view](final-view.png). Each focus-dependent check restores its actual preceding workspace/window/pointer, including special-workspace handling; Freelens stays on 7. |
| 10. Pinned scope and stable data/configuration contracts | Source hashes/scope above. The only production source change in this ticket is pointer focus eligibility. Schema, parsing/retention/refresh/lifecycle/profile selection and stable identities remain unchanged. No prototype/research merge, streaming, previous-instance or multi-Pod scope was introduced. |

The six selection/copy cases are [Readable Inline](gesture-readable-inline.json),
[Readable Side](gesture-readable-side.json), [Readable Bottom](gesture-readable-bottom.json),
[Raw Inline](gesture-raw-inline.json), [Raw Side](gesture-raw-side.json) and
[Raw Bottom](gesture-raw-bottom.json). They create real selections through trusted
Chromium press/move/release and multi-clicks in installed Electron, not prebuilt
selection ranges. Physical keyboard/pointer provenance is not inferred. Complete
badge numbers/labels are excluded; actual application `fields` keys/values remain.
Normal click and Enter/Space inspect immediately; the accepted first-click
multi-click tradeoff remains. Clipboard comparisons include empty/space-only text,
Unicode, JSON escapes and original Kubernetes timestamp precision.

## Integration found and fixed a real Back defect

The supervisor's genuine physical G305 press in [dirty-01 hardware](physical-dirty-01-hardware.json)
on **0.1.32** produced [uncanceled release and real host traversal](physical-dirty-01-trace.json).
Pointerdown targeted `.rl-editor-fields` with Profile name focused. Chromium moved
focus to BODY; at release the document/window remained focused and pointer stayed
inside Profiles, but the descendant-focus guard declined cancellation. Native history
moved 5 → 4 with Profiles still open. This was an application defect, not missing
hardware/operator evidence.

`local-back.ts` now accepts BODY as the local pointer focus placeholder while
retaining active/visible owning-document, target, foreign-focus, transient and
blur/leave constraints. The same local dismissal runs once. No native override,
production main-process input relay, global shortcut or history correction was added.
Four listener regression tests go [red](back-focus-regression-red.txt) before and
[green](back-focus-regression-green.txt) after. A trusted Chromium [installed red
reproduction](back-panel-red.json) also goes [green on 0.1.33](back-panel-green.json).
Those are supplemental to the physical evidence.

The supervisor alone armed each final recorder and sent the user's previously
authorized numbered Dunst notifications. Each final case contains exactly USB
**BTN_SIDE (275) 1 then 0**, native `browser-backward` and back mouseDown/mouseUp,
DOM button 3, owning PID/window/frame/focus and actual history correlation:

| Physical 0.1.33 case | Result |
| --- | --- |
| [Dirty blank Profiles panel](physical-dirty-02-trace.json) | Canceled mouseup/auxclick, one local return, no native step; BODY-focus regression covered. |
| [Clean Profiles](physical-clean-01-trace.json) | Same local return; retained query, record selection and viewport. |
| [Delete confirmation](physical-confirmation-01-trace.json) | Only confirmation canceled, Profiles remains; no native step. |
| [Owned disclosure](physical-disclosure-01-trace.json) | Only disclosure closes, Profiles remains; no native step. |
| [Logs + Find/inspection](physical-logs-01-trace.json) | Uncanceled, exactly one native history step; panels do not intercept. |
| [Native dock region](physical-dock-01-trace.json) | Actual hit is **ResizingAnchor vertical leading**, `resizing` at release / `wasDragging` at auxclick; prior focus is the active dock tab. It is not a pointer hit on that tab. Uncanceled, exactly one native step, no local return. |
| [Parent host/sidebar](physical-host-01-trace.json) | Parent-frame ownership, uncanceled, exactly one native step, no local return. |

All seven `*-desktop.json` and `*-state-restored.json` records pass exact workspace/
window, pointer tolerance and background local/configuration restoration. Passive
observers are removed. [The dock audit](dock-geometry-audit.json) finds the prepared
and current vertical tab reference equal, persisted content height 300 px, unchanged
tabs/selection and cleared resizing flags. Initial numeric dock storage was not
separately snapshotted; no stronger historical storage equality is claimed and no
dock state was rewritten. Pinned host source permits that resize anchor to begin
with any button; `wasDragging` alone does not establish an extent change.

## IME provenance and isolation

No fcitx/ibus runtime was installed. A short-lived, owned [Wayland input-method-v2
client](ime-driver.c) uses the real Hyprland text-input path without grabbing the
keyboard, opening a popup, recording surrounding text, changing global settings
or touching the clipboard. [Read-only capability inventory](ime-registry.txt),
[protocol source/hash and build](ime-build.json) and [tool availability](ime-tool-availability.json)
record the boundary. The [primary protocol source](https://raw.githubusercontent.com/swaywm/wlroots/master/protocol/input-method-unstable-v2.xml)
was fetched 2026-10-25; generated headers/code and binary stay in owned scratch.

[Final IME evidence](ime.json) follows [full process exit/reopen](ime-os-escape-full-reopen.json)
with [no other drivers](ime-os-isolation-drivers.json) and no synthetic composition
case in that fresh process. Both **Ctrl+S and Escape use OS uinput** through
`nativeKeyboard.press`. Trusted compositionstart/update/input and trusted composing
keys preserve the active draft; compositor commit produces exactly `CV30 IME draftあ`;
ordinary Save resumes afterward. The client exits 0, its profile and listeners are
removed, and complete configuration is restored.

**Compositionend reports `isTrusted=false` on this host. It is not claimed as
trusted native proof.** [Isolation](ime-isolation-result.json) reproduces that flag
without prior/queued synthetic-case interference. The trusted preedit/composing-key,
protocol-commit and resumed-Save observations are separate. Earlier mixed-path trials
used OS Ctrl+S but Playwright/CDP Escape; [the correction](ime-provenance-correction.json)
identifies those retained artifacts. Their original OS-Escape label was inaccurate.
The final isolated case corrects delivery rather than relabeling those results.
This is measured Linux Wayland composition ownership, not a full IME candidate-UI,
Windows/macOS, physical-keyboard or universal input-method claim.
The packaged guide conservatively records general Linux OS IME coverage as
unverified; it explicitly points here for current coverage. This report adds
only the isolated Wayland case above. Full input-method/candidate-UI coverage
and OS AltGraph remain unverified.

Reproduce with the existing verification-only Playwright installation and generated
protocol helper, never a production dependency:

```sh
curl -fsSL https://raw.githubusercontent.com/swaywm/wlroots/master/protocol/input-method-unstable-v2.xml -o .scratch/compact-view/30/input-method-unstable-v2.xml
wayland-scanner client-header .scratch/compact-view/30/input-method-unstable-v2.xml .scratch/compact-view/30/input-method-client.h
wayland-scanner private-code .scratch/compact-view/30/input-method-unstable-v2.xml .scratch/compact-view/30/input-method-code.c
cc -Wall -Wextra -I.scratch/compact-view/30 docs/verification/30/ime-driver.c .scratch/compact-view/30/input-method-code.c -o .scratch/compact-view/30/ime-driver $(pkg-config --cflags --libs wayland-client)
CV26_PLAYWRIGHT=1 PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/30/desktop.py script ime docs/verification/30/ime.mjs
```

## Responsiveness, retained failures and cleanup

Each set excludes one warmup and records five actual retained-window responses.
Network completion is measured before SDK processing; DOM geometry and two animation
frame opportunities follow. Values below are worst milliseconds, not scanout or
process-memory guarantees:

| Final 0.1.33 workload | Network wait | Response through paint opportunity | Pause | Host page navigation |
| --- | ---: | ---: | ---: | ---: |
| [1,000 records](performance-bounded.json) | 26.3 | 88.4 | 50.0 | 19.0 |
| [Near 5 MiB UTF-8](performance-near.json) | 30.0 | 207.4 | 43.2 | 29.2 |

All ten final runs satisfy 1,000 ms response / 100 ms interaction targets. Earlier
0.1.32 `early-0.1.32/preliminary-performance-bounded.json` retains a 109.4 ms
navigation paint-opportunity failure (10.3 ms DOM); cause unestablished. A later
passing set does not erase that earlier failure. Final-package results are separate.

Other retained failures/boundaries:

- [0.1.32 physical dirty-01 desktop](physical-dirty-01-desktop.json) restores workspace
  and exact window/view but drifts (682,150) → (684,145), outside tolerance, exit 1.
  It is never an overall pass. Its cursor drift alone identifies neither actor nor cause.
- [Initial unarmed rehearsal](preliminary-pointer-rehearsal-redundant-focus.json)
  separately exposes a redundant focus dispatch that can warp the pointer. The
  corrected restorer avoids redundant focus and waits for virtual motion settlement;
  [five unarmed/no-Back rehearsals](pointer-rehearsal.json) pass. New physical records
  include checkpoints and USB motion separately; absent USB motion is not proof about
  every other input source.
- Earlier audit glob included desktop JSON; inactive-frame setup lacked a genuine
  Extensions history entry after normal Quit; Playwright rejected mouse button Back;
  a microtask observer read cancellation before root dispatch. Corrected final
  probes use explicit result files, real host entries, trusted CDP Back and an
  after-dispatch timer. Preliminary files remain separately identified.
- The first IME assertion incorrectly required a trusted end event. Failed output
  is retained. The measured untrusted-end boundary and the separate mixed-Escape
  provenance correction remain explicit above.

[Final cleanup](cleanup.json) restores original application configuration (Inline,
no saved profiles, built-in Default); only host migration metadata advances to
0.1.33. Per-probe clipboard snapshots are restored only with established ownership;
newer unknown content is preserved rather than rewound to the task baseline. Six
clipboard cases restore original formats/buffers/image pixels; ordinary editing's
immediate original/restored buffer hashes agree. [Shared Pod UIDs/restarts](shared-preserved.json)
are unchanged; [owned namespace](fixture-cleanup.txt), profiles, backup obstruction,
owned backup and input devices/IME process are removed. No shared fixture, kubeconfig
or unrelated extension state was mutated.

[Final capture](final-view.png) leaves the original shared single-json/json target
paused, Readable, without query/selection/empty inspector/test helpers. Native dock
tabs/selection and 300px content height remain, Freelens stays on workspace 7,
and every native check restores the actual prior user desktop. Runtime `.ralph`
data, previous scratch, untracked `.gitignore`, `ralph`, `docs/ralph.md` and unrelated
work remain outside commits. Only #30 source/package/documentation/ticket/evidence
and the authorized runner-written completed #29 Status update are included.
No GitHub comments/closures, external-service messages, pushes, merges or release
publication occurred. The supervisor's local notifications were explicitly authorized.
