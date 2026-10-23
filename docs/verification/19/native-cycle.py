"""Observe native minimize before restoring focus; refocusing a minimized target undoes it."""
import json,subprocess,time,sys
from host import read,dispatch,root,node,ev
label=sys.argv[1];workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address');window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens');assert window['workspace']['id']==7
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
 dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))')
 if focus and any(w['address']==focus for w in read('hyprctl','clients','-j')):dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 facts.update(workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'))
 (ev/(label+'-desktop.json')).write_text(json.dumps(facts,indent=2)+'\n')
assert facts['workspaceAfter']==workspace and facts['focusAfter']==focus,facts
print(label+': actual native minimize/frozen interval/restore passed')
