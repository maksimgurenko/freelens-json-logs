# Issue tracker: GitHub

Issues and specs live in GitHub Issues for
`maksimgurenko/freelens-json-logs`. Use the `gh` CLI.

Run commands from this checkout. Elsewhere, pass
`--repo maksimgurenko/freelens-json-logs`.

## Conventions

- Create: `gh issue create --title "..." --body-file <file>`
- Read: `gh issue view <number> --json number,title,body,labels,comments`
- List: `gh issue list --state open --json number,title,body,labels`
  with appropriate label and state filters.
- Comment: `gh issue comment <number> --body-file <file>`
- Apply or remove labels: `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`
- Create a child issue: `gh issue create --parent <parent> ...`
  or link an existing child with
  `gh issue edit <parent> --add-sub-issue <child>`.
  Where sub-issues are unavailable, put `Part of #<parent>` at
  the top of the child body and link it from the parent.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the referenced issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub issues and PRs share a number space. For an ambiguous number,
try `gh pr view <number>`, then `gh issue view <number>`.

## Wayfinding operations

Used by `/wayfinder`. The map is one issue with child issues as tickets.

- Map: an issue labelled `wayfinder:map`, holding Notes,
  Decisions-so-far, and Fog.
- Child: a sub-issue labelled `wayfinder:<type>`, where type is
  `research`, `prototype`, `grilling`, or `task`. Create these
  labels when needed. Use the parent-link fallback above if necessary.
- Blocking: use native GitHub issue dependencies. Add an edge with
  `gh api --method POST repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
  Obtain the database ID with
  `gh api repos/{owner}/{repo}/issues/<blocker> --jq .id`.
  Where dependencies are unavailable, put `Blocked by: #<number>`
  at the top of the child body.
- Frontier: inspect open children in map order; choose the first
  with no open blockers and no assignee.
- Claim: assign the ticket to the driving developer before work:
  `gh issue edit <number> --add-assignee @me`.
- Resolve: comment with the answer, close the child, then append
  a gist and link to Decisions-so-far in the map.
