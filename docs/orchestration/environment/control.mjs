import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
		['app', `${source}app.cjs`], ['standalone', `${source}standalone.mjs`],
		['mysql', `--datadir=${directory}/data`]
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
