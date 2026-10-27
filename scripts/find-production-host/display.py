"""Private headless labwc -> nested Hyprland; observe the real desktop read-only."""
from pathlib import Path
import json, os, select, socket, subprocess, tempfile, time

ticket = os.environ.get('FIND_HOST_TICKET', '42')
assert ticket in ('42', '48')
run = os.environ.get('FIND_HOST_RUN', '')
assert not run or all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)

root = Path(__file__).resolve().parents[2]
scratch = root / f'.scratch/find/{ticket}-host'
(scratch / 'stop').unlink(missing_ok=True)
prefix = scratch / 'prefix'
runtime = Path(tempfile.mkdtemp(prefix='fd-', dir='/tmp'))
runtime.chmod(0o700)
evidence = root / f'docs/verification/{ticket}/host' / run
evidence.mkdir(parents=True, exist_ok=True)
user_environment = subprocess.check_output(['systemctl', '--user', 'show-environment'], text=True)
user_instance = next(line.split('=', 1)[1] for line in user_environment.splitlines() if line.startswith('HYPRLAND_INSTANCE_SIGNATURE='))
user_env = dict(os.environ, HYPRLAND_INSTANCE_SIGNATURE=user_instance)
def user_state():
    def get(name): return json.loads(subprocess.check_output(['hyprctl', name, '-j'], env=user_env))
    window = get('activewindow')
    return {'active': {key: window.get(key) for key in ('address', 'class', 'workspace')}, 'workspace': get('activeworkspace')['id'], 'pointer': get('cursorpos'), 'clients': [{key: client.get(key) for key in ('address', 'class', 'pid', 'workspace')} for client in get('clients')]}
before = user_state()
watcher = socket.socket(socket.AF_UNIX)
watcher.connect(f"{os.environ['XDG_RUNTIME_DIR']}/hypr/{user_instance}/.socket2.sock")
watcher.setblocking(False)
base = dict(os.environ, XDG_RUNTIME_DIR=str(runtime), XDG_CONFIG_HOME=str(scratch / 'config'), XDG_CACHE_HOME=str(scratch / 'cache'), HYPRLAND_NO_SD_VARS='1', HYPRLAND_NO_SD_NOTIFY='1', HYPRLAND_NO_RT='1', HYPRLAND_NO_WELCOME='1')
for key in ('DISPLAY', 'WAYLAND_DISPLAY', 'HYPRLAND_INSTANCE_SIGNATURE', 'DBUS_SESSION_BUS_ADDRESS', 'ELECTRON_RUN_AS_NODE'):
    base.pop(key, None)
outer_config = scratch / 'labwc'
outer_config.mkdir(exist_ok=True)
(outer_config / 'rc.xml').write_text('<labwc_config/>\n')
(outer_config / 'autostart').write_text('')
(outer_config / 'environment').write_text('')
command = [str(prefix / 'usr/bin/labwc'), '--config-dir', str(outer_config)]
renderer = os.environ.get('FIND_DISPLAY_RENDERER', '')
assert renderer in ('', 'mesa')
if renderer == 'mesa':
    for key in ('GBM_BACKEND', '__GLX_VENDOR_LIBRARY_NAME', 'LIBVA_DRIVER_NAME'):
        base.pop(key, None)
    base['__EGL_VENDOR_LIBRARY_FILENAMES'] = '/usr/share/glvnd/egl_vendor.d/50_mesa.json'
outer_env = dict(base, LD_LIBRARY_PATH=str(prefix / 'usr/lib'), WLR_BACKENDS='headless', WLR_RENDERER='gles2', WLR_LIBINPUT_NO_DEVICES='1', WLR_HEADLESS_OUTPUTS='1')
if renderer == 'mesa':
    outer_env['WLR_RENDER_DRM_DEVICE'] = '/dev/dri/renderD128'
