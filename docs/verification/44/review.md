# Independent #44 review

Fixed point: pre-implementation HEAD
`c9656e844f5b7a22772777b4c10270c82951b291`.
Both reviewers used explicit `fork_turns: none` and received the original ticket,
accepted plan, reviewed design and full live decision-comment paths before parent
conclusions. `git diff <base>...HEAD` / `git log <base>..HEAD --oneline` were empty
before commit; both reviewed the nonempty `git diff --cached <base> --` and
subsequent unstaged ticket corrections, including new test files.

## Standards

No documented-standard violations or actionable smell-baseline findings.
Follow-up review included pointer-capture invalidation, local outside-click
layering, foreign focus preservation, screenshot/font harness and pure dismissal
test. The final resource adapter addition opens/closes or unmounts the history
popover in each disposable smoke cycle; original user smoke files remain untouched.

## Spec

The review identified a pointer capture retained after an abandoned press: later
keyboard Find could consume old text. A mounted failing regression reproduced it.
Opening now consumes the cache only for a pointer-style click, samples the current
Range for keyboard/shortcut opening, and clears the cache on context reset.

A stricter local outside-click regression reproduced dismissal of both popover
and Find. Capturing local clicks now dismisses only the popover. Independent
follow-up identified foreign input focus being stolen by clock restoration;
the failing mounted regression was added, then foreign dismissal was changed to
hide only the popover while retaining host click/focus ownership. The reviewer
confirmed both final corrections. No outstanding missing/partial requirements,
scope creep or incorrect behavior within #44's implementation scope. Physical
key/selection/clipboard and installed/cross-platform acceptance remain downstream.

Final review: **Standards 0 unresolved; Spec 0 unresolved**.
