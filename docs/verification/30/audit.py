"""Final read-only audit; preserve unknown newer clipboard data, never rewind it."""
from pathlib import Path
import hashlib,json,subprocess
base=Path(__file__).resolve().parent
root=base.parents[2]
original=json.loads((root/'.scratch/compact-view/30/original-settings.json').read_text())
current=json.loads((Path.home()/'.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json').read_text())
original.pop('__internal__',None);internal=current.pop('__internal__',None)
assert current==original
pods=json.loads(subprocess.check_output(['kubectl','-n','readable-logs-spike','get','pods','-o','json']))
shared=[{'name':p['metadata']['name'],'uid':p['metadata']['uid'],'containers':[{'name':c['name'],'restartCount':c['restartCount']} for c in p['status'].get('containerStatuses',[])]} for p in pods['items']]
assert shared==json.loads((base/'shared-before.json').read_text())
(base/'shared-preserved.json').write_text(json.dumps(shared,indent=2)+'\n')
namespace=subprocess.run(['kubectl','get','namespace','readable-logs-ticket-30'],capture_output=True,text=True)
assert namespace.returncode!=0 and 'NotFound' in namespace.stderr
final=json.loads((base/'final-identity.json').read_text())['result']['value']
baseline=json.loads((base/'baseline.json').read_text())['result']['value']
view=final['view']
assert final['manifest']['version']=='0.1.33' and all(x['installed']==x['source'] for x in final['files'])
assert view['paused'] and view['rows']>0 and view['selected'] is None and view['query']=='' and not view['profiles'] and not view['existingTestHelpers']
assert view['dockTabs']==baseline['view']['dockTabs']
clipboard={}
for mode in ['readable','raw']:
    for layout in ['inline','side','bottom']:
        name='gesture-'+mode+'-'+layout
        result=json.loads((base/(name+'.json')).read_text())
        assert result['passed']
        restored=result['clipboardRestored']
        assert restored['formats'] and restored['buffers'] and restored['pixels']
        clipboard[name]=restored
editing=json.loads((base/'editing.json').read_text())
assert editing['clipboardSaved']['buffers']==editing['clipboardRestored']['restoredBuffers']
devices=json.loads(subprocess.check_output(['hyprctl','devices','-j']))
assert not any('readable-logs-ticket-' in d.get('name','') for group in devices.values() if isinstance(group,list) for d in group if isinstance(d,dict))
rows=subprocess.check_output(['ps','-eo','pid=,args='],text=True).splitlines()
assert not any(len(p:=row.strip().split(None,1))==2 and Path(p[1].split()[0]).name in ['ime-driver','ime-registry'] for row in rows)
physical=json.loads((base/'physical-summary.json').read_text())
assert physical['complete'] and len(physical['results'])==7
assert not (root/'.ralph/physical-back-armed.json').exists()
dock=json.loads((base/'final-dock-audit.json').read_text())['result']['value']
assert dock['dock']['height']==300 and dock['dock']['isOpen'] and not dock['dock']['fullSize'] and not dock['anchor']['bodyResizing']
report={'originalApplicationConfigurationRestored':True,'hostMigrationMetadata':internal,'ownedNamespaceAbsent':True,'sharedPodsUnchanged':True,'dockTabsUnchanged':True,'dockGeometry':dock,'physicalSummaryComplete':True,'physicalRecorderUnarmed':True,'ownedInputDevicesAbsent':True,'ownedImeProcessAbsent':True,'perGestureClipboardRestored':clipboard,'editingPerProbeClipboardBuffersIdentical':True,'taskClipboardBaselineDiffers':baseline['clipboard']!=final['clipboard'],'clipboardPolicy':'Immediate per-probe snapshots restored only while ownership is established; newer unknown content is preserved, never rewound to task baseline.','finalView':view}
(base/'cleanup.json').write_text(json.dumps(report,indent=2)+'\n')
files=['package.json','package-lock.json','docs/local-development.md',*sorted(str(p.relative_to(root)) for p in (root/'src').rglob('*') if p.is_file()),'tests/local-back.test.ts']
(base/'source-identity.json').write_text(json.dumps({p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files},indent=2)+'\n')
print('Final configuration, per-probe clipboard, input helpers, dock and fixture preservation: passed')
