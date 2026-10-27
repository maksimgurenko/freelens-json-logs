# Independent #42 actual-host continuation review

Fixed point: recorded pre-continuation HEAD
`623792be8f5bbfe5623642dc0fe1649c0ff5fff4`. Both reviewers received the original
#42 requirements, accepted literal-only plan and full decisions before parent
conclusions, with explicit `fork_turns: none`. No production files changed in
this continuation. Earlier implementation reviews remain in `../continuation/`.

Committed comparison: `git diff 623792be8f5bbfe5623642dc0fe1649c0ff5fff4...HEAD`;
commit list `git log 623792be8f5bbfe5623642dc0fe1649c0ff5fff4..HEAD --oneline`
was empty. Both reviews included the nonempty uncommitted ticket diff through
`git diff --cached 623792be8f5bbfe5623642dc0fe1649c0ff5fff4 --` and its current
working artifacts. Follow-up reviews examined the corrected staged result.

## Standards

Initial review: one documented breach and one nonblocking smell judgment.

- Maintenance followed cluster use, contrary to the documented fresh-main-window
  procedure. Fixed the reproduction by quitting/relaunching the isolated app
  before maintenance. `lifecycle.mjs` now rejects cluster contexts, opens Extensions,
  records actual frame state and asserts exactly one root frame. New passing
  lifecycle evidence is from that fresh app. Initial cleanup observations remain
  historical rather than supported-maintenance acceptance.
- Possible Duplicated Code in initial and post-uninstall form installation.
  Both now use the shared single-submission `installPackage()` helper.

Final independent Standards verdict: both findings resolved; **0 unresolved
standard breaches, 0 unresolved smell findings**. No new substantive issues.
The reviewer confirmed private-host checks and attended-action guards remain,
all 14 JS/CJS and three Python scripts parse, lifecycle/cleanup evidence is
consistent and staged whitespace checks pass. No reviewer operated a host/GUI.

## Spec

Initial review: one pending evidence finding, zero confirmed production defects
or scope creep. During an active reproduction, the viewer and lifecycle artifacts
contained failed page/activation assumptions and churn inherited the failed
lifecycle's test owner, contradicting the completion record.

Retained those failures, corrected activation/page readiness, added explicit
fresh maintenance state, and reran dependent checks sequentially with fail-fast
shell execution. The new real mounted viewer, actual SDK/frame/retention/timeout,
fresh maintenance, 20 x 20 latest-only bursts, window destruction and shutdown
artifacts all pass. Ownership, workers, descriptors, timers, listeners and SDK
handlers are verified at their actual cleanup boundaries, including process exit.

Final independent Spec verdict: **0 remaining #42 findings, 0 confirmed
implementation defects, 0 scope-creep findings**. The reviewer confirmed temporary
state preservation during inactivity, actual-exit cleanup and original criterion 9.
Original unintegrated smoke-double failure remains explicitly within #47's
integration scope. Physical/platform acceptance and long host soaks remain
#48/downstream gates and are not inferred from these implementation checks.

Final counts: Standards 0 unresolved; Spec 0 unresolved.
