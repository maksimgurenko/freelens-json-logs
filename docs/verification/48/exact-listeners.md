# #48: exact retention boundary and pre-heap listener observations

Continuation/review baseline: `3555efc4bb3d5fbd5775bf0c405f31c37c857747`.
Original ticket baseline: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Selected **Verify production Find against the acceptance matrix**; #47 is locally
complete. Claimed #48 before implementation with `gh issue edit 48 --add-assignee @me`.
[Live authority](host/exact-listeners/authority.json) confirms complete bodies and
comments for #36/#37/#38/#40/#48 match cached sources and the accepted plan matches
`d02b7e7c19c8e48b1cde714f0a23813b40374824` byte for byte.

This remains a partial checkpoint, not ticket completion or release acceptance.
No production code or package bytes change. Failed resources and all remaining
Host/native/platform gates remain explicit. No original unfinished whole criterion
is newly checked.

## Installed retention checks

[Six checks](host/exact-listeners/retention-boundary.json) pass through the actual
installed production adapter, session, renderer, SDK and main-owned worker. A
temporary HTTP response wrapper is scoped to the owned fixture's log path. It
replaces successful response **bodies** only; it does not replace retention,
parsing, Find, source nodes or worker execution. The wrapper and temporary inputs
are restored/removed on completion. These are controlled HTTP bodies, not a claim
that kubelet naturally emitted these exact timestamp/byte combinations.

- **5,242,879 and 5,242,880 bytes**, including Kubernetes timestamp and final LF:
  one complete matching record, exact application source SHA-256 and full DOM
  Range selection SHA-256, 640 fragments with maximum length 8,192, Pause retained.
  No synthetic line break occurs in the selected source. This is DOM selection,
  not physical selection or system clipboard evidence.
- At **5,242,880 bytes exactly**, a late visible terminal `Q` receives a production
  Custom Highlight. Original/application text retains 5,242,848 UTF-16 units.
- **5,242,881 bytes**: no complete newest record fits; the exact existing oversized
  notice appears. A response containing an older record before the exact 5 MiB
  record omits the predecessor and retains that complete newest record.
- **1,001 transport lines**: the newest 1,000 remain in original order (`row 1 Q`
  through `row 1000 Q`), with the exact count `0 of 1000 matching records` awaiting
  navigation rather than choosing a substitute after replacement.

Independent Standards review found that the initial harness swallowed cleanup
errors. The corrected harness defaults to failure, preserves restoration and
closure errors, verifies the exact original HTTP method, and requires actual
worker exit plus empty owner/retiring/opening/sender/watch state before a pass.
A [fresh private installation](host/retention-reviewed/package-identity.json)
[repeats all six checks](host/retention-reviewed/retention-boundary.json) with
`httpRestored: true` and complete closed state. The earlier successful observations
remain recorded, but only this final harness has the strengthened failure path.

The first run's [failed harness assertion](host/exact-listeners/retention-initial-oracle.json)
looked for the phrase “too large”; production correctly said “exceeds the 5 MiB
original-text budget.” The final harness checks that exact notice. Initial failure
and stdout remain separate; this was an oracle correction, not a production fix.

## Pre-heap diagnostic

[Raw abort-only measurements](host/exact-listeners/attached-soak.json.gz) and
[raw all-target measurements](host/exact-listeners-all/mounted-soak-clean-inspector.json.gz)
retain each sample. Lossless `gzip -dc` recovers compressed evidence.

The bounded weak registration trace now supports a CDP census of **actually
attached** listeners. `DOMDebugger.getEventListeners` runs without a heap snapshot,
`queryObjects` or explicit GC. The collector releases temporary inspector handles
and returns only native IDs, safe target classes, script IDs/locations and counts.
No source code, callback values, element text or credentials are recorded. The
trace still uses weak references; its method is restored on teardown. Registration
and census caps fail explicitly rather than silently truncating evidence.

The default diagnostic traces AbortSignals. Optional `FIND_SOAK_EVENT_TARGETS=1`
traces other EventTargets too, including detached DOM subtrees without piercing
frames. Ancestor/subtree results are de-duplicated using native target identity,
event type, capture and handler location, retaining the maximum multiplicity.
Only targets registered since tracing began and their subtrees are included;
this is not a global heap/listener inventory. Registration stack frames describe
the first captured registration for a target, not necessarily every handler.
Instrumentation changes timing, and no diagnostic pass clears a plain failure.
Before/after DOM counters retain changes during each census.

