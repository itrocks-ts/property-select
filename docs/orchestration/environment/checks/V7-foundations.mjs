import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('node_modules/@itrocks')
const output = root + '/property-select/docs/orchestration/evidence/V7/foundations'
const results = []
mkdirSync(output, { recursive: true })
function run(owner, label, program, args)
{
	const directory = root + '/' + owner
	const text = execFileSync(program, args, { cwd: directory, encoding: 'utf8' })
	writeFileSync(`${output}/${owner}-${label}.txt`, text)
	results.push({ owner, label, command: [program, ...args], status: 'PASS' })
	writeFileSync(output + '/results.json', JSON.stringify(results, null, 2) + '\n')
}
for (const owner of ['storage', 'reflect', 'reflect-path', 'sql-join', 'sql-build', 'mysql', 'mysql-maintainer',
	'fastify-file-session-store', 'fastify']) {
	const manifest = JSON.parse(readFileSync(root + '/' + owner + '/package.json'))
	assert.ok(manifest.scripts.build)
	run(owner, 'build', 'npm', ['run', 'build'])
	if (['reflect', 'reflect-path'].includes(owner)) run(owner, 'types', 'npm', ['run', 'build:test'])
	if (owner === 'storage') run(owner, 'types', 'node', ['../../.bin/tsc', '-p', 'test/tsconfig.json'])
	if (manifest.scripts.test) run(owner, 'test', 'npm', ['test'])
	else run(owner, 'test', 'node', ['--test', '--test-isolation=none',
		...readdirSync(root + '/' + owner + '/test').filter(file => file.endsWith('.test.mjs'))
			.map(file => 'test/' + file)])
	const packed = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
		'--cache', '/tmp/property-select/V7-npm-cache'], { cwd: root + '/' + owner, encoding: 'utf8' })
	writeFileSync(`${output}/${owner}-pack.json`, packed)
	const entries = value => typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(entries)
	const files = new Set(JSON.parse(packed)[0].files.map(file => file.path))
	for (const target of entries(manifest.exports)) {
		const path = target.replace(/^\.\//, '')
		assert.ok(files.has(path), `Missing published export ${owner}/${path}`)
		assert.ok(existsSync(root + '/' + owner + '/' + path))
	}
	results.push({ owner, label: 'exports', status: 'PASS', exports: entries(manifest.exports) })
	writeFileSync(output + '/results.json', JSON.stringify(results, null, 2) + '\n')
	console.log('PASS', owner)
}
