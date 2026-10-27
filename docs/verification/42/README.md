# #42 — Literal Find execution: current checkpoint

**Incomplete; actual-host SDK/lifecycle proof remains.** The production SDK/frame
service, asynchronous renderer client and Find input/two matching flags are now
wired and independently reviewed. The initial pure-worker checkpoint below is
historical. Current implementation, exact commands, automated evidence, limitations
and next-context handoff are in the [continuation report](continuation/README.md).
Do not select #43 or claim complete Find/release acceptance yet.

# Initial pure-worker checkpoint (67b1d5e)

**Incomplete ticket; retry required.** This commit implements the pure literal
matcher, validated wire schema, standalone worker build/package and per-viewer
main execution scheduler. Production SDK/frame ownership and the Find UI are
not wired yet. It does not accept the Find feature, package installation or a release.

Branch: `implementation/find`. Recorded pre-implementation HEAD and review base:
`50bfc2e3999d5079ca9ca8e8698df3c158cf24a9`. The lowest eligible unfinished ticket
was #42, **Run literal Find through owned, cancellable workers**; #41 was locally
done with committed evidence. Claimed before implementation using
`gh issue edit 42 --add-assignee @me`. Live issue #42 and full #36/#37/#38/#40
comments were read; no correction to this slice's accepted literal-only contract
was found. Authority is the accepted plan at
`d02b7e7c19c8e48b1cde714f0a23813b40374824`, cached in
`.ralph/sources/find/accepted-implementation-plan.md`. Prototype/research worktrees
were read as evidence; none was merged or overwritten.

## Implemented and checked

- `src/core/find-matcher.ts`: one escaped-literal implementation for complete
  ordered record/provenance results and separately bounded original UTF-16
  ranges. Only the query folds, using scoped ignore-case with Unicode semantics;
  original Letter/Number/underscore neighbors stay outside folding. No normalization,
  locale tailoring or raw-pattern branch. Whole-source non-overlap is preserved
  across visible scopes, and scope priority can reach later content independently
  of the global 4,096-range cap.
- `src/core/find-protocol.ts`: exact query/two flags; six input-key dimensions,
  request/worker-generation/range-interest identity; structural, count, length,
  UTF-8 application budget, source/ref/order/coverage and UTF-16 range validation.
  It validates before matcher/worker allocation; SDK serialization itself remains
  host-owned and is not claimed to be allocation-free.
- `src/worker/find.ts`: trusted standalone CommonJS output; version handshake,
  repeated match/range operations, request validation and local execution failure.
  Only `node:worker_threads` is external. User text is data. Build/check scripts
  add the worker to the strict tarball allowlist and execute the unpacked asset
  outside the checkout without DOM, SDK or host globals.
- `src/main/find-execution.ts`: lazy reusable worker, one running operation and
  one newest logical input descriptor with its latest decoration interest.
  Exact matching takes priority over range churn; supersession stops actual
  execution and never starts a replacement before the prior exit event. The
  1,000 ms allowance includes validation, queue wait and startup; delayed timer
  callbacks cannot admit a late reply. Empty/oversized inputs do not allocate a
  worker. Old request IDs and stale success/failure identities cannot settle
  current work. Inactivity/disposal release idle/startup workers and await exit.
  This scheduler is not yet connected to the extension or viewer.

TDD seams are the ticket's pure matcher/protocol and owned-worker execution
boundaries. Each behavioral slice began with a failing public-interface check;
focused tests and typechecking were run between slices. The initial packed
allowlist check failed because the worker was absent; see
[worker-package-red.txt](worker-package-red.txt). Final unit coverage adds Unicode,
fragment, retention and controlled-clock/worker regressions. Fake workers/clocks
exercise startup stalls, delayed exit, timeout and stale delivery; they do not
establish actual host behavior.

## Reproduction and evidence

