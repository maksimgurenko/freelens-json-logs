"""Arm one physical G305 Back trace; restore pointer/workspace/focus immediately.

Run from the repository. No notification is sent. The supervisor notifies only
after .ralph/physical-back-armed.json exists. This script never injects Back.
"""
import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
ev = root / 'docs/verification/30'
node = root / '.scratch/readable-logs/toolchain/node_modules/node/bin/node'
spec = importlib.util.spec_from_file_location('cv30_desktop', root / 'docs/verification/30/desktop.py')
desktop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(desktop)
read, dispatch, restore = desktop.read, desktop.dispatch, desktop.restore
motion_spec=importlib.util.spec_from_file_location('cv30_motion',ev/'physical-motion.py')
motion_module=importlib.util.module_from_spec(motion_spec);motion_spec.loader.exec_module(motion_module)
PhysicalMotion=motion_module.PhysicalMotion


def move_pointer(point):
    # Reuse the tested, self-destroying pointer helper for positioning only.
    # No button/key command is sent; the trace gesture must come from the G305.
    commands = json.dumps({'op': 'move', **point}) + '\n' + json.dumps({'op': 'close'}) + '\n'
    result = subprocess.run(['/usr/bin/python3', str(root / 'docs/verification/30/native-input.py')],
                            input=commands, text=True, capture_output=True, timeout=5, check=True)
    replies = [json.loads(line) for line in result.stdout.splitlines()]
    assert replies[-1].get('ok'), result.stdout
    return {'commanded':point,'helperReplies':replies,'observed':read('hyprctl','cursorpos','-j')}


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else 'guided-first'
    if not label.replace('-', '').isalnum():
        raise ValueError('Label must be alphanumeric with hyphens')
    seconds = int(os.environ.get('CV30_TIMEOUT', '30'))
    assert 1 <= seconds <= 45
    device = os.environ.get('CV30_MOUSE', '/dev/input/event5')
    state = ev / (label + '-state.json')
    armed = root / '.ralph/physical-back-armed.json'
    assert not armed.exists(), 'A trace is already armed'
    assert not state.exists(), 'Choose a new label; preserve prior trace evidence'
    workspace = read('hyprctl', 'activeworkspace', '-j')['id']
    focus = read('hyprctl', 'activewindow', '-j').get('address')
    cursor = read('hyprctl', 'cursorpos', '-j')
    window = next(w for w in read('hyprctl', 'clients', '-j') if w['class'] == 'freelens')
    assert window['workspace']['id'] == 7
    facts = {'workspaceBefore': workspace, 'focusBefore': focus, 'cursorBefore': cursor, 'mainPid': window['pid'],
             'timeoutSeconds': seconds, 'physicalInputInjected': False, 'context': os.environ.get('CV30_CONTEXT', 'dirty')}
    trace = hardware = None
    try:
        dispatch('hl.dispatch(hl.dsp.focus({window=' + json.dumps('address:' + window['address']) + '}))')
        subprocess.run([str(node), str(ev / 'guided-state.mjs'), 'prepare', str(state)], cwd=root, check=True, timeout=12)
        point = json.loads(state.read_text())['point']
        move_pointer({'x': round(window['at'][0] + point['x']), 'y': round(window['at'][1] + point['y'])})
        hardware = subprocess.Popen(['/usr/bin/python3', str(ev / 'physical-input.py'), '--device', device,
                                     '--seconds', str(seconds), '--stop-after-release', '--output', str(ev / (label + '-hardware.json'))],
                                    cwd=root, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        trace = subprocess.Popen([str(node), str(ev / 'trace.mjs'), str(seconds + 2), str(ev / (label + '-trace.json'))],
                                 cwd=root, text=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        ready = json.loads(trace.stdout.readline())
        assert ready.get('ready'), ready
        assert hardware.poll() is None, 'Physical recorder failed to arm'
        armed.write_text(json.dumps({'pid': os.getpid(), 'label': label, 'timeoutSeconds': seconds,
                                     'context': os.environ.get('CV30_CONTEXT', 'dirty') + '; workspace 7, pointer/focus at the owned prepared target',
                                     'action': 'Press and release the physical G305 Back side button exactly once; do not move pointer or click elsewhere.'}, indent=2) + '\n')
        print('ARMED: physical G305 Back once; automatic restore after release or timeout', flush=True)
        deadline = time.monotonic() + seconds + 1
        while hardware.poll() is None and time.monotonic() < deadline:
            if trace.poll() is not None:
                raise RuntimeError('Renderer trace ended before gesture')
            time.sleep(.05)
        stdout, stderr = hardware.communicate(timeout=2)
        assert hardware.returncode == 0, stdout + stderr
        facts['hardware'] = json.loads((ev / (label + '-hardware.json')).read_text())
        # Capture physical release's resulting dispatch/traversal before restoration.
        time.sleep(.25)
        trace.stdin.write('stop\n'); trace.stdin.flush()
        stdout, stderr = trace.communicate(timeout=5)
        assert trace.returncode == 0, stdout + stderr
    except BaseException as error:
        facts['failure'] = repr(error)
        raise
    finally:
        if hardware and hardware.poll() is None:
            hardware.terminate(); hardware.wait(timeout=3)
        if trace and trace.poll() is None:
            try:
                trace.communicate('stop\n', timeout=5)
            except subprocess.TimeoutExpired:
                trace.terminate(); trace.wait(timeout=3)
        armed.unlink(missing_ok=True)
        # Sample actual USB motion separately from our owned virtual pointer.
        # A tolerance failure alone never identifies its actor or cause.
        motion = PhysicalMotion()
        try:
            restore(focus, workspace)
            facts['cursorAfterFocusRestore'] = read('hyprctl', 'cursorpos', '-j')
            try:
                facts['pointerRestoration'] = move_pointer(cursor)
            finally:
                if read('hyprctl', 'activewindow', '-j').get('address') != focus:
                    restore(focus, workspace)
            facts['cursorAfterPointerAndFocus'] = read('hyprctl', 'cursorpos', '-j')
            time.sleep(.08)
        except BaseException as error:
            facts['restorationFailure'] = repr(error)
        finally:
            facts['physicalMotionDuringRestoration'] = motion.finish()
        facts.update(workspaceAfter=read('hyprctl', 'activeworkspace', '-j')['id'],
                     focusAfter=read('hyprctl', 'activewindow', '-j').get('address'),
                     cursorAfter=read('hyprctl', 'cursorpos', '-j'),
                     hostWorkspace=next(w for w in read('hyprctl', 'clients', '-j') if w['class'] == 'freelens')['workspace']['id'])
        if state.exists():
            cleanup = subprocess.run([str(node), str(ev / 'guided-state.mjs'), 'restore', str(state)], cwd=root, text=True, capture_output=True, timeout=15)
            facts['viewRestoreExitCode'] = cleanup.returncode
            if cleanup.returncode:
                facts['viewRestoreFailure'] = cleanup.stdout + cleanup.stderr
        (ev / (label + '-desktop.json')).write_text(json.dumps(facts, indent=2) + '\n')
        assert facts['workspaceAfter'] == workspace and facts['focusAfter'] == focus and facts['hostWorkspace'] == 7, facts
        assert all(abs(facts['cursorAfter'][axis] - cursor[axis]) <= 2 for axis in ['x', 'y']), facts
    print('Trace saved; prior desktop restored. This is observation, not mouse Back acceptance.', flush=True)


if __name__ == '__main__':
    main()
