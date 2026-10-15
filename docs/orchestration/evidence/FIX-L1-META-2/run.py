import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

app = Path('/home/baptiste/itrocks/showtime')
out = Path(__file__).resolve().parent
env = dict(os.environ, PS_ENV_DIRECTORY='/tmp/property-select-FIX-L1-META-2', PS_APP_PORT='13649',
    PS_METADATA_URL='http://127.0.0.1:13649',
    PS_FRAMEWORK_INITIALIZER='node_modules/@itrocks/property-select/docs/orchestration/evidence/'
        'FIX-L1-META-2/fixture.cjs',
    PS_PLAYWRIGHT_MODULE='/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/'
        'node/node_modules/playwright/index.mjs')
recipe = 'node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs'
owners = 'node_modules/@itrocks/'
groups = {
    'core': [
        ('list-build', ['npm', '--prefix', owners + 'list', 'run', 'build']),
        ('list-test', ['npm', '--prefix', owners + 'list', 'test']),
        ('framework-test', ['npm', '--prefix', owners + 'framework', 'test']),
        ('metadata', ['node', '--test', '--test-isolation=none',
            str(app / owners / 'framework/test/property-select-metadata.test.mjs')]),
        ('projection-relative', ['node', '--test', owners + 'framework/test/property-select.test.mjs']),
        ('projection', ['node', '--test', '--test-isolation=none',
            str(app / owners / 'framework/test/property-select.test.mjs')]),
        ('selector-test', ['npm', '--prefix', owners + 'property-select', 'test']),
        ('application-build', ['npm', 'run', 'build']),
    ],
    'start': [('start', ['node', recipe, 'app'])],
    'status': [('owned-status', ['node', recipe, 'status'])],
    'absolute-list': [('list-assertions', ['node', '--test', '--test-isolation=none',
        *[str(app / owners / 'list/test' / name) for name in
            ['columns.test.mjs', 'feed.test.mjs', 'list.test.mjs']]])],
    'focused': [(name, ['node', '--test', '--test-isolation=none',
        str(app / owners / 'list/test' / filename)]) for name, filename in
        [('feed-test', 'feed.test.mjs'), ('list-scopes-test', 'list.test.mjs')]],
    'defect': [('empty-columns-http', ['node', str(out / 'empty-columns.mjs')])],
    'stop': [('stop', ['node', recipe, 'stop-app'])],
    'browser': [('metadata-browser', ['node', str(out / 'browser.mjs')]),
        ('columns-browser', ['node', str(out / 'columns-browser.mjs')])]
}
group = sys.argv[1]
records = []
for name, argv in groups[group]:
    result = subprocess.run(argv, cwd=app, env=env, capture_output=True, text=True)
    path = out / (name + '.txt')
    path.write_text(result.stdout + result.stderr)
    records.append(dict(name=name, argv=argv, cwd=str(app), exit_code=result.returncode,
        environment={key: value for key, value in env.items() if key.startswith('PS_')},
        output=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    print(name, result.returncode, flush=True)
(out / ('commands-' + group + '.json')).write_text(json.dumps(records, indent=2) + '\n')
sys.exit(int(any(record['exit_code'] for record in records)))
