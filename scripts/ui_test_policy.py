"""Shared opt-in for verification that touches the real desktop."""
import json
import os
import subprocess


def require_attended(read=None):
    """Fail before any input/focus change unless an attended session is ready."""
    if os.environ.get("FREELENS_UI_MODE") != "attended":
        raise SystemExit(
            "DEFERRED: native UI verification needs an attended session. "
            "Use background CDP probes/screenshots, or arrange a test session "
            "with the user before setting FREELENS_UI_MODE=attended."
        )
    if read is None:
        def read(*args):
            return json.loads(subprocess.check_output(args, text=True))
    workspace = read("hyprctl", "activeworkspace", "-j")
    window = read("hyprctl", "activewindow", "-j")
    if workspace.get("id") != 7 or window.get("class", "").lower() != "freelens":
        raise SystemExit(
            "DEFERRED: focus Freelens on workspace 7 before starting attended "
            "verification. Tests will not switch there automatically."
        )


def allow_focus_change():
    if os.environ.get("FREELENS_UI_MODE") != "attended":
        raise SystemExit("DEFERRED: desktop focus changes require FREELENS_UI_MODE=attended")
