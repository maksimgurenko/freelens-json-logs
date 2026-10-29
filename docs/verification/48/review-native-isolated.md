# Independent review: bounded native #48 checkpoint

Fixed point: `5982a321d720669f0272e09f272499a79eb9c8fc`.
Current branch: `implementation/find`. `git log <baseline>..HEAD` was empty before
this checkpoint commit. The review uses `git diff --cached`, including the current
uncommitted #48 implementation, harness, local ticket and evidence; excludes
pre-existing dirty `GLOSSARY.md` and `docs/README.md`. Snapshot:
`.scratch/find/48-current/native-review.diff`. No `.ralph` runtime is staged.

Original requirements supplied before parent conclusions: local #48 body, accepted
plan at `d02b7e7`, full cached/live #36/#37/#38/#40 decisions, the user's bounded
native direction and explicit narrow close→quit fix request. Both reviewers used
`fork_turns=none` with this complete bounded handoff. Neither ran native/app/resource
checks or published anything. Standards reviewed the documented repository rules
plus the skill's Fowler smell baseline. Spec independently ran the focused new
lifecycle regression, which passes.

## Standards

> No actionable Standards findings. No documented-standard breaches or baseline
> smells requiring changes were found in the staged checkpoint.
>
> The production fix stays narrow, the regression covers close-then-dispose, and
> the evidence preserves failed results, artifact boundaries, private-session
> provenance and cleanup limitations. Review was read-only; no native/app/resource
> checks were rerun.

The reviewer also noted a minor documentation pointer: the fixed native API route
has no keyboard-command log. The report and command manifest now point to its
actual lifecycle record; only the original run references `native-commands.jsonl`.

## Spec

> No remaining actionable Spec finding after the documentation corrections.
>
> Missing/partial requirements remain honest blockers: pointer selection/copy/seeding
> and retention, wheel/manual scrolling, selection/marks through resize, full trusted
> IME transactions, foreign-menu/other-window ownership, and native edge/history/
> pending-focus variants. Windows/macOS remain unverified; resources remain explicitly
> accepted/deferred. This follows #48: “Failed/unperformed production gates remain
> visible and cannot be treated as release acceptance.” Broad unchecked criteria
> were preserved.
>
> No unrequested scope creep found. The main-only visibility-disposal fix follows
> the supervisor’s explicit close→quit direction. It retains the subscribed
> webContents emitter without swallowing arbitrary errors or changing visibility
> semantics. The accepted plan requires disposal to “Idempotently remove bindings,
> timers, listeners, indices, observers and animation frames; await actual exit.”
>
> Evidence and claims now match. Original setup, blur-oracle, getter failure and
> abnormal shutdown evidence remain intact. Initial keyboard/copy results retain
> their original artifact identity; the new package changes only main. The fixed
> native API route records normal exit, 7/7 actual worker exits and empty closed
> service maps/watch. Native execution finished at 17:30:16 UTC, before 17:43:17 UTC.
>
> Two reporting details were corrected: only the initial run has a native-command
> log; fixed API operations use the lifecycle record. Resize preserved an absent
> active result (`-1`), rather than establishing populated-result retention.
>
> The focused new lifecycle regression independently passes. Review performed no
> native/app/resource rerun, desktop activity, edits or publication.

Standards: zero actionable findings. Spec: zero remaining actionable findings;
original unperformed Linux evidence remains blocking acceptance. Neither axis
claims the ticket or release accepted.
