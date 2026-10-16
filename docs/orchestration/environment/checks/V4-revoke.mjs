import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { mkdirSync, writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { request } = require('/home/baptiste/.cache/codex-runtimes/codex-primary-runtime'
	+ '/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = owner + '/docs/orchestration/environment'
const app = 'http://127.0.0.1:13911'
const directory = process.env.PS_V4_DIRECTORY || '/tmp/property-select/V4-revoke'
const output = process.env.PS_V4_OUTPUT || owner + '/docs/orchestration/evidence/V4'
mkdirSync(output, { recursive: true })
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_APP_PORT: '13911',
	PS_FRAMEWORK_INITIALIZER: recipe + '/checks/V4-fixture.cjs' }
const endpoint = app + '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist'
const results = { assertions: [], commands: [], requests: [] }
let started = false
function command(action)
{
	results.commands.push({ action, output: execFileSync(process.execPath, [recipe + '/control.mjs', action],
		{ env, encoding: 'utf8' }) })
	started = action === 'app'
}
async function ready()
{
	for (let i = 0; i < 100; i ++) {
		try { if ((await fetch(app + '/country')).ok) return } catch {}
		await delay(100)
	}
	throw new Error('Server unavailable')
}
function check(name, actual, expected)
{
	results.assertions.push({ name, actual, expected, status: JSON.stringify(actual) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
}
const helper = await request.newContext()
try {
	command('app')
	await ready()
	for (const operation of ['revoke', 'expire']) {
		const user = await request.newContext()
		assert.equal((await user.get(app + '/country')).status(), 200)
		const read = await user.get(endpoint)
		assert.equal(read.status(), 200)
		const { revision } = await read.json()
		const generation = read.headers()['x-property-select-session']
		const data = { revision, state: { version: 1, branch: [], current: 0,
			query: `obsolete-${operation}`, recent: [], scroll: {} } }
		const gate = data => helper.post(app + '/v4/gate/json', { data })
		await gate({ operation: 'arm', id: operation })
		const pending = user.put(endpoint, { data, headers: { 'X-Property-Select-Session': generation } })
		let acquired = false
		for (let i = 0; i < 100; i ++) {
			if ((await (await gate({ operation: 'status' })).json()).pending.includes(operation)) {
				acquired = true
				break
			}
			await delay(20)
		}
		assert.equal(acquired, true)
		assert.equal((await user.post(app + '/property-select-test/session/json', { data: { operation } })).status(), 200)
		await gate({ operation: 'release', id: operation })
		const response = await pending
		results.requests.push({ operation, method: 'PUT', url: endpoint,
			status: response.status(), body: await response.json() })
		check(`${operation}: production action preserves stale-session 410`, response.status(), 410)
		// Retain failures. Inspect durability and new requests independently; no weakened acceptance.
		const stale = await user.put(endpoint, { data, headers: { 'X-Property-Select-Session': generation } })
		check(`${operation}: newly arriving old generation is 410`, stale.status(), 410)
		command('stop-app')
		command('app')
		await ready()
		assert.equal((await user.get(app + '/country')).status(), 200)
		const current = await user.get(endpoint)
		check(`${operation}: new request succeeds after restart`, current.status(), 200)
		const state = await current.json()
		check(`${operation}: no obsolete state resurrected`, state.state, undefined)
		const freshWrite = await user.put(endpoint, { headers: {
			'X-Property-Select-Session': current.headers()['x-property-select-session'] },
			data: { revision: state.revision, state: { ...data.state, query: 'fresh-generation' } } })
		check(`${operation}: fresh generation remains writable`, freshWrite.status(), 200)
		await user.dispose()
	}
}
catch (error) {
	results.failure = { message: error.message, stack: error.stack }
	process.exitCode = 1
}
finally {
	await helper.dispose()
	if (started) command('stop-app')
	results.status = results.failure ? 'FAILED'
		: results.assertions.some(item => item.status === 'FAIL') ? 'NEEDS_FIX' : 'PASS'
	writeFileSync(output + '/revocation.json', JSON.stringify(results, null, 2) + '\n')
	console.log(JSON.stringify(results.assertions))
	if (results.status !== 'PASS') process.exitCode = 1
}
