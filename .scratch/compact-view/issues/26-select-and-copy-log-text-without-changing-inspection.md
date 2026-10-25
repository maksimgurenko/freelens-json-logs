# 26: Select and copy log text without changing inspection

**Status:** ready-for-agent

**Blocked by:** None (can start immediately).

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/26

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Let users select and copy log text naturally while retaining immediate click-to-inspect behavior. Dragging through Readable or Raw records must leave inspection alone, and copied row selections must exclude the additional-field count badge while preserving original log content.

## Acceptance criteria

- [ ] Real pointer drags selecting text within one record and across multiple records preserve the selection without opening inspection or changing an already inspected record. Cover Readable and Raw with both closed and open inspection.
- [ ] A normal click inspects immediately, and Enter/Space row activation remains available. Keep the explicitly accepted multi-click tradeoff: the first click of a double/triple-click may inspect before word/line selection exists. Do not add a single-click delay or require a separate Inspect control.
- [x] Exclude the entire additional-field count badge, such as 4 fields, including its number and label, from selected/copied row text. The singular badge follows the same rule.
- [x] Actual application content, JSON keys and values named fields remain selectable and copyable. Do not remove or rewrite original data to suppress interface metadata.
- [x] Keep Application text and Transport line copy actions byte-for-byte faithful to their existing original-content contract. Ordinary text selection, copy/paste and keyboard focus remain usable.
- [x] Inspection and selection do not silently pause automatic requests. Selected records continue to follow the existing retained-window identity and removal rules.
- [ ] Verify with real pointer drag/click and double/triple-click gestures, keyboard row activation, selected text and actual clipboard results. Exercise open Inline/Side/Bottom inspection where relevant, including retaining a different inspected record during a drag. Synthetic selection state alone is insufficient evidence of the gesture behavior.

## Specification and evidence

Accepted [layout and badge requirement](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104), [navigation/selection policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015) and [final acceptance checks](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804). The accepted prototype demonstrates drag-versus-click behavior but explicitly does not implement the badge requirement.

## Blocked by

None (can start immediately).

## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest numbered eligible ready ticket; no blockers. GitHub #26
was assigned to `@me` before implementation and remains open. Only this ticket
was implemented on `implementation/compact-view`. Full accepted resolutions
#21/#22/#23/#24 and the linked first-release contract were read.

Production implementation: **freelens-readable-logs 0.1.23**, actual **Freelens
1.10.3**, Electron **41.10.0**, Arch Linux / Hyprland / Wayland. Tarball SHA-256:
`64fc858b0799ca2f3a49f6826f297bdb06b13e30e4391b977bf16c639f230f5e`.
Installed manifest, versioned CommonJS bundles and packaged guide match the build.

**Blocked, not done.** Original criteria 1, 2 and 7 remain unchecked pending
physical mouse evidence. Current native computer APIs are disabled; CDP and
available virtual input do not prove physical-device behavior. No physical
operator/external gesture evidence is available. Linux physical input and
Windows/macOS remain unverified.

[Complete report and supervisor handoff](../../../docs/verification/26/README.md)
maps every original criterion, exact commands, package identity, passing checks,
preliminary failures and cleanup.

- Node 24.18.0/npm 11.16.0 locked install, strict TypeScript, all 100 tests, actual
  tarball/CommonJS inspection and byte-identical rebuild pass. Mechanical UI scan
  has no findings. Package/store/configuration identities and schema are stable.
- Production row handlers preserve selection/inspection on drags while keeping
  immediate first-click and Enter/Space activation. Entire count badges are
  generated unselectable metadata; original application/JSON data is unchanged.
- Recorded **supplementary synthetic packaged-host** stages pass 24 Readable/Raw
  within/across-row drags across closed/open Inline/Side/Bottom, 12 singular/plural
  badge clipboard cases, six first clicks and 12 multi-click cases. These are
  passing stages of a later-failed exploratory driver, not an overall passing
  gesture run or physical acceptance. Its failures and one later driver abort
  are retained explicitly.
- Independent bounded packaged checks pass all 12 exact original-copy comparisons
  immediately and after 100 ms, including blank/whitespace/Unicode/escapes, and
  native Chromium copy/paste, Tab/Shift+Tab and row Enter/Space.
- Genuine automatic log requests continue with selection/inspection present.
  A real stdout append evicts the selected record, clears inspection and keeps
  the paused retained window bounded to 1,000 records.
- Fresh-main Extensions-first uninstall/wait/single-install activation passes
  under main PID 306167 with no discovery failure or post-install restart.
- Original complete application configuration, clipboard content/formats, native
  dock tabs and shared fixture identities/restarts are preserved/restored; only
  the owned namespace was deleted. Test transports/listeners are removed.
  Freelens remains running on workspace 7 with actual prior desktop/focus restored.

Remaining gate: a physical mouse operator must record the specified drags and
plain/double/triple clicks in this exact package, verify inspection/selection and
actual clipboard behavior across both modes/layouts, and record input provenance
and desktop/clipboard restoration. The report gives the isolated fixture/probe
setup and cleanup. Do not substitute more synthetic input for this gate.

No GitHub comments/closures, messages, pushes, merges, releases or global
agent/model settings changes were performed.
