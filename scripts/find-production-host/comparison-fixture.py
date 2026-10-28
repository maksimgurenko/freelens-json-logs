"""Continuously emitting, UID-owned Pod used by both resource comparison runs."""
from pathlib import Path
import json, os, subprocess, sys
root = Path(__file__).resolve().parents[2]
assert os.environ.get('FIND_HOST_TICKET') == '48'
run = os.environ['FIND_HOST_RUN']
assert run and all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)
evidence = root / 'docs/verification/48/host' / run
evidence.mkdir(parents=True, exist_ok=True)
state = root / '.scratch/find/48-host/comparison-fixture.json'
base = ['kubectl', '--context', 'kind-freelens-json-logs-spike']
if sys.argv[1:] == ['delete']:
    record = json.loads(state.read_text())
    current = json.loads(subprocess.check_output(base + ['get', 'ns', record['namespace'], '-o', 'json']))
    assert current['metadata']['uid'] == record['namespaceUid']
    assert current['metadata']['labels']['find-comparison'] == '48'
    subprocess.run(base + ['delete', 'ns', record['namespace'], '--wait=true', '--timeout=45s'], check=True)
    state.unlink()
    raise SystemExit
assert not state.exists(), 'Do not overwrite fixture ownership'
ns = 'find-comparison-48-' + str(os.getpid())
namespace = {'apiVersion': 'v1', 'kind': 'Namespace', 'metadata': {'name': ns, 'labels': {'find-comparison': '48'}}}
subprocess.run(base + ['create', '-f', '-'], input=json.dumps(namespace), text=True, check=True)
uid = json.loads(subprocess.check_output(base + ['get', 'ns', ns, '-o', 'json']))['metadata']['uid']
record = {'namespace': ns, 'namespaceUid': uid, 'pod': 'comparison-active', 'container': 'active'}
state.write_text(json.dumps(record, indent=2) + '\n')
image = 'busybox:1.37.0@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e'
script = '''i=0
while [ "$i" -lt 1000 ]; do
  printf '{"message":"comparison sequence %s","sequence":%s,"level":"info"}\\n' "$i" "$i"
  i=$((i+1))
done
while true; do
  printf '{"message":"comparison sequence %s","sequence":%s,"level":"info"}\\n' "$i" "$i"
  i=$((i+1))
  sleep 0.1
done'''
pod = {'apiVersion': 'v1', 'kind': 'Pod', 'metadata': {'name': record['pod'], 'namespace': ns, 'labels': {'find-comparison': '48'}}, 'spec': {'containers': [{'name': 'active', 'image': image, 'command': ['sh', '-c', script]}]}}
subprocess.run(base + ['create', '-f', '-'], input=json.dumps(pod), text=True, check=True)
subprocess.run(base + ['-n', ns, 'wait', 'pod/' + record['pod'], '--for=condition=Ready', '--timeout=60s'], check=True)
current = json.loads(subprocess.check_output(base + ['-n', ns, 'get', 'pod', record['pod'], '-o', 'json']))
record.update(podUid=current['metadata']['uid'], image=image, ratePerSecond=10, prefilledLines=1000)
state.write_text(json.dumps(record, indent=2) + '\n')
(evidence / 'fixture.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record))
