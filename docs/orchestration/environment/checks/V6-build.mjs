import assert            from 'node:assert/strict'
import { execFileSync }  from 'node:child_process'
import { existsSync }    from 'node:fs'
import { mkdirSync }     from 'node:fs'
import { readFileSync }  from 'node:fs'
import { readdirSync }   from 'node:fs'
import { writeFileSync } from 'node:fs'
import { resolve }       from 'node:path'

const root = resolve('node_modules/@itrocks')
const output = root + '/property-select/docs/orchestration/evidence/V6/build'
const result = []
const targets = value => typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(targets)
const required = {
	framework: ['property-select-list.js', 'property-select-metadata.js', 'cjs/property-select.js'],
	home: ['right-pane.js', 'right-pane.d.ts', 'right-pane.css', 'cjs/output.js'],
	list: ['property-select.js', 'property-select.d.ts', 'cjs/list.js'],
	'property-select': ['property-select.js', 'property-select.d.ts', 'cjs/property-select.js',
		'front/property-select.js', 'front/property-select.html', 'front/property-select.css',
		'front/pointer-transport.js'],
	table: ['column-add.js', 'column-add.d.ts', 'column-add.css', 'column-reorder.js', 'column-reorder.d.ts']
}
mkdirSync(output, { recursive: true })
try {
	for (const owner of ['table', 'property-select', 'list', 'home', 'framework']) {
		const directory = root + '/' + owner
		const manifest = JSON.parse(readFileSync(directory + '/package.json'))
		assert.ok(manifest.scripts.build)
		const build = execFileSync('npm', ['run', 'build'], { cwd: directory, encoding: 'utf8' })
		writeFileSync(`${output}/${owner}-build.txt`, build.trimEnd() + '\n')
		const packed = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
			'--cache', '/tmp/property-select/V6-npm-cache'], { cwd: directory, encoding: 'utf8' })
		const files = new Set(JSON.parse(packed)[0].files.map(file => file.path))
		const checked = [...new Set([...required[owner], ...targets(manifest.exports)
			.map(path => path.replace(/^\.\//, ''))])]
		for (const file of checked) {
			assert.ok(files.has(file), 'Missing packaged file: ' + owner + '/' + file)
			assert.ok(existsSync(directory + '/' + file), 'Missing built file: ' + file)
		}
		result.push({ owner, version: manifest.version, status: 'PASS', checked,
			build: manifest.scripts.build, packagedFiles: files.size })
		console.log('PASS', owner, manifest.version)
		const commands = owner === 'property-select' || owner === 'list' ? [['npm', ['test']]]
			: owner === 'home' || owner === 'table'
				? [['node', ['--test']]]
				: []
		if (owner === 'home') commands[0][1].push(directory + '/test/property-select.test.mjs')
		if (owner === 'table') commands[0][1].push(...readdirSync(directory + '/test')
			.filter(file => file.endsWith('.test.mjs')).map(file => directory + '/test/' + file))
		for (const [program, args] of commands) {
			const tests = execFileSync(program, args, { cwd: directory, encoding: 'utf8' })
			writeFileSync(`${output}/${owner}-tests.txt`, tests)
			result.at(-1).tests = { command: [program, ...args], status: 'PASS' }
		}
	}
	const build = execFileSync('npm', ['run', 'build'], { encoding: 'utf8' })
	writeFileSync(output + '/application-build.txt', build.split('\n').map(line => line.trimEnd()).join('\n'))
}
finally { writeFileSync(output + '/results.json', JSON.stringify(result, null, 2) + '\n') }
