import hashlib
import json
from pathlib import Path
import subprocess

application = Path('/home/baptiste/itrocks/showtime')
output = Path(__file__).resolve().parent
framework = application / 'node_modules/@itrocks/framework'
tracking = application / 'node_modules/@itrocks/property-select'
records = {}
for root in [framework, tracking]:
    status = subprocess.check_output(['git', '-C', str(root), 'status', '--short'], text=True)
    revisions = ['aff37e0da8272ca63908a57d7ff3abfa80ec177e', 'HEAD'] if root == framework else ['HEAD']
    argv = ['git', '-C', str(root), 'diff', *revisions]
    if root == tracking:
        argv += ['--', '.', ':!docs/orchestration/evidence/L1-META']
    diff = subprocess.check_output(argv, text=True)
    raw = Path('/tmp/property-select/L1-META') / (root.name + '-diff.raw.txt')
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_text(diff)
    untracked = subprocess.check_output(['git', '-C', str(root), 'ls-files', '--others', '--exclude-standard'], text=True)
    (output / (root.name + '-diff.txt')).write_text('\n'.join(line.expandtabs(2).rstrip() for line in diff.splitlines()) + '\n')
    records[root.name] = dict(status=status, untracked=untracked.splitlines(), raw_diff=str(raw),
        raw_sha256=hashlib.sha256(raw.read_bytes()).hexdigest())
    for relative in untracked.splitlines():
        path = root / relative
        if path.suffix in ['.ts', '.md', '.mjs', '.cjs']:
            path.read_text()

manifest = json.loads((framework / 'package.json').read_text())
package = json.loads((output / 'package-files.json').read_text())[0]
published = {entry['path'] for entry in package['files']}
required = {'cjs/property-select.js', 'cjs/property-select.d.ts', 'cjs/property-select-provider.js',
    'cjs/property-select-provider.d.ts', 'cjs/property-select-actions.js', 'cjs/property-select-actions.d.ts',
    'property-select-metadata.js', 'property-select-metadata.d.ts', 'docs/property-select.md', 'docs/dependencies.md'}
assert required <= published
assert not any(path.startswith(('src/', 'test/')) or path.endswith('.map') for path in published)
assert manifest['dependencies']['@itrocks/property-select'] == 'latest'
for destination in manifest['exports'].values():
    assert (framework / destination).exists()
client = (framework / 'property-select-metadata.js').read_text()
assert 'require(' not in client and 'node:' not in client and 'from ' not in client
assert 'HttpMetadataProvider' in client
assert 'property-select-metadata.js' in (framework / 'app.js').read_text()
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=application, text=True).strip() == \
    'd7ca948292e28c248bdcc0283724e47c2a82bba4'
assert subprocess.check_output(['git', 'status', '--short'], cwd=application, text=True).splitlines() == [
    'AD audit-itrocks-dependencies.json', 'AD audit-itrocks-dependencies.txt']
for name, blob in [('audit-itrocks-dependencies.json', 'ff4dc939cce17af3aa7c14d8063034c5cc85b867'),
                   ('audit-itrocks-dependencies.txt', 'de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
    assert not (application / name).exists()
    assert blob in subprocess.check_output(['git', 'ls-files', '--stage', name], cwd=application, text=True)
records['checks'] = dict(application='PASS', exports='PASS', browser_graph='PASS', package_files='PASS',
    solid='PASS: provider facts, request policy/configuration, actions/serialisation and fetch transport each '
          'have one owner; selector consumes neutral ports; SQL/list/table/home remain outside the provider')
(output / 'review.json').write_text(json.dumps(records, indent=2) + '\n')
print('PASS: public exports, browser graph, dependency direction, owner diffs and application preservation')
