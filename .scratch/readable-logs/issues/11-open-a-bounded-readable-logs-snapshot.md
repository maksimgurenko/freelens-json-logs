# 11: Open a bounded Readable logs snapshot

**Status:** ready-for-agent

**Blocked by:** None (can start immediately).

Source: https://github.com/maksimgurenko/freelens-json-logs/issues/11

This local queue mirrors the GitHub implementation ticket. The authoritative decisions and comment bodies are cached in `.ralph/sources/github-01.md` through `github-10.md`; refresh through `gh` if needed. Record verification here.

## Parent

[Implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8)

## What to build

From a Pod's details header in Freelens 1.10.3, open an extension-owned Readable logs page for that Pod and read one bounded snapshot with the built-in Default formatting. This is the first production tracer bullet: an actual installable TypeScript package and working host-to-viewer path. Automatic refresh and richer inspection/profile controls arrive in the following tickets.

Authoritative requirements: [implementation contract and first-release acceptance](https://github.com/maksimgurenko/freelens-json-logs/issues/8#issuecomment-6352283620); [readable records and parsing fallbacks](https://github.com/maksimgurenko/freelens-json-logs/issues/3#issuecomment-6330814725); [bounded refresh and target lifecycle](https://github.com/maksimgurenko/freelens-json-logs/issues/5#issuecomment-6331306075); [Pod-details header action](https://github.com/maksimgurenko/freelens-json-logs/issues/6#issuecomment-6331951546); [Freelens 1.10.3 public integration contract](https://github.com/maksimgurenko/freelens-json-logs/issues/2#issuecomment-6329877105); [live host-integration evidence](https://github.com/maksimgurenko/freelens-json-logs/issues/7#issuecomment-6332133294); [accepted local maintenance procedure](https://github.com/maksimgurenko/freelens-json-logs/issues/10#issuecomment-6351871618). These accepted decisions govern the behavior; disposable evidence is not production implementation or proof of production acceptance.

## Acceptance criteria

- [x] Produce a reproducible TypeScript extension package pinned to the Freelens 1.10.3 SDK, with a committed dependency lockfile, CommonJS/host-global entry points, and host-provided React/MobX and other host dependencies external. Research/prototype branches remain evidence and are not merged as production code.

- [x] Document runtime/package-manager versions, stable package/store identifiers, and exact commands for a clean locked install, type-check, tests, build and tarball creation. Inspect the tarball and install/run that actual package using the accepted maintenance procedure.

- [x] Place the Readable logs icon button in the Pod-details header beside the native actions; a row/context-menu entry alone is insufficient. Preserve the selected cluster, namespace, Pod name and UID, and show the Pod, container and active built-in Default profile in the viewer.

- [x] Honor the Pod default-container annotation only when it names a regular container, otherwise select the first regular container. If there is no regular container, require explicit selection rather than guessing an init/ephemeral container.

- [x] Request the selected container's current-instance latest 1,000-line tail with Kubernetes timestamps, no following, no previous-instance logs and no incremental cursor. Keep transport timestamp and application text distinct.

- [x] Implement the authoritative Default extraction, candidate precedence, explicit-zone timestamp handling/local display, level normalization and fallbacks. Represent mixed text, malformed JSON, arrays/scalars, blank lines and multiline output according to the parsing examples, without losing records.

- [x] Preserve exact transport lines, application text and complete parsed objects. Retain the newest complete-line suffix within the 5 MiB UTF-8 original-text budget, preserve order and repeated identical lines, and distinguish omission/oversized-record notices from genuine empty success. Provide no tail-size control.

- [x] Show a clear initial error on failed requests rather than treating failure as empty output. Keep pure parsing/formatting logic testable without launching Freelens and isolate navigation, log access, storage and other host operations in the adapter.

- [x] Add automated parsing/preservation and retention fixtures, including the 1,000-line boundary, more-than-tail input, UTF-8 near/over budget and an oversized newest record. Record production-package host evidence for header placement, correct target/container, intact timestamped JSON, mixed text and empty output.

## Blocked by

None (can start immediately).


## Implementation and verification evidence

Implemented on the current `implementation/readable-logs` branch as the production
TypeScript package `freelens-readable-logs@0.1.1`. Stable store ID is
`freelens-readable-logs`; no durable configuration is created in this milestone.
No prototype/research worktree was modified or merged. GitHub #11 was claimed by
assigning `@me` before implementation; no GitHub comments or closure were posted.

Full commands, artifacts, observed outcomes and limitations:
[Ticket 11 verification](../../../docs/verification/11/README.md).
Build/maintenance commands: [local development guide](../../../docs/local-development.md).

Original acceptance criteria, in order:

1. Pinned SDK/core 1.10.3, committed npm lockfile, strict TypeScript, CommonJS
   default entries and host-global bindings: `package.json`, `package-lock.json`,
   `scripts/build.mjs`, `scripts/check-package.mjs`. Packed-file and bundled-input
   checks passed; no host React/MobX or SDK implementation was bundled.
2. Clean `npm ci`, type-check, all **16 tests**, build, pack and tarball inspection
   passed with Node **24.18.0** / npm **11.16.0**. Rebuilding after another locked
   install produced the identical tarball SHA-256
   `6ca722794aca142c7992a90fbc0e405b30902a48e1f4c9e3df169b911d3de2da`.
   That actual package installed via one UI submission in a fresh main window and
   ran without a post-install restart (main PID **2118398** stayed unchanged).
   Validation used process-local `TMPDIR=$HOME/.cache/freelens-readable-logs/tmp`;
   default-temp discovery failures and their limits are recorded, not counted as
   passes. No global configuration was changed.
3. Actual host header DOM and screenshots put Readable logs beside native Logs.
   Clicking it preserved cluster ID, namespace, Pod name and UID, selecting regular
   annotation container `json`; the running 0.1.1 viewer showed Pod, container and
   Default profile. Installed main/renderer bytes match rebuilt bundle hashes.
4. `tests/session.test.ts` verifies valid regular annotation, invalid/init/ephemeral
   annotation fallback and explicit selection with no regular containers. The
   actual host verifies the regular annotation path; the no-regular branch is
   automated evidence, not a claimed real Kubernetes Pod.
5. Adapter uses the explicit container and current-instance 1,000-line timestamped
   snapshot with `follow:false`, `previous:false`, no cursor. The real host showed
   one intact timestamped JSON fixture and a separate 1,000-record window.
6. Authoritative Default examples pass in `tests/records.test.ts`; real mixed input
   showed 12 independent records, including malformed JSON, arrays/scalars, blank
   line, separate stack frames, escaped multiline JSON, Unicode, local application
   time and numeric/unknown-preserving severity behavior.
7. `tests/snapshot.test.ts` verifies exact transport/application originals, complete
   objects, repeated-line order, complete suffixes at/near/over 5 MiB UTF-8 and an
   oversized newest record. Omission/oversize notices have distinct UI branches
   from empty success; no tail-size control is exposed.
8. Core record/retention/target/session logic is host-independent and tested; public
   navigation/log access are in the adapter. The actual packaged host displayed a
   useful initial `PodInitializing` request error rather than empty logs. This is
   not access-denial evidence. Late-result suppression has core fixtures; richer
   refresh/lifecycle/recovery work remains outside this ticket.
9. All requested automated boundaries passed. Production-package evidence covers
   actual header placement/navigation, correct target/container, intact timestamped
   JSON, mixed/malformed/blank output and genuine empty success. Temporary ticket-11
   Pods were removed; original fixture Pods and unrelated host state were preserved.

The complete first release remains subject to tickets 12–19. This ticket does not
claim their polling, inspection, profile persistence, lifecycle, live denial,
performance or release gates. Status is left for the Ralph runner to update.
