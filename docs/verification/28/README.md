# Ticket 28 — physical mouse Back within Profiles

All nine original criteria are satisfied on **freelens-readable-logs 0.1.28** in
**Freelens 1.10.3 / Electron 41.10.0**, Arch Linux / Hyprland / Wayland,
2026-10-25 UTC. Windows and macOS are unavailable and **unverified**.

Only #28 was selected on `implementation/compact-view`: #27 was locally done
with committed evidence, making #28 the lowest eligible ready ticket. It was
[assigned to @me](assignment.json) before implementation; GitHub remains open.

Read the project/tracker/domain instructions, glossary, development guide,
verification reports 19/26/27, tested transport/clipboard/focus helpers and the
original #28 requirements before production edits/host checks. Authority is the
full resolutions for [layout B #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input research #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[acceptance #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and [first-release #8](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620).
The pinned research artifact at `cc989fa3a94d400672e51f72a913f50034aec176` and pinned
host source at `3da74415bff57a77c6e08cb5f538191ce87bac17` were inspected. Disposable
branches were not merged. The accepted B surface and first-release data contracts
are preserved.

## Production behavior and exact package

`local-back.ts` latches a Back gesture begun over the focused, active Profiles
region. At press it resolves one existing local dismissal layer: an owned
disclosure, nested confirmation, or Profiles return. Foreign dialogs/native
popups retain their input ownership; a foreign menu blocks a lower local return.
The final handler cancels **mouseup before auxclick**, then executes the local
action once at auxclick. Canceling auxclick alone was insufficient in this host.
Duplicate delivery cannot execute another local action. Leaving the root, a new
press elsewhere, cancellation or native-window blur releases gesture ownership.

The owning viewer's existing native-window/cluster visibility observation,
document focus, root bounds and event target constrain input ownership. There is
no production main-process mouse relay, native command override, global shortcut
or history mutation. Log-reading Back, native keyboard/menu/top-bar Back/Forward
and gestures over host/dock regions retain host ownership. No local Forward
entries are created; native Forward reopens the saved view without a discarded
draft. Existing Back/Escape actions remain available.

Returning calls the existing local Back action: only the editor/draft unmounts;
the log session, surviving query/record/viewport and saved changes remain. No
request, parser, retention, profile-selection, clipboard or persistence logic
changed. The existing view/extension disposal path removes all new listeners.

- Tarball: `dist/freelens-readable-logs-0.1.28.tgz`.
- SHA-256: `7adfc42ba480daaf2fe8dc8bad1c90dcd62a6c3b95b3c99d1fc30fc48c32f487`.
- [Final installed identity](final-identity.json) matches the actual manifest,
  `out/main-0.1.28.js`, `out/renderer-0.1.28.js` and packaged guide to the checkout.
  [Source hashes](source-identity.json) identify inputs; the completion report
  supplies their commit.
- Package/store `freelens-readable-logs`, config/page `readable-logs`, schema 3,
  SDK/core 1.10.3 and external CommonJS host dependencies remain stable.

## Physical delivery and original-criterion evidence

The supervisor notified the user through Dunst only after each recorder was
armed. The user pressed/released the **physical USB Logitech G305 Back button**
once per case. Device recordings contain only Back/Forward codes, without grabs
or injection; each final case contains **BTN_SIDE (275), value 1 then 0**. This
physical provenance is separate from trusted Chromium and virtual-input checks.

| Physical final-package case | Observed result |
| --- | --- |
| [Dirty Profiles](physical-second-trace.json), [hardware](physical-second-hardware.json) | Mouseup and auxclick canceled; exactly one return; focus Edit profiles; history remains index 4/length 5. |
| [Clean Profiles with reading state](physical-clean-trace.json), [hardware](physical-clean-hardware.json) | Same local return; retained query `CV28 retained physical query`, selected record 0 and scrollTop 0; no history movement. |
| [Delete confirmation](physical-confirmation-trace.json), [hardware](physical-confirmation-hardware.json) | Confirmation canceled; Profiles remains; no host navigation. Its owned saved-profile fixture is removed during configuration restoration. |
| [Owned disclosure](physical-disclosure-trace.json), [hardware](physical-disclosure-hardware.json) | Only Log target details closes; Profiles remains; summary focus restored; no history movement. |
| [Logs with Find/inspection](physical-logs-trace.json), [hardware](physical-logs-hardware.json) | Uncanceled; exactly one real host-history step 4 to 3, with native navigation and cluster popstate. Panels do not intercept Back. |
| [Native dock](physical-dock-trace.json), [hardware](physical-dock-hardware.json) | Profiles is open but target/focus belong to the dock; uncanceled; one host step and no local return. No tab is switched/closed. |
| [Parent host/sidebar frame](physical-host-trace.json), [hardware](physical-host-hardware.json) | Parent context 1 receives uncanceled events; one host step; no cluster-local transition. |

Every final physical trace identifies native **main PID 485281, BrowserWindow 2,
WebContents 2**, its focused window/frame, root and cluster URLs, frame routing
metadata and history index. The actual native `browser-backward` app-command is
observed **alongside** native mouseDown/mouseUp `button: back` and DOM pointer/
mouse button 3 (`buttons: 8` on press). The observer never cancels native input.
Local cases have canceled DOM release events and **zero** native/history
traversals despite the app-command. Host/dock/log cases traverse once. This
establishes delivery/cancellation on this host; it is not source inference.

| Original criterion | Evidence and boundary |
| --- | --- |
| 1. Physical local return/confirmation; preserve saved and reading state | Physical dirty/clean/confirmation cases above. [State matrix](state-matrix.json) additionally saves two real profiles, changes global default/order, returns from a dirty draft with trusted pointer Back and verifies exact saved configuration, query and selected original. |
| 2. One transition, repeat and transient priority | Seven physical traces distinguish one local action from one host traversal. Physical confirmation/disclosure cases resolve one layer. [Supplemental duplicate release](state-matrix.json) leaves all local/history state unchanged; it is explicitly synthetic and does not establish hardware repeats. G305 samples contain one press/release, not a held-key stream; no native keyboard Back handler is added. |
| 3. Log-reading and native host navigation ownership | Physical logs, dock and parent-frame cases. [Native Ctrl+[ / Ctrl+]](state-matrix.json) uses a temporary OS uinput keyboard, not synthetic DOM events. [Native menu callbacks and real top-bar clicks](native-history.json) preserve one-step Back/Forward from dirty Profiles. Menu callback API invocation is distinguished from trusted top-bar pointer input. |
| 4. Forward and history boundaries | [Native Forward](state-matrix.json), [menu/top-bar Forward](native-history.json): saved changes survive; drafts do not return; new-view query/selection reset. The implementation adds no local Forward/history entries or history-state writes. Existing-entry traversal in verification is restoration, not production navigation code. |
| 5. Actual physical path, window/frame/focus and timing | Device/native/root/cluster correlation above. [Initial unhandled 0.1.26 path](physical-first-trace.json) and [failed auxclick-only 0.1.27](preliminary-cancellation-trace.json) retain the observations that motivated earlier mouseup cancellation. Final physical traces measure the actual result. |
| 6. Active region, host/dock/other-window/cached scope and disposal | Physical host/dock cases. [Scope checks](scope.json) observe a genuinely unfocused native window and a real cached cluster under a prior Extensions host entry. Forced DOM delivery is supplemental; the cached document still has visible geometry but declines input. [Teardown](state-matrix.json) records all five root mouse listeners going from one to zero on unmount; the extension uses that same registered disposer. Other applications receive no production listener or system override. |
| 7. Combined packaged input/state/focus matrix | Physical table; [state matrix](state-matrix.json); [native history](native-history.json); each physical `*-desktop.json` and `*-state-restored.json`. Back is tested against a real previously visited host page, never a fabricated history fixture. |
| 8. Supported-boundary limitation or safe implementation | Actual Linux DOM cancellation passes even though native app-command is also delivered. No unsupported host patch/global override is needed. Visible Back/Escape remain. Unavailable-platform results are not promoted to support claims. |
| 9. Exact OS/platform and desktop restoration | [Platform coverage](platforms.json), [environment](environment.json), [final cleanup](cleanup.json), and each physical desktop/restoration record. Windows/macOS are unavailable and unverified. |

## Automated checks and actual activation

Commands from the checkout, using the documented local toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum --check docs/verification/28/package.sha256
```

[Node 24.18.0/npm 11.16.0](toolchain.txt), [locked install](locked-install.txt),
[TypeScript](typecheck-final.txt), [100 tests, zero failures/skips](tests-final.txt),
[package](package-final.txt), [actual tarball/CommonJS check](package-check-final.txt),
[byte-identical rebuild](reproducible.txt) and
[locked rebuild identity](locked-reproducible.txt) pass. Existing automated tests
cover preserved data/lifecycle/configuration behavior; installed-host scripts
exercise the new event boundary. [Mechanical scan](design-detector-final.json)
has no findings; [final capture](final-view.png) preserves incumbent styling.

Final 0.1.28 activation used [normal Quit/all prior PIDs exited](fresh-final-maintenance.json),
[silent fresh main launch](fresh-final-maintenance-launch-desktop.json),
Extensions before any cluster, [Uninstall](final-uninstall.json),
[confirmation](final-confirm-uninstall.json), [stable removal](final-removal.json),
[single Install submission](final-install.json), [Enabled version](final-installed.json),
[cluster](final-open-cluster.json), [target](final-show-original.json),
[actual Pod header action](final-header.json) and [usable installed records](identity-0.1.28.json).
**No discovery failure or post-install restart occurred.** Every launch used
process-local polling and same-filesystem TMPDIR. Optional loopback renderer/main
debugging ports are verification transport, not extension runtime requirements.

## Retained failures and restoration

- Initial absence of human input was recorded, not counted as acceptance.
  After supervisor/user availability, the real physical series above completed.
- Initial 0.1.27 packaging caught old versioned manifest paths; corrected before
  that candidate's install. [Failure](preliminary-package-check-version-path.txt).
- Actual auxclick-only 0.1.27 failed host navigation; the [targeted mouseup probe](diagnostic-mouseup-passing.json)
  passed only with a diagnostic listener. That result is not standalone-package
  acceptance; 0.1.28 ships the correction and passes without that listener.
- The first timeout rehearsal restored focus/workspace but a redundant focus
  dispatch recentered the pointer. Original failure/corrections remain recorded;
  [final rehearsal](rehearsal-timeout-final-desktop.json) and every supervised
  physical record restore pointer within two pixels, plus exact workspace/focus.
- Preliminary matrix scripts selected a Find wrapper instead of its input and
  programmatically changed a draft without focusing it; those failed setups and
  configuration recovery are retained. Final helpers focus the actual editable.
- A stale version-specific maintenance-notice selector dismissed zero notices.
  The [parent hit test](parent-find-hit.json) proved this package's install toast
  covered Find. [Scoped dismissal](corrected-dismiss-owned-toast.json) fixes setup;
  final matrix asserts Find is actually open. Duplicate release does not change
  Find visibility or any other state; earlier assertions used the bad baseline.
- Raw CDP and Playwright Ctrl+[ delivery did not trigger the accelerator in those
  trials. They remain failures; OS-injected keyboard checks subsequently pass.
  No speculative production keyboard handler was added.

[Cleanup](cleanup.json) restores Inline, no saved profiles and built-in Default;
only host-owned migration metadata advances to 0.1.28. Owned profile IDs are removed,
clipboard formats/buffer/image hashes are unchanged, native dock tabs are unchanged,
no owned virtual devices/test helpers remain, and [shared Pod UIDs/restarts](shared-preserved.json)
match the preceding committed baseline. No Kubernetes fixture was created or
mutated: this ticket used read-only shared log/metadata requests. The original
shared `single-json/json` viewer remains paused, Readable, without query/selection.
Freelens stays on workspace 7 and the user's actual prior desktop is restored.

For a coordinated reproduction, start from that simple baseline and run
`guided-trace.py <new-label>` with `CV28_CONTEXT=dirty|clean|confirmation|disclosure|logs|dock|host`
and `CV28_TIMEOUT=30`; notify only after its armed marker exists. The helper never
injects the measured Back gesture and automatically restores after release/timeout.
The local runtime ready/armed notes are intentionally not committed.

Only #28 source, package metadata, local checklist and verification evidence are
committed, plus the authorized runner-written #27 Status update. Prior scratch,
untracked `.gitignore`, `ralph`, `docs/ralph.md`, other queued tickets and runtime
`.ralph` data are preserved. No comments, issue closures, external messages,
pushes, merges, releases or global agent/model changes were performed.
