"""Read-only background input guards; preserve the real desktop even on failure."""
import json,os,pathlib,subprocess,sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from desktop import read,restore,root,node,ev
workspace=read('hyprctl','activeworkspace','-j')['id'];focus=read('hyprctl','activewindow','-j').get('address')
try:
 result=subprocess.run([str(node),str(ev/'inactive.mjs')],cwd=root,capture_output=True,text=True)
 assert result.returncode==0,result.stdout+result.stderr
finally:
 restore(focus,workspace)
 facts={'workspaceBefore':workspace,'focusBefore':focus,'workspaceAfter':read('hyprctl','activeworkspace','-j')['id'],'focusAfter':read('hyprctl','activewindow','-j').get('address')}
 (ev/'inactive-desktop.json').write_text(json.dumps(facts,indent=2)+'\n')
 assert facts['workspaceBefore']==facts['workspaceAfter'] and facts['focusBefore']==facts['focusAfter'],facts
