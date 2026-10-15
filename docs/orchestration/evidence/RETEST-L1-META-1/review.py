import hashlib
import json
from pathlib import Path
import subprocess

app = Path('/home/baptiste/itrocks/showtime')
out = Path(__file__).resolve().parent
owners = app / 'node_modules/@itrocks'
records = {}
for name, prefix in [('framework', 'framework'), ('property-select', 'selector')]:
    raw = (out / (prefix + '-pack-valid.txt')).read_text()
    data = json.JSONDecoder().raw_decode(raw)[0][0]
    assert data['name'] == '@itrocks/' + name
    paths = {entry['path'] for entry in data['files']}
    required = {'cjs/property-select.js', 'property-select-metadata.js', 'property-select-metadata.d.ts',
        'docs/property-select.md'} if name == 'framework' else {
        'cjs/property-select.js', 'property-select.js', 'property-select.d.ts'}
    assert required <= paths
    assert not any(path.startswith(('src/', 'test/')) for path in paths)
    manifest = json.loads((owners / name / 'package.json').read_text())
    for value in manifest['exports'].values():
        for destination in value.values() if isinstance(value, dict) else [value]:
            assert (owners / name / destination).exists()
    records[name] = dict(published_required=sorted(required), files=len(paths),
        runtime_dependencies=manifest.get('dependencies', {}))
client = (owners / 'framework/property-select-metadata.js').read_text()
assert 'require(' not in client and 'node:' not in client and 'from ' not in client
assert 'HttpMetadataProvider' in client
assert 'property-select-metadata.js' in (owners / 'framework/app.js').read_text()
assert not json.loads((owners / 'property-select/package.json').read_text()).get('dependencies')
for name in ['framework', 'list']:
    assert subprocess.check_output(['git', 'status', '--porcelain'], cwd=owners / name, text=True) == ''
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=app, text=True).strip() == \
    'd7ca948292e28c248bdcc0283724e47c2a82bba4'
assert subprocess.check_output(['git', 'status', '--short'], cwd=app, text=True).splitlines() == [
    'AD audit-itrocks-dependencies.json', 'AD audit-itrocks-dependencies.txt']
for name, blob in [('audit-itrocks-dependencies.json', 'ff4dc939cce17af3aa7c14d8063034c5cc85b867'),
    ('audit-itrocks-dependencies.txt', 'de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
    assert not (app / name).exists()
    assert blob in subprocess.check_output(['git', 'ls-files', '--stage', name], cwd=app, text=True)
for name in ['src/list.ts', 'test/columns.test.mjs']:
    current = subprocess.check_output(['git', 'show', 'HEAD:' + name], cwd=owners / 'list')
    original = subprocess.check_output(['git', 'show',
        '005702a6a0cd49740cdea37c2e5150dc80fb670b:' + name], cwd=owners / 'list')
    assert current == original
    records[name] = dict(identical_baseline_and_current=True, sha256=hashlib.sha256(current).hexdigest())
records['checks'] = dict(application_preserved=True, product_owners_clean=True, public_files_and_exports=True,
    dependency_direction=True, browser_graph=True)
(out / 'review.json').write_text(json.dumps(records, indent=2) + '\n')
print('PASS: public exports, package files, dependency direction, product owners and application/index preservation')
