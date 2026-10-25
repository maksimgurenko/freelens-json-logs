"""Audit only owned changes; never restore newer clipboard content to a task baseline."""
from pathlib import Path
import hashlib,json,subprocess
base=Path('docs/verification/29')
original=json.loads(Path('.scratch/compact-view/29/original-settings.json').read_text())
current=json.loads((Path.home()/'.config/Freelens/extension-store/freelens-readable-logs/readable-logs.json').read_text())
original.pop('__internal__',None);internal=current.pop('__internal__',None)
assert current==original
initial=json.loads((base/'early-0.1.29/identity.json').read_text())['result']['value']
final=json.loads((base/'final-identity.json').read_text())['result']['value']
probe=json.loads((base/'editing.json').read_text())
assert probe['clipboardSaved']['buffers']==probe['clipboardRestored']['restoredBuffers']
assert initial['view']['dockTabs']==final['view']['dockTabs']
assert final['view']['paused'] and final['view']['rows']>0 and final['view']['selected'] is None and final['view']['query']=='' and not final['view']['profiles'] and not final['view']['existingTestHelpers']
pods=json.loads(subprocess.check_output(['kubectl','-n','readable-logs-spike','get','pods','-o','json']))
shared=[{'name':x['metadata']['name'],'uid':x['metadata']['uid'],'containers':[{'name':c['name'],'restartCount':c['restartCount']} for c in x['status'].get('containerStatuses',[])]} for x in pods['items']]
assert shared==json.loads((base/'shared-before.json').read_text())
assert not any('readable-logs-ticket-29' in x.get('name','') for x in json.loads(subprocess.check_output(['hyprctl','devices','-j']))['keyboards'])
clipboard={'taskBaselineDiffers':initial['clipboard']!=final['clipboard'],'baseline':initial['clipboard'],'final':final['clipboard'],'perProbeOriginalAndRestoredBuffersEqual':True,'newerContentPreserved':True,'attribution':'Newer content has no known owned marker and matches neither the copy/paste sentinel nor the native fixture selection. No agent-caused mutation is established by the task-baseline mismatch. Left untouched under supervisor guidance.'}
(base/'cleanup.json').write_text(json.dumps({'originalConfigurationRestored':True,'hostMigrationMetadata':internal,'clipboard':clipboard,'dockTabsUnchanged':True,'sharedPodsUnchanged':True,'ownedVirtualKeyboardAbsent':True,'finalView':final['view']},indent=2)+'\n')
(base/'shared-preserved.json').write_text(json.dumps(shared,indent=2)+'\n')
files=['package.json','package-lock.json','docs/local-development.md',*sorted(str(p) for p in Path('src').rglob('*') if p.is_file()),'tests/shortcuts.test.ts']
(base/'source-identity.json').write_text(json.dumps({f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in files},indent=2)+'\n')
platform={'linux':{'os':'Arch Linux / Hyprland / Wayland','host':final['host'],'electron':final['electron'],'chromium':final['chromium'],'keyboard':'OS-injected temporary uinput keyboard; trusted Chromium editing/variants; no physical keyboard claim','nonUS':'Russian layout on the owned virtual device; actual key а with code KeyF, Ctrl=true; device removed afterward','AltGraph':'Supplemental DOM and parameterized unit checks; OS AltGraph unverified','IME':'No ibus/fcitx command or running process available; OS IME unverified; supplemental composition guards pass'},'Windows':'Unavailable and unverified; Ctrl parser tests do not establish Windows OS behavior','macOS':'Unavailable and unverified; Cmd parser tests do not establish macOS OS behavior'}
(base/'platforms.json').write_text(json.dumps(platform,ensure_ascii=False,indent=2)+'\n')
print('Configuration, per-probe clipboard preservation, dock, shared fixtures and device cleanup: passed; newer clipboard retained')
