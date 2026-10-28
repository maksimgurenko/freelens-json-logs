## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues. Before working with tickets, read
`docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical triage labels. Before triaging, read
`docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `GLOSSARY.md` and `docs/adr/`.
Before exploring the codebase, read `docs/agents/domain.md`.

## Freelens validation

Run Freelens (Lens) on Hyprland workspace 7. Routine verification must preserve
the user's focus, workspace and pointer throughout the check. Use background CDP
probes/screenshots; launch silently on workspace 7 when needed. Restoring focus
after a test still interrupts the user.

Before any UI verification, read `docs/agents/ui-verification.md` for the background
workflow and the explicit opt-in required for attended native input checks.

Windows and macOS test coverage is planned soon, in a future task. Keep both
platforms explicitly unverified and defer adding or running their test suites
for this implementation increment. Existing Linux Find acceptance is complete.
