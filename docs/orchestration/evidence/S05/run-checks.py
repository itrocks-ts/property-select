"""Run S05 owner checks from the showtime test bench without changing its files."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd()
evidence = Path(__file__).resolve().parent
owners = root / 'node_modules/@itrocks'
commands = [
    ('sql-join-build', ['npm', '--prefix', str(owners / 'sql-join'), 'run', 'build'], root),
    ('sql-join-test', ['npm', '--prefix', str(owners / 'sql-join'), 'test'], root),
    ('sql-join-projection', ['node', '--test', '--test-isolation=none',
                           str(owners / 'sql-join/test/property-select.test.mjs')], root),
    ('framework-build', ['npm', '--prefix', str(owners / 'framework'), 'run', 'build'], root),
    ('framework-test', ['npm', '--prefix', str(owners / 'framework'), 'test'], root),
    ('framework-projection', ['node', '--test', '--test-isolation=none',
                             str(owners / 'framework/test/property-select.test.mjs')], root),
    ('sql-build-compatibility', ['npm', '--prefix', str(owners / 'sql-build'), 'test'], root),
    ('sql-join-pack', ['npm', 'pack', '--dry-run', '--json', '--offline'], owners / 'sql-join'),
    ('framework-pack', ['npm', 'pack', '--dry-run', '--json', '--offline'], owners / 'framework')
]
results = []
for name, argv, cwd in commands:
    run = subprocess.run(argv, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         env={**os.environ, 'npm_config_cache': '/tmp/property-select/S05/npm-cache'})
    filename = name + '.txt'
    output = run.stdout.rstrip() + b'\n'
    (evidence / filename).write_bytes(output)
    results.append(dict(argv=argv, cwd=str(cwd), exit_code=run.returncode, output=filename,
                        sha256=hashlib.sha256(output).hexdigest(),
                        raw_sha256=hashlib.sha256(run.stdout).hexdigest()))
    (evidence / 'commands.json').write_text(json.dumps(results, indent=2) + '\n')
    print(name, 'PASS' if run.returncode == 0 else 'FAIL', flush=True)
    if run.returncode:
        print(run.stdout.decode(), flush=True)
        raise SystemExit(run.returncode)
