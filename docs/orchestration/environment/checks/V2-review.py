import hashlib
import json
from pathlib import Path
import subprocess

root = Path.cwd()
owner = root / 'node_modules/@itrocks/property-select'
out = owner / 'docs/orchestration/evidence/V2'
commands = []
for name in ['transformer', 'core-transformers', 'property-select', 'home', 'list', 'framework']:
    package = root / 'node_modules/@itrocks' / name
    argv = ['npm', 'run', 'build']
    result = subprocess.run(argv, cwd=package, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    filename = name + '-build.txt'
    (out / filename).write_text(result.stdout)
    commands.append({'argv': argv, 'cwd': str(package), 'code': result.returncode, 'output': filename})
    (out / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    if result.returncode:
        raise SystemExit(name + ' build failed')
    pack = subprocess.run(['npm', 'pack', '--dry-run', '--json', '--ignore-scripts', '--offline',
                           '--cache', '/tmp/property-select-V2-pack-cache'], cwd=package, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if pack.returncode:
        raise SystemExit(pack.stderr)
    inventory = json.loads(pack.stdout)[0]
    (out / (name + '-pack.json')).write_text(json.dumps(inventory, indent=2) + '\n')
    manifest = json.loads((package / 'package.json').read_text())
    def targets(value):
        if isinstance(value, str):
            return [value]
        if isinstance(value, dict):
            return [target for child in value.values() for target in targets(child)]
        return []
    packed = {entry['path'] for entry in inventory['files']}
    for target in targets(manifest.get('exports', {})):
        if '*' not in target:
            assert (package / target).exists(), (name, target)
            assert target.removeprefix('./') in packed, (name, target)
    print(name + ': build and public exports PASS', flush=True)
for name in ['property-select', 'list', 'framework', 'transformer', 'core-transformers']:
    package = root / 'node_modules/@itrocks' / name
    argv = ['npm', 'test']
    result = subprocess.run(argv, cwd=package, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    filename = name + '-test.txt'
    (out / filename).write_text(result.stdout)
    commands.append({'argv': argv, 'cwd': str(package), 'code': result.returncode, 'output': filename})
    (out / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    if result.returncode:
        raise SystemExit(name + ' test failed')
    print(name + ': tests PASS', flush=True)
