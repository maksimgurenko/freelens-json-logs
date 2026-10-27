# #48 weak-root/natural-idle continuation review

Original ticket pin: `3fb33db5f5ded3523bcf66c1145f0af967ec0bf3`.
Current continuation pin, recorded before changes:
`863db9d74786a2ee4e689bf0fe3e464c47597cd5`.
No intermediate commits. Review command at review time:
`git diff --cached 863db9d --` (including new current ticket files/evidence).
Unrelated dirty glossary/docs/setup data is excluded.

Both independent reviewers used explicit `fork_turns: none`, the original issue,
accepted plan/full decision comments, committed pre-work NEXT and supervisor
requirements before parent conclusions. Standards also received AGENTS/domain/UI
and local-development guidance plus the full heuristic smell baseline. No host,
CDP/native operations or file mutations were delegated. Review does not establish
whole-ticket or release acceptance.

## Standards

Initial report found zero documented-standard breaches, one diagnostic ordering
issue and one optional duplicated-growth smell. The first census now runs before
tracing/idle setup; triggering and final verdicts share `growthFrom`. The reviewer
confirmed both corrections.

Final evidence review found one minor count-wording issue: 101 described a narrower
native-path subset, while 120 recorded listener paths contain an AbortSignal.
All broad descriptions now use 120 and the exact 101 predicate is separately
recorded in `host/weak-idle-final/native-path-counts.json`.

Final independent follow-up:

> Count-wording finding resolved. I independently reproduced all four audit counts:
> 794 listeners, 120 paths containing native AbortSignal, 181 occurrences, and the
> precisely defined 101-path subset. All 20 timing summaries match the existing raw
> samples' count/min/max values. Their combined-stage and non-native-latency scope
> is accurate. No remaining actionable Standards or diagnostic/evidence correctness
> findings. No host/CDP/native operations or file mutations ran.

The reviewer independently recomputed all five every-sample verdicts: initial/plain
pass, extended one violation, corrected 27 long violations, timing control four.
Peaks and final +182 nodes/+27 listeners match the report. Package/regression/
reproducibility/cleanup/hashes, changed desktop endpoints, remaining SDK handlers
and native/platform limits remain accurately scoped.

## Spec

The independent initial review found the same immediate-census ordering gap;
its follow-up confirms the corrected code captures `violatingViewerRoots` before
tracing. The older loaded harness/results remain separate. Final evidence review
independently identified the same AbortSignal wording error, now corrected.

Final independent follow-up:

> Finding resolved. The staged audit reproduces 794 listeners, 120 paths containing
> AbortSignal, 181 AbortSignal occurrences and the explicitly defined 101-path
> subset. All added timing counts/minima/maxima match the saved samples. Their
> combined-stage, non-native scope is accurate. No remaining actionable
> Spec/evidence findings; resource failures and acceptance limits remain unchanged.

The reviewer checked that the four timing-control viewers collect by the
15-second observation, that this is not proof of the original +1,551/+26 cause,
and that empty WeakRefs/later heap paths do not become an exact failed-sample
native inventory. No unsupported product fallback or resource-policy change ships.

Remaining findings: **Standards 0; Spec 0**. Failed resources, unchecked original
criteria and native/platform release gates remain open.
