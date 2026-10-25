import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import json,pathlib,subprocess,time
root=pathlib.Path('/home/max/work/freelens-json-logs')
def read(*args):return json.loads(subprocess.check_output(args,text=True))
workspace=read('hyprctl','activeworkspace','-j')['id']
focus=read('hyprctl','activewindow','-j').get('address')
window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
facts={'workspaceBefore':workspace,'focusBefore':focus,'hostWindow':window['address']}
def probe(name):
    data=subprocess.check_output(['node','scripts/host-cdp.mjs','770814',f'docs/verification/17/probes/{name}.js'],cwd=root,text=True)
    (root/f'docs/verification/17/{name}.json').write_text(data)
    assert 'exceptionDetails' not in json.loads(data),data
def capture(name):
    subprocess.run(['node','scripts/host-cdp.mjs','screenshot',f'docs/verification/17/{name}.png'],cwd=root,check=True)
try:
    subprocess.run(['hyprctl','eval','hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))'],check=True)
    time.sleep(.3)
    capture('viewer')
    probe('capture-editor');capture('editor')
    probe('capture-matching');capture('matching')
finally:
    subprocess.run(['hyprctl','eval','hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))'],check=True)
    facts['workspaceAfter']=read('hyprctl','activeworkspace','-j')['id']
    facts['focusAfter']=read('hyprctl','activewindow','-j').get('address')
    (root/'docs/verification/17/desktop-capture.json').write_text(json.dumps(facts,indent=2)+'\n')
