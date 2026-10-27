"""Launch only into the proven private display; never the user compositor."""
from pathlib import Path
import json, os, subprocess
ticket = os.environ.get('FIND_HOST_TICKET', '42')
assert ticket in ('42', '48')
run = os.environ.get('FIND_HOST_RUN', '')
assert not run or all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)

root=Path(__file__).resolve().parents[2]
s=root/f'.scratch/find/{ticket}-host'
info=json.loads((s/'session.json').read_text())
user=subprocess.check_output(['systemctl','--user','show-environment'],text=True)
assert 'HYPRLAND_INSTANCE_SIGNATURE='+info['instance'] not in user
assert Path(info['runtime']).name.startswith('fd-')
env=dict(os.environ,**info['environment'],FREELENS_INTEGRATION_TESTING_DIR=(s/'integration-path').read_text(),XDG_CONFIG_HOME=str(s/'config'),XDG_CACHE_HOME=str(s/'cache'),CHOKIDAR_USEPOLLING='1',CHOKIDAR_INTERVAL='100')
for key in info.get('unsetEnvironment', []): env.pop(key, None)
for key in ['DISPLAY','DBUS_SESSION_BUS_ADDRESS','ELECTRON_RUN_AS_NODE','FREELENS_UI_MODE']: env.pop(key,None)
cmd=['/usr/share/freelens/freelens','--ozone-platform=wayland','--remote-debugging-address=127.0.0.1','--remote-debugging-port=9241','--inspect=127.0.0.1:9242','--disable-renderer-backgrounding']
with (root/f'docs/verification/{ticket}/host'/run/'host.log').open('a') as f:
 process=subprocess.Popen(cmd,cwd='/home/max',env=env,stdout=f,stderr=subprocess.STDOUT)
 (s/'host-pid').write_text(str(process.pid))
 print(json.dumps({'pid':process.pid,'command':cmd,'privateInstance':info['instance']}),flush=True)
 process.wait()
 print(json.dumps({'pid':process.pid,'exit':process.returncode}),flush=True)
