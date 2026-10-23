"""Run one native-visible measurement, immediately restoring the desktop in finally."""
import json,pathlib,subprocess,sys,time
root=pathlib.Path(__file__).resolve().parents[3]; ev=root/'docs/verification/19'
def read(*args):return json.loads(subprocess.check_output(args,text=True))
def dispatch(expr):subprocess.run(['hyprctl','eval',expr],check=True,stdout=subprocess.DEVNULL)
workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address');window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
assert window['workspace']['id']==7
facts={'workspaceBefore':workspace,'focusBefore':focus,'window':window['address'],'windowWorkspace':7}
try:
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.2)
 result=subprocess.run([str(root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node'),'scripts/host-cdp.mjs','770814',str(ev/'probes'/sys.argv[1])],cwd=root,capture_output=True,text=True)
 (ev/(sys.argv[2]+'.json')).write_text(result.stdout);facts['exitCode']=result.returncode
finally:
 if focus and any(w['address']==focus for w in read('hyprctl','clients','-j')):dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 facts.update(workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'))
 (ev/(sys.argv[2]+'-desktop.json')).write_text(json.dumps(facts,indent=2)+'\n')
assert result.returncode==0,result.stdout+result.stderr
assert facts['workspaceAfter']==workspace and facts['focusAfter']==focus,facts
print(sys.argv[2]+': passed')
