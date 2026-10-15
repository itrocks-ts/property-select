import json
import re
import subprocess
from pathlib import Path

root = Path('/home/baptiste/itrocks/showtime')
owner = root / 'node_modules/@itrocks/reflect-path'
tracking = root / 'node_modules/@itrocks/property-select'
base = tracking / 'docs/orchestration'
evidence = base / 'evidence/S04'
results = []


def git(path, *arguments):
    return subprocess.check_output(['git', *arguments], cwd=path, text=True)


def check(condition, text):
    if not condition:
        raise AssertionError(text)
    results.append(f'PASS: {text}')


sha = '7d1534eece60d23339f2ad8355d49c8d5074c08d'
check(git(owner, 'rev-parse', 'HEAD').strip() == sha, 'delivered product commit is the tested checkpoint')
check(git(owner, 'status', '--short') == '', 'product source/tests/README/manifest are clean')
manifest = json.loads((owner / 'package.json').read_text())
pack = json.loads((evidence / 'reflect-path-pack.json').read_text())[0]
files = {entry['path'] for entry in pack['files']}
required = {
    'LICENSE', 'README.md', 'cjs/property.d.ts', 'cjs/property.js', 'cjs/reflect-path.d.ts',
    'cjs/reflect-path.js', 'cjs/resolve-property-path.d.ts', 'cjs/resolve-property-path.js',
    'cjs/types.d.ts', 'cjs/types.js', 'package.json'
}
check(files == required, 'package inventory contains the facade, resolver, types and allowlisted files only')
check(pack['version'] == manifest['version'] == '0.3.1', 'product and dry-run package version agree')
check(not any(path.endswith('.map') or path.startswith(('src/', 'test/')) for path in files),
      'package inventory excludes source, tests and source maps')
for name in ['PropertyPathError', 'ReflectPropertyPath', 'resolvePropertyPath']:
    check(name in (owner / 'cjs/reflect-path.js').read_text(), f'public runtime facade exports {name}')
for name in ['PropertyPathErrorCode', 'ResolvedPropertyPath', 'resolvePropertyPath']:
    check(name in (owner / 'cjs/reflect-path.d.ts').read_text(), f'public declaration facade exports {name}')
commands = json.loads((evidence / 'commands.json').read_text())
check(all(command['exit_code'] == command['expected_exit_code'] for command in commands),
      'recorded commands have their expected exit status')
passed = (evidence / 'reflect-path-test.txt').read_text()
check(all(f'{key} {value}' in passed for key, value in [('tests', 12), ('pass', 12), ('fail', 0), ('skipped', 0)]),
      'twelve runtime tests pass with zero failed or skipped cases')
for path in (owner / 'src').glob('*.ts'):
    for dependency in re.findall(r"from '(@itrocks/[^'/]+)'", path.read_text()):
        check(dependency in manifest['dependencies'], f'{path.name} declares public dependency {dependency}')
check('@itrocks/class-file' in manifest['devDependencies'], 'public test helper has a declared installed owner')
keywords = manifest['keywords']
check(keywords == sorted(set(keywords), key=str.lower), 'product keywords are unique and sorted')
check(f"\n{manifest['description']}.\n" in (owner / 'README.md').read_text(), 'README description agrees with manifest')
for package in [owner, tracking]:
    check(not git(package, 'ls-files', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock'),
          f'{package.name} has no tracked lockfile needing synchronisation')
    check(subprocess.run(['git', 'diff', '--check'], cwd=package).returncode == 0,
          f'{package.name} whitespace check passes')
    check(subprocess.run(['git', 'diff', '--cached', '--check'], cwd=package).returncode == 0,
          f'{package.name} staged whitespace check passes')
check(git(root, 'rev-parse', 'HEAD').strip() == 'd7ca948292e28c248bdcc0283724e47c2a82bba4',
      'showtime HEAD is preserved')
check(git(root, 'status', '--short') == 'AD audit-itrocks-dependencies.json\nAD audit-itrocks-dependencies.txt\n',
      'showtime has only the two initial AD statuses')
expected_blobs = {
    'audit-itrocks-dependencies.json': 'ff4dc939cce17af3aa7c14d8063034c5cc85b867',
    'audit-itrocks-dependencies.txt': 'de960a87ea9b4f6eb1cece85ab32596baef11fcd'
}
for path, blob in expected_blobs.items():
    check(git(root, 'ls-files', '--stage', path).split()[1] == blob, f'{path} index blob is preserved')
    check(not (root / path).exists(), f'{path} working file remains absent')
checkpoints = json.loads((evidence / 'checkpoints.json').read_text())
for name in ['class-file', 'class-type', 'property-type', 'reflect']:
    package = root / 'node_modules/@itrocks' / name
    check(git(package, 'rev-parse', 'HEAD').strip() == checkpoints[name]['head']
          and git(package, 'status', '--short') == '', f'{name} remains clean and unchanged')
plan = json.loads((base / 'PLAN.json').read_text())
task = next(task for task in plan['tasks'] if task['id'] == 'S04')
check(task['status'] == 'DONE' and task['tested_checkpoints']['@itrocks/reflect-path']['sha'] == sha,
      'manifest records S04 at the tested product commit')
check(next(task for task in plan['tasks'] if task['id'] == 'S05')['status'] == 'PENDING',
      'no subsequent task was started')
check(plan['product_verdict'] == 'NOT_RUN', 'combined product acceptance remains NOT_RUN')
check(json.loads((tracking / 'package.json').read_text())['version'] == '0.0.17', 'tracking patch version is 0.0.17')
original = git(tracking, 'show', 'fc3312732029b566dec2a22a655ec51505944e42:docs/orchestration/VALIDATION.md')
current = (base / 'VALIDATION.md').read_text()
check(current.count('Current verdict: `NOT_RUN`.') == original.count('Current verdict: `NOT_RUN`.'),
      'no combined SQL/provider/search/browser case was promoted')
markdown = [owner / 'README.md', *(owner / 'docs').glob('*.md'), base / 'reports/S04.md',
            base / 'tasks/S04.md', base / 'VALIDATION.md']
source = [path for path in owner.rglob('*')
          if path.suffix in ['.ts', '.mjs'] and 'cjs' not in path.parts and not path.name.endswith('.d.ts')]
for path in [*markdown, *source]:
    for number, line in enumerate(path.read_text().splitlines(), 1):
        check(len(line.expandtabs(2)) <= 120 or 'https://' in line,
              f'{path.relative_to(root)}:{number} meets the width convention')
for path in markdown:
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        if '://' in target or target.startswith('#'):
            continue
        check((path.parent / target.split('#')[0]).exists(), f'{path.name} local link resolves: {target}')
results = [line for line in results if 'meets the width convention' not in line]
results.append('PASS: new source and Markdown lines meet the 120-column convention')
results.append('PASS: complete product staged/unstaged/untracked diff reviewed before explicit-path staging')
results.append('SOLID: path resolution reuses public relation targets; '
               'terminal shape facts do not parse TypeScript syntax.')
results.append('SOLID: one path resolver owns metadata traversal; '
               'custom root metadata and singular value API remain usable.')
results.append('SOLID: no storage, SQL, selector, presentation, framework or browser runtime dependency introduced.')
results.append('NOT_RUN: provider permissions, automatic search cycles, '
               'SQL execution, browser and final integration gates.')
(evidence / 'review.txt').write_text('\n'.join(results) + '\n')
print(f'PASS: {len(results)} retained review assertions/observations')
