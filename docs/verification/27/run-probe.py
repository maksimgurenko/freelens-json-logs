import json,pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[3];ev=root/'docs/verification/27'
selector,name,*extra=sys.argv[1:];source=pathlib.Path(name) if '/' in name else ev/'probes'/(name+'.js');label=extra[0] if extra else source.stem
r=subprocess.run([str(root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node'),'scripts/host-cdp.mjs',selector,str(source)],cwd=root,text=True,capture_output=True)
(ev/(label+'.json')).write_text(r.stdout)
if r.returncode:print(r.stdout+r.stderr);sys.exit(r.returncode)
assert 'exceptionDetails' not in json.loads(r.stdout),r.stdout
print(label+': passed')
