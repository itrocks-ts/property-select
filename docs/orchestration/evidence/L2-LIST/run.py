import hashlib
import json
from pathlib import Path
import subprocess

root = Path('/home/baptiste/itrocks/showtime')
proof = root / 'node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-LIST'
commands = []

def run(name, argv, cwd=root):
    result = subprocess.run(argv, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    output = proof / (name + '.txt')
    raw = Path('/tmp/property-select/L2-LIST/commands') / output.name
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_bytes(result.stdout)
    cleaned = '\n'.join(line.rstrip() for line in result.stdout.decode().splitlines()).rstrip()
    output.write_text(cleaned + '\n' if cleaned else '')
    commands.append(dict(argv=argv, cwd=str(cwd), exit=result.returncode, output=output.name,
                         sha256=hashlib.sha256(output.read_bytes()).hexdigest(), raw_output=str(raw),
                         raw_sha256=hashlib.sha256(result.stdout).hexdigest()))
    (proof / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    print(name, result.returncode, flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)

for owner in ['transformer', 'core-transformers', 'property-select', 'list', 'framework', 'home']:
    run(owner + '-build', ['npm', '--prefix', 'node_modules/@itrocks/' + owner, 'run', 'build'])
    if owner != 'home':
        run(owner + '-tests', ['npm', '--prefix', 'node_modules/@itrocks/' + owner, 'test'])
for owner in ['list', 'framework', 'home']:
    run(owner + '-contracts', ['node', '--test', '--test-isolation=none',
                              str(root / 'node_modules/@itrocks' / owner / 'test/property-select.test.mjs')])
run('application-build', ['npm', 'run', 'build'])
for owner in ['transformer', 'core-transformers', 'list', 'framework', 'home', 'property-select']:
    run(owner + '-pack', ['npm', 'pack', '--dry-run', '--json', '--ignore-scripts', '--offline',
                         '--cache', '/tmp/property-select-L2-LIST-npm-cache'], root / 'node_modules/@itrocks' / owner)
    run(owner + '-whitespace', ['git', '-C', 'node_modules/@itrocks/' + owner, 'diff', '--check'])
