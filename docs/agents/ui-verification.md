# Freelens Linux UI playbook

Use this playbook for UI verification, local installation/restarts and
Hyprland/Wayland setup problems. Reuse the existing routes below so a new task
starts with the known procedure and investigates only a concrete failure.

Keep the real Freelens window on workspace 7. Unattended work, including Ralph,
must preserve the user's workspace, focus, pointer and clipboard throughout.
Never use `Page.bringToFront`, compositor focus commands, cursor movement or a
fake `document.hasFocus()` to make an unattended check pass. Restoring focus
afterward still interrupts the user. A focus-dependent check without an available
authorized route stays deferred, with its coverage limitation recorded.

## Choose the route

| Task | Route | Evidence it provides |
| --- | --- | --- |
| Inspect UI state or take a screenshot | Background `scripts/host-cdp.mjs` | Renderer state and rendered appearance |
| Verify an installed package in a disposable host | `scripts/find-production-host/`, with a private profile/display | Actual Freelens extension integration |
| Test keyboard, selection, wheel, IME, clipboard or native windows unattended | Guarded private-session helpers within the task's authorized scope | The specific virtual Wayland/native API routes exercised |
| Exercise native input or window lifecycle on the user's desktop | An agreed attended session | The attended checks actually performed |
| Install an authorized update into the user's Freelens | The maintenance sequence below | Installed artifact identity and a usable renderer |

