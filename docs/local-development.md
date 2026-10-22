# Build and install Readable logs

This production implementation includes bounded snapshots and explicit automatic
refresh, Pause/Resume, Refresh and Retry (GitHub #11–12). Later lifecycle,
inspection and profile tickets are not implemented yet. The
accepted requirements in GitHub #8 and its resolution links take precedence over
the feasibility research in the root README and all disposable prototypes.

Supported host: **Freelens 1.10.3 only**, currently tested on Arch Linux/Wayland.
Build toolchain: **Node 24.18.0, npm 11.16.0, TypeScript 5.9.3, esbuild 0.28.2**.
The SDK and its core dependency are pinned to 1.10.3; `package-lock.json` pins the
complete build tree. Use Node 24 as required by the SDK, rather than the machine's
Node 26. `.nvmrc` records the build version; no global agent configuration changes
are required.

From a clean checkout with that toolchain on PATH:

```sh
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
npm run package
npm run check:package
tar -tzf dist/freelens-readable-logs-0.1.2.tgz
sha256sum dist/freelens-readable-logs-0.1.2.tgz
```

The locked esbuild platform package supplies its binary without install scripts.
The test command executes TypeScript using Node's type stripping; no host is
launched. Build metadata under `dist/build-meta.json` shows only project inputs
and tiny host-global bindings. `check:package` inspects the actual tarball,
asserts its allowlisted files and host-only dependencies, and loads its packed
CommonJS default exports with stub host globals. This is a packaging test;
real host verification is recorded separately under `docs/verification/11/` and
`docs/verification/12/`.
Running the same build twice yields the same tarball bytes with this toolchain.

Stable package identifier: **freelens-readable-logs**. Stable `storeName`:
**freelens-readable-logs**. Page ID: **readable-logs**. These identifiers remain
stable across updates. This milestone creates no configuration or store file;
main and renderer entry points are present, but main has no durable writes yet.
Do not infer profile persistence from an empty main entry point.

## Supported local maintenance

The validation launch uses a process-local temporary directory on the same
filesystem as `~/.freelens/extensions`:

```sh
mkdir -p "$HOME/.cache/freelens-readable-logs/tmp"
TMPDIR="$HOME/.cache/freelens-readable-logs/tmp" /usr/bin/freelens
```

This changes only this host process's temporary-directory environment. It does
not change Freelens code or global configuration. Earlier install attempts on
this machine timed out after extraction without discovery; filesystem probes
alone did not establish their cause. Keep a failed install distinct from a
successful install and record the exact environment. The debug port used by
verification tooling is optional and is not an extension runtime requirement.

Follow [the accepted procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618):

1. Use a fresh main window and open **Extensions before any cluster**. If a
   cluster has been opened in the session, fully quit/reopen Freelens first.
   This requires at most one pre-maintenance restart.
2. For an update, **Uninstall** the old package and wait for removal to finish,
   retaining its saved extension settings. Install the new tarball via the form
   **once** and wait. Do not use the overwrite/reinstallation prompt.
3. Check version **0.1.2** and Enabled, then open the cluster. Open a Pod's details
   header and click the **Readable logs** icon beside the native actions. Verify
   cluster, namespace, Pod UID, container and **Default** profile, and usable logs.
   Do not restart after installation as a substitute for passing this check.
4. Enable/disable/uninstall maintenance also uses the fresh-main-window state.
   A failed or cycling install is a failure: stop and retain diagnostic evidence.

The installed viewer requests current-instance logs with `container`,
`tailLines: 1000`, `timestamps: true`, `follow: false`, `previous: false`; no
cursor, streaming, previous-instance or multi-Pod logs are requested. The default
annotation applies only to regular containers. With none, select explicitly.

The viewer retains the latest complete-line suffix within **5 MiB UTF-8 original
transport text**, counting each original LF terminator, including a final LF if
present. LF separators are not part of the per-record transport line; CR and all
other source characters stay intact. A final LF does not add a record; additional
blank lines do. More-than-tail responses are also bounded to the newest 1,000
records. Omissions and an oversized newest record are distinct from empty logs.
The budget bounds retained original text, not download size, transient response
memory, parsed-object overhead or total process memory. The public convenience
API completes the full response and offers no per-request cancellation handle.

Default numeric timestamp units are unset and severity mappings are empty:
numbers remain visible as levels and do not imply a severity; numeric timestamps
do not imply seconds or milliseconds. Application timestamp candidates require
RFC 3339 with an explicit zone; display uses the computer's local timezone.
Original precision, JSON whitespace and all parsed fields remain in core state.
Raw inspection and clipboard controls are subsequent ticket work.

An active selected target fetches immediately, then three seconds after each
successful request settles. Snapshots replace the window, preserving repeated
lines. Pause freezes the window and rejects pending results immediately. Refresh
fetches once while paused; Resume fetches fresh data and restores automatic mode.
A slow notice appears after 15 seconds without timing out or cancelling the read.
Only one read per target may be outstanding, including invalidated reads from a
departed view: a fresh same-target request waits for settlement. Different targets
can proceed independently. Repeated Refresh actions coalesce rather than queue.

A genuine empty success clears the window and continues automatic updates.
Failures retain the last successful window, mark it outdated, explain the host
error and stop automatic updates. Retry is explicit; successful Retry restores
automatic mode unless paused. Failed Retry never starts a retry loop.

Metadata UID is checked before the first read; this does not provide an atomic
UID-bound log read. Leaving/disabling stops timers and invalidates pending results
without cancelling the underlying request. Host visibility and ongoing
Pod/container lifecycle observations are ticket 13 work.