Run from the repository root with the documented project-local toolchain:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
node --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js --version
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run typecheck
node --experimental-strip-types --test tests/find-matcher.test.ts tests/find-protocol.test.ts tests/find-execution.test.ts
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js test
python3 -B -m unittest discover -s tests -p ui_desktop_test.py -v
node scripts/verify-find-execution.mjs
node scripts/verify-find-identity.mjs
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run test:smoke
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run check:package
sha256sum dist/freelens-readable-logs-0.1.34.tgz
node .scratch/readable-logs/toolchain/node_modules/npm/bin/npm-cli.js run package
sha256sum --check docs/verification/42/package-sha256.txt
git diff --cached --check
```

| Check | Outcome and evidence |
| --- | --- |
| Environment/identity | Node 24.18.0, npm 11.16.0, Arch Linux x86_64, Chromium 154.0.8037.97. `FREELENS_UI_MODE` unset. Package/store `freelens-readable-logs`, version 0.1.34; config `readable-logs`, schema 3; pinned Freelens 1.10.3. [environment.txt](environment.txt). |
| Locked install | Passed, 463 packages; existing deprecation warnings retained in [npm-ci.txt](npm-ci.txt). |
| Typecheck | Passed. [typecheck.txt](typecheck.txt). |
| Unit/state suite | 212 passed, none failed/skipped. [full-tests.txt](full-tests.txt). |
| Focused seams | Matcher/protocol: 88 passed, including all four flags, Kelvin/sigma/sharp-s, accents, astral/lone surrogates, U+0345, query boundaries, dense cap, late source ranges and actual retention. [matcher-protocol-tests.txt](matcher-protocol-tests.txt). Scheduler: controlled-clock/worker cases in [focused-tests.txt](focused-tests.txt). |
| Actual worker lifecycle | 20 cycles, 441 requests, 41 starts/exits, peak one and zero remaining. Includes real startup supersession, idle reuse, inactivity, reactivation and disposal before ready. Final startup stop-to-exit 2.51 ms in this run; replacement-through-reply samples are a different metric, not stop latency. [actual-worker-lifecycle.json](actual-worker-lifecycle.json). These small samples are not latency guarantees or resource-soak acceptance. |
| Mounted production renderer | Nine grouped identity/viewport/restart/copy-payload checks pass, zero uncaught errors. Real versioned CommonJS renderer, React 17/MobX, isolated headless Chromium; SDK/filesystem/clipboard stand-ins. [mounted-identity.json](mounted-identity.json). The existing synchronous Find remains in this renderer, so this does not verify async worker/UI integration. |
| Existing resource smoke | Passed core/main and production renderer workloads with original heap/external/RSS, DOM/listener/document, disk/settings and browser-storage checks. [resource-smoke.txt](resource-smoke.txt). The user's pre-existing smoke/CI/dependency work was retained unchanged; new Find SDK/UI workloads are still pending, and #47 owns full integration. |
| Desktop guards | Six passed against a fake desktop; no native operations. [ui-guards.txt](ui-guards.txt). |
| Packed asset/reproducibility | Strict tarball/metadata and actual unpacked worker checks pass, including version, count/provenance, original offsets, cap/late ranges, oversized rejection and actual exit from a non-checkout CWD. [package-check.txt](package-check.txt), [package-sha256.txt](package-sha256.txt), [reproducibility.txt](reproducibility.txt). |
| User work | All prestart tracked dirty files retain their recorded SHA-256 bytes. [prestart-preservation.json](prestart-preservation.json). No package/lockfile/CI/glossary/local-development or other user content was staged. The runner's #41 done status is the only related prior-ticket update included. |

Independent review is recorded in [review.md](review.md). Standards had one
nonblocking duplication finding, resolved with a shared failed-operation helper;
Spec found zero confirmed defects and retained the explicit integration gates.

## Exact continuation for the next context

Continue **#42 only**, from this checkpoint commit; keep the original acceptance
text and baseline above. Do not move to #43. Concrete autonomous work remains:

1. Add the main extension's SDK service and trusted worker factory. Read the
   versioned worker relative to the installed main module inside supervised
   startup, then construct `Worker(source, { eval: true })`. Bind opaque viewer
   ownership to actual requesting webContents and senderFrame process/routing
   identity. Include actual frame-tree membership (the experimental frame-deleted
   listener alone was disproved), same-frame replacement, inactive/closed owners,
   disable/deactivate and app shutdown; await actual exit and remove handlers.
2. Add the extension-scoped renderer client and connect the production Find input,
   Match case and Whole words to this scheduler. Keep input exact/untrimmed and
   flags initially off/reset on instance context. Carry full input/request/worker/
   interest identities, validate replies and reject stale failures. Remove the
   synchronous production matching path. Keep independent live reveal permission;
   #43 adds the full reading/refinement state behavior.
3. Implement renderer timers before dispatch: immediate pending/disabled navigation,
   Searching after 100 ms, expiry at 1,000 ms including bridge/startup; preserve
   oversize input with explanation. Latch timeout/execution feedback, explicit edit
   or Retry on current data only, no retry on refresh or silent fallback. Separate
   decoration failure from completed exact counts. Preserve composition editing,
   following/Pause, original copy and all existing viewer behavior.
4. Add mounted async Find/client regressions and actual packed production-worker/
   SDK/frame-ownership/lifecycle evidence in an isolated graphical host. Keep the
   user's desktop untouched, obey `docs/agents/ui-verification.md`, keep
   `FREELENS_UI_MODE` unset. Do not install into/restart the user's host or seek
   attended approval before #48. Run remaining required suites/package/resource
   checks after integration, record precise limits and leave native/Windows/macOS
   checks unverified where unavailable. Review further changes against the same
   original #42 baseline plus this checkpoint. Only report done after all original
   criteria are satisfied and committed.
