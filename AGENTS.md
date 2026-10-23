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

Run Freelens (Lens) on Hyprland workspace 7. Launch and restore it silently,
preserving the user's current workspace and focused window whenever possible.
Prefer background interaction. When a native check needs focus, restore the
previous workspace and focused window immediately afterward.
