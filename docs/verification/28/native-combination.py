"""Send one native Ctrl+[ or Ctrl+] via an owned, self-destroying uinput device.

This is OS-injected keyboard evidence, not a physical mouse/keyboard claim.
The caller must focus Freelens on workspace 7 and restore the desktop afterward.
"""
import json
from pathlib import Path
import subprocess
import sys
import time

code = {'back': 26, 'forward': 27}[sys.argv[1]]
helper = Path(__file__).with_name('native-input.py')
child = subprocess.Popen(['/usr/bin/python3', str(helper)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
try:
    assert json.loads(child.stdout.readline()).get('ready')
    for key, down in [(29, 1), (code, 1), (code, 0), (29, 0)]:
        child.stdin.write(json.dumps({'op': 'key', 'code': key, 'down': down}) + '\n'); child.stdin.flush()
        assert json.loads(child.stdout.readline()).get('ok')
        time.sleep(.025)
    child.stdin.write(json.dumps({'op': 'close'}) + '\n'); child.stdin.flush()
    child.wait(timeout=3)
    assert child.returncode == 0
finally:
    if child.poll() is None:
        child.stdin.close(); child.wait(timeout=3)
print(json.dumps({'action': sys.argv[1], 'physical': False, 'deviceDestroyed': True}))
