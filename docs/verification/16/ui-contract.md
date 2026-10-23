# Ticket 16 UI contract

This records the built formatting-profile surface in the existing Readable logs viewer, inspected in Freelens 1.10.3 with extension 0.1.15. It is a local component contract for an operating interface. The surrounding Freelens dark UI and the established viewer supply its visual authority; this change establishes no separate visual system.

Product authority remains the accepted [profile rules](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832), [viewer interactions](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6351951935), [implementation contract](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620), and [ticket 16](../../../.scratch/readable-logs/issues/16-create-and-save-formatting-profiles.md). Built behavior and styling are recorded from [profile-editor.tsx](../../../src/renderer/profile-editor.tsx), [viewer.tsx](../../../src/renderer/viewer.tsx), and [viewer.css](../../../src/renderer/viewer.css).

## Native appearance and composition

The viewer retains its target strip, container/profile selectors, update controls, and active-profile identity. Profiles opens an editor within that viewer. Find, presentation controls, records/inspector, and the viewer footer are hidden while editing; the target strip and identity remain visible.

The editor uses the host's sans typography for headings, labels, help, and ordinary controls. Its title is 18px at weight 500, the Preview heading is 14px at weight 500, and help is 12px with a 1.6 line height. Paths, sample text, and preview data use the host monospace face. Buttons and fields reuse the viewer's thin borders, 3px corners, compact padding, and visible disabled state.

Host theme variables remain authoritative: `--mainBackground` for the main field, `--contentColor` for input surfaces, `--textColorAccent` for primary text, `--textColorSecondary` for supporting text, and `--primary` for focus. The reviewed dark host renders the main field as #1e2124 and content surfaces as #262b2f. Flat surfaces and separators carry hierarchy.

At the reviewed desktop size, profile management spans the editor above two equal columns: rules on the left, sample input and preview on the right. A 28px gap separates the columns. The editor itself scrolls vertically within the available viewer height; lower path controls, severity mappings, validation, and Save/Cancel remain part of that scroll. The screenshot of the editor top does not claim to show the entire form.

## States and actions

| State | Built behavior |
| --- | --- |
| Saved profile | Saved profile and Global default selectors, Duplicate, Edit, and Delete provide management. Built-in Default is read-only; Edit and Delete are disabled for it. Duplicate starts an independent draft. |
| Draft | Name, ordered path lists, numeric timestamp interpretation, and severity mappings become editable. Saved-profile selection, management actions, and Global default are disabled until the draft ends. Save profile and Cancel appear below the fields. |
| Sample preview | Labeled Sample logs accepts application text or timestamped lines without requiring configuration JSON. Empty input explains how to start; valid rules preview up to 20 lines. Invalid rules replace preview output with a correction prompt. |
| Invalid draft | A specific error list appears inline above Save/Cancel with `role="alert"`. Save profile is disabled; Cancel remains available. Saved rules remain active. |
| Save | A valid draft saves explicitly, ends draft mode, and reports that retained logs use the saved rules. A save failure appears as a status message and retains the draft. Formatting and sample editing initiate no log request. |
| Cancel or close | Cancel discards the draft and reports that saved rules are unchanged. Close profiles or toggling Profiles closes the editor, discarding its local draft and sample. Samples and unfinished edits are temporary. |
| Delete | An inline confirmation names the profile and explains manual/global-default fallback. Confirm delete and Keep profile make the choice explicit. |
| Unavailable settings | The editor reports the saved-settings problem and disables profile changes while preserving the stored data. |

Path hints explain exact slash paths, literal dots, array indexes, escaping, ordered fallback, and each empty-list behavior. Severity controls distinguish Text from Number and offer the six canonical target levels. These controls change presentation; complete parsed records and exact original text remain available in the viewer's existing inspector. Saving or changing the active profile reformats retained records and updates formatting-dependent Find results without requesting logs. Existing automatic or explicit refresh remains a separate viewer action.

## Keyboard and focus

Opening the editor programmatically focuses its Formatting profiles heading (`tabIndex=-1`). Close profiles returns focus to the Profiles button. Profiles exposes its expanded state with `aria-expanded`. Labeled native buttons, selects, inputs, and textareas retain ordinary keyboard interaction and source-order Tab navigation; disabled controls are excluded from that interaction. The inherited focus-visible rule draws a 2px host-primary outline with a 2px offset.

This is an in-view section rather than a modal dialog. There is no custom focus trap, Escape-to-close handler, or Save shortcut. Cancel performs no additional programmed focus move. Validation uses an alert; save/discard notices use status roles. These focus and keyboard details are source-defined behavior, not a claim of a separate full keyboard or assistive-technology audit.

## Responsive rule

At viewport widths of 1000px or less, the editor becomes one column with an 18px gap: rules precede sample input and preview. Global default loses its right-aligned auto margin, management and mapping controls can wrap, and textareas fit their column. The desktop screenshot review verifies the two-column state; the narrow rule is recorded from CSS and has not been visually verified by this handoff. The viewer's existing Side inspector separately stacks at 800px or less.

## Visual verification scope

The reviewed native captures are [viewer.png](viewer.png), [editor.png](editor.png), and [validation.png](validation.png). They show the viewer, editor top, and deliberately scrolled lower form respectively. The black area below the extension is the native log terminal. [finish-review.txt](finish-review.txt) records the full scoped review and its validation-contrast finding; [finish-verdict.txt](finish-verdict.txt) scores the correction.

Validation text now uses the host's bright primary foreground rather than its insufficient error red. [validation-contrast.json](validation-contrast.json) measures rgb(255,255,255) against rgb(30,33,36), **16.18:1**. The final reviewer disposition is **ship for this scored contrast fix**. It does not expand that verdict into a new full-surface review or establish durable persistence across quit/reopen; functional acceptance belongs to the separate ticket evidence.

This record preserves the existing host appearance and the corrected legibility. It does not promote the former low-contrast error color, this ticket's two-column form, or screenshot-specific sample content into global design rules.
