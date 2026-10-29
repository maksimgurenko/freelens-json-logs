# Readable logs 0.1.36 verification

The runtime fixes were checked on Linux with Freelens 1.10.3. Windows and macOS
remain unverified; their suites are deferred.

## Regression checks

- `tests/find-state.test.ts` reproduced inspection clearing the active result:
  clicking the found row changed `1 / 1` to `0 / 1`. The regression now passes,
  retaining the result and refinement candidate while cancelling its old reveal.
- `tests/find-performance-browser.jsx` reproduced all three refresh symptoms
  together by holding an appended snapshot's matching reply: the counter changed,
  the hidden-match link was removed, and the scrollbar mark disappeared. The
  regression now retains those same controls on unchanged source text.
- `tests/find-client.test.ts` checks retained membership through delayed feedback,
  and invalidation on source changes, eviction, query changes and context changes.
- The mounted production renderer checks inspection and deselection in Inline,
  Bottom and Side layouts, plus query edits, stale replies, retention, navigation,
  highlighting and disposal. All 259 unit tests and the browser suite passed.
- The worker's existing incremental-matching test confirms that a one-row append
  searches the new source rather than rescanning all 1,000 retained records.

## Installed-host evidence

The local package `0.1.37-local.84da5f1f` was installed once through Extensions in
a fresh main window. Its production source files match this release's sources;
the final release changes package metadata, versioned entry names and embedded
version strings. The prerelease tarball SHA-256 was
`e7f7ada0d9d739c63f328b775a4d84ebad9ab0ef3f9080a3ffa5feb7ed79a192`.

The [recorded background probe](installed-find-ui.json) checked the actual viewer:
inspection and deselection kept `1 / 1`, and the same counter, hidden-match link
and scrollbar mark survived two explicit refreshes and a later automatic refresh.
The probe observed three transitions through pending matching with no indicator
failures. Installed entry files matched the tested package, and saved settings
were preserved apart from host migration metadata.

The first background probe waited for a scrollbar mark before the hidden native
window had painted. A background screenshot allowed the pending layout frame to
run; the subsequent probe passed without activating the window or simulating
focus. These are DOM/CDP checks, not new physical-input or cross-platform evidence.

## Final release package

Local inspection of `freelens-readable-logs-0.1.36.tgz` passed, and a second build
produced identical bytes. Its SHA-256 is
`6b96680041a919caf5d503e89021cb48dd22218ab554ed5ac73ac8c91f076be4`.

The version-tag CI validates the final `0.1.36` assets before publication. It runs
typechecking, unit and mounted-browser tests, worker lifecycle and resource smoke
checks, desktop-helper policy tests, tarball inspection and byte-for-byte rebuild
comparison. The release job publishes that checked tarball and `SHA256SUMS`.
