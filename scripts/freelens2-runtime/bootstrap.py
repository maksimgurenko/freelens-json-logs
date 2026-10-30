"""Install this experiment's checksum-pinned tools into its owned temporary prefix."""
from pathlib import Path
import base64
import hashlib
import json
import tarfile
import urllib.request

root = Path(__file__).resolve().parents[2]
record = json.loads((root / 'docs/research/freelens2-runtime/toolchain.json').read_text())
tools = Path('/tmp/freelens2-runtime-tools-57')
tools.mkdir(exist_ok=True)
node = tools / 'node-v24.22.1-linux-x64.tar.xz'
urllib.request.urlretrieve(record['nodeURL'], node)
assert hashlib.sha256(node.read_bytes()).hexdigest() == record['nodeSHA256']
with tarfile.open(node) as archive:
    archive.extractall(tools, filter='data')
pnpm = tools / 'pnpm.tgz'
urllib.request.urlretrieve(record['pnpmURL'], pnpm)
algorithm, expected = record['pnpmIntegrity'].split('-', 1)
assert base64.b64encode(hashlib.new(algorithm, pnpm.read_bytes()).digest()).decode() == expected
with tarfile.open(pnpm) as archive:
    archive.extractall(tools / 'pnpm', filter='data')
print(tools)
