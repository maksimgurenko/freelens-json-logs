# Independent ticket #45 review

Fixed pre-implementation HEAD: `02c4dbd9539ad70943604b28ea843a9102dfa0ef`
([record](review-base.txt)). Current-branch ticket work was uncommitted during
review, with the complete implementation/test diff staged:

```sh
git diff --cached 02c4dbd9539ad70943604b28ea843a9102dfa0ef
git log 02c4dbd9539ad70943604b28ea843a9102dfa0ef..HEAD --oneline
```

The commit list was empty. Two independent agents used explicit `fork_turns: none`
with complete bounded handoffs, original requirements/artifacts before parent
conclusions, and the code-review skill's separate Standards and Spec briefs.
They reviewed only ticket changes, excluding unrelated dirty/untracked user work.

Standards sources: `AGENTS.md`, `docs/agents/domain.md`, `GLOSSARY.md`,
`docs/agents/ui-verification.md`, `docs/local-development.md`, accepted Find plan,
existing core/renderer conventions and the full smell baseline. No
`CODING_STANDARDS.md` or `CONTRIBUTING.md` exists. Spec sources: the original local
#45 acceptance text, accepted plan, full live #36/#37/#38/#40 decisions and reviewed
design, with literal-only/appearance corrections. No reviewer edited files or
operated the user's native desktop or GitHub.

## Standards

Initial report: no hard documented-standard violations. One low-priority judgment
call, **possible Primitive Obsession**: deriving Retry availability from
`highlightStatus.startsWith('Highlighting incomplete. Retry')` couples behavior
to user-facing wording. Fixed with typed `HighlightStatus { message, retryable }`.

Final independent bounded recheck:

> Clean bounded recheck: no new material standards violations or baseline smells
> found. The original Retry finding remains resolved.
>
> The revised validator keeps source verification isolated, avoids token caches
> and guessed paths, and updates both WeakMap sources with cleanup.

## Spec

The review found three P2 provenance cases while refining the same requirement:
“Selection seeding uses actual source provenance across all inspector
representations.” Each was independently rechecked after its fix.

1. Entire pretty All fields text was marked eligible, allowing generated
   indentation and decoded non-message data to seed Find. Added explicit
   application/active-message source binding and lazy ordered JSON-token
   correspondence, with owner cleanup.
2. Whole-lexeme equality was overly restrictive: an actual `needle` slice in an
   otherwise escaped token, and exact active extracted `Σ`, must remain eligible.
   Validation now checks the selected text against its corresponding application
   token region or explicitly equal current message, without paths or decoded
   offsets projected into JSON. Pure [red](fields-slice-red.txt) /
   [green](fields-slice-green.txt) and mounted tests cover both cases.
3. Per-fragment validation allowed separate valid `a` and `b` pieces to form an
   invalid `ab` query across the 8,192-unit boundary. The renderer now aggregates
   the entire selected interval per fields presentation and validates once.
   The mounted regression places decoded `ab` at offset 8,191 in
   `a\u0062 c b`, where no complete `ab` exists in either searchable source.

Final independent production-helper/headless recheck:

> Resolved. Independent headless Chromium checks confirm:
>
> - Cross-fragment decoded `ab`, generated indentation and decoded non-message
>   `Σ` are rejected.
> - Genuine cross-fragment `ab`, active extracted `Σ` and literal `needle` inside
>   an escaped token remain eligible.
>
> No remaining concrete correctness finding in this fix. All previously reported
> provenance findings are resolved. Host/native acceptance remains unverified.

Review totals: Standards **1 low-priority judgment call, resolved; 0 remaining**.
Spec **3 P2 cases, resolved; 0 remaining**. No scope creep reported. Physical
focus styling, installed-host Custom Highlights and native/platform evidence
remain the dedicated #48 gates.