started = time.monotonic()
events = []
outer = nested = None
result = {'before': before, 'userInstance': user_instance, 'outerCommand': command, 'runtime': str(runtime), 'renderer': renderer, 'rendererEnvironment': {key: outer_env[key] for key in ('GBM_BACKEND','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','WLR_RENDER_DRM_DEVICE') if key in outer_env}}
try:
    output = (evidence / 'outer.log').open('w')
    outer = subprocess.Popen(command, env=outer_env, stdout=output, stderr=subprocess.STDOUT)
    for _ in range(200):
        sockets = [path for path in runtime.glob('wayland-*') if not path.name.endswith('.lock')]
        if sockets: break
        if outer.poll() is not None: raise RuntimeError('Outer display failed: ' + (evidence / 'outer.log').read_text()[-6000:])
        time.sleep(.05)
    else: raise RuntimeError('Private outer socket did not appear')
    config = scratch / 'hyprland.lua'
    config.write_text('-- Disposable nested compositor; no user configuration or startup commands.\n'
                      'hl.monitor({output="", mode="1920x1080@60", position="0x0", scale=1})\n')
    nested_env = dict(base, WAYLAND_DISPLAY=str(sockets[0]), AQ_DRM_DEVICES='/dev/null', LIBSEAT_BACKEND='seatd', SEATD_SOCK=str(scratch / 'no-seatd.sock'))
    output = (evidence / 'hyprland.log').open('w')
    nested = subprocess.Popen(['Hyprland', '--config', str(config)], env=nested_env, stdout=output, stderr=subprocess.STDOUT)
    instance = None
    for _ in range(300):
        if nested.poll() is not None: raise RuntimeError('Nested Hyprland failed: ' + (evidence / 'hyprland.log').read_text()[-6000:])
        candidates = list((runtime / 'hypr').glob('*/.socket.sock'))
        if candidates:
            candidate = candidates[0].parent.name
            test = subprocess.run(['hyprctl', 'activeworkspace', '-j'], env=dict(nested_env, HYPRLAND_INSTANCE_SIGNATURE=candidate), capture_output=True, text=True, timeout=2)
            if test.returncode == 0 and test.stdout.lstrip().startswith('{'): instance = candidate; break
        time.sleep(.05)
    if not instance: raise RuntimeError('Nested Hyprland IPC did not become ready')
    assert instance != user_instance
    isolated_env = dict(nested_env, HYPRLAND_INSTANCE_SIGNATURE=instance)
    description = next(item for item in json.loads(subprocess.check_output(['hyprctl', 'instances', '-j'], env=isolated_env)) if item['instance'] == instance)
    isolated_env['WAYLAND_DISPLAY'] = str(runtime / description['wl_socket'])
    # This dispatch targets only the private runtime/socket, never the real desktop.
    subprocess.run(['hyprctl', 'eval', 'hl.dispatch(hl.dsp.focus({workspace=7}))'], env=isolated_env, check=True, stdout=subprocess.DEVNULL)
    info = {'unsetEnvironment': ['GBM_BACKEND','__GLX_VENDOR_LIBRARY_NAME','LIBVA_DRIVER_NAME'] if renderer == 'mesa' else [], 'outerPid': outer.pid, 'hyprlandPid': nested.pid, 'instance': instance, 'runtime': str(runtime), 'environment': {key: isolated_env[key] for key in ('XDG_RUNTIME_DIR', 'HYPRLAND_INSTANCE_SIGNATURE', 'WAYLAND_DISPLAY', 'HYPRLAND_NO_SD_VARS', 'HYPRLAND_NO_SD_NOTIFY', 'AQ_DRM_DEVICES', 'LIBSEAT_BACKEND', 'SEATD_SOCK', '__EGL_VENDOR_LIBRARY_FILENAMES') if key in isolated_env}}
    (scratch / 'session.json').write_text(json.dumps(info, indent=2) + '\n')
    print(json.dumps({'ready': True, **info}), flush=True)
    while not (scratch / 'stop').exists():
        if nested.poll() is not None or outer.poll() is not None: raise RuntimeError('Private display exited unexpectedly')
        ready, _, _ = select.select([watcher], [], [], .1)
        if ready:
            data = watcher.recv(65536)
            if not data: raise RuntimeError('Real desktop observer disconnected')
            for event in data.decode().splitlines():
                if event.startswith(('activewindowv2>>', 'workspace>>', 'focusedmon>>', 'openwindow>>', 'closewindow>>')): events.append({'ms': (time.monotonic() - started) * 1000, 'event': event})
        if time.monotonic() - started > 7200: raise RuntimeError('Private display exceeded two hours')
except Exception as error:
    result['error'] = str(error)
    raise
finally:
    for process in (nested, outer):
        if process and process.poll() is None:
            process.terminate()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired: process.kill(); process.wait()
    if (runtime / 'hypr').exists():
        for log in (runtime / 'hypr').glob('*/hyprland.log'):
            (evidence / 'hyprland-internal.log').write_bytes(log.read_bytes())
    after = user_state()
    result.update(after=after, events=events, elapsedSeconds=time.monotonic() - started, outerExit=outer.returncode if outer else None, hyprlandExit=nested.returncode if nested else None)
    (evidence / 'real-desktop.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'closed': True, 'focusSame': before['active'] == after['active'], 'workspaceSame': before['workspace'] == after['workspace'], 'pointerSame': before['pointer'] == after['pointer'], 'clientsSame': before['clients'] == after['clients'], 'events': len(events), 'error': result.get('error')}), flush=True)
