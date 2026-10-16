import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('node_modules/@itrocks')
const base = root + '/property-select/docs/orchestration/evidence/V7'
const checkpoints = JSON.parse(readFileSync(base + '/checkpoints.json'))
const before = JSON.parse(readFileSync(base + '/preservation-before.json'))
const git = (directory, ...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' })
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const result = { owners: [], sourceReview: [], preservation: {}, assertions: [] }
const check = (name, actual, expected) => {
	assert.deepEqual(actual, expected, name)
	result.assertions.push({ name, actual, expected, status: 'PASS' })
}
mkdirSync(base + '/review', { recursive: true })
for (const [owner, checkpoint] of Object.entries(checkpoints)) {
	const directory = root + '/' + owner
	check(owner + ': checkpoint unchanged', git(directory, 'rev-parse', 'HEAD').trim(), checkpoint.sha)
	check(owner + ': product sources unchanged', git(directory, 'diff', 'HEAD', '--', 'src'), '')
	if (owner !== 'property-select') check(owner + ': clean owner', git(directory, 'status', '--short'), '')
	result.owners.push({ owner, ...checkpoint, status: git(directory, 'status', '--short') })
}
for (const [path, observation] of [
	['list/src/list.ts',
		'HTML and visible columns call configured select with scope and ids; JSON keeps entity search.'],
	['list/src/projection.ts', 'Public typed path and representation transformers; no SQL builder or hydration.'],
	['list/src/front/property-select.ts',
		'Consumer adapts paths and data; beginExternal owns geometry, pane token owns fold.'],
	['framework/src/front/property-select-list.ts',
		'Public dynamic activation, injected pane registration and cleanup.'],
	['framework/src/front/property-select-metadata.ts', 'HTTP descriptions only; forwards cancellation signal.'],
	['property-select/src/property-select.ts',
		'Generic metadata, consumer and state ports; no host/table/data dependency.'],
	['table/src/column-add.ts', 'Generic opaque identity and column transactions reuse public reorder operations.'],
	['home/src/front/right-pane.ts', 'Single generic pane owns registration, focus and responsive suspension.'],
	['mysql/src/mysql.ts',
		'Projection executes sql-build and delegates typed reconstruction to its own projection code.'],
	['sql-build/src/select.ts', 'Projection and criteria share the SQL relationship graph.']
]) {
	check(path + ': inspected source exists', existsSync(root + '/' + path), true)
	result.sourceReview.push({ path, sha256: sha(root + '/' + path), observation })
}
result.preservation = { head: git('.', 'rev-parse', 'HEAD').trim(), status: git('.', 'status', '--short'),
	index: git('.', 'ls-files', '--stage', 'audit-itrocks-dependencies.json', 'audit-itrocks-dependencies.txt'),
	config_sha256: sha('config.yaml') }
check('Showtime preserved exactly', result.preservation, before)
for (const file of ['audit-itrocks-dependencies.json', 'audit-itrocks-dependencies.txt'])
	check(file + ': still absent', existsSync(file), false)
result.status = 'PASS'
writeFileSync(base + '/review/results.json', JSON.stringify(result, null, 2) + '\n')
console.log('PASS', result.assertions.length, 'checkpoint, source and preservation assertions')
