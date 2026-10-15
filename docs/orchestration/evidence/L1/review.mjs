import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const owner = fileURLToPath(new URL('../../../../', import.meta.url))
const app = resolve(owner, '../../..')
const read = path => readFileSync(resolve(owner, path), 'utf8')
const manifest = JSON.parse(read('package.json'))
const inventory = JSON.parse(read('docs/orchestration/evidence/L1/package-files.json'))[0]
const files = new Set(inventory.files.map(file => file.path))
assert.equal(inventory.name, '@itrocks/property-select')
assert.equal(manifest.version, '0.1.0')
for (const stem of ['controller', 'intentions', 'metadata', 'navigation', 'path', 'ports', 'property-select'])
	for (const file of [`${stem}.js`, `${stem}.d.ts`, `cjs/${stem}.js`, `cjs/${stem}.d.ts`])
		assert.ok(files.has(file), `Missing public artifact: ${file}`)
assert.ok(![...files].some(file => file.startsWith('test/') || file.startsWith('src/') || file.endsWith('.map')))
const visited = new Set()
function scan(entry)
{
	if (visited.has(entry))
		return
	visited.add(entry)
	const code = readFileSync(entry, 'utf8')
	assert.ok(!/\b(?:document|window|process|require)\b/u.test(code), `Unexpected environment dependency: ${entry}`)
	for (const match of code.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/gu)) {
		assert.ok(match[1].startsWith('./'), `External browser dependency: ${match[1]}`)
		scan(resolve(dirname(entry), match[1]))
	}
}
scan(resolve(owner, 'property-select.js'))
for (const file of readdirSync(resolve(owner, 'src')).filter(file => file.endsWith('.ts')))
	assert.ok(!/from ['"](?:@itrocks\/|node:)/u.test(read(`src/${file}`)), file)
const evidence = name => read(`docs/orchestration/evidence/L1/application-${name}.txt`).trim()
assert.equal(evidence('head'), 'd7ca948292e28c248bdcc0283724e47c2a82bba4')
assert.equal(evidence('status'), 'AD audit-itrocks-dependencies.json\nAD audit-itrocks-dependencies.txt')
assert.equal(evidence('index'),
	'100644 ff4dc939cce17af3aa7c14d8063034c5cc85b867 0\taudit-itrocks-dependencies.json\n'
	+ '100644 de960a87ea9b4f6eb1cece85ab32596baef11fcd 0\taudit-itrocks-dependencies.txt')
for (const name of ['audit-itrocks-dependencies.json', 'audit-itrocks-dependencies.txt'])
	assert.equal(existsSync(resolve(app, name)), false)
console.log(JSON.stringify({
	application: 'Preserved HEAD, initial AD entries, staged blobs and working-file absence',
	browserGraph: [...visited].map(file => file.slice(owner.length)).sort(),
	package: `${manifest.name}@${manifest.version}`,
	publicArtifacts: 'ESM/CJS/declarations present; source/tests/maps excluded',
	status: 'PASS'
}, null, 2))
