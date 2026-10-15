"""Reproduce S07 validation from the showtime test bench with installed tools only."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd()
evidence = Path(__file__).resolve().parent
owners = root / 'node_modules/@itrocks'
environment = evidence.parent.parent / 'environment'
commands = []
for owner in ['mysql', 'mysql-maintainer', 'framework']:
    commands.append((f'{owner}-build', ['npm', '--prefix', str(owners / owner), 'run', 'build'], root))
commands += [
    ('model-build', ['node', 'node_modules/.bin/tsc', '-p', str(environment / 'models/tsconfig.json')], root),
    ('mysql-test', ['node', '--test', '--test-isolation=none',
                    str(owners / 'mysql/test/property-select.test.mjs')], root),
    ('framework-test', ['npm', '--prefix', str(owners / 'framework'), 'test'], root),
    ('framework-projection', ['node', '--test', '--test-isolation=none',
                              str(owners / 'framework/test/property-select.test.mjs')], root),
    ('maintainer-test', ['npm', '--prefix', str(owners / 'mysql-maintainer'), 'test'], root),
    ('maintainer-projection', ['node', '--test', '--test-isolation=none',
                               str(owners / 'mysql-maintainer/test/property-select.test.mjs')], root),
    ('application-build', ['npm', 'run', 'build'], root),
    ('database-reset', ['node', str(environment / 'control.mjs'), 'reset'], root),
    ('database-smoke', ['node', str(environment / 'database-smoke.mjs')], root),
    ('database-projection', ['node', str(environment / 'checks/S07.mjs')], root)
]
for owner in ['mysql', 'mysql-maintainer', 'framework']:
    commands.append((f'{owner}-pack', ['npm', 'pack', '--dry-run', '--json', '--offline'], owners / owner))
results = []
for name, argv, cwd in commands:
    run = subprocess.run(argv, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         env={**os.environ, 'npm_config_cache': '/tmp/property-select/S07/npm-cache'})
    filename = name + '.txt'
    output = run.stdout.rstrip() + b'\n'
    (evidence / filename).write_bytes(output)
    results.append(dict(argv=argv, cwd=str(cwd), exit_code=run.returncode, output=filename,
                        sha256=hashlib.sha256(output).hexdigest()))
    (evidence / 'commands.json').write_text(json.dumps(results, indent=2) + '\n')
    print(name, 'PASS' if run.returncode == 0 else 'FAIL', flush=True)
    if run.returncode:
        print(run.stdout.decode(), flush=True)
        raise SystemExit(run.returncode)
