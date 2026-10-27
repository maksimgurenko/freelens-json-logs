# Independent ticket #46 review

Fixed pre-implementation HEAD: `7e6485536b3fec58b6c4b9f17592167b658bc74d`
([record](review-base.txt)). Ticket work was staged but uncommitted during review:

```sh
git diff --cached 7e6485536b3fec58b6c4b9f17592167b658bc74d -- scripts/verify-find-identity.mjs src/core/find-marks.ts src/core/find-state.ts src/renderer/find-marks.ts src/renderer/viewer.css src/renderer/viewer.tsx tests/find-identity-browser.jsx tests/find-marks-browser.jsx tests/find-marks.test.ts tests/find-state.test.ts
git log 7e6485536b3fec58b6c4b9f17592167b658bc74d..HEAD --oneline
```

The commit list was empty. Two independent agents received explicit
`fork_turns: none`, complete bounded handoffs, original requirements/artifacts
before parent conclusions, and the code-review skill's separate Standards/Spec
briefs. Unrelated dirty/untracked work was excluded. Reviews were read-only.

Standards: `AGENTS.md`, `docs/agents/domain.md`, `GLOSSARY.md`,
`docs/agents/ui-verification.md`, `docs/agents/issue-tracker.md`,
`docs/local-development.md` and the full Fowler smell baseline. No CONTRIBUTING
or CODING_STANDARDS file exists. Spec: original #46 acceptance criteria, accepted
plan, live full #36/#37/#38/#40/#46 decisions, reviewed design and evidence.

## Standards

> No documented-standard violations or meaningful baseline-smell findings in the scoped staged diff.
>
> The change preserves the documented vocabulary and pure-core/renderer separation. Geometry observers, listeners, frames and mark controls have explicit viewer-scoped disposal. The browser harness remains headless and adds no native desktop interaction.
>
> Read-only review; tests were not rerun.

Final bounded recheck after the click-time regrouping fix:

> No new material Standards findings in the final activation handler or split-group regression. Both retain the documented occurrence vocabulary and viewer-owned lifecycle. No meaningful baseline smells identified.
>
> Read-only recheck; tests were not rerun.

## Spec

Initial review found no missing/partial requirements, scope creep or concrete
incorrect behavior. A bounded follow-up examined click-time regrouping and
revised the result to one correctness finding:

> #37 requires: “If geometry changed, remeasure the same live target.” The handler measures before choosing the clicked group's next occurrence. If wrapping, expansion or fonts split/merge that group, measurement replaces its view; the membership check then returns even when the intended occurrence survives and still matches.

The new mounted regression reproduced this before the fix
([red](browser-regroup-red.txt)). The handler now captures the original target
before measurement and validates that same ref afterward. Independent recheck:

> The regrouping finding is resolved.
>
> The handler now captures the clicked group's next occurrence before measurement, validates that same reference against the current window, exact matches and visible groups, then uses shared navigation. It carries cycling state into the new group.
>
> Dismissal/disposal still remove controls and listeners; eviction or changed matching/context rejects stale references. No additional Spec finding emerged.
>
> The new regression directly exercises group splitting during synchronous growth. Recorded red fails as expected; green was still pending when inspected.

The completed [green browser run](browser-regroup-green.txt) is recorded separately
by the implementation session. Packed-host/native/platform acceptance remains the
later dedicated gate.

Review totals: Standards **0 findings**. Spec **1 correctness finding, resolved;
0 remaining**. No scope creep reported.
