"""Run S06 owner validation using installed tools, with no application edits."""
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path.cwd()
evidence = Path(__file__).resolve().parent
owner = root / 'node_modules/@itrocks/sql-build'
commands = [
    ('sql-build-build', ['npm', '--prefix', str(owner), 'run', 'build'], root),
    ('sql-build-test', ['npm', '--prefix', str(owner), 'test'], root),
    ('sql-build-projection', ['node', '--test', '--test-isolation=none',
                              str(owner / 'test/property-select.test.mjs')], root),
    ('sql-build-pack', ['npm', 'pack', '--dry-run', '--json', '--offline'], owner)
]
results = []
for name, argv, cwd in commands:
    run = subprocess.run(argv, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         env={**os.environ, 'npm_config_cache': '/tmp/property-select/S06/npm-cache'})
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
