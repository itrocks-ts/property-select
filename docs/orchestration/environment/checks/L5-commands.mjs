import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('node_modules/@itrocks')
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L5')
mkdirSync(output, { recursive: true })
const records = []
function run(name, command, args, cwd = process.cwd())
{
	let status = 0, log
	try { log = execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' }) }
	catch (error) {
		status = error.status ?? -1
		log = String(error.stdout) + String(error.stderr)
	}
	writeFileSync(`${output}/${name}.txt`, log.split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n')
	records.push({ name, command: [command, ...args], cwd, status, log: `${name}.txt` })
	console.log(name, status)
	writeFileSync(output + '/commands.json', JSON.stringify(records, null, 2) + '\n')
}
for (const owner of ['table', 'property-select', 'list', 'home', 'framework']) {
	run(owner + '-build', 'npm', ['--prefix', root + '/' + owner, 'run', 'build'])
	const scripts = JSON.parse(readFileSync(root + '/' + owner + '/package.json')).scripts
	if (scripts.test) run(owner + '-test-script', 'npm', ['--prefix', root + '/' + owner, 'test'])
	const files = readdirSync(root + '/' + owner + '/test').filter(name => /\.test\.(mjs|js)$/.test(name))
	if (files.length) run(owner + '-tests', process.execPath, ['--test', ...files
		.map(file => root + '/' + owner + '/test/' + file)])
	run(owner + '-pack', 'npm', ['pack', '--dry-run', '--json', '--ignore-scripts',
		'--cache', '/tmp/property-select/L5-npm-cache'],
		root + '/' + owner)
}
run('application-build', 'npm', ['run', 'build'])
if (records.some(record => record.status !== 0)) process.exitCode = 1
