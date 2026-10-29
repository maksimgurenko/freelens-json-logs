# Using Readable logs

For downloads and installation, start with the [README](../README.md#install).
The supported host is Freelens 1.10.3; the verified Linux launch settings are in
the [maintenance guide](local-development.md#supported-local-maintenance).

## Open logs and control updates

Open a Pod's details and click **Readable logs** beside the native Logs action.
The viewer opens its own page in the current cluster. Check the Pod and namespace
shown at the top, then use **Container** to select the output you want. Regular,
init and ephemeral containers are listed separately.

The toolbar uses compact icon buttons. Hover over a button to see its action
and any available shortcut. The pencil edits profiles; the gear opens Display options.

New views update automatically. **Pause** keeps the current log window;
**Refresh** fetches once while remaining paused. **Resume** reads fresh logs and
restores automatic updates. Selecting a record alone keeps updates running.

The recent window contains at most 1,000 records and 5 MiB of original UTF-8
text. Each refresh replaces that window. If a selected record leaves it, the
selection clears. Pause before a long inspection to keep the current records.
The viewer reads the current container instance; after an observed restart,
old records clear. Reopen from the current Pod if the original was deleted or
replaced.

## Inspect and copy a record

Choose an **Inspection** layout and select a row:

| Layout | Where the record opens |
| --- | --- |
| Inline expansion | Below the selected row. |
| Side inspector | Beside the log list. |
| Bottom inspector | Below the log list; occupies no space without a selection. |

The layout preference is saved globally. Click the selected row again or use
**Close** to clear the selection and close the inspector. **Enter** or **Space**
on a focused row also toggles its inspector.

**All fields** shows the complete parsed JSON object, including fields hidden
from compact rows. For plain text or malformed JSON, it shows the original
application text. The other tabs and copy actions preserve the received text:

- **Application text** excludes the timestamp added by Kubernetes.
- **Transport line** includes that Kubernetes timestamp.
- **Copy application text** and **Copy transport line** preserve the original
  spacing, JSON escapes and timestamp precision.

**Readable** uses the active profile. **Raw** shows the original text, including
the Kubernetes timestamp when **Show timestamps** is enabled. **Word wrap**
controls whether long rows wrap in the log list.

## Find records and follow output

**Find** searches literal text in application text and the extracted message,
including fields hidden from compact rows. It ignores case by default; enable
**Match case** or **Whole words** to narrow the search. Every row stays visible,
and the timestamp added by Kubernetes is excluded.

Use **Next** / **Previous**, or **Enter** / **Shift+Enter**, to move between matching
records. Navigation wraps from the last match to the first. Highlights and
scrollbar marks show matches; links beside a row reveal matches in hidden fields.
Select a single line of log text before opening an empty Find to use it as the
query. **Recent searches** recalls up to seven searches and their mode settings
for this view. **Clear** empties the query; **Close** keeps it for reopening.

Inspecting the active Find result keeps its ordinal and search position. During
refresh, unchanged matching rows keep their counter, scrollbar marks and hidden-match
links while new records are checked. Navigation waits for the complete result;
hovering over the counter reports when matching is pending.

New views follow the bottom of the output. Scrolling away keeps your reading
position when the same records survive a refresh. If that position leaves the
recent window, a notice explains it. **To bottom** resumes following.

## Create a formatting profile

The built-in **Default** profile recognizes these fields in priority order:

| Value | Default field paths |
| --- | --- |
| Message | `/message`, `/msg` |
| Application timestamp | `/timestamp`, `/time`, `/@timestamp` |
| Level | `/level`, `/severity`, `/log.level`, `/log/level` |

For example, an application might write:

```json
{"time":"2026-10-23T10:42:11Z","severity":50,"msg":"Payment declined","orderId":841}
```

To label its numeric severity and show the order ID inline:

1. Open **Profiles**, select **Default** under **Saved profile**, then **Duplicate**.
2. Name the copy `Payments`. Keep the default message, timestamp and level paths.
3. Add `/orderId` to **Inline fields**.
4. Under **Severity mappings**, choose **Add mapping**, select **Number**, enter
   `50` and choose **ERROR** as the target.
5. Paste the example into **Sample logs** and check the **Preview**.
6. Choose **Save profile**, then **Close profiles**. Select `Payments` in the
   viewer's **Profile** selector to use it for the current view.

Numeric levels keep their original value until you give them an explicit mapping.
For numeric application timestamps, choose seconds or milliseconds explicitly.
Text timestamps need an RFC 3339 timezone, such as `Z` or `+02:00`; displayed
times use your computer's local timezone. Kubernetes time is the fallback.

Enter one slash path per line in each field list. `/error/message` selects a
nested field; `/log.level` selects a key literally named `log.level`.
`/items/0/code` selects the first array element's `code`. Escape a slash inside a
key as `~1` and a tilde as `~0`. Lists replace the defaults, with the first usable
value winning. **Hidden fields** removes extra data from compact rows while
keeping it available in the inspector and originals.

Choose **Edit** to change a saved profile. **Cancel** or **Close profiles**
discards unfinished edits; **Save profile** applies valid rules. Samples and
drafts are temporary, and changing formatting uses the records already loaded.

## Apply profiles automatically

Edit `Payments` and enable **Enabled for matching**. Set **Match namespace** to
`production`, **Match container name** to `api`, and add a Pod-label condition
with key `app` and value `payments`. Save it, then select **Auto** in the viewer.

The profile now applies when all three conditions match. Conditions are exact
and case-sensitive. Leave a namespace or container condition empty to omit that
restriction. At least one condition is needed for automatic matching.

Selection follows this order:

1. A profile chosen manually for the current view.
2. The first enabled profile whose conditions all match, in **Matching order**.
3. The **Global default**, which starts as built-in Default.

Use **Move up** / **Move down** to change matching priority. Order and global
default changes save immediately. Disabling matching keeps a profile available
for manual selection and as the global default.

Saved profiles and Inspection survive a restart or extension update. Manual
profile selection clears when you change container or reopen the view. New views
also reset Find, selected record, Readable/Raw, timestamps, wrapping and Pause.

## Errors and settings recovery

A failed read keeps the last successful records, marks them outdated and stops
automatic updates. Choose **Retry** after correcting the problem. An empty
successful response means the selected container returned no logs.

If saved settings cannot be read, **Settings recovery** explains the problem.
You can still read logs with built-in Default and Side inspection. To start
fresh, choose **Reset settings…**, then **Back up and reset**. A verified backup
must succeed before settings are replaced. **Cancel reset** preserves everything.

See [settings recovery and manual backup restoration](local-development.md#recovering-unusable-settings)
for file locations and recovery details.
