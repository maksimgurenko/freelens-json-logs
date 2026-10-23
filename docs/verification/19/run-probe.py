import json,pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[3]
selector,name=sys.argv[1:3]
output=root/'docs/verification/19'/((sys.argv[3] if len(sys.argv)>3 else name)+'.json')
result=subprocess.run([str(root/'.scratch/readable-logs/toolchain/node_modules/node/bin/node'), 'scripts/host-cdp.mjs',selector,str(root/'docs/verification/19/probes'/(name+'.js'))],cwd=root,text=True,capture_output=True)
output.write_text(result.stdout)
if result.returncode: print(result.stdout+result.stderr);sys.exit(result.returncode)
assert 'exceptionDetails' not in json.loads(result.stdout),result.stdout
print(output.name+': passed')
