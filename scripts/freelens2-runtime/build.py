"""Reproduce the pinned host build without changing its tracked source."""
from pathlib import Path
import json
import os
import subprocess
import sys
import time

SOURCE = Path('/home/max/work/freelens2')
TOOLS = Path('/tmp/freelens2-runtime-tools-57')
EVIDENCE = Path(__file__).resolve().parents[2] / 'docs/research/freelens2-runtime'
PIN = 'c02289f23422d9512544de3c506605296433e999'
assert subprocess.check_output(['git', '-C', str(SOURCE), 'rev-parse', 'HEAD'], text=True).strip() == PIN
assert not subprocess.check_output(['git', '-C', str(SOURCE), 'status', '--porcelain', '--untracked-files=no'])
bin_dir = TOOLS / 'bin'
bin_dir.mkdir(exist_ok=True)
pnpm = bin_dir / 'pnpm'
if pnpm.is_symlink():
    pnpm.unlink()
pnpm.write_text('#!/bin/sh\nexec "' + str(TOOLS / 'node-v24.22.1-linux-x64/bin/node') +
                '" "' + str(TOOLS / 'pnpm/package/bin/pnpm.mjs') + '" "$@"\n')
pnpm.chmod(0o755)
env = dict(os.environ, PATH=f'{TOOLS}/node-v24.22.1-linux-x64/bin:{bin_dir}:' + os.environ['PATH'],
           TURBO_CONCURRENCY='2', NODE_OPTIONS='--max-old-space-size=4096', CI='true')
assert subprocess.check_output(['node', '--version'], env=env, text=True).strip() == 'v24.22.1'
assert subprocess.check_output(['pnpm', '--version'], env=env, cwd=SOURCE, text=True).strip() == '12.15.0'
steps = {
    'install': ['pnpm', 'install', '--frozen-lockfile'],
    'di': ['pnpm', 'build:di'],
    'build': ['pnpm', 'build'],
    'package': ['pnpm', 'build:app:dir'],
}
for name in sys.argv[1:] or steps:
    command = steps[name]
    started = time.time()
    print(json.dumps({'step': name, 'command': command, 'started': started}), flush=True)
    with (EVIDENCE / f'{name}.log').open('w') as output:
        completed = subprocess.run(command, cwd=SOURCE, env=env, stdout=output, stderr=subprocess.STDOUT)
    status = subprocess.check_output(['git', '-C', str(SOURCE), 'status', '--porcelain', '--untracked-files=no'], text=True)
    result = {'step': name, 'command': command, 'cwd': str(SOURCE), 'exit': completed.returncode,
              'seconds': time.time() - started, 'trackedStatus': status}
    (EVIDENCE / f'{name}.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result), flush=True)
    if completed.returncode or status:
        print((EVIDENCE / f'{name}.log').read_text()[-7000:], flush=True)
        raise SystemExit(completed.returncode or 2)
