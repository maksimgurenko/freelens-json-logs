"""Owned source/geometry fixture for #48's real installed renderer checks."""
from pathlib import Path
import json, os, subprocess

assert os.environ.get('FIND_HOST_TICKET') == '48'
run = os.environ['FIND_HOST_RUN']
assert run and all(c in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in run)
root = Path(__file__).resolve().parents[2]
owner = json.loads((root / '.scratch/find/48-host/fixture.json').read_text())
base = ['kubectl', '--context', 'kind-freelens-json-logs-spike']
namespace = json.loads(subprocess.check_output(base + ['get', 'ns', owner['namespace'], '-o', 'json']))
assert namespace['metadata']['uid'] == owner['uid']
assert namespace['metadata']['labels']['find-verification'] == '48'
rows = [{'message': f'needle {i}' if i in (0, 120) else f'ordinary {i}'} for i in range(180)]
rows[10] = {'message': 'long ' * 4000, 'hidden': 'presentation growth'}
rows[64] = {'message': 'visible', 'secret': 'needle'}
rows[160] = {'message': '😀' * 257}
rows[161] = {'message': 'first\nsecond\rthird\u2028fourth\u2029fifth'}
rows[162] = {'message': 'Σ decoded', 'other': 'Σ needle'}
lines = [json.dumps(row, ensure_ascii=True) for row in rows]
script = "cat <<'FIND_SURFACES'\n" + '\n'.join(lines) + "\nFIND_SURFACES\nsleep 86400"
image = 'busybox:1.37.0@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e'
pod = {'apiVersion': 'v1', 'kind': 'Pod', 'metadata': {
    'name': 'find-surfaces', 'namespace': owner['namespace'], 'labels': {'find-verification': '48'}},
    'spec': {'containers': [{'name': 'app', 'image': image, 'command': ['sh', '-c', script]}]}}
subprocess.run(base + ['create', '-f', '-'], input=json.dumps(pod), text=True, check=True)
subprocess.run(base + ['-n', owner['namespace'], 'wait', 'pod/find-surfaces', '--for=condition=Ready', '--timeout=45s'], check=True)
record = json.loads(subprocess.check_output(base + ['-n', owner['namespace'], 'get', 'pod', 'find-surfaces', '-o', 'json']))
path = root / '.scratch/verification/48/host' / run / 'surface-fixture.json'
path.write_text(json.dumps({'namespace': owner['namespace'], 'namespaceUid': owner['uid'],
    'pod': 'find-surfaces', 'podUid': record['metadata']['uid'], 'image': image, 'records': len(rows)}, indent=2) + '\n')
print(path)
