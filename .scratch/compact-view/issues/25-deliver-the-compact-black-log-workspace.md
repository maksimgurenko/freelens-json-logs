# 25: Deliver the compact black log workspace

**Status:** ready-for-agent

**Blocked by:** None (can start immediately).

GitHub: https://github.com/maksimgurenko/freelens-json-logs/issues/25

## Parent

https://github.com/maksimgurenko/freelens-json-logs/issues/20

## What to build

Give Readable logs the accepted B single-toolbar layout so users spend more of the window reading logs while keeping target context and every existing viewing capability reachable. This ticket delivers working visible controls, on-demand Find and reclaimed inspector space using the existing production log/profile behavior. Contextual keyboard navigation and the additional shortcuts are delivered by the dependent tickets.

## Acceptance criteria

- [x] Implement accepted layout B with compact target context, container/profile selection, directly available Pause/Resume, Refresh and Find, and an icon plus visible Edit profiles label beside profile selection.
- [x] Find opens on demand in a temporary row. Its visible close action hides the row while retaining the current view query and matching state for reopening; it does not filter the recent log window or persist the query across views.
- [x] Preserve the existing case-insensitive literal application-text OR extracted-message Find predicate, one count per record, Previous/Next wraparound, no-match feedback and recomputation after relevant profile/window changes.
- [x] Keep Readable/Raw, timestamps, wrap and Inline/Side/Bottom inspection reachable through the compact display-options arrangement. Technical target identifiers remain reachable through their own disclosure; the compact record/status footer and actionable lifecycle/error/recovery feedback remain available.
- [x] Readable and Raw canvases, including empty log space, have a pitch-black background. Recover space from surrounding chrome while preserving readable log typography; do not adopt prototype pixel measurements as fixed requirements.
- [x] No empty inspector pane reserves space in any layout. Selecting a record opens the chosen layout; closing inspection or losing the selected record returns that space to logs. Keep the saved global layout preference, with Side as the initial default, and retain all inspector content tabs and exact original-text copy actions.
- [x] At ordinary desktop widths the controls form the chosen compact toolbar. Long target/container/profile names and narrower windows adapt in logical groups without page-wide horizontal overflow or inaccessible controls. Keep visible keyboard focus and accessible control names.
- [x] Opening presentation controls or inspection does not implicitly pause requests. Keep the existing parsing, recent-log-window bounds, refresh/lifecycle, profile-selection and configuration contracts, including quiet routine refresh status without log-area jumps.
- [x] Verify ordinary, empty, loading/error, long-label and narrow-window states, Readable/Raw and all inspector layouts against production behavior. Record packaged Freelens observations separately from browser checks; the prototype is interaction evidence rather than production code to merge wholesale.

## Specification and evidence

Accepted [layout](https://github.com/maksimgurenko/freelens-json-logs/issues/21#issuecomment-6392444104) and [final acceptance contract](https://github.com/maksimgurenko/freelens-json-logs/issues/24#issuecomment-6392766804). The [navigation decision](https://github.com/maksimgurenko/freelens-json-logs/issues/22#issuecomment-6392713015) defines retained Find and inspection state; its full Escape policy is delivered by a dependent ticket. The linked disposable B prototype is visual evidence, not authority for omitted production features.

## Blocked by

None (can start immediately).


## Implementation and verification evidence (2026-10-25 UTC)

Selected as the lowest eligible ready ticket; no blockers. GitHub #25 was assigned
to `@me` before implementation and remains open. Only this ticket was implemented.
Accepted full resolutions #21/#22/#23/#24 and the first-release contract were read;
prototype B at `a293e92` was compared without merging it.

Production package **freelens-readable-logs 0.1.22**, actual **Freelens 1.10.3**,
Arch Linux / Hyprland / Wayland. Tarball SHA-256:
`ef7c13ad3181b96fab8e5e925f37e6c6140c89b9ce3796003756566725f8b95e`.
Installed manifest, both versioned bundles and packaged guide match the build.

All nine original criteria are satisfied. The complete criterion-by-criterion
mapping, exact commands, executable probes, observations, preliminary failures,
cleanup and evidence boundaries are in
[the verification report](../../../docs/verification/25/README.md).

- Accepted B toolbar and separate target/display disclosures; black Readable/Raw
  canvases including genuine empty output; long Pod/container/profile labels and
  installed-view widths 360–1600px with no control/page overflow.
- On-demand Find retains query/count/current result on close/reopen; literal OR
  predicate, wraparound, no-match/profile/window recomputation and fresh-view reset
  pass against actual records.
- Six Readable/Raw × Inline/Side/Bottom cases, exact tabs/copy, collapse on Close
  and real selected-record eviction pass. Saved layout survives reopening; Side
  remains the unchanged initial default. Eighteen exact clipboard comparisons pass.
- Real held loading and socket error/Retry pass; automatic requests continue while
  presentation/inspection are open. Routine refresh has zero log-area movement.
- Documented Node 24.18.0/npm 11.16.0: locked install, strict TypeScript, all 100
  tests, tarball/CommonJS inspection and byte-identical rebuild pass. Design scan
  has no findings. Stable identifiers/schema/host dependencies are unchanged.
- Final package used fresh-main Extensions-first uninstall/wait/single install;
  Enabled, target UID, actual header action and usable logs passed without a
  post-install restart. No discovery failure occurred.
- Original configuration and clipboard content restored; only owned profile and
  namespace removed, shared UIDs/restarts preserved, transport helpers removed.
  Freelens remains on workspace 7 with per-operation desktop/focus restoration.

Windows/macOS native input remain unverified. Physical gestures, Escape routing
and added shortcuts are separate tickets #26–29, not claims made by #25. No GitHub
comments/closures, external messages, pushes, merges or releases were performed.
