import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile

application = Path('/home/baptiste/itrocks/showtime')
owner = application / 'node_modules/@itrocks/list'
output = Path(__file__).resolve().parent
baseline = Path(tempfile.mkdtemp(prefix='property-select-list-baseline-'))
sha = '005702a6a0cd49740cdea37c2e5150dc80fb670b'
archive_argv = ['git', 'archive', sha]
archive = subprocess.check_output(archive_argv, cwd=owner)
with tarfile.open(fileobj=io.BytesIO(archive)) as source:
    source.extractall(baseline, filter='data')
(baseline / 'node_modules').symlink_to(application / 'node_modules', target_is_directory=True)
records = []
commands = [
    ('baseline-list-test', ['npm', '--prefix', str(baseline), 'test']),
    ('baseline-columns-test', ['node', '--test', '--test-isolation=none', str(baseline / 'test/columns.test.mjs')])
]
for name, argv in commands:
    result = subprocess.run(argv, cwd=application, capture_output=True, text=True)
    captured = result.stdout + result.stderr
    (output / (name + '.txt')).write_text(captured)
    records.append(dict(argv=argv, cwd=str(application), exit_code=result.returncode, output=name + '.txt'))
    assert result.returncode == 1
    if name == 'baseline-columns-test':
        assert 'A column save must not fetch or render the list' in captured
(output / 'baseline-list-test.json').write_text(json.dumps(dict(archive_argv=archive_argv,
    archive_cwd=str(owner), directory=str(baseline), sha=sha, version='0.8.0', commands=records,
    extraction='Python tarfile.extractall(filter=data); node_modules links to installed tools'), indent=2) + '\n')
print('PASS: immutable old list HEAD reproduces the same unrelated empty-columns failure')
