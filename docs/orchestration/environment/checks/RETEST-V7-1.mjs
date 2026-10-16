// Final acceptance: fresh execution of independent verifiers, isolated output and owned services.
import assert                  from 'node:assert/strict'
import { execFileSync }        from 'node:child_process'
import { spawnSync }           from 'node:child_process'
import { createHash }          from 'node:crypto'
import { mkdirSync }           from 'node:fs'
import { readFileSync }        from 'node:fs'
import { unlinkSync }          from 'node:fs'
import { writeFileSync }       from 'node:fs'
import { resolve }             from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const owner = resolve('node_modules/@itrocks/property-select')
const recipe = owner + '/docs/orchestration/environment'
const output = owner + '/docs/orchestration/evidence/RETEST-V7-1'
const selected = process.argv[2]
const checkpoints = JSON.parse(readFileSync(output + '/checkpoints.json'))
if (!selected && !process.env.PS_V7_FROM) {
	for (const name of Object.keys(checkpoints)) {
		const directory = resolve('node_modules/@itrocks/' + name)
		checkpoints[name] = {
			sha: execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
			version: JSON.parse(readFileSync(directory + '/package.json')).version,
			status: execFileSync('git', ['-C', directory, 'status', '--short'], { encoding: 'utf8' })
		}
	}
	writeFileSync(output + '/checkpoints.json', JSON.stringify(checkpoints, null, 2) + '\n')
}
const commands = []
const hash = value => createHash('sha256').update(value).digest('hex')
const suites = [
	['foundations', 'V7-foundations', 'V7/foundations'],
	['build', 'L7-build', 'L7/build'],
	['architecture', 'L7-architecture', 'L7'],
	['imports', 'RETEST-L7-1-imports', 'RETEST-L7-1'],
	['sql', 'VSQL', 'VSQL'],
	['ui', 'V2-UI', 'V2-UI'],
	['pane', 'V2-HOME', 'V2-HOME', 'pane'],
	['table', 'RETEST-V2-TABLE-1-itinerary', 'RETEST-V2-TABLE-1/itinerary', 'shared'],
	['geometry', 'RETEST-V2-TABLE-1', 'RETEST-V2-TABLE-1/independent', 'shared'],
	['integration', 'V2', 'V2'],
	['search', 'V3', 'V3'],
	['search-focus', 'RETEST-V3-1', 'RETEST-V3-1/independent'],
	['search-bounds', 'V3-bounds', 'V3'],
	['state', 'V4', 'V4'],
	['session-regression', 'RETEST-V7-1-session', 'RETEST-V7-1/session', 'shared'],
	['state-integrated', 'RETEST-V4-1-integrated', 'RETEST-V4-1/integrated-complete'],
	['state-standalone', 'RETEST-V4-1-standalone', 'RETEST-V4-1/standalone'],
	['state-races', 'RETEST-V4-1-challenges', 'RETEST-V4-1/challenges-complete'],
	['state-revoke', 'V4-revoke', 'V4'],
	['state-contract', 'V4-contract', 'V4'],
	['desktop', 'V5', 'V5', 'shared'],
	['transport', 'V5-support', 'V5/support', 'shared'],
	['touch', 'V6', 'V6', 'shared'],
	['interruption', 'V6-interruption', 'V6'],
	['load', 'L7', 'L7', 'shared'],
	['error', 'RETEST-V7-1-error', 'RETEST-V7-1/error', 'shared'],
	['scope', 'RETEST-L7-1-scope', 'RETEST-L7-1', 'shared'],
	['review', 'V7-review', 'V7/review']
]
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
for (const [id, script, oldEvidence, service] of suites.slice(process.env.PS_V7_FROM
	? suites.findIndex(([id]) => id === process.env.PS_V7_FROM) : 0)) {
	if (selected && selected !== id) continue
	console.log('BEGIN', id, new Date().toISOString())
	const dest = output + '/' + id
	mkdirSync(dest, { recursive: true })
	writeFileSync(dest + '/checkpoints.json', JSON.stringify(checkpoints, null, 2) + '\n')
	const sourcePath = recipe + '/checks/' + script + '.mjs'
	const original = readFileSync(sourcePath, 'utf8')
	let source = original.replaceAll('/evidence/' + oldEvidence, '/evidence/RETEST-V7-1/' + id)
	source = source.replaceAll('/tmp/property-select-V2-UI', '/tmp/property-select/RETEST-V7-1-ui')
		.replaceAll('/tmp/property-select-V2', '/tmp/property-select/RETEST-V7-1-integration')
		.replaceAll('/tmp/property-select/RETEST-V3-1', '/tmp/property-select/RETEST-V7-1-search-focus')
		.replaceAll('/tmp/property-select/RETEST-V4-1-standalone', '/tmp/property-select/RETEST-V7-1-state-standalone')
		.replaceAll('/tmp/property-select/V3', '/tmp/property-select/RETEST-V7-1-search')
	if (id === 'pane') source = source.replace(/results.checkpoints = \{[\s\S]*?\n\}/,
		'results.checkpoints = ' + JSON.stringify(checkpoints))
	source = source.replaceAll('b274d101e2d250a9318b312f0324a24a00519eb4', checkpoints['property-select'].sha)
		.replaceAll("version: '0.2.1'", "version: '0.7.7'")
	// Transport tests share only a fresh service; sessions are created independently by each test.
	if (service) for (const port of ['13953', '13973', '13981']) source = source.replaceAll(port, '14091')
	if (service) for (const port of ['13954', '13974', '13982']) source = source.replaceAll(port, '14092')
	if (id === 'search') source = source.replace('await page.goto(url)',
		'if (integrated) await page.context().clearCookies()\n\tawait page.goto(url)')
	if (id === 'search-focus') source = source.replace('await page.goto(integrated ?',
		"if (integrated) { await page.goto('about:blank'); await page.context().clearCookies() }"
		+ "\n\tawait page.goto(integrated ?")
	if (id === 'integration') {
		source = source.replace('checks: [], commands:', 'abortedSignals: [], checks: [], commands:')
		source = source.replace('const page = await context.newPage()', `
		await context.exposeBinding('v7AbortObserved', (_source, url) => results.abortedSignals.push({ mode, url }))
		await context.addInitScript(() => {
			const originalFetch = window.fetch
			window.fetch = function(input, options) {
				const url = new URL(typeof input === 'string' ? input : input.url, location.href).href
				options?.signal?.addEventListener('abort', () => void window.v7AbortObserved(url), { once: true })
				return originalFetch.apply(this, arguments)
			}
		})
		const page = await context.newPage()`)
		source = source.replace("check('browser console/network health', [], results.health)", `
		results.expectedCancellations = results.health.filter(record => record.kind === 'request'
			&& record.text === 'net::ERR_ABORTED' && /\\/property-select\\/(context|resolve)\\/json\\?/.test(record.url)
			&& results.abortedSignals.some(signal => signal.mode === record.mode && signal.url === record.url))
		check('browser console/network health excluding observed metadata signal cancellation', [],
			results.health.filter(record => !results.expectedCancellations.includes(record)))`)
	}
	if (id === 'session-regression') source = source.replaceAll('14071', '14091')
	if (id === 'review') source = source.replaceAll('/evidence/V7', '/evidence/RETEST-V7-1')
	if (['state-integrated', 'state-races'].includes(id)) source = source.replaceAll(
		"page.locator('.ps-status').innerText()",
		"page.locator('.ps-persistence').evaluate(node => (node.firstChild?.textContent ?? '').trim())")
	if (id === 'touch') source = source.replace(
		"check('Only intentional request aborts', proof.failed.filter(request => request.error !== "
			+ "'net::ERR_ABORTED'), [])",
		"proof.networkReview = 'network.json requires individual observed signal or completed response attribution'")

	const executable = recipe + '/checks/.RETEST-V7-1-' + id + '.mjs'
	writeFileSync(executable, source)
	writeFileSync(dest + '/executed.mjs', source)
	writeFileSync(dest + '/execution.json', JSON.stringify({ sourcePath, sourceSha256: hash(original),
		executedSha256: hash(source),
		networkObserverSha256: hash(readFileSync(recipe + '/checks/RETEST-V7-1-network.cjs')),
		checkpoints, trackingVersion: '0.7.7',
		adaptations: ['fresh output', 'owned directories and ports', 'current provenance',
			'V2 aborts require observed AbortSignal; V3 opens fresh sessions; functional assertions unchanged']
	}, null, 2) + '\n')
	const env = { ...process.env,
		NODE_OPTIONS: '--require=' + recipe + '/checks/RETEST-V7-1-network.cjs',
		PS_RETEST_NETWORK: dest + '/network.json', PS_L7_BUILD_OUTPUT: dest, PS_L7_ARCHITECTURE_OUTPUT: dest,
		PS_VSQL_OUTPUT: dest + '/', PS_VSQL_RAW: '/tmp/property-select/RETEST-V7-1-sql', PS_V3_OUTPUT: dest,
		PS_V4_OUTPUT: dest, PS_V4_DIRECTORY: '/tmp/property-select/RETEST-V7-1-' + id,
		PS_V5_OUTPUT: dest, PS_V5_SUPPORT_OUTPUT: dest, PS_V6_OUTPUT: dest, PS_L7_OUTPUT: dest,
		PS_TABLE_OUTPUT: dest, PS_TABLE_URL: 'http://127.0.0.1:14092/table-fixture',
		PS_PANE_URL: 'http://127.0.0.1:14091/pane-fixture', PS_V5_SUPPORT_APP: 'http://127.0.0.1:14091',
		PS_V5_SUPPORT_DEMO: 'http://127.0.0.1:14092' }
	const serviceEnv = { ...process.env, PS_ENV_DIRECTORY: '/tmp/property-select/RETEST-V7-1-' + id + '-owned',
		PS_APP_PORT: '14091', PS_STANDALONE_PORT: '14092', PS_FRAMEWORK_INITIALIZER:
			recipe + (service === 'pane' ? '/home/fixture.cjs' : '/checks/V4-fixture.cjs') }
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
			await ready('http://127.0.0.1:14091/country')
			await ready('http://127.0.0.1:14092/')
			command('node', [recipe + '/control.mjs', 'status'], { ...process.env, PS_APP_PORT: '14091' },
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
assert.ok(!selected || suites.some(([id]) => id === selected), 'Unknown stage')
