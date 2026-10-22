"""PROTOTYPE: background SIGTERM/relaunch, confined to workspace 7."""
import json, os, pathlib, signal, subprocess, sys, time
here = pathlib.Path(__file__).resolve().parent
label = sys.argv[1]
windows = json.loads(subprocess.check_output(['hyprctl', 'clients', '-j']))
window = next(w for w in windows if w['class'] == 'freelens')
rows = [line.split(None, 2) for line in subprocess.check_output(['ps', '-eo', 'pid=,ppid=,comm='], text=True).splitlines()]
family = {str(window['pid'])}
while True:
    expanded = family | {pid for pid, parent, name in rows if parent in family}
    if expanded == family: break
    family = expanded
os.kill(window['pid'], signal.SIGTERM)
for elapsed in range(100):
    alive = [pid for pid in sorted(family) if pathlib.Path('/proc', pid).exists()]
    if not alive: break
    time.sleep(.1)
facts = dict(at=time.time(), oldMainPid=window['pid'], originalPids=sorted(family),
             remainingPids=alive, quit='SIGTERM main process', waitSeconds=elapsed/10)
if alive:
    here.joinpath(f'evidence/{label}-restart.json').write_text(json.dumps(facts, indent=2))
    raise SystemExit('Original host processes remain; no relaunch attempted')
log = pathlib.Path.home() / '.local/state/freelens-json-logs-spike/freelens-local-installation.log'
facts['newLogOffset'] = log.stat().st_size
facts['activeWorkspaceBeforeLaunch'] = json.loads(subprocess.check_output(['hyprctl', 'activeworkspace', '-j']))['id']
facts['activeWindowBeforeLaunch'] = json.loads(subprocess.check_output(['hyprctl', 'activewindow', '-j'])).get('address')
launch = f'/usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235 >> {log} 2>&1'
subprocess.run(['hyprctl', 'eval', f'hl.exec_cmd({json.dumps(launch)}, {{workspace="7 silent", no_initial_focus=true}})'], check=True)
for elapsed in range(100):
    windows = json.loads(subprocess.check_output(['hyprctl', 'clients', '-j']))
    new = next((w for w in windows if w['class'] == 'freelens'), None)
    if new: break
    time.sleep(.1)
if not new: raise SystemExit('No Freelens window appeared')
facts['newMainPid'] = new['pid']
facts['newWindowWorkspace'] = new['workspace']['id']
facts['activeWorkspaceAfterLaunch'] = json.loads(subprocess.check_output(['hyprctl', 'activeworkspace', '-j']))['id']
facts['activeWindowAfterLaunch'] = json.loads(subprocess.check_output(['hyprctl', 'activewindow', '-j'])).get('address')
here.joinpath(f'evidence/{label}-restart.json').write_text(json.dumps(facts, indent=2))
print(json.dumps(facts, indent=2))
