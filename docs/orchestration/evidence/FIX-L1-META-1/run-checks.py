import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

application = Path('/home/baptiste/itrocks/showtime')
output = Path(__file__).resolve().parent
framework = 'node_modules/@itrocks/framework'
listing = 'node_modules/@itrocks/list'
recipe = 'node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs'
environment = dict(os.environ, PS_ENV_DIRECTORY='/tmp/property-select-FIX-L1-META-1', PS_APP_PORT='13629',
    PS_METADATA_URL='http://127.0.0.1:13629',
    PS_PLAYWRIGHT_MODULE='/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/'
        'node/node_modules/playwright/index.mjs')
groups = {
    'red': [
        ('feed-before-fix', ['node', '--test', '--test-isolation=none',
            str(application / listing / 'test/feed.test.mjs')])
    ],
    'core': [
        ('list-build', ['npm', '--prefix', listing, 'run', 'build']),
        ('list-test', ['npm', '--prefix', listing, 'test']),
        ('framework-build', ['npm', '--prefix', framework, 'run', 'build']),
        ('framework-test', ['npm', '--prefix', framework, 'test']),
        ('projection-test', ['node', '--test', '--test-isolation=none',
            str(application / framework / 'test/property-select.test.mjs')]),
        ('metadata-test', ['node', '--test', '--test-isolation=none',
            str(application / framework / 'test/property-select-metadata.test.mjs')]),
        ('application-build', ['npm', 'run', 'build'])
    ],
    'integration': [
        ('country', ['node', str(output / 'country.mjs')]),
        ('owned-status', ['node', recipe, 'status'])
    ],
    'focused': [
        ('feed-test', ['node', '--test', '--test-isolation=none',
            str(application / listing / 'test/feed.test.mjs')]),
        ('list-scopes-test', ['node', '--test', '--test-isolation=none',
            str(application / listing / 'test/list.test.mjs')])
    ],
    'browser': [('metadata-browser', ['node', framework + '/test/metadata-browser.mjs'])],
    'start': [('start', ['node', recipe, 'app'])],
    'stop': [('stop', ['node', recipe, 'stop-app'])]
}
environment['PS_FRAMEWORK_INITIALIZER'] = framework + '/test/metadata-fixture.cjs'
group = sys.argv[1]
records = []
for name, argv in groups[group]:
    result = subprocess.run(argv, cwd=application, env=environment, capture_output=True, text=True)
    destination = output / (name + ('.json' if name in ['country', 'metadata-browser'] else '.txt'))
    captured = result.stdout + result.stderr
    destination.write_text('\n'.join(line.rstrip() for line in captured.splitlines()) + '\n' if captured else '')
    records.append(dict(argv=argv, cwd=str(application), exit_code=result.returncode,
        environment={name: value for name, value in environment.items() if name.startswith('PS_')},
        output=destination.name, sha256=hashlib.sha256(destination.read_bytes()).hexdigest()))
    print(name, result.returncode, flush=True)
(output / ('commands-' + group + '.json')).write_text(json.dumps(records, indent=2) + '\n')
expected = 1 if group == 'red' else 0
if any(record['exit_code'] != expected for record in records):
    sys.exit(1)
