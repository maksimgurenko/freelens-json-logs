"""Owned real-log/restart fixture for #48; all writes stay in its UID-checked namespace."""
from pathlib import Path
import json, os, subprocess

assert os.environ.get('FIND_HOST_TICKET') == '48'
root = Path(__file__).resolve().parents[2]
owner = json.loads((root / '.scratch/find/48-host/fixture.json').read_text())
base = ['kubectl', '--context', 'kind-freelens-json-logs-spike']
namespace = json.loads(subprocess.check_output(base + ['get', 'ns', owner['namespace'], '-o', 'json']))
assert namespace['metadata']['uid'] == owner['uid']
assert namespace['metadata']['labels']['find-verification'] == '48'
script = '''printf '%s\n' '{"message":"edge upstream","alternate":"pay\\u006dent"}' '{"message":"repeat upstream"}' '{"message":"middle"}' '{"message":"repeat upstream"}' '{"message":"end"}'
while [ ! -f /tmp/restart ]; do sleep 0.1; done
'''
pod = {'apiVersion': 'v1', 'kind': 'Pod', 'metadata': {
    'name': 'find-sequence', 'namespace': owner['namespace'], 'labels': {'find-verification': '48'}},
    'spec': {'containers': [{'name': 'app',
        'image': 'busybox:1.37.0@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e',
        'command': ['sh', '-c', script]}]}}
subprocess.run(base + ['create', '-f', '-'], input=json.dumps(pod), text=True, check=True)
subprocess.run(base + ['-n', owner['namespace'], 'wait', 'pod/find-sequence', '--for=condition=Ready', '--timeout=45s'], check=True)
record = json.loads(subprocess.check_output(base + ['-n', owner['namespace'], 'get', 'pod', 'find-sequence', '-o', 'json']))
run = os.environ['FIND_HOST_RUN']
assert run and all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)
path = root / '.scratch/verification/48/host' / run / 'sequence-fixture.json'
path.write_text(json.dumps({'namespace': owner['namespace'], 'namespaceUid': owner['uid'],
    'pod': 'find-sequence', 'podUid': record['metadata']['uid'], 'image': pod['spec']['containers'][0]['image']}, indent=2) + '\n')
print(path)
