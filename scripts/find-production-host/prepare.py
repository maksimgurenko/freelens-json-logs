"""Prepare #42's disposable display packages/profile, without global installs."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import tempfile

ticket = os.environ.get('FIND_HOST_TICKET', '42')
assert ticket in ('42', '48')

root = Path(__file__).resolve().parents[2]
scratch = root / f'.scratch/find/{ticket}-host'
scratch.mkdir(parents=True, exist_ok=True)
pid = scratch / 'host-pid'
if pid.exists() and Path('/proc/' + pid.read_text()).exists():
    raise SystemExit('Stop the previous owned host before preparing another profile')
prefix = scratch / 'prefix'
prefix.mkdir(exist_ok=True)
records = json.loads((root / 'scripts/find-production-host/display-packages.json').read_text())
for record in records:
    package = scratch / record['url'].rsplit('/', 1)[1]
    if not package.exists():
        subprocess.run(['curl', '-fsSL', '--max-time', '40', record['url'], '-o', str(package)], check=True)
    assert hashlib.sha256(package.read_bytes()).hexdigest() == record['sha256']
    subprocess.run(['bsdtar', '-xf', str(package), '-C', str(prefix)], check=True)
integration = Path(tempfile.mkdtemp(prefix=f'freelens-production-find-{ticket}-'))
(scratch / 'integration-path').write_text(str(integration))
profile = integration / 'Freelens'
kubeconfigs = profile / 'kubeconfigs'
kubeconfigs.mkdir(parents=True)
(profile / 'home/.freelens/extensions').mkdir(parents=True)
(profile / 'lens-user-store.json').write_text(json.dumps({'preferences': {
    'syncKubeconfigEntries': [], 'allowErrorReporting': False, 'downloadKubectlBinaries': False}}))
(profile / 'package.json').write_text(json.dumps({
    'name': 'find-production-isolated-profile', 'version': '0.0.0', 'private': True}))
with (kubeconfigs / 'fixture.yaml').open('w') as output:
    subprocess.run(['kubectl', '--context', 'kind-freelens-json-logs-spike',
                    'config', 'view', '--minify', '--raw'], stdout=output, check=True)
os.chmod(kubeconfigs / 'fixture.yaml', 0o600)
print(json.dumps({'profile': str(profile), 'packages': records}))
