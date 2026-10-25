# 26: Select and copy log text without changing inspection

**Status:** done

**Blocked by:** None (can start immediately).

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/26

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Let users select and copy log text naturally while retaining immediate click-to-inspect behavior. Dragging through Readable or Raw records must leave inspection alone, and copied row selections must exclude the additional-field count badge while preserving original log content.

## Acceptance criteria

- [x] Real pointer drags selecting text within one record and across multiple records preserve the selection without opening inspection or changing an already inspected record. Cover Readable and Raw with both closed and open inspection.
- [x] A normal click inspects immediately, and Enter/Space row activation remains available. Keep the explicitly accepted multi-click tradeoff: the first click of a double/triple-click may inspect before word/line selection exists. Do not add a single-click delay or require a separate Inspect control.
- [x] Exclude the entire additional-field count badge, such as 4 fields, including its number and label, from selected/copied row text. The singular badge follows the same rule.
- [x] Actual application content, JSON keys and values named fields remain selectable and copyable. Do not remove or rewrite original data to suppress interface metadata.
- [x] Keep Application text and Transport line copy actions byte-for-byte faithful to their existing original-content contract. Ordinary text selection, copy/paste and keyboard focus remain usable.
- [x] Inspection and selection do not silently pause automatic requests. Selected records continue to follow the existing retained-window identity and removal rules.
- [x] Verify with real pointer drag/click and double/triple-click gestures, keyboard row activation, selected text and actual clipboard results. Exercise open Inline/Side/Bottom inspection where relevant, including retaining a different inspected record during a drag. Synthetic selection state alone is insufficient evidence of the gesture behavior.

## Specification and evidence

Accepted [layout and badge requirement](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104), [navigation/selection policy](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015) and [final acceptance checks](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804). The accepted prototype demonstrates drag-versus-click behavior but explicitly does not implement the badge requirement.

## Blocked by

None (can start immediately).

## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest numbered eligible ready ticket; no blockers. GitHub #26
was assigned to `@me` before implementation and remains open. Only this ticket
was implemented on `implementation/compact-view`. Full accepted resolutions
#21/#22/#23/#24 and the linked first-release contract were read.

Production implementation: **freelens-readable-logs 0.1.24**, actual **Freelens
1.10.3**, Electron **41.10.0**, Arch Linux / Hyprland / Wayland. Tarball SHA-256:
`ad17fff73f29f1b5247887fb5f31785bd97ab2af2ec758881be272ebbe770fdd`.
Installed manifest, versioned CommonJS bundles and packaged guide match the build.

**All seven original criteria are satisfied.** The earlier physical-hardware-only
interpretation added a gate absent from #26 and is withdrawn following supervisor
clarification. Final evidence uses Playwright 1.64.1 trusted Chromium pointer and
keyboard input in the installed package to create actual selection and compare
the actual Electron clipboard. Synthetic selection state alone is not counted.
No physical hardware provenance is claimed. #28's explicit physical mouse Back
gate remains required, unimplemented and unverified. Windows/macOS are unavailable
and unverified. The runner owns the Status field above.

[Complete report and original-criterion evidence map](../../../docs/verification/26/README.md)
maps every original criterion, exact commands, package identity, passing checks,
retained failures and cleanup. Initial implementation commit:
`53e75265bf0bb659e9b2b82264bdcc3560c26934`; the continuation commit records this
completed checklist, the production correction and all final evidence together.

- Node 24.18.0/npm 11.16.0 locked install, strict TypeScript, all 100 tests, actual
  tarball/CommonJS inspection and byte-identical rebuild pass. Mechanical UI scan
  has no findings. Package/store/configuration identities and schema are stable.
- Production row handlers preserve selection/inspection on drags while keeping
  immediate first-click and Enter/Space activation. Entire count badges are
  generated unselectable metadata; original application/JSON data is unchanged.
  A real 0.1.23 packaged regression exposed a suppressed normal click inside an
  existing selection. 0.1.24 snapshots the pre-gesture selection position so that
  unchanged old ranges allow immediate clicks while new selection/drag suppresses
  inspection. The same packaged regression passes on 0.1.24; no delay is added.
- All six complete final gesture cases pass: **24** Readable/Raw within/across-row
  drags with closed/open Inline/Side/Bottom inspection, including retaining a
  different inspected record; **12** singular/plural badge clipboard cases;
  **six** immediate first clicks; **12** Enter/Space activations; **12**
  double/triple-click word/line selections. Actual application content/JSON
  keys/values named `fields` remain selected and copied.
- **72** original-copy actions pass byte-for-byte comparisons both immediately
  and after 100 ms, with a different clipboard sentinel before every copy.
  Covers both original actions, blank/whitespace/indentation, Unicode, escapes
  and Kubernetes timestamp precision. Ordinary Find copy/paste and Tab/Shift+Tab
  pass. Every final case restores clipboard formats, buffers and image pixels.
- Genuine automatic HTTP 200 log requests continue with actual drag selection
  and another record inspected; selection and the exact inspected original
  survive. A real stdout append evicts the record, clears inspection and keeps
  the paused retained window bounded to 1,000 records/114,000 original bytes.
- Fresh-main Extensions-first uninstall/wait/single-install activation passes
  under main PID 383756, using process-local polling and same-filesystem TMPDIR,
  with no discovery failure or post-install restart.
- Historical custom CDP/uinput failures remain recorded. The supervisor's stale
  drag hypothesis was tested with `Input.cancelDragging` plus explicit releases;
  that native case still failed, so its cause is not established. The historical
  18-byte empty-copy mismatch was not reproduced by focused trials or the final
  full trusted-input sequence; retained selection alone was not an established
  cause. No speculative copy/CSS fix was made and no failures were relabeled.
- Original complete application configuration, clipboard content/formats, native
  dock tabs and shared fixture identities/restarts are preserved/restored; only
  the owned namespace was deleted. Test transports/listeners are removed.
  The owned temporary virtual input device is absent.
  Freelens remains running on workspace 7 with actual prior desktop/focus restored.

No GitHub comments/closures, messages, pushes, merges, releases or global
agent/model settings changes were performed.
