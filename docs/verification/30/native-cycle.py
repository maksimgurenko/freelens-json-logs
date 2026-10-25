"""Observe native minimize before restoring focus; refocusing a minimized target undoes it."""
import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import json,subprocess,time,sys
from desktop import read,dispatch,restore,root,node,ev
label=sys.argv[1];workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address');window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens');assert window['workspace']['id']==7
cursor=read('hyprctl','cursorpos','-j')
facts={'workspaceBefore':workspace,'focusBefore':focus,'window':window['address'],'mainPid':window['pid']}
def probe(name,suffix):
 r=subprocess.run([str(node),'scripts/host-cdp.mjs','770814',str(ev/'probes'/(name+'.js'))],cwd=root,text=True,capture_output=True)
 (ev/(label+'-'+suffix+'.json')).write_text(r.stdout);assert r.returncode==0,r.stdout+r.stderr
try:
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.2)
 subprocess.run([str(node),str(ev/'focus-host.mjs')],cwd=root,check=True)
 probe('native-minimize','native')
 # Deliberately do not refocus the target during the hidden observation interval.
 probe('check-hidden','hidden')
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.2)
 subprocess.run([str(node),str(ev/'focus-host.mjs')],cwd=root,check=True)
 probe('native-unminimize','restore')
 probe('visibility-return','returned')
finally:
 restore(focus,workspace)
 commands=json.dumps({'op':'move',**cursor})+'\n'+json.dumps({'op':'close'})+'\n'
 subprocess.run(['/usr/bin/python3',str(root/'docs/verification/30/native-input.py')],input=commands,capture_output=True,text=True,check=True,timeout=5)
 restore(focus,workspace)
 facts.update(workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'))
 (ev/(label+'-desktop.json')).write_text(json.dumps(facts,indent=2)+'\n')
assert facts['workspaceAfter']==workspace and facts['focusAfter']==focus,facts
print(label+': actual native minimize/frozen interval/restore passed')
