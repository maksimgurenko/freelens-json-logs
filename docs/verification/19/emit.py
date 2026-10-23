"""Append fixture records through the actual container stdout FD, never responses."""
import subprocess,sys,json,pathlib
start,end=map(int,sys.argv[1:]);program='awk \'BEGIN {for(i='+str(start)+';i<='+str(end)+';i++) printf "{\\"message\\":\\"row %04d\\",\\"level\\":\\"info\\",\\"hidden\\":\\"Private.Needle[0] α🙂\\",\\"nested\\":{\\"ok\\":true}}\\n",i}\' > /proc/1/fd/1'
cmd=['kubectl','--context','kind-freelens-json-logs-spike','-n','readable-logs-ticket-19','exec','release','-c','bounded','--','sh','-c',program]
r=subprocess.run(cmd,text=True,capture_output=True);pathlib.Path(__file__).with_name(f'emit-{start}-{end}.json').write_text(json.dumps({'command':cmd,'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr},ensure_ascii=False,indent=2)+'\n');assert r.returncode==0,r.stderr
