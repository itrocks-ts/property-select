import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createConnection, createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const directory = mkdtempSync(join(tmpdir(), 'property-select-shutdown-regression-'))
const control = fileURLToPath(new URL('./control.mjs', import.meta.url))
const ports = [13424, 13425, 13426]
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_DATABASE_PORT: String(ports[0]),
	PS_APP_PORT: String(ports[1]), PS_STANDALONE_PORT: String(ports[2]) }

function run(command, extra = {})
{
	const result = spawnSync(process.execPath, [control, command], { env: { ...env, ...extra }, encoding: 'utf8' })
	assert.equal(result.status, 0, `${command}: ${result.stderr}`)
	if (result.stdout) process.stdout.write(result.stdout)
}

async function listening(port)
{
	return new Promise(resolve => {
		const socket = createConnection({ host: '127.0.0.1', port })
		socket.once('connect', () => {
			socket.destroy()
			resolve(true)
		})
		socket.once('error', () => resolve(false))
	})
}

async function until(check)
{
	const deadline = Date.now() + 30000
	while (!await check()) {
		assert.ok(Date.now() < deadline, 'Readiness or shutdown timed out')
		await setTimeout(100)
	}
}

// Reserve each selected port before creating services; refuse occupied resources.
for (const port of ports) {
	await new Promise((resolve, reject) => {
		const server = createServer().once('error', reject)
		server.listen(port, '127.0.0.1', () => server.close(resolve))
	})
}
const inheritedPorts = [13316, 13317, 13318, 13319, 13320, 13321, 13322, 13323]
const inherited = await Promise.all(inheritedPorts.map(listening))
console.log(`Resources: ${directory}; ports ${ports.join(', ')}`)
try {
	for (let cycle = 1; cycle <= 2; cycle ++) {
		run('database')
		await until(async () => await listening(ports[0]) && existsSync(`${directory}/mysql.pid`))
		if (cycle === 1) run('reset')
		const pid = readFileSync(`${directory}/mysql.pid`, 'utf8').trim()
		const foreignDirectory = `${directory}/foreign`
		mkdirSync(foreignDirectory, { recursive: true })
		writeFileSync(`${foreignDirectory}/mysql.pid`, pid)
		const refused = spawnSync(process.execPath, [control, 'stop'], {
			env: { ...env, PS_ENV_DIRECTORY: foreignDirectory }, encoding: 'utf8'
		})
		assert.notEqual(refused.status, 0)
		assert.match(refused.stderr, /not the owned MySQL instance/)
		assert.equal(await listening(ports[0]), true)
		console.log(`PASS: cycle ${cycle} rejects a foreign recorded PID without stopping its server`)
		run('app')
		run('standalone')
		await until(async () => await listening(ports[1]) && await listening(ports[2]))
		run('status')
		const page = await fetch(`http://127.0.0.1:${ports[2]}/`)
		assert.equal(page.status, 200)
		run('stop')
		await until(async () => !(await Promise.all(ports.map(listening))).some(Boolean))
		assert.equal(existsSync(`${directory}/mysql.pid`), false)
		assert.equal(existsSync(`${directory}/mysql.sock`), false)
		assert.match(readFileSync(`${directory}/mysql.log`, 'utf8'), /Shutdown complete/)
		assert.match(readFileSync(`${directory}/queries.log`, 'utf8'), /Query\tshutdown/i)
		run('stop')
		console.log(`PASS: cycle ${cycle} full stack stopped, journal confirmed; repeated stop succeeds`)
	}
	assert.deepEqual(await Promise.all(inheritedPorts.map(listening)), inherited)
	console.log('PASS: inherited listener availability preserved; fixtures survive restart')
}
finally {
	if (existsSync(`${directory}/mysql.pid`)) run('stop')
	console.log(`Retained logs and synthetic datadir: ${directory}`)
}
