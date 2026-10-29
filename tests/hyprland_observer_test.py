"""Exercise the observer CLI only against temporary, owned Unix sockets."""

import json
import os
from pathlib import Path
import select
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'observe-hyprland.py'


@unittest.skipUnless(sys.platform.startswith('linux'), 'Linux observer; other platforms unverified')
class HyprlandObserverTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='hyprland-observer-test-')
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'events.sock'

    def observe(self, chunks=(), *, expected=0, disconnect=False, interrupt=False):
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as server:
            server.bind(str(self.path))
            server.listen(1)
            server.settimeout(3)
            process = subprocess.Popen(
                [sys.executable, '-B', str(SCRIPT), '--socket', str(self.path), '--duration', '.3'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            try:
                connection, _ = server.accept()
                with connection:
                    first = b''
                    deadline = time.monotonic() + 3
                    while b'\n' not in first:
                        remaining = deadline - time.monotonic()
                        self.assertGreater(remaining, 0, 'observer did not announce readiness')
                        self.assertTrue(select.select([process.stdout], [], [], remaining)[0])
                        data = os.read(process.stdout.fileno(), 65536)
                        self.assertTrue(data, 'observer exited before readiness')
                        first += data
                    line, _, pending = first.partition(b'\n')
                    ready = json.loads(line)
                    self.assertEqual(ready['kind'], 'ready')
                    for chunk in chunks:
                        connection.sendall(chunk)
                        time.sleep(.005)
                    if disconnect:
                        connection.shutdown(socket.SHUT_WR)
                    if interrupt:
                        process.send_signal(signal.SIGINT)
                    output, error = process.communicate(timeout=3)
                    rows = [ready, *[json.loads(line) for line in (pending + output).splitlines()]]
                    self.assertEqual(process.returncode, expected, error.decode())
                    self.assertEqual(rows[-1]['kind'] == 'complete', expected == 0)
                    connection.settimeout(1)
                    self.assertEqual(connection.recv(1), b'', 'observer wrote to the socket')
                    if expected == 0:
                        self.assertFalse(error)
                        self.assertEqual(rows[-1]['events'], len(rows) - 2)
                    return rows, error.decode()
            finally:
                if process.poll() is None:
                    process.kill()
                process.communicate(timeout=3)

    def test_fragmented_events_filter_titles_and_preserve_repeated_notifications(self):
        rows, _ = self.observe([
            b'activewindowv2>>abc\nactivewind',
            b'owv2>>abc\nworkspacev2>>7,seven\nopenwindow>>private-title\n',
            b'focusedmon>>DP-1,7\nworkspace>>7\n',
        ])
        self.assertEqual([(row['event'], row['value']) for row in rows[1:-1]], [
            ('activewindowv2', 'abc'), ('activewindowv2', 'abc'),
            ('workspacev2', '7,seven'), ('focusedmon', 'DP-1,7'), ('workspace', '7'),
        ])
        self.assertNotIn('private-title', json.dumps(rows))
        self.assertEqual([row['elapsedSeconds'] for row in rows],
                         sorted(row['elapsedSeconds'] for row in rows))
        self.assertTrue(all(row['at'] > 0 for row in rows))

    def test_idle_observation_completes(self):
        rows, _ = self.observe()
        self.assertEqual([row['kind'] for row in rows], ['ready', 'complete'])
        self.assertGreaterEqual(rows[-1]['elapsedSeconds'], .3)

    def test_early_disconnect_retains_events_and_fails(self):
        rows, error = self.observe([b'workspace>>7\n'], disconnect=True, expected=1)
        self.assertEqual(rows[-1]['event'], 'workspace')
        self.assertIn('disconnected', error)

    def test_partial_final_line_fails(self):
        _, error = self.observe([b'workspace>>'], expected=1)
        self.assertIn('incomplete event line', error)

    def test_invalid_utf8_fails(self):
        _, error = self.observe([b'workspace>>\xff\n'], expected=1)
        self.assertIn('utf-8', error)

    def test_oversized_line_fails(self):
        _, error = self.observe([b'x' * (1024 * 1024 + 1)], expected=1)
        self.assertIn('size limit', error)

    def test_interrupt_is_incomplete(self):
        _, error = self.observe(interrupt=True, expected=130)
        self.assertIn('interrupted; observation is incomplete', error)

    def test_invalid_durations_fail_before_connection(self):
        for value in ('0', '-1', 'inf', 'nan', 'invalid'):
            with self.subTest(value=value):
                result = subprocess.run(
                    [sys.executable, '-B', str(SCRIPT), '--socket', str(self.path), '--duration', value],
                    capture_output=True, timeout=3)
                self.assertEqual(result.returncode, 2)
                self.assertFalse(result.stdout)

    def test_missing_socket_fails_without_readiness(self):
        result = subprocess.run(
            [sys.executable, '-B', str(SCRIPT), '--socket', str(self.path), '--duration', '.1'],
            capture_output=True, timeout=3)
        self.assertEqual(result.returncode, 1)
        self.assertFalse(result.stdout)
        self.assertIn(b'observe-hyprland:', result.stderr)


if __name__ == '__main__':
    unittest.main()
