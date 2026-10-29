# tmux-ralph-loop

The project launcher is `./ralph`. Its reusable tool checkout lives under
`${XDG_DATA_HOME:-$HOME/.local/share}/tmux-ralph-loop`; set `RALPH_TOOL_HOME` to use
another checkout. Disposable runtime files stay in the ignored `.ralph/`
directory. On a fresh machine, install the tool with:

```sh
git clone https://github.com/maksimgurenko/tmux-ralph-loop.git "${XDG_DATA_HOME:-$HOME/.local/share}/tmux-ralph-loop"
./ralph --help
```

This repository uses GitHub Issues as its issue tracker. The loop only reads
local Markdown tickets; it does not fetch or synchronize GitHub issues.
Prepare a local ticket directory before starting it, following the
[upstream ticket format](https://github.com/maksimgurenko/tmux-ralph-loop#ticket-format).

Pass the same ticket directory to every command, replacing the example path:

```sh
./ralph status --tickets /path/to/tickets
./ralph start --tickets /path/to/tickets
./ralph stop --tickets /path/to/tickets
```

Codex is the default agent. `start` launches an interactive agent in tmux and
instructs it to commit completed ticket work on the current branch. Use `status`
to get the attach command and inspect `.ralph/loop.log` for progress.

See the [upstream documentation](https://github.com/maksimgurenko/tmux-ralph-loop)
for other agents, prompts, and recovery commands.
