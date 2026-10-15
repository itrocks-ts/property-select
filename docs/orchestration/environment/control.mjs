import { spawn, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import {
	closeSync, existsSync, mkdirSync, openSync, readFileSync, realpathSync, unlinkSync, writeFileSync
} from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const directory = resolve(process.env.PS_ENV_DIRECTORY || '/tmp/showtime-property-select-env')
const appPort = Number(process.env.PS_APP_PORT || 13317)
const databasePort = Number(process.env.PS_DATABASE_PORT || 13316)
const standalonePort = Number(process.env.PS_STANDALONE_PORT || 13318)
const source = fileURLToPath(new URL('.', import.meta.url))
const socket = `${directory}/mysql.sock`
const command = process.argv[2]

function execute(program, args, input)
{
	const result = spawnSync(program, args, { input, stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit' })
	if (result.status !== 0) throw new Error(`${program} failed: ${result.error ?? result.status}`)
}

function launch(program, args, log)
{
	const descriptor = openSync(`${directory}/${log}`, 'a')
	const child = spawn(program, args, {
		cwd: resolve(source, '../../../../../..'), detached: true, stdio: ['ignore', descriptor, descriptor]
	})
	child.unref()
	closeSync(descriptor)
	return child
}

function processIdentity(pid)
{
	const root = `/proc/${pid}`
	const status = readFileSync(`${root}/status`, 'utf8')
	const stat = readFileSync(`${root}/stat`, 'utf8')
	const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ')
	return {
		args: readFileSync(`${root}/cmdline`, 'utf8').split('\0').filter(Boolean),
		boot: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(),
		executable: fields[0] === 'Z' ? null : realpathSync(`${root}/exe`),
		start: fields[19],
		state: fields[0],
		uid: Number(status.match(/^Uid:\s+(\d+)/m)?.[1])
	}
}

function serviceArguments(name, port, token)
{
	const script = name === 'app' ? 'app.cjs' : 'standalone.mjs'
	return [`${source}${script}`, `--ps-environment=${directory}`, `--ps-port=${port}`, `--ps-token=${token}`]
}

async function launchService(name)
{
	const pidFile = `${directory}/${name}.pid`
	const ownerFile = `${directory}/${name}.owner.json`
	// Exclusive reservation also prevents concurrent launches overwriting another owner's record.
	const reservation = openSync(pidFile, 'wx')
	closeSync(reservation)
	const port = name === 'app' ? appPort : standalonePort
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		unlinkSync(pidFile)
		throw new Error('Invalid service port')
	}
	const token = randomUUID()
	const args = serviceArguments(name, port, token)
	let child
	try {
		child = launch(process.execPath, args, `${name}.log`)
		await new Promise((resolve, reject) => {
			child.once('spawn', resolve)
			child.once('error', reject)
		})
	}
	catch (error) {
		unlinkSync(pidFile)
		throw error
	}
	writeFileSync(pidFile, String(child.pid))
	const identity = processIdentity(child.pid)
	if (JSON.stringify(identity.args) !== JSON.stringify([process.execPath, ...args])) {
		throw new Error('Launched service identity unavailable; PID reservation retained')
	}
	writeFileSync(ownerFile, JSON.stringify({ ...identity, directory, name, pid: child.pid, port, token }))
}

async function stopService(name)
{
	const pidFile = `${directory}/${name}.pid`
	const ownerFile = `${directory}/${name}.owner.json`
	if (!existsSync(pidFile)) return
	const pid = Number(readFileSync(pidFile, 'utf8').trim())
	if (!Number.isSafeInteger(pid) || pid <= 1) throw new Error(`Invalid ${name} PID`)
	let current
	try { current = processIdentity(pid) }
	catch (error) {
		if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error
		// An invisible /proc entry is not proof of exit in a restricted execution namespace.
		try { process.kill(pid, 0) }
		catch (probe) {
			if (probe.code !== 'ESRCH') throw probe
			unlinkSync(pidFile)
			if (existsSync(ownerFile)) unlinkSync(ownerFile)
			return
		}
		throw new Error(`Cannot establish ${name} process identity`)
	}
	if (current.state === 'Z') {
		unlinkSync(pidFile)
		if (existsSync(ownerFile)) unlinkSync(ownerFile)
		return
	}
	const owner = JSON.parse(readFileSync(ownerFile, 'utf8'))
	const expected = [process.execPath, ...serviceArguments(name, owner.port, owner.token)]
	if (owner.directory !== directory || owner.name !== name || owner.pid !== pid
		|| !Number.isInteger(owner.port) || owner.port < 1 || owner.port > 65535
		|| typeof owner.token !== 'string' || !owner.token
		|| current.uid !== process.getuid() || owner.uid !== current.uid
		|| current.executable !== realpathSync(process.execPath) || owner.executable !== current.executable
		|| owner.boot !== current.boot || owner.start !== current.start
		|| JSON.stringify(owner.args) !== JSON.stringify(expected)
		|| JSON.stringify(current.args) !== JSON.stringify(expected)) {
		throw new Error(`PID ${pid} is not the owned ${name} instance`)
	}
	// Recheck process birth identity immediately before signalling and throughout the bounded wait.
	const sameProcess = (waiting = false) => {
		try {
			const next = processIdentity(pid)
			return next.boot === owner.boot && next.start === owner.start && next.state !== 'Z'
		}
		catch (error) {
			if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error
			try { process.kill(pid, 0) }
			catch (probe) {
				if (probe.code === 'ESRCH') return false
				throw probe
			}
			// Exit may race the /proc executable read; wait for a stable exit observation.
			if (waiting) return true
			throw new Error(`Cannot establish ${name} process identity`)
		}
	}
	if (sameProcess()) {
		try { process.kill(pid, 'SIGTERM') }
		catch (error) { if (error.code !== 'ESRCH') throw error }
	}
	const deadline = Date.now() + 10000
	while (sameProcess(true)) {
		if (Date.now() >= deadline) throw new Error(`Owned ${name} shutdown timed out; resources retained`)
		await setTimeout(50)
	}
	unlinkSync(pidFile)
	unlinkSync(ownerFile)
	console.log(`PASS: owned ${name} ${pid} stopped`)
}

async function stopDatabase()
{
	const pidFile = `${directory}/mysql.pid`
	if (!existsSync(pidFile)) {
		if (existsSync(socket)) throw new Error('Database socket exists without an owned PID')
		console.log('PASS: owned MySQL is already stopped')
		return
	}
	const pid = Number(readFileSync(pidFile, 'utf8').trim())
	if (!Number.isSafeInteger(pid) || pid <= 1) throw new Error('Invalid database PID')
	const args = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0')
	for (const argument of [
		`--datadir=${directory}/data`, `--socket=${socket}`, `--pid-file=${pidFile}`, '--bind-address=127.0.0.1'
	]) {
		if (!args.includes(argument)) throw new Error(`PID ${pid} is not the owned MySQL instance`)
	}
	const uid = readFileSync(`/proc/${pid}/status`, 'utf8').match(/^Uid:\s+(\d+)/m)?.[1]
	if (Number(uid) !== process.getuid()) throw new Error('MySQL belongs to another user')
	// Verify the server reached through the socket before sending any administrative shutdown.
	const connection = ['--no-defaults', '--protocol=SOCKET', `--socket=${socket}`, '--connect-timeout=5', '-u', 'root']
	const identity = spawnSync('mysql', [...connection, '--batch', '--skip-column-names', '-e',
		'SELECT @@datadir, @@socket, @@pid_file, @@server_uuid'], { encoding: 'utf8', timeout: 10000 })
	if (identity.status !== 0) throw new Error(`MySQL identity check failed: ${identity.stderr ?? identity.error}`)
	const [data, serverSocket, serverPidFile, uuid] = identity.stdout.trim().split('\t')
	const ownedUuid = readFileSync(`${directory}/data/auto.cnf`, 'utf8').match(/^server-uuid=(.+)$/m)?.[1]
	if (resolve(data) !== resolve(directory, 'data') || serverSocket !== socket || serverPidFile !== pidFile
		|| !ownedUuid || uuid !== ownedUuid) throw new Error('Socket does not identify the owned MySQL instance')
	const result = spawnSync('mysqladmin', [...connection, 'shutdown'], { encoding: 'utf8', timeout: 30000 })
	if (result.status !== 0) throw new Error(`MySQL shutdown failed: ${result.stderr ?? result.error}`)
	const deadline = Date.now() + 30000
	const running = () => {
		try { return !/^State:\s+Z/m.test(readFileSync(`/proc/${pid}/status`, 'utf8')) }
		catch (error) {
			if (error.code === 'ENOENT') return false
			throw error
		}
	}
	while (existsSync(pidFile) || existsSync(socket) || running()) {
		if (Date.now() >= deadline) throw new Error('Owned MySQL shutdown timed out; resources retained')
		await setTimeout(100)
	}
	console.log(`PASS: owned MySQL ${pid} stopped through ${socket}; PID file and socket removed`)
}

mkdirSync(directory, { recursive: true })
if (command === 'database') {
	if (!existsSync(`${directory}/data/auto.cnf`)) {
		mkdirSync(`${directory}/data`, { recursive: true })
		execute('mysqld', ['--no-defaults', '--initialize-insecure', `--datadir=${directory}/data`,
			`--log-error=${directory}/mysql-init.log`])
	}
	if (existsSync(`${directory}/mysql.pid`)) throw new Error('Database PID exists; check status before starting')
	launch('mysqld', ['--no-defaults', `--datadir=${directory}/data`, `--socket=${socket}`,
		`--port=${databasePort}`, '--bind-address=127.0.0.1', `--pid-file=${directory}/mysql.pid`,
		`--log-error=${directory}/mysql.log`, '--general-log=1', `--general-log-file=${directory}/queries.log`,
		'--mysqlx=0'], 'mysql-launch.log')
}
else if (command === 'reset') {
	execute('mysql', ['--no-defaults', `--socket=${socket}`, '-u', 'root'],
		readFileSync(`${source}fixtures.sql`, 'utf8'))
}
else if (command === 'app' || command === 'standalone') {
	await launchService(command)
}
else if (['stop', 'stop-app', 'stop-standalone'].includes(command)) {
	for (const name of ['app', 'standalone']) {
		if (command === 'stop' || command === `stop-${name}`) await stopService(name)
	}
	if (command === 'stop') await stopDatabase()
}
else if (command === 'queries') {
	console.log(readFileSync(`${directory}/queries.log`, 'utf8'))
}
else if (command === 'status') {
	execute('mysqladmin', ['--no-defaults', `--socket=${socket}`, '-u', 'root', 'ping'])
	const response = await fetch(`http://127.0.0.1:${appPort}/country`)
	const html = await response.text()
	if (response.status !== 200 || !html.includes('Recipe France')) throw new Error('Synthetic list unavailable')
	console.log('PASS: framework list HTTP 200 with Recipe France')
}
else throw new Error('Use database, reset, app, standalone, status, queries, stop-app, stop-standalone or stop')
