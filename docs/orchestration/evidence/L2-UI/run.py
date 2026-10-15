import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

app = Path('/home/baptiste/itrocks/showtime')
out = Path(__file__).resolve().parent
owner = app / 'node_modules/@itrocks/property-select'
recipe = owner / 'docs/orchestration/environment/control.mjs'
env = dict(os.environ, PS_ENV_DIRECTORY='/tmp/property-select-L2-UI', PS_STANDALONE_PORT='13720',
    PS_UI_OUTPUT=str(out), PS_UI_URL='http://127.0.0.1:13720',
    PS_PLAYWRIGHT_MODULE='/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')
groups = {
    'review': [('review', ['python3', str(out / 'review.py')])],
    'core': [('build', ['npm', '--prefix', str(owner), 'run', 'build']),
        ('test', ['npm', '--prefix', str(owner), 'test'])],
    'pack': [('pack', ['npm', '--cache', '/tmp/property-select/L2-UI/cache', 'pack', '--dry-run',
        '--offline', '--ignore-scripts', '--json', str(owner)])],
    'start': [('start', ['node', str(recipe), 'standalone'])],
    'stop': [('stop', ['node', str(recipe), 'stop-standalone'])],
    'browser': [('browser', ['node', str(owner / 'test/browser-ui.mjs')])],
    'preflight': [('preflight', ['python3', str(out / 'preflight.py')])],
    'status': [('owned-status', ['node', str(out / 'status.mjs')])]
}
records = []
for name, argv in groups[sys.argv[1]]:
    result = subprocess.run(argv, cwd=app, env=env, capture_output=True)
    raw = result.stdout + result.stderr
    saved = raw.rstrip() + b'\n' if raw else raw
    if saved != raw:
        (out / (name + '.raw.gz')).write_bytes(gzip.compress(raw, mtime=0))
    (out / (name + '.txt')).write_bytes(saved)
    records.append(dict(argv=argv, cwd=str(app), environment={k:v for k,v in env.items() if k.startswith('PS_')},
        exit_code=result.returncode, output=name+'.txt', sha256=hashlib.sha256(saved).hexdigest(), raw_sha256=hashlib.sha256(raw).hexdigest()))
    print(name, result.returncode, flush=True)
(out / ('commands-' + sys.argv[1] + '.json')).write_text(json.dumps(records, indent=2) + '\n')
sys.exit(int(any(record['exit_code'] for record in records)))
