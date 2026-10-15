import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createConnection, createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const control = fileURLToPath(new URL('./control.mjs', import.meta.url))
const directory = mkdtempSync(join(tmpdir(), 'property-select-process-owner-'))
const foreign = mkdtempSync(join(tmpdir(), 'property-select-process-foreign-'))
const ports = []
const inheritedPorts = [13316, 13317, 13318, 13319, 13320, 13321, 13322, 13323, 13424, 13425, 13426]
const environments = []

async function listening(port)
{
	return new Promise(resolve => {
		const socket = createConnection({ host: '127.0.0.1', port })
		socket.once('connect', () => { socket.destroy(); resolve(true) })
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

function run(command, env, accepted = true)
{
	const result = spawnSync(process.execPath, [control, command], {
		env: { ...process.env, ...env }, encoding: 'utf8', timeout: 60000
	})
	if (accepted) assert.equal(result.status, 0, `${command}: ${result.stderr}`)
	else assert.notEqual(result.status, 0, `Expected refusal: ${command}`)
	return result
}

// Let the kernel choose free ports; retain inherited listener observations throughout the test.
for (let index = 0; index < 5; index ++) {
	ports.push(await new Promise((resolve, reject) => {
		const server = createServer().once('error', reject)
		server.listen(0, '127.0.0.1', () => {
			const port = server.address().port
			server.close(() => resolve(port))
		})
	}))
}
const inherited = await Promise.all(inheritedPorts.map(listening))
for (const [index, root] of [directory, foreign].entries()) {
	environments.push({ PS_ENV_DIRECTORY: root, PS_DATABASE_PORT: String(ports[0]),
		PS_APP_PORT: String(ports[index * 2 + 1]), PS_STANDALONE_PORT: String(ports[index * 2 + 2]) })
}
console.log(JSON.stringify({ directory, foreign, ports }))
try {
	run('database', environments[0])
	await until(async () => await listening(ports[0]) && existsSync(`${directory}/mysql.pid`))
	run('reset', environments[0])
	for (let cycle = 1; cycle <= 2; cycle ++) {
		for (const env of environments) {
			run('app', env)
			run('standalone', env)
			await until(async () => await listening(Number(env.PS_APP_PORT))
				&& await listening(Number(env.PS_STANDALONE_PORT)))
			if (env === environments[0]) run('status', env)
			const country = await fetch(`http://127.0.0.1:${env.PS_APP_PORT}/country`)
			assert.equal(country.status, 200)
			assert.match(await country.text(), /Recipe France/)
			assert.equal((await fetch(`http://127.0.0.1:${env.PS_STANDALONE_PORT}/`)).status, 200)
			for (const name of ['app', 'standalone']) run(name, env, false)
		}
		for (const name of ['app', 'standalone']) {
			const pidFile = `${directory}/${name}.pid`
			const ownerFile = `${directory}/${name}.owner.json`
			const originalPid = readFileSync(pidFile, 'utf8')
			const originalOwner = readFileSync(ownerFile, 'utf8')
			// Copy both records, then forge only the PID: neither can target the foreign live instance.
			copyFileSync(`${foreign}/${name}.pid`, pidFile)
			copyFileSync(`${foreign}/${name}.owner.json`, ownerFile)
			assert.match(run(`stop-${name}`, environments[0], false).stderr, /not the owned/)
			assert.match(run('stop', environments[0], false).stderr, /not the owned/)
			writeFileSync(ownerFile, originalOwner)
			assert.match(run(`stop-${name}`, environments[0], false).stderr, /not the owned/)
			writeFileSync(pidFile, originalPid)
			// Exact runtime port, start time and argument identity must also match.
			for (const patch of [
				{ port: 1 }, { start: '0' }, { token: 'forged' }, { uid: -1 }, { executable: '/wrong/node' }
			]) {
				writeFileSync(ownerFile, JSON.stringify({ ...JSON.parse(originalOwner), ...patch }))
				assert.match(run(`stop-${name}`, environments[0], false).stderr, /not the owned/)
			}
			writeFileSync(ownerFile, originalOwner)
			renameSync(ownerFile, `${ownerFile}.held`)
			run(`stop-${name}`, environments[0], false)
			renameSync(`${ownerFile}.held`, ownerFile)
			for (const invalid of ['0', '-1', 'not-a-pid']) {
				writeFileSync(pidFile, invalid)
				assert.match(run(`stop-${name}`, environments[0], false).stderr, /Invalid .* PID/)
			}
			writeFileSync(pidFile, originalPid)
			assert.equal(await listening(Number(environments[1][name === 'app'
				? 'PS_APP_PORT' : 'PS_STANDALONE_PORT'])), true)
			// Shutdown derives the port from its owned record, even if the caller omits port overrides.
			run(`stop-${name}`, { PS_ENV_DIRECTORY: directory })
			run(`stop-${name}`, { PS_ENV_DIRECTORY: directory })
		}
		for (const env of environments) run('stop-app', env)
		// Foreign full stop has no database record; its app and standalone alone are stopped.
		run('stop', environments[1])
		run('stop', environments[1])
		await until(async () => !(await Promise.all(ports.slice(1).map(listening))).some(Boolean))
		assert.equal(await listening(ports[0]), true)
		assert.deepEqual(await Promise.all(inheritedPorts.map(listening)), inherited)
		console.log(`PASS: cycle ${cycle}, foreign records/PIDs refused, owned stops/repeats, restart and HTTP`)
	}
	run('stop', environments[0])
	run('stop', environments[0])
	await until(async () => !(await listening(ports[0])))
	assert.deepEqual(await Promise.all(inheritedPorts.map(listening)), inherited)
	console.log('PASS: full MySQL teardown; inherited listeners preserved; logs/datadir retained')
}
finally {
	for (const env of environments) {
		const result = run('stop', env)
		if (result.stdout) process.stdout.write(result.stdout)
	}
}
