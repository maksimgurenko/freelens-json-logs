"""Native normal quit, controlled extension-only fixture injection, silent launch.
No host code, other settings, kubeconfig or cluster resources are modified.
"""
import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import json,pathlib,subprocess,time,sys,shutil,hashlib
root=pathlib.Path(__file__).resolve().parents[3]
node=root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node'
ev=root/'docs/verification/19'
def read(*args):return json.loads(subprocess.check_output(args,text=True))
def dispatch(expression):subprocess.run(['hyprctl','eval',expression],check=True,stdout=subprocess.DEVNULL)
def probe(selector,name,output=None):
 result=subprocess.run([str(node),'scripts/host-cdp.mjs',selector,str(ev/'probes'/(name+'.js'))],cwd=root,text=True,capture_output=True)
 (ev/((output or name)+'.json')).write_text(result.stdout)
 assert result.returncode==0,result.stdout+result.stderr
 return json.loads(result.stdout)['result']['value']
def restart(label,source=None,mode=None):
 rows=[line.split(None,2) for line in subprocess.check_output(['ps','-eo','pid=,ppid=,args='],text=True).splitlines()]
 main=[int(pid) for pid,ppid,args in rows if args.startswith('/usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235')]
 assert len(main)==1,main
 family={main[0]}
 while True:
  more=family|{int(pid) for pid,ppid,args in rows if int(ppid) in family}
  if more==family:break
  family=more
 workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address')
 window=next(w for w in read('hyprctl','clients','-j') if w['pid']==main[0])
 facts={'label':label,'oldMainPid':main[0],'oldPids':sorted(family),'workspaceBefore':workspace,'focusBefore':focus,'oldWindowAddress':window['address']}
 try:
  dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))');time.sleep(.25)
  dispatch('hl.dispatch(hl.dsp.send_shortcut({mods="ALT",key="F4",window='+json.dumps('address:'+window['address'])+'}))')
 finally:
  if focus!=window['address']:dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 for _ in range(100):
  alive=[pid for pid in family if pathlib.Path('/proc',str(pid)).exists()]
  if not alive:break
  time.sleep(.1)
 facts['remainingOldPids']=alive;assert not alive,alive
 if source=='--remove-settings':
  shared=pathlib.Path.home()/'.config/Freelens/extension-store'
  owned=shared/'freelens-readable-logs'
  def other_hashes():
   return {str(p.relative_to(shared)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(shared.rglob('*')) if p.is_file() and not p.is_relative_to(owned)}
  before_others=other_hashes()
  preserved=root/'.scratch/readable-logs/19/preserved-backups-20'
  backup=owned/'backups'
  backup_before={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in backup.iterdir()} if backup.exists() else {}
  if backup.exists():
   assert not preserved.exists();backup.rename(preserved)
  (ev/'settings-before-explicit-removal.json').write_bytes((owned/'readable-logs.json').read_bytes())
  shutil.rmtree(owned)
  assert not owned.exists() and other_hashes()==before_others
  backup_after={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in preserved.iterdir()} if preserved.exists() else {}
  assert backup_after==backup_before
  facts['explicitSettingsRemoval']={'onlyDirectory':str(owned),'absent':True,'otherExtensionHashesBefore':before_others,'otherExtensionHashesAfter':other_hashes(),'backupsMovedTo':str(preserved),'backupsBefore':backup_before,'backupsAfter':backup_after}
 elif source:
  path=pathlib.Path.home()/'.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json'
  shutil.copyfile(source,path);path.chmod(int(mode or '600',8));facts['controlledSettingsSource']=str(source);facts['controlledMode']=mode or '600'
 temp=pathlib.Path.home()/'.cache/freelens-readable-logs/tmp';temp.mkdir(parents=True,exist_ok=True)
 cmd=f'env CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100 TMPDIR={temp} /usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235 >> {root}/.scratch/readable-logs/host.log 2>&1'
 dispatch(f'hl.exec_cmd({json.dumps(cmd)}, {{workspace="7 silent", no_initial_focus=true}})')
 for _ in range(100):
  window=next((w for w in read('hyprctl','clients','-j') if w['class']=='freelens'),None)
  if window:break
  time.sleep(.1)
 assert window,'No Freelens window'
 time.sleep(.5)
 window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
 facts['initialMappedWorkspace']=window['workspace']['id']
 if window['workspace']['id']!=7:
  dispatch('hl.dispatch(hl.dsp.window.move({workspace=7,silent=true,window='+json.dumps('address:'+window['address'])+'}))')
  facts['explicitWorkspaceCorrection']=True
 if focus and any(w['address']==focus for w in read('hyprctl','clients','-j')):
  dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+focus)+'}))')
 if focus==facts['oldWindowAddress']:
  dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))')
  facts['focusedHostReplacement']=True
 time.sleep(.1)
 window=next(w for w in read('hyprctl','clients','-j') if w['class']=='freelens')
 assert window['workspace']['id']==7,window
 facts.update(newMainPid=window['pid'],newWorkspace=window['workspace']['id'],workspaceAfter=read('hyprctl','activeworkspace','-j')['id'],focusAfter=read('hyprctl','activewindow','-j').get('address'),launch=cmd,quit='native File > Quit Alt+F4')
 (ev/(label+'.json')).write_text(json.dumps(facts,indent=2)+'\n');print(label+': normal quit/reopen, old processes exited')
if __name__=='__main__':restart(*sys.argv[1:])
