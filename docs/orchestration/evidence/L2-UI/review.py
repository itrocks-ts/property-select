import hashlib
import json
from pathlib import Path
import re
import subprocess

out = Path(__file__).resolve().parent
owner = out.parents[3]
app = owner.parents[2]
manifest = json.loads((owner / 'package.json').read_text())
assert manifest['version'] == '0.2.0'
files = json.JSONDecoder().raw_decode((out / 'pack.txt').read_text())[0][0]['files']
packed = {entry['path'] for entry in files}
required = {'front/property-select.js', 'front/property-select.d.ts', 'front/property-select.html',
    'front/property-select.css', 'property-select.js', 'property-select.d.ts', 'cjs/property-select.js'}
assert required <= packed, required - packed
assert not any(path.startswith(('src/', 'scripts/', 'test/')) for path in packed)
assert not any(path.endswith('.map') for path in packed)
visited = set()
def visit(file):
    file = file.resolve()
    assert file.is_relative_to(owner)
    if file in visited:
        return
    visited.add(file)
    source = file.read_text()
    for specifier in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)", source):
        assert specifier.startswith('.'), specifier
        visit(file.parent / specifier)
visit(owner / 'front/property-select.js')
assert not manifest.get('dependencies')
for name in ['framework', 'home', 'list', 'reflect', 'reflect-path', 'table']:
    assert not any('/' + name + '/' in '/' + str(file.relative_to(owner)) for file in visited)
def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
assert git(app, 'rev-parse', 'HEAD') == 'd7ca948292e28c248bdcc0283724e47c2a82bba4'
assert git(app, 'status', '--short') == 'AD audit-itrocks-dependencies.json\nAD audit-itrocks-dependencies.txt'
for name, blob in [('audit-itrocks-dependencies.json', 'ff4dc939cce17af3aa7c14d8063034c5cc85b867'),
    ('audit-itrocks-dependencies.txt', 'de960a87ea9b4f6eb1cece85ab32596baef11fcd')]:
    assert blob in git(app, 'ls-files', '--stage', name)
    assert not (app / name).exists()
result = dict(status='PASS', source_checkpoint=git(owner, 'rev-parse', 'HEAD'), version=manifest['version'],
    browser_graph=[str(path.relative_to(owner)) for path in sorted(visited)],
    files={name:hashlib.sha256((owner / name).read_bytes()).hexdigest() for name in sorted(required)},
    application_head=git(app, 'rev-parse', 'HEAD'), application_status=git(app, 'status', '--short'))
(out / 'review.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