[Abort-only self-check](host/exact-listeners/abort-only-census-check.json): three
strongly held callback/target pairs are reachable, but only one listener remains
attached after removeEventListener and once/abort delivery. The
[all-target self-check](host/exact-listeners/abort-census-check.json) adds an owned
detached element and confirms detached parent/child listeners and disconnected status are captured,
with the child counted once despite overlapping subtree censuses.

The installed soak also retains partial measured samples if a diagnostic fails
before its workload finishes. Limits, lifecycle assertions and the every-sample
resource verdict are unchanged.

## Resources and limits

[Abort-only trace plus attached census](host/exact-listeners/attached-summary.json)
runs three warmups and 30 measured cycles per bound. Dense peaks: +29 nodes,
zero listeners. Long source **fails at cycle 22: +1,551 nodes/+26 listeners**.
The failed sample's 2,096 nodes/756 listeners are still present at census entry.
The seven traced reachable AbortSignals have **17 attached listeners**, identical
to the baseline and every other captured census. At census exit global counters
are 2,105 nodes/761 listeners: activity continued during the capture. The stable
traced AbortSignal subset does not explain or identify the +26 global listeners.
This narrows the previous lead without claiming global/exclusive attribution.

The immediate [uninstrumented comparison](host/exact-listeners-plain/mounted-soak-clean-inspector.json.gz)
passes all 30 cycles per bound: dense peaks +28 nodes/zero listeners/+330,180 B
renderer heap, long +29 nodes/zero listeners/+466,032 B heap. Both have zero document
and thread growth. This is the same long-lived host after diagnostic restoration,
not a fresh profile. A passing repetition does not erase any earlier failed run.

The [all-target diagnostic](host/exact-listeners-all/summary.json) also passes 30
cycles per bound: dense peaks +29 nodes/zero listeners, long +39 nodes/+1 listener.
Its initial/final/new-high censuses stay at **359 cluster listeners and 29 root
listeners** in the covered subset. The disconnected targets in every captured
cluster census are one host `drawer-content flex column box grow` div and one
host icon. It captured no failure, so those observations do not identify the
failed sample's targets. This run used non-piercing subtree capture; IDs/type/
handler-location multiplicities prevent ancestor/child double counting.

All workloads use the existing real dense 1,000-record and near-5-MiB Kubernetes
fixtures; the exact-byte controlled fixture above is a separate check. Natural
frames come from the previously documented privately modified Aquamarine backend.
This is neither stock-output nor native-input/long-duration plateau acceptance.

## Package, environment and reproduction

[Installed identity](host/exact-listeners/package-identity.json): pinned Freelens
1.10.3, Electron 41.10.0, Node 24.18.0, Chromium 146.0.7680.216, npm 11.16.0.
Stable `freelens-readable-logs@0.1.34` package/store, `readable-logs` page/config,
schema 3. Installed versioned main/renderer/worker hashes equal local build assets.
Host CWD `/home/max`; process-local polling uses `CHOKIDAR_USEPOLLING=1` and
`CHOKIDAR_INTERVAL=100`. Fresh private profile, one Extensions-form installation,
no overwrite or post-install restart. Package SHA-256 remains
`995f1cf5e3ac81f377b16cf8dea24c15237824cd31dd1a066acde26bf868f904`.

Use a new owned run/profile/fixture, from this checkout, with FREELENS_UI_MODE unset:

