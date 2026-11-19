# Readable logs for Freelens

Read JSON container logs as compact **time · level · message** rows. Select a
record to inspect every field or copy its exact original text, and save formatting
profiles for applications that use different log formats.

This package targets **Freelens 2**. The Linux acceptance baseline is Freelens
2.0.0. Use the [build instructions](docs/local-development.md) to create the
archive or try a development install in a private profile.

## What you can do

- Read JSON and plain-text output together, with the original content preserved.
- Choose which fields supply the message, timestamp and severity, and which extra
  fields appear inline.
- Save named profiles and select them automatically by namespace, Pod labels and
  container name.
- Inspect records inline, beside the logs or below them. The Bottom inspector
  opens when a record is selected and collapses when selection clears.
- Pause updates, refresh once, search records and return to the latest output.

## Install

1. Obtain the checked `freelens-readable-logs-v2-<version>.tgz` and
   `SHA256SUMS` from the build or CI artifact. Run `sha256sum --check SHA256SUMS`
   in their directory.
2. Open a fresh Freelens 2 session and go to **Extensions** before opening a cluster.
3. If the legacy `freelens-readable-logs` entry is visible, open its menu,
   choose **Uninstall** and wait for it to disappear. Keep its settings file at
   `<userData>/extension-store/freelens-readable-logs/readable-logs.json`.
4. In **Extensions**, select the v2 `.tgz` or enter its absolute path. Click
   **Install** and wait for `freelens-readable-logs-v2` and **Enabled**.
5. Open a cluster, open a Pod's details and click **Readable logs** beside the
   native Logs action. Choose a container if needed.

Your first v2 launch uses built-in Default and Side inspection. Profiles and
preferences you save in v2 go to a [separate settings file](docs/local-development.md#configuration-and-temporary-state).

## Start reading

The built-in **Default** profile recognizes common message, timestamp and level
fields. Choose **Profiles → Duplicate** to adapt it to your application's logs,
preview a sample and save your rules.

Select a record to inspect it. **Pause** keeps the current records available while
you read; **Refresh** updates once while paused, and **Resume** restores automatic
updates. **Find** searches application text and extracted messages. **To bottom**
resumes following the latest output after you scroll away.

The viewer reads one Pod/container at a time and retains up to **1,000 records**
within **5 MiB of original text**. Automatic updates fetch recent snapshots about
three seconds after each completed request. Older records can leave that window.

See the [user guide](docs/usage.md) for profile examples, inspection, searching and
settings recovery.

## Documentation

- [Build from source and technical reference](docs/local-development.md)
- [CI and release workflow](docs/releasing.md)
- [All documentation, compatibility research and verification](docs/README.md)

Report problems in [GitHub Issues](https://github.com/maksimgurenko/freelens-json-logs/issues),
including your Freelens and extension versions and the steps to reproduce them.
