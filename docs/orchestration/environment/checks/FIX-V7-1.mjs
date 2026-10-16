// Author correction regression only: fresh evidence, sandboxed browser and owned local services.
import assert            from 'node:assert/strict'
import { spawnSync }     from 'node:child_process'
import { createHash }    from 'node:crypto'
import { mkdirSync }     from 'node:fs'
import { readFileSync }  from 'node:fs'
import { unlinkSync }    from 'node:fs'
import { writeFileSync } from 'node:fs'
import { resolve }       from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const owner = resolve('node_modules/@itrocks/property-select')
const recipe = owner + '/docs/orchestration/environment'
const output = owner + '/docs/orchestration/evidence/FIX-V7-1'
const selected = process.argv[2]
const checkpoints = JSON.parse(readFileSync(output + '/checkpoints.json'))
const commands = []
const hash = value => createHash('sha256').update(value).digest('hex')
const suites = [
	['before', 'FIX-V7-1-session', 'FIX-V7-1/session', 'shared'],
	['after', 'FIX-V7-1-session', 'FIX-V7-1/session', 'shared'],
	['after-final', 'FIX-V7-1-session', 'FIX-V7-1/session', 'shared'],
	['build', 'L7-build', 'L7/build'],
	['error', 'RETEST-L7-1-browser', 'RETEST-L7-1/independent', 'shared'],
	['landscape', 'L7-error', 'L7/error', 'shared'],
	['status', 'FIX-V7-1-status', 'FIX-V7-1/status', 'shared']
]
assert.ok(suites.some(([id]) => id === selected),
	'Choose before, after, after-final, build, error, landscape or status')

function command(program, args, env = process.env, cwd = process.cwd(), log)
{
	const started = new Date().toISOString()
	const run = spawnSync(program, args, { cwd, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
	const stdout = (run.stdout || '') + (run.stderr || '')
	if (log) writeFileSync(log, stdout)
	commands.push({ program, args, cwd, started, finished: new Date().toISOString(),
		status: run.status, signal: run.signal, log, environment: Object.fromEntries(Object.entries(env)
			.filter(([key]) => key.startsWith('PS_'))) })
	writeFileSync(output + '/commands-' + (selected || 'all') + '.json', JSON.stringify(commands, null, 2) + '\n')
	if (run.status !== 0) throw new Error(`${program} ${args.join(' ')} failed (${run.status}): ${stdout.slice(-6000)}`)
	return stdout
}
async function ready(url)
{
	for (let i = 0; i < 150; i ++) {
		try { if ((await fetch(url)).ok) return } catch {}
		await pause(100)
	}
	throw Error('Not ready: ' + url)
}
mkdirSync(output, { recursive: true })
for (const [id, script, oldEvidence, service] of suites) {
	if (selected && selected !== id) continue
	console.log('BEGIN', id, new Date().toISOString())
	const dest = output + '/' + id
	mkdirSync(dest, { recursive: true })
	writeFileSync(dest + '/checkpoints.json', JSON.stringify(checkpoints, null, 2) + '\n')
	const sourcePath = recipe + '/checks/' + script + '.mjs'
	const original = readFileSync(sourcePath, 'utf8')
	let source = original.replaceAll('/evidence/' + oldEvidence, '/evidence/FIX-V7-1/' + id)
	if (service) source = source.replaceAll('13981', '14081').replaceAll('14071', '14081')

	const executable = recipe + '/checks/.FIX-V7-1-' + id + '.mjs'
	writeFileSync(executable, source)
	writeFileSync(dest + '/executed.mjs', source)
	writeFileSync(dest + '/execution.json', JSON.stringify({ sourcePath, sourceSha256: hash(original),
		executedSha256: hash(source), checkpoints, trackingVersion: '0.7.6',
		adaptations: ['fresh FIX evidence', 'owned service ports 14081/14082', 'archived executed source']
	}, null, 2) + '\n')
	const env = { ...process.env, PS_STATUS_OUTPUT: dest, PS_STATUS_URL: 'http://127.0.0.1:14082',
		PS_L7_ERROR_OUTPUT: dest, PS_L7_BUILD_OUTPUT: dest }

	const serviceEnv = { ...process.env, PS_ENV_DIRECTORY: '/tmp/property-select/FIX-V7-1-' + id + '-owned',
		PS_APP_PORT: '14081', PS_STANDALONE_PORT: '14082', PS_FRAMEWORK_INITIALIZER:
			recipe + '/checks/V4-fixture.cjs' }
	const started = []
	try {
		if (service) {
			command('mysqladmin', ['--no-defaults', '--socket=/tmp/showtime-property-select-env/mysql.sock',
				'-u', 'root', 'ping'], process.env, undefined, dest + '/database-status.txt')
			for (const action of ['app', 'standalone']) {
				command('node', [recipe + '/control.mjs', action], serviceEnv, undefined,
					dest + '/' + action + '-start.txt')
				started.push(action)
			}
			await ready('http://127.0.0.1:14081/country')
			await ready('http://127.0.0.1:14082/')
			command('node', [recipe + '/control.mjs', 'status'], { ...process.env, PS_APP_PORT: '14081' },
				undefined, dest + '/status.txt')
		}
		command('node', [executable], env, undefined, dest + '/run.txt')
		console.log('PASS', id)
	}
	finally {
		for (const action of started.reverse()) command('node', [recipe + '/control.mjs', 'stop-' + action],
			serviceEnv, undefined, dest + '/' + action + '-stop.txt')
		unlinkSync(executable)
	}
}
