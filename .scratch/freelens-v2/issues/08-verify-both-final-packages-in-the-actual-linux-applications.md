# 08: Verify both final packages in the actual Linux applications

**Status:** ready-for-agent

**GitHub:** [#65](https://github.com/maksimgurenko/freelens-json-logs/issues/65)

**Blocked by:** [07: Run the shared verification matrix and guarded local evaluation helpers](07-run-the-shared-verification-matrix-and-guarded-local-evaluation-helpers.md) ([#64](https://github.com/maksimgurenko/freelens-json-logs/issues/64)).

## Parent

Part of #56: [Accepted implementation handoff: Freelens 1 and 2 compatibility](https://github.com/maksimgurenko/freelens-json-logs/issues/56#issuecomment-6537617726), implementation unit 8.

## What to build

Establish the required behavior-parity evidence for the exact final extension packages in Freelens 1.10.3 and the pinned locally built Freelens 2 application. Run the same common Linux scenarios and report their actual evidence and limits.

Constraints: [Required application acceptance matrix](https://github.com/maksimgurenko/freelens-json-logs/issues/55#issuecomment-6537569435), [Support and packaging policy](https://github.com/maksimgurenko/freelens-json-logs/issues/54#issuecomment-6535659523), [Pinned v2 feasibility evidence and reproduction constraints](https://github.com/maksimgurenko/freelens-json-logs/blob/bca4c8a944d8771b06abc6af1e33d7fe5f5246dc/docs/research/freelens2-runtime.md). The complete [baseline behavior specification](https://github.com/maksimgurenko/freelens-json-logs/blob/87e2a0b568ed68835badb4ca97173d9655db442a/docs/specification.md) remains the regression contract.

## Acceptance criteria

- [ ] Evaluate Freelens 1.10.3 and Freelens 2 declaring 2.0.1-0 built from source revision c02289f23422d9512544de3c506605296433e999 in the designated local checkout. Use the accepted Node 24.22.1 / pnpm 12.15.0 frozen-lockfile install, build:di, build and build:app:dir recipe; verify source/dirty state and build outputs. Reuse an existing v2 build only with matching provenance.
- [ ] For each selected final archive, record extension revision/dirty state; application source/build/full runtime identity; SDK/dependency/type/toolchain/lock/build recipe; executable/app-bundle/archive/installed-resource hashes; and owned PID/profile/private-session/debug/frame identities. Preflight and observed identities must agree before behavioral results count.
- [ ] Verify real correct-package loading, matching application-owned libraries, working React hooks/observable settings and entry through the Pod-header action into the separate correctly targeted viewer. Exercise applicable wrong-package refusal through actual loader/runtime paths, recording where refusal occurred without bypassing a genuine loader rejection.
- [ ] Run the common target/log/metadata and recent-window scenarios: actual SDK request options, container selection, Pause/Refresh/Resume, slow/error/retry, stale/late replies, Pod loss/UID replacement, observed restart and same-target outstanding-read guards across close/reopen and disable/re-enable. Preserve restart-specific state rules; identify controlled delivery/metadata cases explicitly.
- [ ] Exercise boundary snapshots, original content and extracted presentation, occurrence survival/eviction, reading/following/resize/scroll anchoring, inspection layouts, Raw/Readable, selection versus click and exact-original copy through the final production bundles. Exhaustive pure cases remain in their shared gate.
- [ ] Verify profiles, staged Save/Cancel, Auto/manual/default behavior and reformatting without reads/Pause changes. Observe renderer/main/disk synchronization, full quit/reopen persistence, disable/re-enable plus a new edit, independent version store namespaces, invalid/unsupported byte preservation, canceled/failed recovery and confirmed exact backup/reset.
- [ ] Exercise complete Find matching/flags, position/navigation/refinement/history, hidden-source inspection, highlights/marks/reveal and source/mode transitions with real main-owned workers and IPC. Observe actual sender/frame authority, foreign-token rejection, pending registration, cancellation/replacement, deadlines/failures, stale successes/failures and actual worker exits.
- [ ] Use the documented guarded private-session input routes for eligible shortcuts, foreign menu/editor/native Logs ownership, Escape/Back, selection seeding, exact clipboard completion/failure and IME commit/cancellation/late transactions. Distinguish DOM/CDP, controlled delivery, virtual/native-input and physical-device evidence; do not infer native delivery from synthetic DOM events.
- [ ] Verify eligible unfocused views continue, hidden/minimized/inactive routes invalidate/stop work, and return fetches fresh data or preserves Pause. Check page close/navigation, document/frame/renderer loss, disable/re-enable and quit with pending work: owned listeners/timers/observers/ownership release, no stale adoption, actual worker exit and exactly expected reactivated bindings.
- [ ] Every required actual-application case has accepted evidence for both versions, with passed/failed/unperformed status retained beside corrected runs. Missing or failed required evidence blocks the corresponding parity claim; CI, browser stand-ins and the disposable runtime fixture are insufficient. If a fix changes an archive, update its identity and rerun affected gates against that final artifact.
- [ ] Document final commands, provenance, case/reuse results, evidence and preserved validation limits. Read the Linux UI playbook before application work and preserve focus/workspace/pointer/clipboard throughout; use background CDP/guarded private sessions and workspace 7. Do not publish a release or replace the user's installation.

Linux only. Preserve the existing behavior contract and its documented validation limits. Cross-version settings migration, Windows/macOS suites, new features, UI redesign, dock integration, release publishing and replacement of the user's installation remain out of scope. A newly exposed design question needs a precise decision ticket; stop only the work dependent on that answer.