Choose the smallest route that verifies the changed behavior. Existing
[Find acceptance is complete for the agreed Linux scope](../specification.md#validation-limits);
reuse the current regression suites for unchanged behavior. Windows/macOS remain unverified and
outside this implementation increment. This playbook grants no new native-test
authorization.

## Background inspection

Reuse a running host and its known opt-in localhost CDP endpoint.
[`scripts/host-cdp.mjs`](../../scripts/host-cdp.mjs) currently targets renderer
port **9235**. Private-host helpers use **9241** for the renderer and **9242** for
main-process inspection. A host on another port needs an explicit matching
transport; a missing endpoint is a transport/setup failure.

From the repository root, with the background host on 9235 already available:

```sh
freelens_node="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin/node"
"$freelens_node" scripts/host-cdp.mjs contexts
"$freelens_node" scripts/host-cdp.mjs screenshot /tmp/freelens-ui.png
```

Use a saved renderer probe for the required assertion. Background probes may
inspect or interact with the renderer while leaving OS focus alone.

## Private installed-host and native checks

Start with the [host reproduction sequence](../../scripts/find-production-host/README.md).
For native input, also read the
[completed Linux native route](https://github.com/maksimgurenko/freelens-json-logs/blob/98c215e62c5f821cb7a2b2bac194b21c9f5ef3f1/docs/verification/48/native-completion-20261028.md#artifact-and-route).
The reusable pieces under `scripts/find-production-host/` are:

- `prepare.py`: extracts checksum-verified display dependencies and creates a
  disposable Freelens profile with the existing fixture context.
- `display.py`: starts headless labwc and nested Hyprland, writes `session.json`,
  and observes the real desktop read-only.
- `launch.py`: starts Freelens in that private session.
- `private-session.mjs` / `native-input.mjs`: prove the owned PID, private runtime,
  socket, compositor, profile and workspace before native actions.
- `native-completion-common.mjs`: provides persistent virtual keyboard/pointer
  input, geometry translation and owned-process cleanup.

Set `FIND_HOST_TICKET` explicitly: helpers default to **42**. Keep evidence in a
distinct `FIND_HOST_RUN`; generated output stays under `.scratch/verification/`. Native helpers allow specific historical run names and
require an isolation manifest; adapt that interface explicitly for new coverage,
preserving its guards. Keep `FREELENS_UI_MODE` unset for private runs. Use the
environment returned by the native-input guard for every native command; it
separates the session's Wayland socket, runtime and clipboard from the user's.

Known setup lessons:

- A persistent virtual keyboard maintains the private seat. Cursor movement alone
  does not prove click delivery; the completed route uses a persistent virtual
  pointer and observes delivered events.
- Convert renderer coordinates through the actual iframe/window/output geometry.
  The recorded native harness asserts a 1280×720, scale-1 private output.
- Distinguish keyboard delivery, IME protocol transactions and DOM event flags.
  The completed report explains the observed native composition-end flag and
  preserves failed experiments; reuse that explanation before reinvestigating.
- This stack includes a modified Aquamarine diagnostic. Label its evidence with
  the stated limits on stock-display and physical-hardware claims.

Finish by checking normal host exit and removal of only the recorded owned
processes, profile, runtime and fixture resources. Preserve failed observations
alongside corrected runs.

## Attended native checks

Arrange a test session with the user before running real keyboard/mouse,
minimize/restore, restart or physical-input checks on their desktop. Have the user
focus Freelens on workspace 7 first. Set `FREELENS_UI_MODE=attended` only on the
individual command for that agreed session. Keep it unset in Ralph, tmux and the
shell environment. Previous approval of one session does not enable future runs.

The shared JavaScript gate refuses desktop-affecting entry points by default and
checks that Freelens is already focused on workspace 7. The private CDP transport
also gates `Page.bringToFront`. Native host-window probes start with
`// @ui-attended`; `host-cdp.mjs` checks that marker before connecting. Mark new
native window probes the same way.

During an attended session, keep focus-dependent checks short and restore owned
pointer/window state immediately afterward. End the session when the user
resumes other work. Unattended native coverage uses the separate graphical
session above; background DOM/CDP alone does not establish native coverage.

## Installing into the user's Freelens

For an authorized local update:

1. Identify the actual user compositor and owned Freelens process. If the host
   is currently focused or in use, leave it alone and defer maintenance.
2. Back up the extension and saved settings, then prepare the package and record
   its asset hashes before stopping the host.
3. Establish a temporary Freelens-specific activation guard before relaunching.
   The observed Hyprland **v0.56.2 Lua API** route uses `workspace="7 silent"`,
   `no_initial_focus=true`, `no_focus=true`, `focus_on_activate=false` and
   `no_follow_mouse=true`. Check that the rule is enabled. Silent workspace and
   initial-focus settings alone did not prevent a later activation request.
4. Launch on workspace 7 and observe the real desktop as described below.
   Install and probe through background CDP using the matching host endpoint.
5. Verify installed asset hashes, saved settings and usable renderer behavior.
   Remove the temporary rule in cleanup and verify its removal.

If activation protection cannot be established, stop before restarting the user's
host. On an observed desktop interruption, record the failure and stop further
desktop-affecting work; do not restore focus/pointer to manufacture preservation.

The guard has launch evidence; it does not establish every installation and
cleanup step. A single reusable installation helper remains a follow-up.

## What to recheck, and when to investigate

Recheck live process/socket/port identity and ownership on each relevant run.
The shell's compositor variables can be stale: compare them with the actual
user-session compositor from `systemctl --user show-environment` before targeting
the real or private session. Keep live IDs and temporary paths in run evidence.

For desktop maintenance, compare focus/workspace and observe transitions through
the interval. Equal endpoints can hide an interruption. Repeated notifications
of the same focus address are not focus transitions. Report user activity during
observation without automatically attributing it to the test; pointer endpoint
equality is not continuous pointer tracking.

Reuse the documented recipe while its prerequisites hold. Investigate only a
concrete failed precondition, helper error or version/API mismatch. Record the
failure first, inspect the relevant local interface, and consult exact-version
upstream source if that interface does not resolve it. Save the resulting stable
lesson here and keep disposable run observations under `.scratch/verification/`.
The retired run archive remains available in Git history.

## Regression check

When changing the attended gate or background probe CLI, run:

```sh
node --experimental-strip-types --test tests/ui-policy.test.ts
```

It checks rejection before desktop reads and before a native probe connects to
the host. The archived ticket wrappers and their Python tests have been removed.
Use isolated transport tests for any new desktop helper; unattended checks must
continue to preserve the user's focus, workspace, pointer and clipboard.
