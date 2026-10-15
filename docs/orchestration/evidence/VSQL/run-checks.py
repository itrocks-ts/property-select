"""Rebuild delivered public owners and run the independent synthetic VSQL gate."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd()
output = Path(__file__).resolve().parent
owners = root / 'node_modules/@itrocks'
environment = output.parent.parent / 'environment'
commands = []
for owner in ['storage', 'reflect', 'reflect-path', 'sql-join', 'sql-build', 'mysql', 'framework', 'mysql-maintainer']:
    commands.append((owner + '-build', ['npm', '--prefix', str(owners / owner), 'run', 'build'], root))
commands += [
    ('model-build', ['node', 'node_modules/.bin/tsc', '-p', str(environment / 'models/tsconfig.json')], root),
    ('syntax', ['node', '--check', str(environment / 'checks/VSQL.mjs')], root),
    ('VSQL', ['node', str(environment / 'checks/VSQL.mjs')], root),
    ('queries', ['node', str(environment / 'control.mjs'), 'queries'], root),
    ('status', ['node', str(environment / 'control.mjs'), 'status'], root)
]
for owner in ['mysql', 'framework', 'mysql-maintainer', 'property-select']:
    commands.append((owner + '-pack', ['npm', 'pack', '--dry-run', '--json', '--offline'], owners / owner))
records = []
for name, argv, cwd in commands:
    run = subprocess.run(argv, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         env={**os.environ, 'PS_APP_PORT': '13319',
                              'npm_config_cache': '/tmp/property-select/VSQL/npm-cache'})
    data = run.stdout.rstrip() + b'\n'
    (output / (name + '.txt')).write_bytes(data)
    records.append(dict(argv=argv, cwd=str(cwd), exit_code=run.returncode, output=name + '.txt',
                        sha256=hashlib.sha256(data).hexdigest()))
    (output / 'commands.json').write_text(json.dumps(records, indent=2) + '\n')
    print(name, 'PASS' if run.returncode == 0 else 'FAIL', flush=True)
    if run.returncode:
        print(data.decode(), flush=True)
        raise SystemExit(run.returncode)
