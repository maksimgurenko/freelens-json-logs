# Freelens 2.0.0 Linux handoff acceptance

The exact Readable Container Logs archive passed the installed Linux checks on
2026-11-19. This report covers [issue #76][issue] and the
[package acceptance decision][decision].

## Package and host identity

| Item | Verified identity |
| --- | --- |
| Extension revision | `220f3c00d1a050aa8c0d415773ac7010a825ed63` |
| Archive | `freelens-readable-logs-v2-0.1.36.tgz` |
| Archive SHA-256 | `7f959732f787000d14bcfb07448b34288a1367fa8e093eaf7ba45420a5d63847` |
| Manifest | Package and explicit store name `freelens-readable-logs-v2`, version `0.1.36`, `engines.freelens` `^2.0.0`, build SDK `2.0.0` |
| Official host | [Freelens v2.0.0][release] Linux amd64 AppImage, Electron 44.10.0, Chromium 152.0.7977.169 |
| AppImage SHA-256 | `372a019765170ad420b0224d653d488ebebc41faa972052fa3df1337c2cb11d1` |

The handoff `REVISION` matches the CI revision. Both the handoff and
downloaded [CI artifact][ci] passed their `SHA256SUMS` checks, and
`cmp` verified identical archive bytes. The official AppImage matched its
release checksum. The extracted executable, `app.asar` and Kubernetes proxy
used by the test matched their contents in the AppImage.

The private host installed the handoff tarball through **Extensions** and
reported version 0.1.36 as **Enabled**. Freelens labeled the local file
**unverified** because its installer was given a local archive path without
a checksum. The independent checksum and byte comparisons establish its
identity. Installed main, renderer, CSS and worker files matched the archive
byte for byte. CI's package check verified the build boundaries and absence
of the Freelens 1 loader and legacy React/MobX shims.

## Verification results

| Check | Status | Evidence |
| --- | --- | --- |
| Full automated suite | Pass | [CI run 44624741861][ci] passed typechecking, Node tests, Python observer tests, mounted headless Chromium, built-worker checks, resource smoke, package inspection and reproducibility. The completed [Freelens 1.10.3 Linux Find baseline][find] covers unchanged behavior. |
| Pod header, target and separate viewer | Pass | CDP clicked the Pod-header action in the fixture cluster. The extension Page matched cluster, namespace, Pod name and UID, and opened the annotated `json` container. Switching to `empty` cleared the old snapshot. Switching back showed the JSON records. |
| Snapshot and eligibility | Pass | CDP network observation showed metadata reads continued during Pause while log polling stopped. Refresh made one named-container read with the expected snapshot parameters and kept Pause. Resume fetched fresh data. Polling continued while a private auxiliary window had focus, stopped when the root route left the cluster, and resumed on return. The inactive cluster iframe's document remained visible to Chromium during that route check. |
| Settings separation and persistence | Pass | The disposable legacy file specified Bottom inspection. On first launch the v2 viewer used built-in Default and Side inspection. Main saved named profiles, matching order, global default and Bottom inspection to the v2 file. The saved values survived full quit/restart and extension disable/re-enable. The legacy file matched the seed bytes after first launch and subsequent saves. |
| Settings fallback and reset | Pass | Malformed, future-schema and unreadable files used Default and Side with saving inhibited and live logs available. Cancel preserved the file. An obstructed backup and an unreadable source each prevented replacement. Trusted private Wayland Enter confirmed a later reset. Its backup matched the malformed input byte for byte, including Unicode and line endings. A new profile and Inline inspection saved after reset and survived another restart. |
| Clipboard and shortcuts | Pass | Private Wayland keyboard input invoked both copy controls. Private `wl-paste` matched the exact application text and full transport line from the Kubernetes fixture. Trusted Tab, Ctrl+F, Ctrl+G, Enter and Ctrl+Shift+G selected the reading origin, opened Find, moved forward, wrapped and moved backward. CDP confirmed native focus and the expected ordinals through a 1,000-record result. |
| Native window behavior | Pass | Electron's native BrowserWindow API moved focus to and closed a private auxiliary window. Hiding the viewer's native window exited its Find worker. Showing the same window restored Find with its original query and result and one live worker. |
| Main-owned Find and cleanup | Pass | The live viewer received results from the real main-process worker. Leaving the viewer released its session through the close IPC and exited its worker in about 33 ms. Removing the owner frame during a held request cleared owners, senders, subscriptions and the owner watch and exited the worker about 554 ms after dispatch, before the request deadline. |
| Extension disable and normal app quit | Pass | Main inspection held a real worker reply to establish pending work. The Extensions UI deactivated the package with one worker live and its awaited deactivation returned with zero. Re-enable restored service and rejected the old owner token. On a separate pending request, normal `app.quit()` emitted the worker exit before the process exited with code 0. The restart pass recorded nine starts and nine exits with peak concurrency one. |

## Private-session observations

The Linux UI playbook's diagnostic display stack ran headless labwc and nested
Hyprland with the modified Aquamarine diagnostic. The guards checked the
private compositor and host PIDs, workspace 7, runtime directory ownership,
Wayland socket, profile and localhost CDP listeners. CDP drove setup and
observed renderer, network and main state. The native routes used only the
private Wayland socket or BrowserWindow APIs on the identified private host.
The worker observer logged real thread exit events and held replies only in
the lifecycle probes that required pending work.

The real desktop observer recorded six focus notifications, all for the
original window, and no workspace changes. Pointer readings differed at the
endpoints. The observer did not track pointer motion. The test sent no pointer,
keyboard, clipboard, focus or workspace commands to the real desktop. Six
private host launches and both private compositors exited normally. The owned
profile, runtime, configuration and cache were removed. The pre-existing
Kubernetes fixture was read only.

Raw evidence is retained locally in
`.scratch/verification/76/host/official-exact/`.

| Check | Files in the private run directory |
| --- | --- |
| Archive, runtime and regression suite | `artifact-identity.log`, `runtime-identity.json`, `install-enabled.log`, `ci.json` |
| Pod header, snapshots, eligibility and clipboard | `open-first.log`, `viewer-v2-acceptance.json` |
| Settings separation and persistence | `legacy-seed.sha256`, `legacy-final.log`, `save.json`, `persisted-restarted.json`, `persisted-reenabled.json`, `before-disable.sha256` |
| Settings recovery | `fallback-malformed-recover.json`, `fallback-future.json`, `fallback-unreadable.json`, `reset-backup.sha256`, `persisted-after-reset.json` |
| Native input, windows and desktop isolation | `native-find.json`, `native-window.json`, `native-commands.jsonl`, `isolation.json`, `real-desktop.json`, `cleanup.json` |
| Find session and worker teardown | `find-lifecycle-page-departure.json`, `find-lifecycle-frame-loss.json`, `find-lifecycle-disable.json`, `find-lifecycle-quit-pending.json`, `worker-events.jsonl`, `launch-restarted.log` |

Two early probe failures are retained. One probe targeted a removed renderer
field and was updated to use the SDK's scoped IPC. The other assumed exactly
one worker start after showing the window. The corrected probe confirmed
matching results and one live worker after an observed sequential replacement.

Windows and macOS remain unverified. Coverage is limited to the private
diagnostic display and virtual input routes. Release publication, the user's
installation and physical-device tests were outside this acceptance run.

[issue]: https://github.com/maksimgurenko/freelens-json-logs/issues/76
[decision]: https://github.com/maksimgurenko/freelens-json-logs/issues/70#issuecomment-7020197253
[release]: https://github.com/freelensapp/freelens/releases/tag/v2.0.0
[ci]: https://github.com/maksimgurenko/freelens-json-logs/actions/runs/44624741861
[find]: https://github.com/maksimgurenko/freelens-json-logs/blob/98c215e62c5f821cb7a2b2bac194b21c9f5ef3f1/docs/verification/48/native-completion-20261028.md
