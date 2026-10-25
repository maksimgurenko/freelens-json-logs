"""Normal native quit before maintenance. Never used to recover a failed activation."""
import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import pathlib,subprocess,json,time
import sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from desktop import read,dispatch,restore,root
ev=root/'docs/verification/27'
label=sys.argv[1] if len(sys.argv)>1 else 'normal-pre-maintenance-quit'
rows=[l.split(None,2) for l in subprocess.check_output(['ps','-eo','pid=,ppid=,args='],text=True).splitlines()]
window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens');main=window['pid'];family={main}
while True:
 more=family|{int(pid) for pid,ppid,args in rows if int(ppid) in family}
 if more==family:break
 family=more
workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address')
try:
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.2)
 dispatch('hl.dispatch(hl.dsp.send_shortcut({mods="ALT",key="F4",window='+json.dumps('address:'+window['address'])+'}))')
finally:restore(focus,workspace)
for _ in range(100):
 alive=[pid for pid in family if pathlib.Path('/proc',str(pid)).exists()]
 if not alive:break
 time.sleep(.1)
facts={'oldMainPid':main,'oldFamily':sorted(family),'remainingOldPids':alive,'workspaceBefore':workspace,'focusBefore':focus,'workspaceAfter':read('hyprctl','activeworkspace','-j')['id'],'focusAfter':read('hyprctl','activewindow','-j').get('address')}
(ev/(label+'.json')).write_text(json.dumps(facts,indent=2)+'\n');assert not alive,facts
if focus!=window['address']:assert facts['workspaceBefore']==facts['workspaceAfter'] and facts['focusBefore']==facts['focusAfter'],facts
if len(sys.argv)>2:
 import shutil
 source=pathlib.Path(sys.argv[2]);settings=pathlib.Path.home()/'.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'
 shutil.copyfile(source,settings)
 facts['controlledSettingsSource']=str(source)
 (ev/(label+'.json')).write_text(json.dumps(facts,indent=2)+'\n')
subprocess.run(['python3',str(root/'docs/verification/27/desktop.py'),'launch',label+'-launch'],check=True)

if focus==window['address']:
 replacement=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+replacement['address'])+'}))')
 facts.update(focusedHostReplacement=replacement['address'],workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'))
 (ev/(label+'.json')).write_text(json.dumps(facts,indent=2)+'\n')
