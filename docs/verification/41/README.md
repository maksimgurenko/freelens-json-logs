# #41 — Preserve record identity across refreshes and restarts

Implemented on `implementation/find` from recorded HEAD
`c0f73384c13a2bc0b0eb0ecfa1f48d9b0b324528`. This is the occurrence/context
foundation, not acceptance of the complete Find feature or a release.

## Authority and scope

- Selected the lowest eligible local ticket, #41 (no blockers), and claimed it
  with `gh issue edit 41 --add-assignee @me` before implementation.
- Read the accepted literal-only plan at
  `d02b7e7c19c8e48b1cde714f0a23813b40374824`, the reviewed design, and the full
  applicable [#37 state/identity resolution](https://github.com/maksimgurenko/freelens-json-logs/issues/37#issuecomment-6408002921).
  Live `gh issue view` reads for #41 and decisions #36/#37/#38/#40 found no
  corrections: decision bodies and every comment body match the cached sources.
- No regex, new matching modes, history, asynchronous Find execution, highlights
  or marks are introduced here. Those are downstream tickets. The existing Find
  cursor and pending reveal now use the same references that later reading,
  candidate and intent state must consume.

## Implementation and acceptance evidence

| Original criterion | Evidence |
| --- | --- |
| Shared context-qualified occurrence map/lookup | `src/core/occurrences.ts` owns the one immutable window mapping. Session publishes it once per accepted snapshot. Inspection, Find cursor, React row keys and viewport anchors/reveals use it. `tests/occurrences.test.ts`, `tests/inspection.test.ts`, `tests/navigation.test.ts`, `tests/viewport.test.ts`; mounted browser duplicate check. Independent reading state is introduced by #43 and must use this same public seam. |
| Duplicate example, eviction, no equality/index fallback, identical windows | Pure duplicate/empty/zero-overlap/return/context tests and exhaustive overlap oracle. Browser checks `[start,x,end] → [x,end,x]`, retains the same `x` DOM node, focus and actual browser Selection; identical refresh retains them; eviction closes inspection and clears result with feedback, keeps query and never substitutes/revives an equal line. |
| Monotonic observed-instance epoch | `SnapshotState.instanceEpoch` advances for selected-container changes and observed restarts, atomically publishing an empty new context before reads. Session tests cover repeated paused restarts, missing/first-known metadata, count-then-ID, known differing IDs, no increments for Pause/visibility or same-container actions; the read port observes the new epoch and empty window before replacement data. |
| Reset context; reject old completions; retain terminal UID target | Viewer clears existing temporary query/cursor/selection/reveal state before committing a changed context. Future flags/history/origin/candidate state do not exist in #41. Session and mounted browser exercise repeated paused restarts and old-instance log success/failure. UID replacement retains outdated original records and permanently stops reads; it does not adopt the new Pod. No asynchronous Find completion exists until #42. |
| Preserve existing contracts | 115 passing unit/state tests include parsing, retention, snapshot request guards, lifecycle, profiles, selection/copy and local actions. Browser preserves pixel anchor, ordinary To bottom/following and explicit Pause, checks black canvas, and observes exact copy adapter payloads including whitespace, escapes and nanosecond timestamp. Resource smoke and package checks pass. |
| Pure/session and mounted regressions | Relevant state trace 8: shared duplicate/eviction/identical mapping. Trace 12: observed instance reset and old log completion guards. Relevant parts of trace 9/D13: retained result, gained hits wait for navigation, unchanged DOM focus/selection and eviction; trace 13/D15: mounted retained viewport offset and following/Pause. Remaining asynchronous, reading-row, highlight and geometry portions belong to the dependent tickets. |

TDD: the first occurrence regression failed before its public module existed;
the epoch test failed before epoch publication. The mounted production-renderer
test independently reproduced inspection selecting the appended duplicate before
consumer migration: [browser-red.txt](browser-red.txt). A later first-known/same-container
test exposed a false epoch increment on reselection, which was corrected before
the final checks. The final [browser.json](browser.json) records nine grouped
passing checks and zero uncaught errors.

## Reproduction and results

Use the project-local Node and matching npm CLI, from the repository root:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/occurrences.test.ts tests/inspection.test.ts tests/navigation.test.ts tests/viewport.test.ts tests/lifecycle.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node scripts/verify-find-identity.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/41/package-sha256.txt
git diff --check
```

| Check | Outcome / raw evidence |
| --- | --- |
| Environment | Node 24.18.0, npm 11.16.0, Arch Linux x86_64, kernel 7.2.11-arch1-1, Chromium 154.0.8037.97; `FREELENS_UI_MODE` unset. [environment.txt](environment.txt). |
| Locked install | Passed; 463 packages, existing upstream deprecation warnings retained. [install.txt](install.txt). |
| Typecheck | Passed. [typecheck.txt](typecheck.txt). |
| Full unit/state suite | 115 passed, 0 failed/skipped. [tests.txt](tests.txt). |
| Desktop workflow guards | Six passed, including refusal of unattended native operations. Fake desktop only. [desktop-workflow.txt](desktop-workflow.txt). |
| Mounted production renderer | Passed in isolated headless Chromium using the actual versioned CommonJS bundle and real React 17/MobX; SDK, filesystem and clipboard adapters are stand-ins. [browser.json](browser.json), `scripts/verify-find-identity.mjs`, `tests/find-identity-browser.jsx`. |
| Resource smoke | Passed 40 core/main and 40 mounted-renderer cycles; all RAM/disk/settings/storage/DOM/listener assertions retained. [resource-smoke.txt](resource-smoke.txt). |
| Package | Strict original allowlist, host pinning, CommonJS default exports, host-global React/MobX and no runtime dependencies pass. [package-check.txt](package-check.txt), [build-meta.json](build-meta.json). |
| Reproducibility | Two builds identical: SHA-256 `f23d1a7738cc0cd9a9377a11174e9ae0a70dd520723f2c3356f4c1732f8891ea`. [package-first.txt](package-first.txt), [package-second.txt](package-second.txt), [package-sha256.txt](package-sha256.txt), [reproducibility.txt](reproducibility.txt). |

Resource measurements are bounded smoke observations, not a leak-proof or latency
guarantee. Maximum sampled core deltas from warm baseline: heap 150,376 bytes,
external 30,247 bytes, RSS 58,150,912 bytes. Renderer: heap 654,200 bytes, zero
growth in sampled DOM nodes/listeners/documents; origin storage remains zero.
Raw samples, configured thresholds, disk footprints and settings assertions are
in the resource log. The existing smoke harness and its dependencies remain
pre-existing user work; #47 owns their deliberate committed integration.

## Identity, preservation and limits

Package/store: `freelens-readable-logs`; config/page: `readable-logs`; schema 3;
version 0.1.34; host pin Freelens 1.10.3. No version bump or installation was
performed. [bundle-sha256.txt](bundle-sha256.txt) records both built entry hashes.
The package was built against the working checkout, including the preserved dirty
manifest/lockfile/development documentation; reproducibility applies to these
recorded inputs. It is not a clean-checkout release artifact.

[preserved-prestart.txt](preserved-prestart.txt) verifies all six prestart tracked
dirty files against the runner's original hashes. None is staged with this
ticket. Pre-existing untracked smoke, design, scratch and Ralph files remain in
place. Runtime data under `.ralph` stays outside the commit.

All graphical checks here run in an isolated headless browser. No host window,
workspace, focus, pointer or clipboard was operated; `FREELENS_UI_MODE` remained
unset. Copy evidence is the exact argument received by the clipboard adapter,
not a physical clipboard round trip. No packed Freelens installation, native
input/IME/clipboard, Windows/macOS or installed-host soak evidence is claimed.
Those remain the explicit #48 acceptance gates. Workers do not exist in this
slice; trusted worker packaging/execution starts in #42, so no worker check is
claimed here. Metadata observations and name-addressed reads remain non-atomic;
identical windows cannot identify unobserved identical additions.

## Independent review

Standards and Spec reviews are pinned to the recorded pre-implementation HEAD,
including this ticket's staged diff. Results and any resolutions are recorded
in `review.md` before completion.
