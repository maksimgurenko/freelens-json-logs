# tmux-ralph-loop

The project launcher is `./ralph`. Its reusable tool checkout lives under
`${XDG_DATA_HOME:-$HOME/.local/share}/tmux-ralph-loop`; set `RALPH_TOOL_HOME` to use
another checkout. Disposable runtime files stay in the ignored `.ralph/`
directory. On a fresh machine, install the tool with:

```sh
git clone https://github.com/maksimgurenko/tmux-ralph-loop.git "${XDG_DATA_HOME:-$HOME/.local/share}/tmux-ralph-loop"
./ralph --help
```

Update an existing tool checkout with `git pull --ff-only` from that directory.

This repository uses [GitHub Issues](agents/issue-tracker.md). With an authenticated
`gh` CLI, inspect the queue of open `ready-for-agent` issues:

```sh
./ralph status --tracker github
```

Use `./ralph start --tracker github` to start a watcher for that queue. The
runner closes completed issues and labels blocked attempts `ralph:blocked`.
Once a run starts, `./ralph status` and `./ralph stop` use the saved source.

For local Markdown tickets, follow the
[upstream ticket format](https://github.com/maksimgurenko/tmux-ralph-loop#ticket-format)
and replace the example directory below. Use a separate state directory to keep
this queue independent of the GitHub run:

```sh
./ralph status --state .ralph/local --tickets /path/to/tickets
./ralph start --state .ralph/local --tickets /path/to/tickets
./ralph stop --state .ralph/local
```

Codex is the default agent. `start` launches an interactive agent in tmux. For
local tickets, the agent receives instructions to commit completed ticket work
on the current branch. Use `status` to get the attach command and find the logs.

See the [upstream documentation](https://github.com/maksimgurenko/tmux-ralph-loop)
for other agents, prompts, and recovery commands.
