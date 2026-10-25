"""Exercise verification helpers with a fake desktop, never the user's session."""
import importlib.util
import os
import pathlib
import re
import runpy
import subprocess
import tempfile
import unittest
from unittest.mock import patch


ROOT = pathlib.Path(__file__).resolve().parents[1]


class DesktopTests(unittest.TestCase):
    def load_desktop(self, ticket):
        spec = importlib.util.spec_from_file_location(
            "desktop", ROOT / f"docs/verification/{ticket}/desktop.py"
        )
        desktop = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(desktop)
        return desktop

    def background_check(self, ticket, action, mode="", exit_code=0, user_moved=False):
        desktop = self.load_desktop(ticket)
        window = {
            "class": "freelens", "address": "0xhost", "pid": 123,
            "workspace": {"id": 7}, "at": [0, 0],
        }
        responses = {
            "activeworkspace": {"id": 1},
            "activewindow": {"address": "0xuser"},
            "cursorpos": {"x": 10, "y": 20},
            "clients": [window],
        }
        calls = []

        def run(command, **kwargs):
            calls.append(command)
            if user_moved:
                responses["activewindow"] = {"address": "0xother"}
                responses["activeworkspace"] = {"id": 2}
            return subprocess.CompletedProcess(command, exit_code, "{}\n", "probe failed")

        with tempfile.TemporaryDirectory() as directory, \
             patch.object(desktop, "ev", pathlib.Path(directory)), \
             patch.object(desktop, "read", side_effect=lambda *args: responses[args[1]]), \
             patch.object(desktop, "dispatch") as dispatch, \
             patch.object(desktop.subprocess, "run", side_effect=run), \
             patch.object(desktop.time, "sleep"), \
             patch.dict(os.environ, {"FREELENS_UI_MODE": mode}), \
             patch("sys.argv", ["desktop.py", action, "background", "root"]):
            if exit_code or user_moved:
                with self.assertRaises(AssertionError):
                    desktop.main()
            else:
                desktop.main()
        self.assertEqual([], dispatch.call_args_list, "Screenshot requested desktop focus")
        self.assertFalse(any("native-input.py" in str(arg) for cmd in calls for arg in cmd),
                         "Screenshot moved the user's pointer")

    def test_background_capture_and_probes_never_touch_desktop(self):
        for ticket in range(25, 31):
            for action in ("capture", "probe"):
                with self.subTest(ticket=ticket, action=action):
                    self.background_check(ticket, action)

    def test_background_failure_does_not_restore_desktop_even_in_attended_mode(self):
        for ticket in range(25, 31):
            with self.subTest(ticket=ticket):
                self.background_check(ticket, "capture", mode="attended", exit_code=1)

    def test_background_check_leaves_new_user_focus_alone(self):
        for ticket in range(25, 31):
            with self.subTest(ticket=ticket):
                self.background_check(ticket, "capture", user_moved=True)

    def test_scripts_require_attended_mode_before_any_desktop_calls(self):
        for ticket in range(25, 31):
            desktop = self.load_desktop(ticket)
            with self.subTest(ticket=ticket), \
                 patch.dict(os.environ, {"FREELENS_UI_MODE": ""}), \
                 patch.object(desktop, "read") as read, \
                 patch.object(desktop, "dispatch") as dispatch, \
                 patch("sys.argv", ["desktop.py", "script", "test", "example.mjs"]):
                with self.assertRaisesRegex(SystemExit, "DEFERRED"):
                    desktop.main()
                read.assert_not_called()
                dispatch.assert_not_called()

    def test_attended_mode_still_requires_freelens_already_focused(self):
        desktop = self.load_desktop(30)
        for workspace, window in ((1, "freelens"), (7, "browser")):
            with self.subTest(workspace=workspace, window=window), \
                 patch.dict(os.environ, {"FREELENS_UI_MODE": "attended"}), \
                 patch.object(desktop, "read", side_effect=lambda *args: (
                     {"id": workspace} if args[1] == "activeworkspace" else {"class": window}
                 )), \
                 patch.object(desktop, "dispatch") as dispatch, \
                 patch("sys.argv", ["desktop.py", "script", "test", "example.mjs"]):
                with self.assertRaisesRegex(SystemExit, "DEFERRED"):
                    desktop.main()
                dispatch.assert_not_called()

    def test_native_entrypoints_defer_before_subprocess_or_device_access(self):
        # Run actual entry points with desktop/device access replaced by tripwires.
        # A missing guard must fail the test without touching the user's session.
        paths = [p for p in (ROOT / "docs/verification").rglob("*.py")
                 if p.name != "desktop.py" and (
                     re.search(r"hl\.dsp\.(?:focus|workspace)\(", p.read_text())
                     or "/dev/uinput" in p.read_text())]
        self.assertTrue(paths)
        for path in paths:
            with self.subTest(path=str(path.relative_to(ROOT))), \
                 patch.dict(os.environ, {"FREELENS_UI_MODE": ""}), \
                 patch("os.open", side_effect=AssertionError("Device access before gate")), \
                 patch("subprocess.run", side_effect=AssertionError("Process before gate")), \
                 patch("subprocess.check_output", side_effect=AssertionError("Process before gate")), \
                 patch("subprocess.Popen", side_effect=AssertionError("Process before gate")):
                with self.assertRaisesRegex(SystemExit, "DEFERRED"):
                    runpy.run_path(str(path), run_name="__main__")


if __name__ == "__main__":
    unittest.main()
