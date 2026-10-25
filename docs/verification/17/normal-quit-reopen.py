import pathlib as _ui_path,sys as _ui_sys
_ui_sys.path.insert(0,str(_ui_path.Path(__file__).resolve().parents[3]/'scripts'))
from ui_test_policy import require_attended as _require_attended
_require_attended()
import json,os,pathlib,signal,subprocess,time,sys
root=pathlib.Path('/home/max/work/freelens-json-logs')
rows=[line.split(None,2) for line in subprocess.check_output(['ps','-eo','pid=,ppid=,args='],text=True).splitlines()]
main=[int(pid) for pid,ppid,args in rows if args.startswith('/usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235')]
assert len(main)==1, main
family={main[0]}
while True:
    more=family|{int(pid) for pid,ppid,args in rows if int(ppid) in family}
    if more==family:break
    family=more
facts={'at':time.time(),'oldMainPid':main[0],'originalPids':sorted(family),'reason':'Normal quit/reopen for ticket 17 persistence' if 'persistence' in sys.argv else 'Fresh main window before ticket 17 maintenance'}
facts['activeWorkspaceBefore']=json.loads(subprocess.check_output(['hyprctl','activeworkspace','-j']))['id']
facts['activeWindowBefore']=json.loads(subprocess.check_output(['hyprctl','activewindow','-j'])).get('address')
window=next(w for w in json.loads(subprocess.check_output(['hyprctl','clients','-j'])) if w['pid']==main[0])
subprocess.run(['hyprctl','eval','hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))'],check=True)
time.sleep(.25)
shortcut='hl.dispatch(hl.dsp.send_shortcut({mods="ALT",key="F4",window='+json.dumps('address:'+window['address'])+'}))'
subprocess.run(['hyprctl','eval',shortcut],check=True)
facts['quit']='Native File > Quit accelerator Alt+F4 sent to Freelens window'
for i in range(100):
    alive=[pid for pid in family if pathlib.Path('/proc',str(pid)).exists()]
    if not alive:break
    time.sleep(.1)
subprocess.run(['hyprctl','eval','hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+facts['activeWindowBefore'])+'}))'],check=True)
facts['remainingOriginalPids']=alive
assert not alive,alive
if len(sys.argv)>1 and sys.argv[1]=='quarantine':
    source=pathlib.Path.home()/'.freelens/extensions/freelens-readable-logs'
    target=root/f'.scratch/readable-logs/failed-install-{int(time.time())}'
    assert not (pathlib.Path.home()/'.config/Freelens/node_modules/freelens-readable-logs').exists()
    assert not target.exists()
    source.rename(target)
    facts['quarantinedFailedPackage']=str(target)
log=root/'.scratch/readable-logs/host.log'
temp_prefix=''
if 'same-filesystem-temp' in sys.argv:
    temp=pathlib.Path.home()/'.cache/freelens-readable-logs/tmp'
    temp.mkdir(parents=True,exist_ok=True)
    temp_prefix=f'env CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=100 TMPDIR={temp} '
    facts['processLocalPolling']={'CHOKIDAR_USEPOLLING':'1','CHOKIDAR_INTERVAL':'100'}
    facts['processLocalTMPDIR']=str(temp)
cmd=f'{temp_prefix}/usr/bin/freelens --remote-debugging-address=127.0.0.1 --remote-debugging-port=9235 >> {log} 2>&1'
subprocess.run(['hyprctl','eval',f'hl.exec_cmd({json.dumps(cmd)}, {{workspace="7 silent", no_initial_focus=true}})'],check=True)
for i in range(100):
    windows=json.loads(subprocess.check_output(['hyprctl','clients','-j']))
    window=next((w for w in windows if w['class']=='freelens'),None)
    if window:break
    time.sleep(.1)
assert window,'No Freelens window'
facts['newMainPid']=window['pid'];facts['newWindowWorkspace']=window['workspace']['id']
facts['activeWorkspaceAfter']=json.loads(subprocess.check_output(['hyprctl','activeworkspace','-j']))['id']
facts['activeWindowAfter']=json.loads(subprocess.check_output(['hyprctl','activewindow','-j'])).get('address')
(root/('docs/verification/17/normal-quit-reopen.json' if 'persistence' in sys.argv else 'docs/verification/17/fresh-maintenance.json')).write_text(json.dumps(facts,indent=2)+'\n')
print(json.dumps(facts,indent=2))
