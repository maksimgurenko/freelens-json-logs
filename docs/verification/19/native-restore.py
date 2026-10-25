"""Activate the existing single-instance host, preserving workspace/focus."""
import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import pathlib,subprocess,json,time,sys
root=pathlib.Path(__file__).resolve().parents[3];ev=root/'docs/verification/19'
def read(*a):return json.loads(subprocess.check_output(a,text=True))
def dispatch(s):subprocess.run(['hyprctl','eval',s],check=True,stdout=subprocess.DEVNULL)
focus=read('hyprctl','activewindow','-j').get('address');workspace=read('hyprctl','activeworkspace','-j')['id'];facts={'workspaceBefore':workspace,'focusBefore':focus}
try:
 res=subprocess.run(['/usr/bin/freelens'],capture_output=True,text=True,timeout=10);facts['activationExitCode']=res.returncode;assert res.returncode==0,res.stderr
 time.sleep(.3)
 window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens');facts['mainPid']=window['pid'];facts['windowWorkspace']=window['workspace']['id']
 if window['workspace']['id']!=7:dispatch('hl.dispatch(hl.dsp.window.move({workspace=7,silent=true,window='+json.dumps('address:'+window['address'])+'}))')
finally:
 if focus and any(w['address']==focus for w in read('hyprctl','clients','-j')):dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 facts.update(workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'))
 (ev/(sys.argv[1]+'.json')).write_text(json.dumps(facts,indent=2)+'\n')
assert facts['workspaceAfter']==workspace and facts['focusAfter']==focus
print('Existing host activated; desktop restored')
