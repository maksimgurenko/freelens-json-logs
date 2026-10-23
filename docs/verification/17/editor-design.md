# Ticket 17: profile editor design record

This record describes the automatic-selection controls added to the existing staged profile editor. The incumbent dark Freelens interface supplies the visual language. Product behavior follows the accepted [profile-selection resolution](https://github.com/maksimgurenko/freelens-json-logs/issues/4#issuecomment-6331193832) and [implementation contract](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620).

## Composition

The viewer retains its target toolbar: Pod, container, profile selector and **Profiles** button. The selector's Auto option includes the resolved name (`Auto · <profile name>`); the identity line also names the active profile. This keeps the result visible during both viewing and editing.

Opening Profiles replaces the log work area with a scrolling editor while retaining target context. The editor contains, in order:

- A heading, **Close profiles** and a short explanation of drafts and temporary samples.
- Saved-profile selection with **Duplicate**, **Edit**, **Delete** and a separate global-default selector.
- **Matching order**, an ordered list with profile names, textual matching states and **Move up** / **Move down** buttons. Moving saves immediately; the global default remains a separate choice.
- Two equal columns: editable profile rules on the left, sample logs and preview on the right. Automatic matching precedes the existing extraction fields.
- Validation, save feedback and **Save profile** / **Cancel** actions below the form.

The editor uses 24px horizontal padding, a 14px vertical rhythm and a 28px column gap. At a CSS viewport width of 1000px or less, the columns stack with an 18px gap; management controls wrap. Label-condition rows also wrap, retaining visible labels above each key/value input.

## Host theme and form language

Controls use native HTML buttons, selects, checkboxes, text inputs and textareas. Typography inherits from Freelens; headings are 18px and 14px at weight 500, helper text is 12px, and path/sample textareas use the host monospace family at 12px. Thin dividers and tonal surfaces define groups without cards or shadows.

| Host variable | Applied role | CSS fallback |
| --- | --- | --- |
| `--mainBackground` | Viewer/editor background | `#1e2124` |
| `--textColorAccent` | Main text | `#e3e5e8` |
| `--textColorSecondary` | Help text and hover borders | `#a6adb5` |
| `--contentColor` | Control and notice surfaces | `#262b2f` |
| `--borderColor` | Control outlines | `#4c5053` |
| `--borderFaintColor` | Section dividers | `#373a3e` |
| `--primary` | Checkbox accent, caret and keyboard focus | `#00a7a0` |

These remain live host-variable references in [viewer.css](../../../src/renderer/viewer.css); the fallbacks do not define a separate palette. Controls have 3px corners and 1px borders. Enabled buttons and selects strengthen their borders on hover. Disabled controls use reduced opacity, with native disabled behavior.

## Matching controls and states

**Automatic matching** groups an enabled checkbox, exact namespace and container-name inputs, and repeatable Pod-label key/value rows with **Add label condition** and **Remove**. Nearby help states that every condition must match, comparisons include case, blank namespace/container impose no restriction, and an empty label value requires an explicitly empty label. The control set exposes the three accepted condition types.

The order list distinguishes **Matching enabled**, **Matching disabled** and **No conditions · never matches** in text. Its first/last move buttons are disabled at their respective boundaries. With no saved profiles, a prompt explains duplication and the Default fallback. Disabled and conditionless profiles remain available for manual or global-default selection.

The saved profile is read-only until Edit or Duplicate starts a draft. During a draft, profile switching, management, global-default selection and reordering are disabled. Matching and formatting edits share the existing explicit Save/Cancel lifecycle. Invalid drafts disable Save and explain the errors; the preview asks for correction. Empty samples show a prompt, while valid samples preview up to 20 lines. Samples and unfinished edits disappear when the editor closes.

Successful saves announce that retained logs use the saved rules. Deletion requires an inline confirmation describing the Auto and Default fallbacks. A settings-load problem is an alert and disables profile mutations while preserving the saved data.

## Keyboard and accessible states

Opening the editor focuses its heading; **Close profiles** returns focus to the toolbar's Profiles button. The toolbar button exposes `aria-expanded`. Native form controls provide ordinary Tab navigation and keyboard activation, with explicit labels for conditions, mappings and profile selectors. Move and remove buttons include the affected profile name or row number in their accessible names.

The matching order is a semantic ordered list, and automatic matching is a fieldset with a legend. A 2px host-accent `:focus-visible` outline with a 2px offset identifies keyboard focus. Errors and delete confirmation use alerts; save/discard feedback uses status text. Matching status is communicated through words as well as control appearance.

## Evidence

The built composition is visible in [viewer.png](viewer.png), [editor.png](editor.png) and [matching.png](matching.png), captured from Freelens at a 2317 × 1252 CSS viewport (3828 × 2101 desktop PNGs). Control behavior and styling are recorded in [profile-editor.tsx](../../../src/renderer/profile-editor.tsx), [viewer.tsx](../../../src/renderer/viewer.tsx) and [viewer.css](../../../src/renderer/viewer.css). This is the scoped design record for ticket 17.
