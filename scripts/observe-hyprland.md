# Observe desktop focus and workspace events

`observe-hyprland.py` preserves the useful part of the archived release-install
desktop monitor: continuous, read-only observation of Hyprland's event socket.
Use it alongside before/after state checks when the
[Linux UI playbook](../docs/agents/ui-verification.md) requires observing the
whole interval. Equal endpoints can conceal an intermediate focus change.

Choose the intended live instance using the playbook's identity checks, then pass
its event socket explicitly. The script does not discover an instance or trust
the shell's compositor variables.

```sh
python3 scripts/observe-hyprland.py \
  --socket /absolute/path/to/hypr/INSTANCE/.socket2.sock \
  --duration 60 > /tmp/freelens-desktop-events.jsonl
```

Wait for the flushed `ready` record before beginning the authorized operation.
The JSONL contains `activewindowv2`, `workspace`, `workspacev2` and `focusedmon`
notifications, with wall-clock and elapsed timestamps. It excludes window titles
and unrelated notifications. Repeated notifications remain visible; a repeated
window address alone is not a focus transition. A successful bounded observation
ends with `complete`; an early disconnect, partial final line, malformed UTF-8 or
oversized line exits nonzero, preserving already emitted records.

This is an observer, not an acceptance verdict. It cannot attribute events to a
test, identify focus before connection, track pointer motion or establish
clipboard preservation. It sends no socket data, runs no desktop commands and
never changes focus, workspace, pointer or clipboard. It neither launches nor
authorizes a Freelens operation. Verification used a temporary fake Unix socket;
real-compositor behavior was not rerun during preservation. Linux only;
Windows/macOS remain unverified.

Run the isolated CLI regression checks without connecting to a real compositor:

```sh
python3 -B -m unittest discover -s tests -p hyprland_observer_test.py -v
```
