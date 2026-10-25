"""Background capture/probes; other ticket scripts require attended opt-in."""
import json,pathlib,subprocess,time,sys,os
root=pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'scripts'))
from ui_test_policy import require_attended,allow_focus_change
ev=root/'docs/verification/28';node=root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node'
def read(*args):return json.loads(subprocess.check_output(args,text=True))
def dispatch(expr):
 if 'hl.dsp.focus(' in expr or 'hl.dsp.workspace(' in expr:allow_focus_change()
 subprocess.run(['hyprctl','eval',expr],check=True,stdout=subprocess.DEVNULL)
def restore(focus,workspace):
 if os.environ.get('FREELENS_UI_MODE')!='attended':return
 # A focused special-workspace window does not restore the underlying regular
 # workspace. Restore that separately before returning its actual focused window.
 if read('hyprctl','activeworkspace','-j')['id']!=workspace:dispatch('hl.dispatch(hl.dsp.focus({workspace='+str(workspace)+'}))')
 if focus and any(w['address']==focus for w in read('hyprctl','clients','-j')):dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
def main():
 action,label,*args=sys.argv[1:]
 if action not in ('capture','probe','launch'):require_attended(read)
 workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address')
 facts={'action':action,'workspaceBefore':workspace,'focusBefore':focus}
 facts['cursorBefore']=read('hyprctl','cursorpos','-j')
 window=next((w for w in read('hyprctl','clients','-j') if w['class']=='freelens'),None)
 try:
  if action=='launch':
   assert window is None,'Host already running; use native fresh-main workflow'
   temp=pathlib.Path.home()/'.cache/freelens-readable-logs/tmp';temp.mkdir(parents=True,exist_ok=True)
   assert os.stat(temp).st_dev==os.stat(pathlib.Path.home()/'.freelens/extensions').st_dev
   cmd=f'env CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100 TMPDIR={temp} /usr/bin/freelens --inspect=127.0.0.1:9229 --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235 >> {root}/.scratch/compact-view/28/host.log 2>&1'
   facts['command']=cmd
   dispatch(f'hl.exec_cmd({json.dumps(cmd)}, {{workspace="7 silent", no_initial_focus=true}})')
   for _ in range(100):
    window=next((w for w in read('hyprctl','clients','-j') if w['class']=='freelens'),None)
    if window:break
    time.sleep(.1)
   assert window,'No host mapped';time.sleep(.4)
   window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
   facts['initialMappedWorkspace']=window['workspace']['id']
   if window['workspace']['id']!=7:dispatch('hl.dispatch(hl.dsp.window.move({workspace=7,silent=true,window='+json.dumps('address:'+window['address'])+'}))')
  else:
   assert window and window['workspace']['id']==7,'Host must remain on workspace 7'
   if action not in ('capture','probe'):
    dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.2)
   if action=='capture':cmd=[str(node),'scripts/host-cdp.mjs','screenshot',str(ev/(label+'.png'))]
   elif action=='input':cmd=[str(node),str(ev/'input.mjs')]
   elif action=='focus':cmd=[str(node),str(ev/'focus.mjs')]
   elif action=='script':cmd=[str(node),args[0],*args[1:]]
   elif action=='probe':cmd=[str(node),'scripts/host-cdp.mjs',args[0],str(ev/'probes'/(label+'.js'))]
   else:raise ValueError(action)
   runenv=dict(os.environ)
   if action=='script':
    runenv['CV26_CURSOR_START']=json.dumps(facts['cursorBefore'])
    runenv['CV26_WINDOW_AT']=json.dumps({'x':window['at'][0],'y':window['at'][1]})
   r=subprocess.run(cmd,cwd=root,capture_output=True,text=True,env=runenv);facts['exitCode']=r.returncode
   if action=='probe':(ev/(label+'.json')).write_text(r.stdout)
   assert r.returncode==0,r.stdout+r.stderr
 finally:
  if os.environ.get('FREELENS_UI_MODE')=='attended' and action not in ('capture','probe','launch'):
   restore(focus,workspace)
   p=facts['cursorBefore'];commands=json.dumps({'op':'move','x':p['x'],'y':p['y']})+'\n'+json.dumps({'op':'close'})+'\n'
   restored=subprocess.run(['/usr/bin/python3',str(root/'docs/verification/26/continuation/native-input.py')],input=commands,capture_output=True,text=True,check=True,timeout=5)
   facts['nativePointerRestore']=restored.stdout.strip().splitlines()[-1]
   if read('hyprctl','activewindow','-j').get('address')!=focus:
    restore(focus,workspace)
    facts['finalFocusRestoredAfterPointer']=True
   facts['cursorAfter']=read('hyprctl','cursorpos','-j')
  window=next((w for w in read('hyprctl','clients','-j') if w['class']=='freelens'),None)
  facts.update(workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'),hostWorkspace=window['workspace']['id'] if window else None,mainPid=window['pid'] if window else None)
  (ev/(label+'-desktop.json')).write_text(json.dumps(facts,indent=2)+'\n')
  assert facts['focusBefore']==facts['focusAfter'] and facts['workspaceBefore']==facts['workspaceAfter'],facts
 print(label+': passed ('+('background' if action in ('capture','probe','launch') else 'attended')+')')
if __name__=='__main__':main()
