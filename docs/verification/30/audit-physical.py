"""Correlate final-package USB/native/DOM observations; never generates input."""
from pathlib import Path
import json

base=Path(__file__).resolve().parent
cases={'dirty':'02','clean':'01','confirmation':'01','disclosure':'01','logs':'01','dock':'01','host':'01'}
results=[]
for kind,number in cases.items():
    stem=f'physical-{kind}-{number}'
    required=[base/f'{stem}-{suffix}.json' for suffix in ['hardware','trace','desktop','state','state-restored']]
    if not all(p.exists() for p in required):
        continue
    hardware,trace,desktop,state,restored=[json.loads(p.read_text()) for p in required]
    events=hardware['events']
    assert hardware['physicalUsb'] and not hardware['injection'] and hardware['completePressRelease']
    assert [(e['code'],e['value']) for e in events]==[(275,1),(275,0)],stem
    assert not trace.get('failure') and not trace.get('cleanupFailure'),stem
    owner=trace['nativeBefore'];before=owner['historyIndex']
    assert owner['pid']==desktop['mainPid'] and owner['focused'] and owner['windowId']==owner['focusedWindowId'],stem
    assert any(x.get('version')=='0.1.33' for x in trace['before']),stem
    native=[r for r in trace['records'] if r.get('source')=='owning main process']
    assert len([r for r in native if r['type']=='app-command' and r.get('command')=='browser-backward'])==1,stem
    assert [r['mouse']['type'] for r in native if r['type']=='before-mouse-event' and r['mouse'].get('button')=='back']==['mouseDown','mouseUp'],stem
    releases=[r for r in trace['records'] if r.get('phase')=='after dispatch' and r['type'] in ['mouseup','auxclick']]
    assert len(releases)==2 and all(r['trusted'] and r['button']==3 for r in releases),stem
    navigation=[r for r in native if r['type']=='did-navigate-in-page']
    if kind in ['dirty','clean','confirmation','disclosure']:
        assert all(r['defaultPrevented'] for r in releases) and not navigation,stem
        assert all(r.get('historyIndex')==before for r in native),stem
        assert all(r['profiles']==(kind in ['confirmation','disclosure']) for r in releases),stem
        if kind=='clean':
            assert all(r['query']=='CV30 retained physical query' and r['selected']=='0' for r in releases),stem
        if kind=='confirmation':assert all(not r['confirmation'] for r in releases),stem
        if kind=='disclosure':assert all(not r['targetDetailsOpen'] for r in releases),stem
    else:
        assert not any(r['defaultPrevented'] for r in releases),stem
        assert len(navigation)==1 and navigation[0]['historyIndex']==before-1,stem
    assert trace['nativeAfter']['observerRemoved'] and trace['nativeAfter']['bindingRemoved'],stem
    assert all(x['observerRemoved'] and x['bindingRemoved'] for x in trace['after']),stem
    assert not desktop.get('failure') and not desktop.get('restorationFailure') and desktop['viewRestoreExitCode']==0,stem
    assert desktop['workspaceBefore']==desktop['workspaceAfter'] and desktop['focusBefore']==desktop['focusAfter'] and desktop['hostWorkspace']==7,stem
    assert all(abs(desktop['cursorBefore'][axis]-desktop['cursorAfter'][axis])<=2 for axis in ['x','y']),stem
    assert restored['originalConfigurationRestored'] and restored['probeRemoved'] and restored['profilesClosed'],stem
    results.append({'case':kind,'package':'0.1.33','passed':True,'physicalUsbPressRelease':True,
                    'localReleaseCanceled':kind in ['dirty','clean','confirmation','disclosure'],
                    'nativeHistorySteps':len(navigation),'owner':owner,'desktopRestored':True,
                    'physicalMotionDuringRestoration':desktop.get('physicalMotionDuringRestoration'),
                    'evidenceStem':stem})
output={'complete':len(results)==7,'results':results,'older32Dirty01':'failed; excluded from final passes'}
(base/'physical-summary.json').write_text(json.dumps(output,indent=2)+'\n')
print(f'{len(results)}/7 final-package physical cases correlated')
