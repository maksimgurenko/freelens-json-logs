# Domain Docs

This repository uses a single-context layout:

- `GLOSSARY.md` at the repository root
- ADRs under `docs/adr/`, named `NNNN-short-title.md`

## Before exploring

Read `GLOSSARY.md` and ADRs relevant to the area being explored.

If these files do not exist, proceed silently. The `domain-modeling`
skill creates them lazily as terms and decisions are resolved.

## Use the glossary's vocabulary

Use defined domain terms in issue titles, refactor proposals,
hypotheses, and test names.

For an undefined concept, reconsider whether the project needs the
term. Note genuine gaps for `domain-modeling`.

## Flag ADR conflicts

If a proposal contradicts an ADR, identify that ADR and explain
why the decision should be reconsidered.
