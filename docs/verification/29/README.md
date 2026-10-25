# Ticket 29 — scoped shortcuts and a temporary reference

All eleven original criteria are satisfied on **freelens-readable-logs 0.1.31**,
**Freelens 1.10.3 / Electron 41.10.0**, Arch Linux / Hyprland / Wayland,
2026-10-25 UTC. Windows and macOS are unavailable and **unverified**. Linux
non-US input is verified with a Russian layout on the owned temporary keyboard;
OS AltGraph and a live OS IME are unverified. Supplemental guard tests are not
promoted to native platform evidence.

Only #29 was selected on `implementation/compact-view`. Local #27 was done with
committed evidence; #25–28 were done, while #30 still depended on #29.
[Assignment](assignment.json) claims GitHub #29 before implementation. The issue
remains open. No prototype/research branch was merged.

## Authority and production behavior

Read `AGENTS.md`, tracker/domain guidance, `GLOSSARY.md`, the full development
guide and verification reports 26/27/28 before editing or host interaction.
Read original #29 and the full accepted resolutions for
[layout B #21](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[navigation #22](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input research #23](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755),
[final contract #24](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
and [first-release #8](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620).
Pinned research at `cc989fa3` and host SearchInput/native Logs handlers were
inspected; production changes extend the accepted B surface.

`local-shortcuts.ts` selects the actual primary modifier: Ctrl on Linux/Windows,
Cmd on macOS. Exact combinations reject extra/wrong modifiers, AltGraph and
composition. Per-view resolvers call the same Find, match navigation, Save and
To bottom actions as visible controls. Foreign editors, confirmations, native
popups, menus, hidden/inactive views and foreign focus retain ownership. Save
holds are consumed without repeated saves or fallthrough after a successful save.
Ordinary editing, Tab traversal and native activation remain available.

The renderer registers a frame-local capture dispatcher during extension
activation, before native Logs mounts its selection capture handler. It cancels
only a command owned by an eligible viewer. This fixes the measured stale-native-
selection conflict without changing host search state, clearing selection as a
workaround, replacing host listeners, or using a global/native shortcut override.
The extension-lifetime dispatcher is removed on deactivation. View teardown
removes its callback, observers and composition/key-release/blur listeners;
without a viewer the dispatcher has no action or input ownership.

Display options contains **Shortcuts**. The reference uses existing colors,
typography and controls, occupies no permanent band, and closes through visible
Close or the existing one-layer Escape resolver. Focus returns to Display options,
the nearest surviving opener after its menu closes. Controls expose platform hints
in tooltips and relevant accessibility shortcut metadata. Clicking inspector or
reference text retains local focus through `tabIndex=-1`, without adding a Tab stop.

No parser, retention bound, request/lifecycle logic, profile-selection algorithm,
clipboard adapter or configuration schema changed. Host Back/Forward, reload and
palette remain host-owned; no other binding or history entry was introduced.

## Exact package and automated checks

- Tarball: `dist/freelens-readable-logs-0.1.31.tgz`.
- SHA-256: `0d1fb960c9a5febab23537e466fdff72b0e001faa91c7262659c981e60f7e3cc`.
- [Final installed identity](final-identity.json) matches manifest, versioned
  `out/main-0.1.31.js`, `out/renderer-0.1.31.js` and packaged guide byte-for-byte.
- Package/store `freelens-readable-logs`, page/config `readable-logs`, schema 3,
  SDK/core 1.10.3 and host-external CommonJS dependencies remain stable.
  [Source hashes](source-identity.json) identify inputs; the completion report
  supplies their commit.

Commands from this checkout:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum --check docs/verification/29/package.sha256
```

[Node 24.18.0/npm 11.16.0](toolchain.txt), [locked install](locked-install.txt),
[TypeScript](typecheck.txt), [101 tests, no failures/skips](tests.txt),
[package](package.txt), [CommonJS/tarball inspection](package-check.txt) and
[locked byte-identical rebuild](reproducible.txt) pass. New parameterized tests
check modifier grammar; existing navigation tests cover exact originals, decoded
messages, literal matching, profile reformatting and window recomputation. They do
not establish Windows/macOS OS input. The [mechanical scan](design-detector.json)
has no findings. [Desktop](shortcuts-desktop.png), [narrow](shortcuts-narrow.png)
and [measured visual checks](visual.json) retain incumbent styling without local
horizontal overflow. Narrow uses an explicit 600×900 renderer viewport, not a
claim about a different native platform. [Final view](final-view.png) is restored.

## Original criteria and final-package evidence

| Criterion | Evidence |
| --- | --- |
| 1. Actual platform modifier, exact combinations, editing/IME ownership | [Scope matrix](case-scope.json): trusted wrong/extra modifiers, foreign editables, Profiles, dock and ordinary Tab. Actual native Russian `key=а`, `code=KeyF` is not aliased to Latin Find in logs. [Editing](editing.json) checks actual copy/paste and Shift selection, plus explicitly supplemental AltGraph/composition checks. Unit grammar covers Ctrl/Meta separately. |
| 2. Primary+F in owned log context | [Native stale-selection conflict](find-conflict.json): trusted pointer drag creates real native Logs selection; OS-delivered Ctrl+F focuses only local Find, retaining native query. [Logs](case-logs.json) covers viewport, retained query selection and inspector controls. [Pointer text checks](inspector-pointer.json) cover Inline/Side/Bottom text. Profiles, recovery confirmations and foreign editors are excluded in scope/editing matrices. |
| 3. Enter and repeat match navigation | [Logs](case-logs.json): no-query open/focus; Enter/Shift+Enter; primary+G/Shift+G; hidden retained query; first/next/previous/wrap/no-match. Enter outside Find stays unowned; native Space still inspects. |
| 4. Preserved predicate/count/recomputation/query lifetime | Same logs matrix uses 1,000 real retained records, counts once per record, and explicit paused Refresh after real producer output evicts the searched oldest record. Existing navigation tests exercise literal application-text OR decoded active-message matching and profile/window recomputation. New-view query reset is checked in lifecycle. |
| 5. Draft-only Save, unchanged/invalid/failed/held paths | [Profiles](case-profiles.json): absent draft stays unowned; input and textarea Save; unchanged draft; valid Save stays in Profiles; invalid validation retains draft; a controlled adapter exception retains error/draft and executes once despite held input. The exception is injected at the existing save adapter, not claimed as a new disk-durability test. Saved configuration is restored afterward. |
| 6. To bottom scope without Resume | [Logs](case-logs.json): OS Ctrl+End follows from viewport while paused. Inspector Ctrl+End and Shift selection variants remain unconsumed; their native default scrolling is allowed. Native row focus/activation and parser scope share the same command. |
| 7. One-layer reference dismissal, held input and lifecycle scope | [Reference](case-reference.json), [pointer reference dismissal](visual.json), [per-view teardown](lifecycle.json), [host focus](host-focus.json) and [inactive guards](inactive.json). Teardown records one callback to zero, two composition listeners to zero, and window key-release listener removal. The owning extension disposer removes the frame dispatcher. Existing Escape/Back repeat behavior is unchanged. |
| 8. Hints and small menu entry | Reference/visual evidence and installed screenshots above; platform hint text is measured in visual.json. Close/Escape returns focus to Display options. No permanent band is added. |
| 9. Host reserved commands and intentionally unbound actions | [Lifecycle](lifecycle.json): OS primary+[ / primary+] traverse exactly one actual host entry; native primary+Shift+P opens the real host palette; primary+R reloads the host document. Host reload returns to overview; the target is reopened through its actual Pod header action afterward. Local parser leaves these and all other excluded bindings unowned. |
| 10. Actual packaged coexistence and input contexts | Native stale-selection Find, logs/profiles/scope/reference/editing/lifecycle matrices above. Native Menu and select ownership are tested with real mounted host surfaces. [Parent-frame input](host-focus.json) focuses actual Extensions search while the cluster is cached; local Find remains closed. Inactive forced DOM events are supplemental only. |
| 11. Separate platforms, non-US case and desktop restoration | [Platforms](platforms.json): Linux native Ctrl and Russian-layout results; Windows/macOS unavailable/unverified; live IME and OS AltGraph unverified. Every `*-desktop.json` restores actual prior regular workspace and focused window, including special-workspace focus. Freelens remains on workspace 7. |

Reproduction uses the existing verification-only Playwright 1.64.1 installation
under `.scratch/compact-view/26/browser-driver`; no new production dependency:

```sh
CV26_PLAYWRIGHT=1 PYTHONDONTWRITEBYTECODE=1 python3 docs/verification/29/desktop.py script case-profiles docs/verification/29/input-cases.mjs profiles
```

Other cases are `logs`, `scope`, `reference`; logs requires the existing
read-only `changing-logs` target with 1,000 records. `find-conflict.mjs` requires
the existing `single-json` native dock tab mounted and the extension target usable.
Helpers use only owned temporary uinput devices and destroy/release them on exit.
No physical hardware keyboard provenance is claimed or required by this ticket.

## Installation, retained failures and restoration

Final activation used [normal pre-maintenance Quit/all old PIDs exited](fresh-maintenance.json),
[silent fresh launch](fresh-maintenance-launch-desktop.json),
[Extensions before clusters](extensions.json), [Uninstall](uninstall.json),
[confirmation](confirm-uninstall.json), [stable removal retaining settings](removal.json),
[one Install submission](install.json), [Enabled 0.1.31](installed.json),
[cluster](open-cluster.json), [actual Pod header](header.json) and
[usable records](usable.json). **No discovery failure or post-install restart**
substituted for activation. Launch uses process-local polling and same-filesystem
TMPDIR. Later native reload tests happen after successful activation and verify a
reserved host command; they are not installation recovery.

Failures remain separate from final passes:

- 0.1.29 root-only capture let native Logs seed its query first. Its package/hash
  and [measured initial observation](early-0.1.29/find-conflict-observation.json)
  are retained; that observation was reconstructed from recorded tool output
  because a later helper reused its temporary filename. Early activation dispatch
  fixes it in 0.1.30/0.1.31, without a host patch.
- 0.1.30 clicking Side/Bottom inspector text left BODY focused, routing Find to
  native search. [Original pointer measurements](early-0.1.30/inspector-pointer-0.1.30.json)
  remain; 0.1.31 passes all three layouts with a focusable inspector region.
- The first 0.1.31 Find trial failed before explicit usable-view readiness; its
  preceding identity snapshot has zero rows. [Failed input](preliminary-0.1.31-input-readiness.json)
  remains a failure; its precise timing cause is not established. An explicit
  usable-view wait precedes final native acceptance. The stale-selection case also
  passes after a native host reload and target reentry.
- Preliminary observer assertions expected consumed Save events to reach a later
  window observer; they cannot after stopImmediatePropagation. Other assertions
  expected excluded commands to retain local focus, or native Ctrl+End to suppress
  ordinary document scrolling. Corrected checks distinguish local actions from
  native behavior; original `preliminary-*` results remain.
- Initial pointer geometry was outside the scrolled viewport; the corrected helper
  scrolls the actual target into view before trusted input.
- Preliminary lifecycle scripts assumed adjacent entries always unmount the viewer,
  then assumed host reload restores its local route. Actual history includes
  same-view details entries; native Back/Forward can traverse those without a
  local dismissal. Final tests measure exact host indices and actual teardown,
  observe host reload returning to overview, then reopen through the Pod header.
  The resulting setup/restoration failures are retained separately.

[Cleanup audit](cleanup.json) restores the full application configuration (Inline,
no profiles, built-in Default); only host migration metadata advances to 0.1.31.
No Kubernetes fixture was created or changed. Shared Pod UIDs/restart counts,
dock tabs and owned-device cleanup [pass](shared-preserved.json). The original
`single-json/json` view is paused, Readable, without query, selection, reference,
recovery marker or test helpers. Native dock search is restored.

Clipboard audit deliberately uses **per-probe** ownership. Newer 12-character
clipboard content differs from the initial empty clipboard and matches no known
owned test content. That mismatch does not establish an agent mutation; it was
left untouched under supervisor guidance. Final [copy/paste evidence](editing.json)
records the newer snapshot's buffer hash and the identical restored hash, plus
format/image checks. The helper restores only a proven owned sentinel or an
unchanged snapshot, preserving any newer unknown content. No unrelated clipboard
text is included in evidence. The task-baseline comparison is recorded as a
mismatch, not relabeled as a pass.

Only #29 implementation, package metadata, local checklist and evidence are
committed, plus the authorized runner-written #28 Status update. Prior scratch,
untracked `.gitignore`, `ralph`, `docs/ralph.md`, other tickets and runtime `.ralph`
remain outside. No comments, issue closures, external messages, pushes, merges,
releases or global agent/model changes were performed.
