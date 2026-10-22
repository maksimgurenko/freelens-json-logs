"""PROTOTYPE: observe one UI action; contain repeated activations with SIGTERM."""
import json, os, pathlib, signal, subprocess, sys, time

here = pathlib.Path(__file__).resolve().parent
label, action, main_pid = sys.argv[1], sys.argv[2], int(sys.argv[3])
log = pathlib.Path.home() / '.local/state/freelens-json-logs-spike/freelens-local-installation.log'
evidence = here / 'evidence'
start = log.stat().st_size
started = time.time()
result = subprocess.run(['node', str(here / 'cdp.mjs'), 'root', str(here / action)], capture_output=True, text=True)
evidence.joinpath(f'{label}-action.json').write_text(result.stdout)
if result.returncode:
    raise RuntimeError(result.stderr)
for elapsed in range(1, 9):
    time.sleep(1)
    with log.open() as file:
        file.seek(start)
        delta = file.read()
    activations = delta.count('[READABLE-LOGS-HOST-SPIKE] main activated')
    deactivations = delta.count('[READABLE-LOGS-HOST-SPIKE] main deactivated')
    stopped = activations > 20 or deactivations > 20
    if stopped:
        os.kill(main_pid, signal.SIGTERM)
        break
facts = dict(started=started, elapsed=elapsed, mainPid=main_pid, activations=activations,
             deactivations=deactivations, logOffset=start, stoppedForCycling=stopped)
evidence.joinpath(f'{label}.json').write_text(json.dumps(facts, indent=2))
evidence.joinpath(f'{label}-log.txt').write_text('\n'.join(line for line in delta.splitlines()
    if 'READABLE-LOGS-HOST-SPIKE' in line)[:6500])
if not stopped:
    result = subprocess.run(['node', str(here / 'cdp.mjs'), 'root', str(here / 'inspect.js')], capture_output=True, text=True)
    evidence.joinpath(f'{label}-ui.json').write_text(result.stdout)
print(json.dumps(facts, indent=2))
