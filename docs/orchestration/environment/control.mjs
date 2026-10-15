import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const directory = process.env.PS_ENV_DIRECTORY || '/tmp/showtime-property-select-env'
const appPort = Number(process.env.PS_APP_PORT || 13317)
const databasePort = Number(process.env.PS_DATABASE_PORT || 13316)
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
else if (command === 'app') {
	if (existsSync(`${directory}/app.pid`)) {
		const pid = Number(readFileSync(`${directory}/app.pid`, 'utf8'))
		try { process.kill(pid, 0); throw new Error('Application PID is alive; check before starting') }
		catch (error) { if (error.code !== 'ESRCH') throw error }
	}
	launch(process.execPath, [`${source}app.cjs`], 'app.log')
}
else if (command === 'standalone') {
	launch(process.execPath, [`${source}standalone.mjs`], 'standalone.log')
}
else if (['stop', 'stop-app', 'stop-standalone'].includes(command)) {
	// Match the recorded owner's command line before signalling a potentially reused PID.
	for (const [name, marker] of [
		['app', `${source}app.cjs`], ['standalone', `${source}standalone.mjs`]
	]) {
		if (command !== 'stop' && command !== `stop-${name}`) continue
		if (!existsSync(`${directory}/${name}.pid`)) continue
		const pid = Number(readFileSync(`${directory}/${name}.pid`, 'utf8'))
		try {
			const argumentsText = readFileSync(`/proc/${pid}/cmdline`, 'utf8')
			if (!argumentsText.includes(marker)) throw new Error(`PID ${pid} is not the owned ${name}`)
			process.kill(pid, 'SIGTERM')
		}
		catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ESRCH') throw error }
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
