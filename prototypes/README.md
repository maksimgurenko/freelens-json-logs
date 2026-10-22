# Disposable readable-log viewer prototype

Question: **which inspection and profile-editing interactions add readable JSON while keeping the maintainer's native Logs workflow familiar?**

This is an evidence artifact for [Choose the readable log viewer interactions with a disposable prototype](https://github.com/maksimgurenko/freelens-json-logs/issues/6), part of [Map: Readable JSON logs first-release specification](https://github.com/maksimgurenko/freelens-json-logs/issues/1). It is not a production extension. **The maintainer chose all three inspection layouts, configurable as a saved global viewer preference, with Side as the initial default. The rest of the walkthrough verdict remains pending.** Keep this branch disposable; do not merge it.

## Run

From the branch checkout:

```sh
python -m http.server 8096 --bind 127.0.0.1 --directory prototypes
```

Open <http://127.0.0.1:8096/readable-logs-prototype.html>. No dependencies, build, cluster access, or host installation are needed. The HTML can also be opened directly; clipboard access depends on the browser's secure-context rules.

On the maintainer's machine, the existing Caddy service serves the worktree at:

<http://127.0.0.1:8088/freelens-json-logs-prototype/prototypes/readable-logs-prototype.html>

## Compare

Use the viewer’s **Inspection** selector, the bottom switcher, or the left/right arrow keys outside an input. All three layouts remain available; **Side is the initial default**. A valid `variant` URL parameter is a shareable preview override; otherwise the saved layout is used. Changing a layout saves the global prototype preference:

| Variant | Structure | Trade-off to assess |
| --- | --- | --- |
| `?variant=A` | A record expands inside the log canvas. | Keeps full scan width and context, but expansion moves neighboring rows. |
| `?variant=B` | The selected record appears in a side inspector. | Keeps row heights steady, but reduces horizontal log space. |
| `?variant=C` | The selected record appears in a bottom inspector. | Keeps scan width, but reduces visible log height and can resemble a second dock. |

**Built-in reference** switches to a source-based reconstruction of native Logs. It is not an embedded native component, a screenshot of the installed host, or a live cluster test. **Pod actions** demonstrates entry through the Pod menu and makes the separate extension-page versus built-in-dock difference visible.

**Scenarios & walkthrough** contains synthetic scenarios, snapshot advancement, slow-request settlement, a reset, and the relevant state. It is prototype tooling, separate from the proposed product controls. All log content, cluster names and Pod identities are illustrative. Formatting profiles and samples exist only in browser memory; reload discards them. The inspection layout is the deliberate exception: a clearly named `PROTOTYPE-readable-logs-inspection-layout` localStorage key demonstrates the agreed saved global preference across reloads and same-origin tabs. Reset restores Side. This is browser storage, not proof of Freelens settings persistence across a host restart.

## Walkthrough for the live verdict

1. Enter through **Pod actions → Readable logs**. Identify the cluster, Pod, container and active profile. Compare with the built-in reference.
2. Scan mixed output. Inspect a payment error in each layout. Compare all parsed fields with exact **Application text** and **Transport line**, including their copy actions. Try **Raw**, timestamps, word wrap, and find navigation.
3. Scroll away from the bottom while automatic updates continue. The prototype anchors a surviving visible record during snapshot replacement; when the anchor leaves the recent window it reports the loss. **To bottom** follows again. **Pause** keeps the window available, and **Refresh** while paused updates once and stays paused. Inspection itself does not silently pause polling.
4. Choose Default manually, then Auto. Change to `worker` and observe the automatic profile reset and numeric severity mapping. Init and ephemeral container choices are available explicitly.
5. Open **Profiles**. Duplicate Default; change message/level/time paths, inline/hidden fields, numeric time units, matching or mappings; preview a sample. Try an invalid path. **Save** applies staged profile edits, order, deletion and global-default changes; **Cancel** discards the editor's changes. Reformatting saved records does not fetch logs.
6. Exercise empty output, denied access, connection failure, a slow request, a bounded tail, and a deleted/replaced Pod. Errors retain outdated records and stop automatic refresh. Explicit retry simulates recovery. During a slow request, Pause/Resume waits for the invalidated request to settle before starting a fresh same-target request; another container can proceed.

### Proposals requiring the maintainer's reaction

- Whether the common formatting row and the globally saved Inspection selector feel native enough. Keeping all three layouts with Side as the initial default is already agreed.
- The full-width compact row: time, level, message, inline fields and a count of additional top-level field groups. Long lines scroll horizontally unless Word wrap is enabled. This is a prototype count, not a settled semantic definition of every nested field.
- The staged profile editor and live sample preview, including its ordinary field controls and slash paths.
- Native-style follow behavior with replacement snapshots: a surviving anchor stays still, but older records can leave the bounded window. Explicit Pause is the way to preserve a window for inspection.
- Timestamp and wrapping defaults. This draft starts with timestamps on and wrapping off to make the formatted columns and long-line trade-off visible; native defaults are timestamps off and wrapping on.
- The meaningful scope differences: a separate page, bounded recent history instead of native history loading at the top, and no previous-container logs or download-all operation. Native has no explicit Pause/Refresh controls; those are extension additions.

The all-layouts/global-preference/Side-default choice was explicitly agreed in the live exchange; the remaining proposals await the walkthrough verdict. Do not infer a verdict from the agent's preferred starting variant.

## Evidence and limits

The inputs are the resolved [record parsing](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725), [formatting profiles](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832), and [refresh and lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075) decisions. Their answers remain in those tickets.

Native source was checked on **2026-10-21 (America/Cancun)** at official Freelens **v1.10.3**, revision `3da74415bff57a77c6e08cb5f538191ce87bac17`. The local extracted source matched the official Git blobs for 66 relevant files.

- [Viewer composition](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/view.tsx#L77), [target selectors](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/resource-selector.tsx#L88), [options](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/controls.tsx#L45).
- [Black canvas, row density and hover](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/list.scss#L7), [follow and To bottom behavior](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/list.tsx#L233), [native polling and history](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/dock/logs/store.ts#L21).
- [Dark theme](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/themes/lens-dark.injectable.ts#L79), [type stacks](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/app.scss#L18), [Roboto definitions](https://github.com/freelensapp/freelens/blob/3da74415bff57a77c6e08cb5f538191ce87bac17/packages/core/src/renderer/components/fonts.scss#L9).

The prototype uses authored SVG control icons and the upstream Roboto Regular font; it approximates the surrounding host chrome. Roboto's embedded metadata declares Apache License 2.0; a copy is in `assets/Apache-2.0.txt`. Logs use the host's monospace stack rather than its terminal Nerd Font.

The host implementation must persist the layout alongside other global extension settings, separately from formatting profiles. The synthetic window has 60 lines to make movement easy to observe. The bounded-tail scenario uses an illustrative smaller window; it does not measure the actual 1,000-line / 5-MiB draft bounds. Slow requests and errors are simulated; the parsing helper is sufficient for the examples, not a production parser or acceptance-test implementation. It does not establish host mounting, navigation contracts, identity watches, API timeouts, memory bounds, speed, clipboard behavior in Electron, or persistence across a real restart. The separate [host integration spike](https://github.com/maksimgurenko/freelens-json-logs/issues/7) still owns those observations.

## Verification

Browser checks covered paused refresh, profile selection without fetching, invalid-profile Save blocking, Cancel preserving saved profiles and discarding a copied profile, explicit Save, exact original-text storage, denied-access retention, explicit recovery, and empty-success clearing. Slow-request invalidation and queued fresh requests were exercised separately. JavaScript syntax checked with Node. Browser console showed no application errors.

Visual inspection covered the side inspector at 1440×950, the profile editor at 950×800, and the profile editor at 390×844. The editor and document had no horizontal overflow at the narrower sizes. The desktop layouts are the intended evaluation surfaces. The mechanical design detector used its degraded regex fallback because optional parser modules were absent; its Roboto warning is intentional because this prototype inherits Freelens's font. Screenshots are under `screenshots/`.

The subsequent layout-preference check verified Side as the first-use default, selection preservation while switching, saved choice on reopening the base URL, propagation to another open same-origin view, and separation from formatting-profile settings.
