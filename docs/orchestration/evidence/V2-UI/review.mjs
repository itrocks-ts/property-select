import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const owner = fileURLToPath(new URL('../../../../', import.meta.url))
const graph = {}
function visit(path)
{
	if (graph[path]) return
	const source = readFileSync(resolve(owner, path), 'utf8')
	graph[path] = createHash('sha256').update(source).digest('hex')
	for (const [, specifier] of source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
		assert.ok(specifier.startsWith('.'), `${path}: forbidden bare import ${specifier}`)
		const target = relative(owner, resolve(owner, dirname(path), specifier))
		assert.ok(!target.startsWith('..'))
		visit(target)
	}
}
visit('front/property-select.js')
assert.ok(!Object.keys(graph).some(path => /(^|\/)(framework|home|list|table|reflect|storage|sql)/.test(path)))
const expected = [
	'property-select.js', 'property-select.d.ts', 'cjs/property-select.js', 'cjs/property-select.d.ts',
	'front/property-select.js', 'front/property-select.d.ts', 'front/property-select.css', 'front/property-select.html'
]
const inventory = JSON.parse(readFileSync(new URL('./pack.json', import.meta.url)))[0]
assert.equal(inventory.name, '@itrocks/property-select')
assert.equal(inventory.version, '0.2.1')
const files = inventory.files.map(file => file.path)
for (const path of expected) {
	assert.ok(existsSync(resolve(owner, path)), path)
	assert.ok(files.includes(path), `package excludes ${path}`)
}
assert.ok(!files.some(path => /^(?:src|test)\/|\.map$/.test(path)))
const require = createRequire(import.meta.url)
assert.equal(typeof require(resolve(owner, 'cjs/property-select.js')).PropertySelect, 'function')
const result = {
	verdict: 'PASS', graph, files: expected, inventoryFiles: files.length, cjs: 'public import without DOM'
}
writeFileSync(new URL('./artifacts.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
