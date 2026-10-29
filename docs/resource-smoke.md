# RAM and disk smoke test

Run with the supported Node 24 toolchain and Chromium/Chrome installed:

```sh
npm run test:smoke
```

Set `CHROME_BIN=/path/to/chromium` if it is not on PATH. A missing browser fails
the command rather than skipping checks. CI runs it on every push and PR, in
addition to the unit tests and package checks. The command builds the production
bundles, prints JSON measurements and exits nonzero on a regression. A three-minute
deadline kills its isolated child processes.

The test uses disposable HOME, XDG directories, working directory, temporary files
and a headless browser profile. It never connects to the installed Freelens, uses
the desktop, or reads the user's extension settings. Child processes and their
temporary directories are removed on success and failure.

## Workloads

- **Core and main:** 40 cycles, with one long-lived log view refreshing throughout
  and other views opening, switching containers, failing, retrying and closing.
  Fresh responses exceed both 1,000 lines and 5 MiB; the retained recent log window
  must remain within those bounds. Pause/Resume, hide/show, late successes/failures
  after close, metadata watchers, request guards, main activation/deactivation and
  window/IPC listener cleanup run repeatedly. Timers and watchers must return to
  the live-view baseline after every cycle and to zero at final teardown.
- **Find execution:** 20 cycles use the production main bundle and versioned
  trusted worker through SDK boundary stand-ins. Alternate 1,000 records near
  5 MiB and one exact 5 MiB source, using production retention. Rapid query,
  window/message and visible-range replacements keep only the latest operation,
  with exact matching ahead of decoration. Inactivity, reactivation and closure
  await actual exit; peak one worker, no surviving owners/inflight requests or
  worker listeners, and stable post-GC timers/ports/Linux threads are asserted.
- **Renderer:** the actual production CommonJS bundle runs with real React 17,
  MobX and Chromium DOM. Forty cycles render 256 JSON records, refresh four times,
  inspect records, use Find, preview a large sample in the profile editor, then
  unmount or disable the extension. The integrated workload also rapidly replaces
  queries, switches profiles without reads, replaces three more snapshots,
  churns visible range interests and commits/dismisses history. Owned profiles
  are deleted each cycle. IPC subscriptions, timers, geometry observers, animation
  frames and Custom Highlight registrations must be released every time. Post-GC
  heap/DOM measurements catch detached source indices/ranges as well.

Four cycles warm the parsers, React and allocators. Six further batches of six
cycles are measured after explicit garbage collection (the worker-only workload
uses four further batches of four). Each sample is compared
with the warmed baseline, so a large early regression cannot hide in an average.

## Failure thresholds

| Resource | Allowed growth after warmup |
| --- | --- |
| Node retained JS heap | 12 MiB |
| Node external allocations | 8 MiB |
| Node resident memory (RSS) | 96 MiB |
| Renderer retained JS heap | 8 MiB |
| Renderer DOM nodes, including detached nodes | 128 |
| Renderer JS event listeners | 8 |
| Renderer documents | 0 |
| Chromium profile | 8 MiB and 128 files |

RSS allows allocator high-water behavior; the post-GC heap, watcher, listener and
DOM checks give tighter signals for retained extension objects. Chromium creates
its own database files asynchronously, so its whole-profile allowance is broader
than the application storage checks below. These budgets are smoke-test limits,
not the extension's total memory allowance. The 5 MiB snapshot contract bounds
original text, not parsed objects, rendering or transient response allocations.

Disk checks are stricter for extension-owned data:

- Viewing logs must leave the isolated filesystem's file names, byte counts and
  SHA-256 hashes unchanged after every measured batch.
- One hundred preference changes must overwrite the same settings file. The final
  footprint must be exactly one file smaller than 4 KiB, containing precisely the
  expected configuration. No log history, unsolicited backups or temporary files
  may accumulate.
- The renderer may attempt **zero** native filesystem writes. localStorage,
  sessionStorage, IndexedDB and CacheStorage must remain empty. CDP also checks
  that the origin has zero retained quota-managed storage.

Explicit settings recovery intentionally preserves backups; this smoke workload
does not invoke recovery or change that retention policy.

## Scope and verification

This is a regression tripwire, not proof against arbitrarily slow leaks. Freelens
SDK/IPC/Electron calls are represented by public-boundary stand-ins, as in the
package and recovery tests. The core, adapters, configuration store and main and
renderer bundles are production code; host-internal caches, native Electron
allocations, GPU memory and Kubernetes transport behavior require an installed-host
soak test. Native keyboard, pointer, clipboard and window checks are outside this
headless test.

Find's browser transport invokes the production SDK handlers using numbered
HTTP requests in caller order, with concurrent replies. HTTP upload completion
order is not Electron IPC send order: a tiny cancel can otherwise overtake a
large source payload and manufacture a failure. The stand-in has a bounded
sequence buffer and fails on missing messages; it never serializes whole replies
or replaces real worker execution. Controlled-clock unit tests separately cover
startup deadlines, late exit, stale outcomes and latched explicit recovery.
`npm run test:browser` exercises the combined selected-text/history/hidden-source/
mark workflow and full long-source selection. System clipboard delivery is never
used by these tests; exact copy payloads are observed at the clipboard adapter.

On 2026-10-25, Node 24.18.0 and local Chromium passed both workloads. The Node
retained heap decreased from 20.72 to 16.40 MiB; renderer heap grew from 6.92 to
7.54 MiB, with DOM nodes and listeners unchanged. Settings stayed at 90 bytes and
browser application storage stayed empty. Existing tests (109) and typechecking
also passed.

Deliberate temporary production-code mutations verified the failure signals:
retaining prior snapshots failed the heap budget, writing a new file on each
configuration inspection failed the disk-footprint comparison, and omitting
document listener cleanup failed the renderer heap budget, with DOM nodes and
listeners also growing beyond their allowances. The mutations were
removed before the final passing run.
