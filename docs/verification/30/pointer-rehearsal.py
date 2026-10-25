"""Unarmed/no-Back rehearsal of the physical recorder's exact desktop restore."""
import importlib.util
import json
from pathlib import Path
import time
root=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('guided',Path(__file__).with_name('guided-trace.py'))
guided=importlib.util.module_from_spec(spec);spec.loader.exec_module(guided)
assert not (root/'.ralph/physical-back-armed.json').exists()
results=[]
for index in range(5):
    workspace=guided.read('hyprctl','activeworkspace','-j')['id']
    focus=guided.read('hyprctl','activewindow','-j').get('address')
    cursor=guided.read('hyprctl','cursorpos','-j')
    window=next(w for w in guided.read('hyprctl','clients','-j') if w['class']=='freelens')
    result={'index':index,'workspaceBefore':workspace,'focusBefore':focus,'cursorBefore':cursor,'armed':False,'BackInjected':False}
    try:
        guided.dispatch('hl.dispatch(hl.dsp.focus({window='+json.dumps('address:'+window['address'])+'}))')
        guided.move_pointer({'x':window['at'][0]+450,'y':window['at'][1]+350})
    finally:
        motion=guided.PhysicalMotion()
        try:
            guided.restore(focus,workspace)
            result['pointerRestoration']=guided.move_pointer(cursor)
            if guided.read('hyprctl','activewindow','-j').get('address')!=focus:
                guided.restore(focus,workspace)
            time.sleep(.08)
        finally:
            result['physicalMotionDuringRestoration']=motion.finish()
        result.update(workspaceAfter=guided.read('hyprctl','activeworkspace','-j')['id'],focusAfter=guided.read('hyprctl','activewindow','-j').get('address'),cursorAfter=guided.read('hyprctl','cursorpos','-j'))
        result['passed']=result['workspaceAfter']==workspace and result['focusAfter']==focus and all(abs(result['cursorAfter'][axis]-cursor[axis])<=2 for axis in ['x','y'])
        results.append(result)
        (root/'docs/verification/30/pointer-rehearsal.json').write_text(json.dumps({'results':results,'armed':False,'noBackInput':True},indent=2)+'\n')
        assert result['passed'],result
print('5 unarmed pointer/workspace/focus rehearsals passed')
