"""Own isolated #48 Kubernetes fixtures; never change the shared spike fixtures."""
from pathlib import Path
import json, subprocess, sys, os
assert os.environ.get('FIND_HOST_TICKET') == '48'
run = os.environ.get('FIND_HOST_RUN', '')
assert not run or all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)
root = Path(__file__).resolve().parents[2]
evidence = root / '.scratch/verification/48/host' / run
evidence.mkdir(parents=True, exist_ok=True)
state = root / '.scratch/find/48-host/fixture.json'
base = ['kubectl', '--context', 'kind-freelens-json-logs-spike']
if sys.argv[1:] == ['delete']:
    record = json.loads(state.read_text())
    current = json.loads(subprocess.check_output(base + ['get', 'ns', record['namespace'], '-o', 'json']))
    assert current['metadata']['uid'] == record['uid']
    assert current['metadata']['labels']['find-verification'] == '48'
    subprocess.run(base + ['delete', 'ns', record['namespace'], '--wait=true', '--timeout=45s'], check=True)
    state.unlink()
    raise SystemExit
assert not state.exists(), 'Do not overwrite an existing fixture owner'
ns = 'find-verification-48-' + str(os.getpid())
namespace = {'apiVersion':'v1','kind':'Namespace','metadata':{'name':ns,'labels':{'find-verification':'48'}}}
subprocess.run(base + ['create','-f','-'],input=json.dumps(namespace),text=True,check=True)
uid = json.loads(subprocess.check_output(base + ['get','ns',ns,'-o','json']))['metadata']['uid']
state.write_text(json.dumps({'namespace':ns,'uid':uid},indent=2)+'\n')
lines=[]
for i in range(120):
    message = f'row {i}' + (' upstream' if i in (2,73,82,90) else '')
    row={'message':message,'index':i}
    if i == 10: row['secret']='needle'
    if i == 11: row['message']='decoded Σ payment'
    lines.append(json.dumps(row,ensure_ascii=True))
trace = "cat <<'FIND_FIXTURE'\n" + '\n'.join(lines).replace('payment','pay\\u006dent') + "\nFIND_FIXTURE\nsleep 86400"
dense = "awk 'BEGIN{s=\"\";for(j=0;j<2400;j++)s=s\"a \";for(i=0;i<1000;i++)print s}' ; sleep 86400"
long = "head -c 5242750 /dev/zero | tr '\\000' x; printf ' Q\\n'; sleep 86400"
image='busybox:1.37.0@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e'
pod={'apiVersion':'v1','kind':'Pod','metadata':{'name':'find-fixtures','namespace':ns,'labels':{'find-verification':'48'}},'spec':{'containers':[{'name':name,'image':image,'command':['sh','-c',script]} for name,script in [('traces',trace),('dense',dense),('long',long)]]}}
subprocess.run(base + ['create','-f','-'],input=json.dumps(pod),text=True,check=True)
subprocess.run(base + ['-n',ns,'wait','pod/find-fixtures','--for=condition=Ready','--timeout=60s'],check=True)
result=json.loads(subprocess.check_output(base + ['-n',ns,'get','pod','find-fixtures','-o','json']))
(evidence/'fixture.json').write_text(json.dumps({'namespace':ns,'namespaceUid':uid,'podUid':result['metadata']['uid'],'image':image,'containers':result['status']['containerStatuses']},indent=2)+'\n')
print(ns)
