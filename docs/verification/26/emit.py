"""Append only to the owned container's real stdout for selected-record eviction."""
import pathlib,subprocess,json
program='awk \'BEGIN {for(i=1001;i<=2000;i++) printf "{\\"message\\":\\"row %04d fields new output\\",\\"level\\":\\"info\\",\\"fields\\":\\"original fields\\"}\\n",i}\' > /proc/1/fd/1'
cmd=['kubectl','--context','kind-freelens-json-logs-spike','-n','readable-logs-ticket-26','exec','selection-copy','-c','selection','--','sh','-c',program]
r=subprocess.run(cmd,text=True,capture_output=True)
pathlib.Path(__file__).with_name('emit.json').write_text(json.dumps({'command':cmd,'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr},indent=2)+'\n')
assert r.returncode==0,r.stderr
