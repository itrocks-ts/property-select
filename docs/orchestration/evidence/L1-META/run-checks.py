import hashlib
import json
import os
from pathlib import Path
import subprocess

application = Path('/home/baptiste/itrocks/showtime')
output = Path(__file__).resolve().parent
framework = 'node_modules/@itrocks/framework'
recipe = 'node_modules/@itrocks/property-select/docs/orchestration/environment/control.mjs'
environment = dict(os.environ, PS_ENV_DIRECTORY='/tmp/property-select-L1-META', PS_APP_PORT='13619',
    PS_PLAYWRIGHT_MODULE='/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/'
        'node/node_modules/playwright/index.mjs')
commands = [
    ('build', ['npm', '--prefix', framework, 'run', 'build']),
    ('framework-test', ['npm', '--prefix', framework, 'test']),
    ('existing-projection-test', ['node', '--test', framework + '/test/property-select.test.mjs']),
    ('existing-projection-absolute', ['node', '--test', '--test-isolation=none',
        str(application / framework / 'test/property-select.test.mjs')]),
    ('metadata-test', ['node', '--test', '--test-isolation=none',
        str(application / framework / 'test/property-select-metadata.test.mjs')]),
    ('browser', ['node', framework + '/test/metadata-browser.mjs']),
    ('defect-offset', ['node', str(output / 'defect-offset.mjs')]),
    ('owned-status', ['node', recipe, 'status']),
    ('package-files', ['npm', 'pack', './' + framework, '--dry-run', '--json', '--ignore-scripts', '--offline',
        '--cache', '/tmp/property-select/L1-META/npm-cache']),
    ('framework-diff-check', ['git', '-C', framework, 'diff', '--check']),
    ('tracking-diff-check', ['git', '-C', 'node_modules/@itrocks/property-select', 'diff', '--check']),
    ('application-status', ['git', 'status', '--short']),
    ('application-head', ['git', 'rev-parse', 'HEAD']),
    ('application-index', ['git', 'ls-files', '--stage',
        'audit-itrocks-dependencies.json', 'audit-itrocks-dependencies.txt'])
]
records = []
for name, argv in commands:
    result = subprocess.run(argv, cwd=application, env=environment, capture_output=True, text=True)
    destination = output / (name + ('.json' if name in ['browser', 'package-files'] else '.txt'))
    captured = result.stdout + result.stderr
    destination.write_text(captured.rstrip() + '\n' if captured else '')
    records.append(dict(argv=argv, cwd=str(application), exit_code=result.returncode, output=destination.name,
        sha256=hashlib.sha256(destination.read_bytes()).hexdigest()))
    print(name, result.returncode, flush=True)
(output / 'commands.json').write_text(json.dumps(records, indent=2) + '\n')
