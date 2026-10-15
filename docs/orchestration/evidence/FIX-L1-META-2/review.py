import hashlib
import json
from pathlib import Path
import subprocess

app = Path('/home/baptiste/itrocks/showtime')
out = Path(__file__).resolve().parent
owners = app / 'node_modules/@itrocks'

def git(directory, *args):
    return subprocess.check_output(['git', *args], cwd=directory, text=True).strip()

assert git(app, 'rev-parse', 'HEAD') == 'd7ca948292e28c248bdcc0283724e47c2a82bba4'
assert git(app, 'status', '--short').splitlines() == [
    'AD audit-itrocks-dependencies.json', 'AD audit-itrocks-dependencies.txt']
for name, blob in [('audit-itrocks-dependencies.json', 'ff4dc939cce17af3aa7c14d8063034c5cc85b867'),
    ('audit-itrocks-dependencies.txt', 'de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
    assert not (app / name).exists()
    assert blob in git(app, 'ls-files', '--stage', name)
assert git(owners / 'list', 'status', '--short') == ''
assert git(owners / 'framework', 'status', '--short') == ''
assert git(owners / 'framework', 'rev-parse', 'HEAD') == '3566dd9352a6ce25df58e6d365f50481e2787eca'
changed = git(owners / 'list', 'diff', '--name-only', '7191d22217a7d087c197134bc09226a34d05fc60', 'HEAD')
assert changed.splitlines() == ['package.json', 'src/list.ts', 'test/columns.test.mjs']
source = (owners / 'list/src/list.ts').read_text()
assert 'if (request.request.data.columns !== undefined)' in source
assert 'if (request.request.data.columns !== undefined)' in (owners / 'list/cjs/list.js').read_text()
artifacts = json.loads((out.parent / 'L1-META/final-artifacts.json').read_text())['sha256']
for name, digest in artifacts.items():
    assert hashlib.sha256((owners / 'framework' / name).read_bytes()).hexdigest() == digest
for owner in ['framework', 'list', 'property-select']:
    manifest = json.loads((owners / owner / 'package.json').read_text())
    exports = manifest['exports']
    for export in exports.values() if isinstance(exports, dict) else [exports]:
        for destination in export.values() if isinstance(export, dict) else [export]:
            assert (owners / owner / destination).exists()
    assert not git(owners / owner, 'ls-files', '*lock*')
checkpoints = {name: dict(sha=git(owners / name, 'rev-parse', 'HEAD'),
    version=json.loads((owners / name / 'package.json').read_text())['version'])
    for name in ['list', 'framework']}
checkpoints['property-select'] = dict(base_sha='96443912c6a0cd7a7253f506ea109d346f1907cb',
    base_version='0.1.3', version='0.1.4', runtime_source_delta='none')
(out / 'checkpoints.json').write_text(json.dumps(checkpoints, indent=2) + '\n')
record = dict(application_and_index_preserved=True, product_owners_clean=True, public_exports=True,
    list_source_and_build_match=True, unchanged_metadata_artifacts=artifacts,
    list_changed_paths=changed.splitlines(), no_tracked_locks=True,
    node=subprocess.check_output(['node', '--version'], text=True).strip(),
    npm=subprocess.check_output(['npm', '--version'], text=True).strip())
(out / 'review.json').write_text(json.dumps(record, indent=2) + '\n')
print('PASS: owner scope, generated exports, metadata digests, application HEAD and both index blobs')
