# Disposable installed-host checks

Read the [Linux UI playbook](../../docs/agents/ui-verification.md) first. These
helpers use a private profile and headless labwc → nested Hyprland session, with
Freelens on private workspace 7. They verify the private process, runtime and
debug endpoints before interacting with the host. Keep `FREELENS_UI_MODE` unset.

The command sequence below records the historical Freelens 1 integration.
Reuse the private profile, display and CDP guards for v2. Adapt the host
executable, archive identity and scenario probes before connecting to
Freelens 2. The v2 [development install](../../docs/local-development.md)
uses the host's **Extensions** form in the private profile. The headless
browser, worker and resource suites run separately through npm.

`prepare.py` requires the existing `kind-freelens-json-logs-spike` kubeconfig
context. It copies that context into a private profile without changing cluster
resources. Display packages are downloaded, SHA-256 verified against
`display-packages.json`, and extracted locally without global installation.

With the supported Node/npm toolchain on PATH, set `FIND_HOST_TICKET` (`42` or
`48`) and a distinct `FIND_HOST_RUN` consistently in each supervised terminal:

```sh
export FIND_HOST_TICKET=48
export FIND_HOST_RUN=local-check
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/display.py
# Leave display.py running; in another terminal with the same environment:
python3 scripts/find-production-host/launch.py
# Leave launch.py running; in a third terminal:
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/viewer.mjs
node scripts/find-production-host/suite.mjs
node scripts/find-production-host/quit.mjs
```

Generated observations go under `.scratch/verification/<ticket>/host/<run>/`;
profile/display state stays under `.scratch/find/<ticket>-host/`. The renderer
uses localhost port 9241 and main inspection uses 9242. Native helpers require
additional isolation manifests and scenario-specific prerequisites; this sequence
alone does not authorize or prepare native input. The small native helper binaries
are rebuilt separately using the [source retrieval and build recipe](native-tools.md).

Check normal host exit, actual worker exit and empty service ownership before
cleanup. For another install/disable/uninstall scenario, launch a fresh main
window before visiting a cluster. Finish by creating the scratch host's `stop`
file, waiting for both private compositors to exit, and removing only the
recorded owned profile, runtime and fixture resources. Preserve failures beside
corrected observations until the task's conclusions have been reviewed.
