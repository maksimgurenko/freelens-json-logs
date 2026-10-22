# Disposable local installation experiment

Observed 2026-10-22 on the maintainer's installed **Freelens 1.10.3**
(`freelens-bin 1.10.3-1`) for
[Choose a reliable local installation and activation procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10).

**Awaiting the maintainer's verdict.** This branch is evidence, not the production
extension. Do not merge it or open a PR. The original integration spike is in
[the adjacent directory](../host-integration/README.md).

## Proposed first-release procedure

1. Start from a fresh main window and open **Extensions** before opening any
   cluster. If a cluster has already been opened in this session, fully quit and
   reopen Freelens first. Returning to Extensions from an already-open cluster
   does not establish this starting state: its frame can remain loaded. A host
   just launched without opening a cluster already meets this requirement.
2. For an update or same-version replacement, use the installed extension's
   menu → **Uninstall**, confirm, and wait until its row disappears and removal
   completes. Keep its saved extension settings. Do not install over the
   existing version through the reinstallation prompt.
3. Enter the new tarball's absolute path and click the form's **Install once**.
   Wait for installation to complete; check the displayed version and Enabled
   status. Do not repeat the click while waiting. The tested explicit
   uninstall/install path did not need the overwrite confirmation.
4. Open the cluster and the Pod's readable-log action without another restart.
   Verify the expected version, usable log view, and retained settings. The
   host's Enabled label alone is insufficient evidence.
5. Perform any enable/disable maintenance from the same fresh-launch main-window
   state. Live re-enabling with an already-loaded cluster was not tested.

This procedure requires at most one restart before maintenance, to establish
the tested main-window-only state. The initial proposal also required a restart
after installation; the maintainer challenged that requirement, and the focused
0.0.2 → 0.0.3 test below demonstrated an upgrade without it. The second restart
has been removed. The decision is whether this simpler maintenance sequence is
acceptable for the maintainer's first release. The experiment establishes neither
a hot-update guarantee with loaded cluster frames nor broad support for other
versions or packages.

## Observed sequences

The baseline was the existing user profile with the spike uninstalled, a retained
disabled registry entry, and the fixture cluster frame already loaded. This was
not pristine user data. Only the named experimental extension was changed.

| Sequence | Result | Evidence |
| --- | --- | --- |
| Existing main and cluster frames → Extensions → one form Install click for rebuilt 0.0.1 | 51 main activations and 51 deactivations in one second. Main received SIGTERM to contain the cycling; all old host processes exited. | [Click receipt](evidence/hot-install-click.json), [counts](evidence/hot-install-observation.json), [excerpt](evidence/hot-install-log-excerpt.txt) |
| Fresh launch after that install, without opening a cluster | 0.0.1 shown Enabled; one main activation and no deactivation at capture. | [Launch](evidence/cold-launch.json), [UI](evidence/after-cold-launch.json) |
| Main window only → explicit Uninstall → wait → fresh 0.0.1 Install | Uninstall deactivated once; install activated once, with no further main transition during its eight-second observation. | [Removal](evidence/root-only-uninstall.json), [installation](evidence/root-only-install.json), [installation UI](evidence/root-only-install-ui.json), [loaded contexts](evidence/root-only-contexts.json) |
| Main window only → same-version Install → host's separate overwrite confirmation | Old installation was removed; installation then failed. Extracted source remained, but the installed package path was absent. | [Prompt](evidence/reinstall-prompt.json), [confirmation observation](evidence/root-only-reinstall.json), [later failure notification](evidence/reinstall-later-ui.json), [disk facts](evidence/reinstall-later-disk.json) |
| Full quit/relaunch after failed same-version reinstall | UI still showed Enabled, but main could not find its module, and the Pod-header action was absent. Restart alone did not repair this failed reinstall. | [Process exit/relaunch](evidence/reinstall-recovery-restart.json), [UI](evidence/reinstall-recovery-ui.json), [disk](evidence/reinstall-recovery-disk.json), [cluster UI](evidence/reinstall-recovery-cluster-ui.json) |
| Uninstall the broken entry → full restart → clean 0.0.1 Install before opening a cluster | One activation, no deactivation during eight seconds. Opening the fixture cluster subsequently provided the header action and working page. A marker entered through that page reached disk. | [Restart](evidence/clean-before-marker-restart.json), [install](evidence/second-clean-install.json), [page](evidence/v1-marker-page.json), [saved marker](evidence/marker-before-upgrade.json) |
| Full restart → main window only → explicit Uninstall 0.0.1 → wait → Install 0.0.2 | One removal/deactivation and one installation/activation, with no cycling during either eight-second observation. | [Restart](evidence/before-explicit-upgrade-restart.json), [contexts](evidence/before-explicit-upgrade-contexts.json), [uninstall](evidence/explicit-upgrade-uninstall.json), [install](evidence/explicit-upgrade-install.json), [version/status](evidence/explicit-upgrade-install-ui.json) |
| Still main window only → Disable → Enable 0.0.2 | Each action produced its one expected main transition; no cycling during either eight-second observation. | [Disable](evidence/root-only-disable.json), [Enable](evidence/root-only-enable.json) |
| Full restart → open fixture cluster → Pod-header action | Running page visibly identifies 0.0.2, retains the marker from 0.0.1, and reads the known timestamped JSON record. One main activation and no deactivation at capture. | [Restart](evidence/after-explicit-upgrade-restart.json), [page](evidence/v2-after-restart-page.json), [screenshot](evidence/v2-after-restart.png), [store](evidence/marker-after-upgrade.json), [stability](evidence/v2-stability.json), [main excerpt](evidence/v2-main-lifecycle.txt) |
| Follow-up: restart before maintenance → main window only → explicit Uninstall 0.0.2 → wait → Install 0.0.3 → open cluster **without restarting again** | New heading identifies 0.0.3, marker from 0.0.1 remains, and one timestamped fixture record is read. Main PID **1876290** is identical before installation and at the working-page capture. Only the expected old-version deactivation and new-version activation occurred. | [Pre-install restart](evidence/before-single-restart-upgrade-restart.json), [contexts](evidence/before-single-restart-upgrade-contexts.json), [uninstall](evidence/single-restart-upgrade-uninstall.json), [install](evidence/single-restart-upgrade-install.json), [same-process facts](evidence/v3-without-post-install-restart.json), [page](evidence/v3-without-post-install-restart-page.json), [screenshot](evidence/v3-without-post-install-restart.png), [main excerpt](evidence/v3-main-lifecycle.txt) |