```sh
export PATH="$PWD/.scratch/readable-logs/toolchain/node_modules/node/bin:$PATH"
export FIND_HOST_TICKET=48 FIND_HOST_RUN=exact-listeners
python3 scripts/find-production-host/prepare.py
python3 scripts/find-production-host/fixtures.py
# Supervised separate long-lived commands:
FIND_DISPLAY_RENDERER=mesa LD_LIBRARY_PATH="$PWD/.scratch/find/48-host/aquamarine/build" python3 scripts/find-production-host/display.py
python3 scripts/find-production-host/launch.py
node scripts/find-production-host/install.mjs
node scripts/find-production-host/cdp.mjs 9242 main scripts/find-production-host/observer.cjs
node scripts/find-production-host/open-view.mjs
node scripts/find-production-host/identity.mjs
node scripts/find-production-host/abort-census-check.mjs
node scripts/find-production-host/retention-boundary.mjs
FIND_SOAK_INSPECTOR_CLEAN=1 FIND_SOAK_NATURAL_FRAMES=1 FIND_SOAK_CYCLES=30 FIND_SOAK_IDLE_MS=100 FIND_SOAK_SIGNAL_TRACE=1 FIND_SOAK_SIGNAL_CENSUS=1 node scripts/find-production-host/mounted-soak.mjs
# For all-target capture add FIND_SOAK_EVENT_TARGETS=1; omit trace/census flags
# for the plain repetition. Use separate evidence run names, copying only the
# owned fixture descriptor, so repeated sample labels cannot overwrite evidence.
```

Exact output and failing attempts are retained in the three run directories.
The accepted resource policy is not relaxed and the pinned host is not patched.

## Final checks, cleanup and continuation

[Host invocation/outcome index](host/exact-listeners/host-commands.json) and
[resource baselines/peaks](host/exact-listeners/resource-summary.json) retain
separate main/renderer RAM, DOM/document/listener, thread, profile disk/settings
and inactive-control-to-exit observations. Match timing is a combined observation
of Pause/input dispatch/SDK/worker/count delivery, not pure worker or native input
latency. No separate medians are added.

[Exact final commands, environment and exits](host/exact-listeners/final-checks.json)
record pinned locked install, typecheck, full tests, shared desktop policy checks,
mounted production browser, actual worker checks, original resource smoke and
strict package creation/checks. [Two builds](host/exact-listeners/reproducibility.json)
retain the unchanged package identity. The installed diagnostic resource failure
is separate from these regression checks and stays failed.

[Shutdown](host/exact-listeners/shutdown-clean.json) records **318 actual starts/
exits**, peak one, zero live workers and empty owner/opening/retiring/sender/watch
state, including a worker stopped during paused startup. No physical close-button
input is claimed. [Owned profile cleanup](host/exact-listeners/cleanup-profile.json)
confirms normal app exit, UID-checked namespace deletion, profile removal and
matching fresh before/after user-settings/glossary/docs-index hashes. The private
compositor exited and only its owned `/tmp/fd-*` runtime was removed.

[Desktop summary](host/exact-listeners/desktop-summary.json) records **6,550**
redundant notifications of the same active user window, with zero observed
focus-address/workspace/window transitions. Client lists match. Pointer equality
is endpoint-only; no native pointer/input/clipboard, activation, focus restoration
or fake focus operation occurred. All test windows belonged to private workspace 7.

The next concrete autonomous step is a smaller diagnostic: retain only **weak**
references to each owned `.readable-logs` root while mounted, then census that
root's detached subtree immediately when a retained-resource sample violates a
limit. This can observe assigned DOM event handlers as well as addEventListener
registrations and avoids wrapping every EventTarget registration. Keep pre/post
counters and release inspector handles before the next sample. Capture without a
later heap GC, then reproduce a plain run. A stable abort subset and a passing
broader instrumented run do not justify changing product disposal or thresholds.

Other Host/key/trace coverage, stock-display/long-duration plateau, physical
selection/copy/clipboard, native editing/IME/AltGraph/shortcuts/menus/focus/window
delivery, and Windows/macOS remain explicit gates in [the matrix](matrix.md).
The exact-byte installed controlled-response gap is now covered at its stated
layer; natural kubelet ordering and physical selection are not inferred.
[Independent review](review-exact-listeners.md) applies both Standards and Spec.
The final-harness repeat uses `FIND_HOST_TICKET=48 FIND_HOST_RUN=retention-reviewed`
and the same setup/install/observer/open-view/identity/retention-boundary/shutdown/
UID-checked-delete commands shown above. It passes three actual starts/exits,
zero live workers/maps/watch and a fresh typecheck. Its [cleanup](host/retention-reviewed/cleanup.json)
and private-display observer retain that separate interval.
No GitHub comment/closure, push, merge, PR, release or host patch occurred.
