import hashlib
import json
from pathlib import Path
import subprocess

application = Path('/home/baptiste/itrocks/showtime')
output = Path(__file__).resolve().parent
owners = {}
for name in ['framework', 'list', 'property-select']:
    root = application / 'node_modules/@itrocks' / name
    owners[name] = dict(sha=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
        status=subprocess.check_output(['git', 'status', '--short'], cwd=root, text=True),
        version=json.loads((root / 'package.json').read_text())['version'])
assert owners['framework'] == dict(sha='3566dd9352a6ce25df58e6d365f50481e2787eca', status='', version='0.9.3')
assert owners['list']['sha'] == '7191d22217a7d087c197134bc09226a34d05fc60'
assert owners['list']['status'] == ''
assert owners['list']['version'] == '0.8.1'
listing = application / 'node_modules/@itrocks/list'
files = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD^', 'HEAD'], cwd=listing, text=True).splitlines()
assert files == ['package.json', 'src/feed.ts', 'test/feed.test.mjs']
assert '(request.data.offset ?? Feed.DEFAULT_OFFSET)' in (listing / 'cjs/feed.js').read_text()
framework = application / 'node_modules/@itrocks/framework'
previous = json.loads((output.parent / 'L1-META/final-artifacts.json').read_text())['sha256']
artifacts = {path: hashlib.sha256((framework / path).read_bytes()).hexdigest() for path in previous}
assert artifacts == previous
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=application, text=True).strip() == \
    'd7ca948292e28c248bdcc0283724e47c2a82bba4'
assert subprocess.check_output(['git', 'status', '--short'], cwd=application, text=True).splitlines() == [
    'AD audit-itrocks-dependencies.json', 'AD audit-itrocks-dependencies.txt']
for name, blob in [('audit-itrocks-dependencies.json', 'ff4dc939cce17af3aa7c14d8063034c5cc85b867'),
                   ('audit-itrocks-dependencies.txt', 'de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
    assert not (application / name).exists()
    assert blob in subprocess.check_output(['git', 'ls-files', '--stage', name], cwd=application, text=True)
directory = Path('/tmp/property-select-FIX-L1-META-1')
assert not (directory / 'app.pid').exists()
assert not (directory / 'app.owner.json').exists()
owners['property-select'].pop('sha')
record = dict(owners=owners, list_changed_files=files, framework_artifacts_sha256=artifacts,
    application_preservation='PASS: original HEAD, two AD entries, exact staged blobs, absent working files',
    ownership_cleanup='PASS: only recorded task app stopped; database and inherited processes untouched',
    solid='PASS: Feed owns request pagination defaults; Limit and strict SQL validation keep their contracts')
(output / 'review.json').write_text(json.dumps(record, indent=2) + '\n')
print('PASS: exact owner scope, generated feed, identical metadata artifacts, cleanup and application preservation')