The single-click result rules out duplicate Install clicks as a necessary trigger
in the tested state. It does not establish a synchronization race, a host defect,
or an extension-code cause. The comparisons associate success with the tested
fresh main-window sequence; they do not isolate the underlying cause. Direct
installation of a *different* version over an existing version was not tested;
the demonstrated update uses separate uninstall and install operations.

## Restart and workspace details

One **focused Alt+F4 / File → Quit** exited every recorded host process. A prior
attempt to send that shortcut directly to an unfocused window returned success
from the compositor but did not exit the app; it is recorded separately in
[the no-exit observation](evidence/targeted-shortcut-no-exit.json). That input
delivery result is not a host Quit failure. No successful Quit duration was
measured for the later focused shortcut.

The subsequent automated restarts used **SIGTERM for the main process**, verified
that every original host process exited, and then started a new process. No
SIGKILL was needed. The saved marker was confirmed on disk before the upgrade
sequence. This is full-process recovery evidence, not a crash-safety or profile
migration proof.

After the maintainer requested workspace 7, per-launch rules placed every new
window there without switching workspace or stealing focus:

```lua
hl.exec_cmd("/usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235",
  {workspace="7 silent", no_initial_focus=true})
```

The restart captures preserve the active workspace (**2** in the original runs,
**6** in the follow-up) and focused window before and after each launch, with
the new Freelens window on **7**. No persistent
Hyprland configuration was changed. CDP operates on the background Electron
frames; it is an observation tool, not an extension dependency.

## Reproduce and inspect

From this evidence worktree, build the unchanged original runtime source and the
tiny version-change specimen:

```sh
cd prototypes/host-integration
npm run package
cd ../local-installation
node build-upgrade.mjs
# Follow-up specimen for the single-restart upgrade:
node build-upgrade.mjs 0.0.3
```

`0.0.1` is rebuilt from the adjacent spike; npm also includes that directory's
README. `0.0.2` and `0.0.3` change only package version, activation diagnostics and
the visible prototype heading. They retain the same experimental store name and
format. Tarballs and generated package directories are ignored by Git.

Follow the proposed UI procedure above. The optional local helper `cdp.mjs`
targets Electron debugging port 9235; `contexts` lists the main/cluster contexts,
`screenshot <file>` captures the current page, and `<context> <script-file>`
evaluates a supplied DOM/public-SDK probe. Its action files target this specific
fixture and checkout path. `observe.py <label> <action-file> <main-pid>` observes
one action for eight seconds and contains more than 20 activations/deactivations
with SIGTERM. These are disposable experiment tools, not a release installer.

## Limits and cleanup

- The eight-second observations and later page captures are bounded evidence,
  not long-term stability certification. Only this package, host version, user
  profile and one disposable cluster were used.
- Retention across uninstall/update was proved for one marker string. Production
  formatting-profile validation, migration, rollback and crash durability remain
  acceptance work for the real package.
- A failed or cycling install is an explicit failure. Do not keep clicking
  Install, silently retry it, or trust Enabled without the runtime smoke check.
  The observed recovery was explicit removal, full restart and clean installation.
- No host patch, source diagnosis, real application change, production extension,
  upstream issue or PR was made.
- Pending the human verdict, only `freelens-readable-logs-host-spike@0.0.3` and
  its experimental marker remain installed. Its paused page is on workspace 7
  for review. After review, disable/uninstall that package through Extensions,
  verify its action disappears, and remove only
  `~/.config/Freelens/extension-store/freelens-readable-logs-host-spike/`.
  Keep the shared fixture cluster and unrelated Freelens settings/extensions.
