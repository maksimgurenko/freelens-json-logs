# Ticket 25 — compact black log workspace

Implemented only GitHub #25 on `implementation/compact-view`. It was the lowest
ready local ticket with no blockers and was assigned to `@me` before source edits
([assignment](assignment.json)). GitHub remains open. No comments, messages,
pushes, merges or releases were made.

The accepted [B layout](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104),
[navigation decision](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015),
[input research](https://github.com/maksimgurenko/freelens-json-logs/issues/23#issuecomment-6391059755)
and [final contract](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804)
were read in full, together with the linked
[first-release contract](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620).
The available prototype worktree at
`/home/max/dotfiles/html_docs/html_docs/freelens-logs-ux-prototype`, commit
`a293e92`, was compared directly, especially `variantB()` and its toolbar,
Find, disclosure and inspector CSS. Production retains its existing session,
formatting, Find predicate, editor, storage, recovery and clipboard code. No
prototype or research branch was merged or modified.

## Exact package and automated results

Final **freelens-readable-logs 0.1.22**, actual **Freelens 1.10.3**, Arch Linux /
Hyprland / Wayland, 2026-10-25 UTC (2026-10-24 local). Main process **286618**
remained running from fresh maintenance through final verification. Tarball:

`dist/freelens-readable-logs-0.1.22.tgz`

SHA-256:
`ef7c13ad3181b96fab8e5e925f37e6c6140c89b9ce3796003756566725f8b95e`.

[Installed identity](installed-identity.json) compares the manifest, both actual
installed bundles and the packaged development guide to the build. Every hash
matches. Versioned CommonJS entry paths are `out/main-0.1.22.js` and
`out/renderer-0.1.22.js`. Package/store ID `freelens-readable-logs`, configuration
name `readable-logs`, page ID and schema 3 remain unchanged. SDK/core remain
pinned to 1.10.3; host libraries remain external. Lockfile changes are only the
root package version fields.

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
sha256sum dist/freelens-readable-logs-0.1.22.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/25/package.sha256
```

[Node 24.18.0/npm 11.16.0](toolchain.txt), [locked installation](locked-install.txt),
[strict TypeScript](typecheck.txt), [100 tests, zero failures/skips](tests.txt),
[package creation](package.txt), [tarball/CommonJS inspection](package-check.txt),
[second build](rebuild.txt), [identical bytes](reproducible.txt) pass.
[Mechanical design scan](design-detector.json) reports no findings. Existing
core/request/configuration tests cover the preserved first-release behavior;
the changed UI is verified against the installed package below.

## Original criteria and final-package evidence

| Original criterion | Implementation and passing evidence |
| --- | --- |
| Accepted B toolbar and visible labeled profile action | `Viewer` has one compact toolbar with target disclosure, container/profile groups, authored edit icon plus **Edit profiles**, Pause/Resume, Refresh and Find. [Ordinary layout/identity](final-layout.json), [capture](final-layout.png). At the observed ordinary width it is one 44.87px band; this is an observation, not a fixed contract. |
| On-demand Find, retained query/match and temporary lifetime | [Layout/Find matrix](layout-find.json) checks initial hidden state, explicit open/close/reopen, same query/count/current record and all 1,000 rows retained. [Departure](new-view-before.json) and [actual new view](new-view-after.json) prove query empty and Find closed on reopening. Closing focuses the visible Find opener; broader Escape ownership is #27. |
| Existing literal OR predicate, count, wrapping and recomputation | [Matrix](layout-find.json) checks case-insensitive literal matching, 99-record Previous/Next wraparound, hidden original fields, decoded extracted messages, no regex interpretation, Kubernetes-prefix exclusion, empty/no-match feedback, profile changes and an actual empty window. The existing `findMatches`/`moveMatch` implementations are unchanged. After a profile removes the current match, navigation selects a new one using the existing cursor contract. |
| Display options, independent technical identity, footer and actionable feedback | [Six mode/layout cases](mode-layout-matrix.json), [full technical identity](presentation-auto.json), [ordinary disclosures](final-layout.png), [real socket error and retained records](state-scenes.json), [error capture](request-error.png), [explicit Retry](recover-scenes.json), [loading](loading.json). Timestamps/wrap and original inspector tabs/copies pass in [matrix](layout-find.json). Existing lifecycle/slow/recovery notices and actions remain outside the disclosures; their original handlers are unchanged. |
| Pitch-black Readable/Raw including empty space; reclaimed chrome | Computed canvas is `rgb(0, 0, 0)` in [Readable/Raw matrix](mode-layout-matrix.json), [genuine empty Readable](layout-find.json) and [empty Raw](empty-scene.json). [Empty capture](empty-raw.png), [ordinary](final-layout.png), [narrow Raw](narrow-raw-side.png). The records' existing 12px/1.65 monospace typography is retained; surrounding padding and permanent bands are reduced. Empty-success feedback is inside the black canvas. |
| No empty inspector; selection/close/expiry; saved preference; original content | [All six combinations](mode-layout-matrix.json) open on selection and return all pane space on Close. [Measured closed/open geometry](layout-find.json) covers Inline/Side/Bottom. [Real 1,100-record append](emit-1001-2100.json) evicts the selected record; [expiry check](expiry-after.json) proves no reserved pane and saved Side retained. [New view](new-view-after.json) retains chosen Bottom; initial Side remains the unchanged configuration default. [18 clipboard comparisons and complete object/tab checks](layout-find.json) use retained original application/transport strings, including whitespace, blanks, Unicode, escapes and Kubernetes precision. |
| Ordinary, long-label and narrow adaptation; accessible names/focus | [Width matrix](widths.json) exercises a real long Pod/container name and saved long profile at 1600/1200/1024/800/600/360px. No visible toolbar/Find/footer control exceeds the view and no extension-wide horizontal overflow occurs. Logical groups wrap and Side stacks vertically at narrow container widths. [Final narrow capture](final-narrow.png), [Find/open inspector capture](narrow-raw-side.png). [Trusted host keyboard dispatch](keyboard.json) checks button/summary/row activation, Tab/Shift+Tab and the visible Find focus outline. |
| No implicit pause; preserved data/state and quiet status | [Automatic controls/inspection](presentation-auto.json) observes a real automatic request with disclosures and inspection open. [Quiet refresh](quiet-refresh.json) observes zero routine snapshot banners, zero top movement and zero height movement. [Held real request](loading.json) retains the same snapshot and accessible busy state without moving logs; paused Refresh stays paused. [Bounds/expiry](expiry-after.json) retains exactly 1,000 records below 5 MiB. All 100 existing deterministic tests pass; no parsing, request/lifecycle, matching, persistence or copy implementation changed. |
| Verify required production states and separate evidence classes | The linked actual-package probes/captures cover ordinary, genuine empty, held/loading, real error/recovery, long names, constrained widths, both presentation modes and every inspector layout. Width constraints are applied to the installed view's container, not a claim of physical OS-window resizing. Browser prototype observations from #21 are visual/interaction evidence only. No new browser fixture is counted as production or native evidence. |

## Host workflow and reproducible tools

Read `docs/local-development.md` and verification reports 14, 15 and 19 before
host checks. The fresh main window opened Extensions **before any cluster**.
The final update used [normal pre-maintenance Quit](normal-pre-maintenance-quit.json),
[fresh launch](fresh-update-desktop.json), [Extensions](extensions.json),
[Uninstall](uninstall.json), [confirmation](confirm-uninstall.json),
[stable removal retaining settings](removal.json), [one Install submission](install.json)
and [Enabled 0.1.22](installed.json), then [cluster](open-cluster.json),
[current target UID](show-fixture.json), [real Pod-header action](header.json)
and [usable package](setup.json). There was **no post-install restart** and no
failed package discovery in either the preliminary or final installation.

Launch environment was process-local `CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100`
with `TMPDIR=/home/max/.cache/freelens-readable-logs/tmp`, verified on the same
filesystem as the extension directory. The first 0.1.21 launch initially mapped
on workspace 6 despite the silent request; the helper corrected it to workspace
7 before any host interaction. All tested host windows remained on workspace 7.

`run-probe.py <root|770814> <name-or-source-path> [output-label]` uses the existing
opt-in localhost CDP transport and fails on exceptions. `desktop.py capture <name>`
and `desktop.py keyboard keyboard` focus only for the operation and immediately
restore the actual preceding desktop/focus. The per-operation `*-desktop.json`
records show before/after identities, including changes in the operator's active
workspace during the session. No fixed prior workspace is assumed.

[Keyboard evidence](keyboard.json) uses trusted Chromium `Input.dispatchKeyEvent`
after focusing the owning host/frame. It establishes these ordinary packaged
control interactions, not physical mouse gestures or OS-level shortcut behavior.
Windows and macOS are **unverified**. Mouse Back, drag-versus-inspect/badge
selection, contextual Escape, shortcut routing and platform-primary modifier gates
belong to #26–29 and are not claimed complete here.

The owned [fixture](fixture.json) uses real container stdout and timestamped public
SDK reads. `emit.py 1001 2100` appends through that container's stdout FD. The
[error probe](probes/state-scenes.js) redirects only its owned log request to a
closed local port, obtains real `ECONNREFUSED`, retains 1,000 records and uses the
visible Retry to recover. No log response body is substituted. The loading probe
holds and then releases exactly one owned request in `finally`.

## Preliminary failures and limits

Earlier **0.1.21** results are retained under [early-0.1.21/](early-0.1.21/).
The visual pass exposed context truncation before the Pod name. Final 0.1.22
prioritizes namespace/Pod in the compact breadcrumb, with full cluster/context in
its disclosure, and prevents routine footer status wrapping. Versioned entry names
changed for the final installation; earlier observations are not relabeled as final.

Preliminary probe failures remain excluded from acceptance:

- The first Find selector matched its `role=search` container rather than its
  input; another assertion expected recomputation to select a new cursor, and
  a rerun assumed the inspector's retained tab was All fields. Final selectors
  and expectations follow the existing state contract.
- [PNG comparison](preliminary-png-encoding-comparison.json) compared encoded
  PNG bytes after Electron re-encoded a restored image. Final clipboard checks
  preserve and compare image pixels and original formats, and exact buffers for
  non-image formats. The original application/transport clipboard comparisons
  themselves passed. Original image pixels are restored in `finally`.
- The [first keyboard driver](preliminary-keyboard-desktop.json) failed native
  button activation. The final driver brings the owning page to front and supplies
  the Enter text event; [trusted events and focus results](keyboard.json) pass.
- A [pre-launch focus assertion](preliminary-quit-destroyed-focus.json) compared
  the old focused Freelens window after normal Quit had destroyed it. All old
  processes had exited. The fresh main was launched and replacement focus
  requested before maintenance; the [continuation record](normal-pre-maintenance-quit.json)
  retains that distinction. This was not discovery failure or a post-install restart.
- [Final-view preparation](preliminary-final-view-not-paused.json) initially
  checked Pause before pausing the newly opened shared view. The final helper
  explicitly pauses, waits and verifies the rendered state.

This ticket does not rerun the complete #19 release/performance or recovery matrix;
existing automated coverage remains passing and the affected presentation/request
paths were exercised above. Full compact-release integration is #30.

## Restored state

[Cleanup](cleanup.json) deletes only the owned saved profile and restores the
original complete application configuration: Inline inspection, no profiles,
Default global default. Only host-owned migration version metadata changes from
0.1.20 to 0.1.22. User clipboard content/formats were restored; image pixels were
compared without logging the image. No reset or backup was performed.

[Final view](final-review.json) is the original shared `single-json/json` target,
paused, Readable, with new-view defaults, no selected record, no empty inspector,
and no transport/store helper. Existing native dock tabs remain available. The
[final screenshot](restored-shared-view.png) and [desktop restoration](restored-shared-view-desktop.json)
leave Freelens on workspace 7 and preserve the actual prior workspace/focused window.
[Owned namespace deletion](fixture-cleanup.txt) completed; [shared UIDs/restarts](shared-fixtures-preserved.json)
are unchanged. Kubeconfig, RBAC, shared fixtures and unrelated settings were not changed.

Only this ticket, production changes and its verification evidence are committed.
Pre-existing untracked files, other ticket queues, `.scratch/readable-logs`,
`.gitignore`, `ralph`, `docs/ralph.md` and runtime `.ralph` data remain outside it.
