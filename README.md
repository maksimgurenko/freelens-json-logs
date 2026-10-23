# Readable logs for Freelens

Read JSON container logs as compact **time · level · message** rows. Select a
record to inspect every field or copy its exact original text, and save formatting
profiles for applications that use different log formats.

Requires **Freelens 1.10.3**. Verified on Arch Linux/Wayland. Uses your existing
Freelens cluster connection.

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

1. Open the [latest release](https://github.com/maksimgurenko/freelens-json-logs/releases/latest)
   and download `freelens-readable-logs-<version>.tgz` from **Assets**.
2. Fully quit and reopen Freelens. Open **Extensions before opening a cluster**.
3. For an update, uninstall the old extension and wait for removal. Your saved
   profiles and inspection preference are retained.
4. Install the downloaded `.tgz` once and wait for its version and **Enabled** status.
5. Open your cluster, open a Pod's details and click **Readable logs** beside the
   native Logs action. Choose a container if needed.

On the verified Linux setup, extension discovery requires filesystem polling.
Use the launch settings in the [installation and maintenance guide](docs/local-development.md#supported-local-maintenance).

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
