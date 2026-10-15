import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

app = Path('/home/baptiste/itrocks/showtime')
out = Path(__file__).resolve().parent
env = dict(os.environ, PS_ENV_DIRECTORY='/tmp/property-select-RETEST-L1-META-1', PS_APP_PORT='13639',
    PS_METADATA_URL='http://127.0.0.1:13639',
    PS_FRAMEWORK_INITIALIZER='node_modules/@itrocks/framework/test/metadata-fixture.cjs',
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
        ('framework-pack', ['npm', '--prefix', owners + 'framework', 'pack', '--dry-run', '--json', '--offline']),
        ('selector-pack', ['npm', '--prefix', owners + 'property-select', 'pack', '--dry-run', '--json', '--offline'])
    ],
    'start': [('start', ['node', recipe, 'app'])],
    'status': [('owned-status', ['node', recipe, 'status'])],
    'review': [('review', ['python3', str(out / 'review.py')])],
    'focused': [(name, ['node', '--test', '--test-isolation=none',
        str(app / owners / 'list/test' / filename)]) for name, filename in
        [('feed-test', 'feed.test.mjs'), ('list-scopes-test', 'list.test.mjs')]],
    'defect': [('empty-columns-http', ['node', str(out / 'empty-columns.mjs')])],
    'stop': [('stop', ['node', recipe, 'stop-app'])],
    'browser': [('independent-browser', ['node', str(out / 'browser.mjs')])]
}
groups['pack'] = [(name.replace('-pack', '-pack-retry'), argv + ['--cache', '/tmp/property-select-retest-npm'])
    for name, argv in groups['core'] if name.endswith('-pack')]
groups['public-pack'] = [(prefix + '-pack-valid', ['npm', 'pack', './' + owners + owner,
    '--dry-run', '--json', '--ignore-scripts', '--offline', '--cache', '/tmp/property-select-retest-npm'])
    for prefix, owner in [('framework', 'framework'), ('selector', 'property-select')]]
group = sys.argv[1]
if group == 'baseline':
    root = Path(tempfile.mkdtemp(prefix='property-select-RETEST-L1-META-list-'))
    sha = '005702a6a0cd49740cdea37c2e5150dc80fb670b'
    archive = subprocess.check_output(['git', 'archive', sha], cwd=app / owners / 'list')
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(root, filter='data')
    (root / 'node_modules').symlink_to(app / 'node_modules', target_is_directory=True)
    (out / 'baseline.json').write_text(json.dumps(dict(sha=sha, version='0.8.0', directory=str(root),
        archive_argv=['git', 'archive', sha], archive_cwd=str(app / owners / 'list'),
        archive_sha256=hashlib.sha256(archive).hexdigest()), indent=2) + '\n')
    groups[group] = [
        ('baseline-test', ['npm', '--prefix', str(root), 'test']),
        ('baseline-columns', ['node', '--test', '--test-isolation=none', str(root / 'test/columns.test.mjs')]),
        ('current-columns', ['node', '--test', '--test-isolation=none',
            str(app / owners / 'list/test/columns.test.mjs')])
    ]
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
