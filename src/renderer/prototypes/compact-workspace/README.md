# Compact Readable logs browser prototype

Question: which arrangement returns space and attention to logs while keeping controls usable?

This disposable browser fixture sits beside the renderer it represents. It reuses
the actual `viewer.css` for the canvas and record/inspector vocabulary, with three
structurally different control layouts on one route. It uses illustrative sample
records and in-memory state; it does not load Electron, contact Kubernetes or
change settings. All three use the same black canvas, log typography and data.

Run from the repository root:

```sh
python -m http.server 8097 --bind 127.0.0.1 --directory .
```

Open <http://127.0.0.1:8097/src/renderer/prototypes/compact-workspace/?variant=a>.
On the maintainer's existing local HTML server:
<http://127.0.0.1:8088/freelens-logs-ux-prototype/src/renderer/prototypes/compact-workspace/?variant=a>.

- `a`: compact context line and labeled toolbar, Find always in the toolbar.
- `b`: one toolbar, secondary settings in a menu, Find opens a temporary row.
- `c`: context/target selection at the top, tools in a vertical rail, Find floats
  above logs without shifting the first record.

Use the bottom switcher or Left/Right outside fields; the query parameter makes
each variant linkable. Relevant variant state is printed to the browser console
on switching, and the controls expose current query/modes/selection visibly.

Try Ctrl/Cmd+F, Enter/Shift+Enter in Find, record selection, inspector tabs and
Inline/Side/Bottom, Raw, timestamps, wrap, Pause/Resume, Refresh, and target details.
Display options also offers long-name, empty and error examples. Open Profiles,
choose Edit, change a field, then use Escape, Back to logs, or browser Back to
discard the draft. Ctrl/Cmd+S saves only while editing a draft. Global default
saves immediately in this browser session; draft exit does not undo it. The
bottom bar's Prototype button explains the variants and evidence boundary.

Browser history demonstrates local Profiles-to-logs navigation. DOM mouse Back
handling is only a browser prototype: native event delivery and shortcut
coexistence in Freelens 1.10.3 remain separate validation. The rail, no-selection
inspector collapse and Find placement are proposals, not approved behavior.

Source baseline: main commit `f5c3406`, package `0.1.20`. Original surface:
`src/renderer/viewer.tsx`, `profile-editor.tsx`, `viewer.css`.

Decision ticket: [Choose a compact log-focused layout with browser variants](https://github.com/maksimgurenko/freelens-json-logs/issues/21).
Map: [Compact logs, navigation and keyboard shortcuts](https://github.com/maksimgurenko/freelens-json-logs/issues/20).

Awaiting the maintainer's browser verdict. No production implementation or
acceptance decision is implied by this artifact.

## Browser check, 2026-10-24

Rendered all three at 1440 × 1000, plus long target names with Find and inspection
open at 800 × 800 and 600 × 800. The rail changes to a horizontal tool group in
the narrow state. No page-wide horizontal overflow was observed. All log canvases
computed to `rgb(0, 0, 0)`. Above-log chrome in the initial desktop state measured
80px (A), 42px (B) and 37px (C); these are browser-fixture observations, not native
Freelens measurements. The prototype switcher occupies a separate bottom area.

Browser key events verified Ctrl+F focusing local Find, Enter moving to the next
match, Ctrl+S saving an active profile draft, and Escape discarding an unsaved
draft while retaining the saved profile, global default, query, and a 500px log
scroll position. Escape restored focus to Profiles. Browser Back returned from
Profiles while retaining a previously saved change. No JavaScript errors were
observed in that interaction pass. This is not macOS or native mouse-event proof.

JavaScript syntax and `git diff --check` passed. The design detector reported no
findings but ran in its documented degraded regex mode because optional parser
modules were unavailable; visual inspection was performed separately.

Primary-source host/input research, including native navigation and Find
conflicts, lives on a separate disposable branch:
[Compact view input contracts](https://github.com/maksimgurenko/freelens-json-logs/blob/cc989fa3a94d400672e51f72a913f50034aec176/docs/research/compact-view-input-contracts.md).
