import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import json,subprocess,time,sys
from host import read,dispatch,root,node,ev
name=sys.argv[1]
workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address')
window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
try:
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.25)
 subprocess.run([str(node),'scripts/host-cdp.mjs','screenshot',str(ev/(name+'.png'))],cwd=root,check=True)
finally:
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 (ev/(name+'-desktop.json')).write_text(json.dumps({'workspaceBefore':workspace,'focusBefore':focus,'workspaceAfter':read('hyprctl','activeworkspace','-j')['id'],'focusAfter':read('hyprctl','activewindow','-j').get('address'),'hostWorkspace':window['workspace']['id']},indent=2)+'\n')
