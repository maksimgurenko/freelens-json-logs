# 08: Verify the final package in released Freelens 2 on Linux

**Status:** ready-for-agent

**GitHub:** [#65](https://github.com/maksimgurenko/freelens-json-logs/issues/65)

**Blocked by:** [07: Run Freelens 2 CI and guarded local evaluation helpers](07-run-freelens-2-ci-and-guarded-local-evaluation-helpers.md) ([#64](https://github.com/maksimgurenko/freelens-json-logs/issues/64)).

## Parent

Part of #56: [Historical implementation handoff](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 8.

## Target and scope

The maintainer has narrowed implementation to **Freelens 2 only**. Target [released Freelens 2.0.0](https://github.com/freelensapp/freelens/releases/tag/v2.0.0), published 2026-10-28, at source commit `b9b53e16056578c5407312eba5823a089972f6d5` with SDK `2.0.0`. These current acceptance criteria supersede the historical handoff's dual-platform implementation, packaging and evaluation requirements.

Reference the released [extension API](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/api.md) and [porting guide](https://github.com/freelensapp/freelens/blob/b9b53e16056578c5407312eba5823a089972f6d5/docs/extensions/migrating-from-v1.md). Preserve the complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) as the functional regression contract.

## What to build

Establish actual application acceptance for the exact final extension package in released Freelens 2.0.0 on Linux, preserving the existing user-visible behavior and reporting the tested evidence and limits.

## Acceptance criteria

- [ ] Build the actual Linux application from released v2.0.0 source commit b9b53e16056578c5407312eba5823a089972f6d5 using that revision's declared pinned toolchain, frozen-lockfile install and documented build recipe. Verify source/dirty state, SDK and build outputs. Reuse an existing build only with matching release provenance.
- [ ] Record extension revision/dirty state; application release/source/build/full runtime identity; SDK/dependency/type/toolchain/lock/build recipe; executable/app-bundle/archive/installed-resource hashes; and owned PID/profile/private-session/debug/frame identities. Preflight and observed identities agree before results count.
- [ ] Verify real final-package loading, application-owned libraries, working React hooks/observable settings and entry through the Pod-header action into the separate correctly targeted viewer. Record applicable real loader/runtime refusal without bypassing genuine loader rejection.
- [ ] Exercise actual SDK log/metadata options, container selection, Pause/Refresh/Resume, slow/error/retry, stale/late replies, Pod loss/UID replacement, observed restart and same-target outstanding-read guards across close/reopen and disable/re-enable. Preserve restart-specific state; identify controlled delivery/metadata cases.
- [ ] Exercise boundary snapshots, originals and extracted presentation, occurrence survival/eviction, reading/following/resize/scroll anchoring, inspection layouts, Raw/Readable, selection versus click and exact-original copy through the final bundle. Exhaustive pure cases remain in their shared gate.
- [ ] Verify profiles, staged Save/Cancel, Auto/manual/default and reformatting without reads/Pause changes. Observe renderer/main/disk synchronization, full quit/reopen persistence, disable/re-enable plus a new edit, the stable v2 store identity, invalid/unsupported byte preservation, canceled/failed recovery and confirmed exact backup/reset.
- [ ] Exercise complete Find matching/flags, position/navigation/refinement/history, hidden-source inspection, highlights/marks/reveal and source/mode changes with real main-owned workers and IPC. Observe sender/frame authority, foreign-token rejection, pending registration, cancellation/replacement, deadlines/failures, stale successes/failures and actual worker exit.
- [ ] Use documented guarded private-session input routes for eligible shortcuts, foreign menu/editor/native Logs ownership, Escape/Back, selection seeding, exact clipboard completion/failure and IME commit/cancellation/late transactions. Distinguish DOM/CDP, controlled delivery, virtual/native-input and physical-device evidence.
- [ ] Verify unfocused eligible views continue, hidden/minimized/inactive routes invalidate/stop work and return fetches fresh data or preserves Pause. Check page close/navigation, document/frame/renderer loss, disable/re-enable and quit with pending work: owned resource release, no stale adoption, actual worker exit and exactly expected reactivated bindings.
- [ ] Every required actual application case has accepted evidence from the released v2 build, with passed/failed/unperformed results and corrected runs retained beside failures. Missing or failed required evidence blocks the corresponding acceptance claim. Earlier feasibility fixtures and CI/browser stand-ins are insufficient. If an archive changes, update its identity and rerun affected gates.
- [ ] Document final commands, provenance, case results, evidence and preserved validation limits. Read the Linux UI playbook before application work and preserve focus/workspace/pointer/clipboard throughout; use background CDP/guarded private sessions and workspace 7. Do not publish a release or replace the user's installation.

Linux only. Preserve the baseline behavior and its documented validation limits. Settings transfer from older installations, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only work dependent on that answer.
