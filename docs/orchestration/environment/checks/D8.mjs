// Independent delivery: local artefacts, owned restart and trusted browser add/reload smoke.
import assert                  from 'node:assert/strict'
import { execFileSync }        from 'node:child_process'
import { createHash }          from 'node:crypto'
import { existsSync }          from 'node:fs'
import { mkdirSync }           from 'node:fs'
import { readFileSync }        from 'node:fs'
import { realpathSync }        from 'node:fs'
import { writeFileSync }       from 'node:fs'
import { createRequire }       from 'node:module'
import { resolve }             from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const root    = resolve('node_modules/@itrocks')
const owner   = root + '/property-select'
const base    = owner + '/docs/orchestration'
const recipe  = base + '/environment'
const output  = base + '/evidence/D8'
const service = '/tmp/property-select/D8-owned'
const app     = 'http://127.0.0.1:14119'
const demo    = 'http://127.0.0.1:14120'
const stage   = process.argv[2] || 'all'
const require = createRequire(import.meta.url)
const hash    = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const json    = file => JSON.parse(readFileSync(file, 'utf8'))
const env     = { ...process.env, PS_ENV_DIRECTORY: service, PS_APP_PORT: '14119', PS_STANDALONE_PORT: '14120',
	PS_FRAMEWORK_INITIALIZER: recipe + '/session/fixture.cjs' }
const commands = []
const proof = { assertions: [], cases: [], chromiumSandbox: true, console: [], failed: [], responses: [],
	inputs: [], seed: 'canonical synthetic 120 invoices', stage, started: new Date().toISOString() }
assert.ok(['all', 'build', 'services', 'smoke', 'final'].includes(stage), 'Unknown D8 stage')
mkdirSync(output, { recursive: true })

function save(name, value)
{
	writeFileSync(output + '/' + name + '.json', JSON.stringify(value, null, 2) + '\n')
}

function command(program, args, name, options = {})
{
	const started = new Date().toISOString()
	try {
		const result = execFileSync(program, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
		writeFileSync(output + '/' + name + '.txt', result.trimEnd() + '\n')
		commands.push({ program, args, started, status: 'PASS', log: name + '.txt' })
		save('commands-' + stage, commands)
		return result
	}
	catch (error) {
		writeFileSync(output + '/' + name + '.txt', String(error.stdout || '') + String(error.stderr || '') + error)
		commands.push({ program, args, started, status: 'FAIL', log: name + '.txt' })
		save('commands-' + stage, commands)
		throw error
	}
}

function check(name, observed, expected)
{
	proof.assertions.push({ name, observed, expected })
	assert.deepEqual(observed, expected, name)
}

function git(directory, ...args)
{
	return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function preservation()
{
	return { head: git('.', 'rev-parse', 'HEAD').trim(), status: git('.', 'status', '--short'),
		index: git('.', 'ls-files', '--stage', 'audit-itrocks-dependencies.json', 'audit-itrocks-dependencies.txt'),
		config_sha256: hash('config.yaml') }
}

async function ready(url)
{
	for (let attempt = 0; attempt < 150; attempt ++) {
		try { if ((await fetch(url)).ok) return } catch {}
		await pause(100)
	}
	throw Error('HTTP unavailable: ' + url)
}

async function services()
{
	command('mysqladmin', ['--no-defaults', '--socket=/tmp/showtime-property-select-env/mysql.sock',
		'-u', 'root', 'ping'], 'database')
	command('ss', ['-ltnp'], 'listeners-before')
	// This unique directory owns only D8 services. Existing recipe and other listeners are never stopped.
	const before = {}
	for (const name of ['app', 'standalone']) {
		if (existsSync(service + '/' + name + '.owner.json')) {
			before[name] = json(service + '/' + name + '.owner.json')
			command('node', [recipe + '/control.mjs', 'stop-' + name], name + '-previous-stop', { env })
		}
		await assert.rejects(fetch((name === 'app' ? app : demo) + '/'), 'D8 port must be free')
		command('node', [recipe + '/control.mjs', name], name + '-start', { env })
		await ready((name === 'app' ? app + '/country' : demo + '/'))
		const initial = json(service + '/' + name + '.owner.json')
		command('node', [recipe + '/control.mjs', 'stop-' + name], name + '-restart-stop', { env })
		command('node', [recipe + '/control.mjs', name], name + '-restart-start', { env })
		await ready((name === 'app' ? app + '/country' : demo + '/'))
		const final = json(service + '/' + name + '.owner.json')
		check(name + ': new owned process after restart', final.pid !== initial.pid, true)
		before[name] = { initial, final }
	}
	save('services', { directory: service, owners: before, app, demo,
		initializer: env.PS_FRAMEWORK_INITIALIZER, inheritedProcesses: 'preserved; no inherited stop/reset' })
	command('node', [recipe + '/control.mjs', 'status'], 'status',
		{ env: { ...process.env, PS_APP_PORT: '14119' } })
}

async function build()
{
	const baseline = json(base + '/evidence/RETEST-V7-1/checkpoints.json')
	const checkpoints = {}
	for (const name of Object.keys(baseline)) {
		const directory = root + '/' + name
		const manifest = json(directory + '/package.json')
		const sha = git(directory, 'rev-parse', 'HEAD').trim()
		if (name === 'property-select') {
			git(directory, 'merge-base', '--is-ancestor', '5c0fcfa090d0540d773eec4d279db14ded9ce9f6', sha)
			check('Selector product unchanged since acceptance',
				git(directory, 'diff', '5c0fcfa090d0540d773eec4d279db14ded9ce9f6', '--', 'src'), '')
		}
		else check(name + ': expected HEAD', sha, baseline[name].sha)
		check(name + ': delivered version', manifest.version, name === 'property-select' ? '0.7.8' : baseline[name].version)
		if (name !== 'property-select') check(name + ': clean repository', git(directory, 'status', '--short'), '')
		check(name + ': untouched product sources', git(directory, 'diff', 'HEAD', '--', 'src'), '')
		checkpoints[name] = { sha, version: manifest.version, scripts: manifest.scripts,
			status: git(directory, 'status', '--short'), exported: manifest.exports }
	}
	save('checkpoints', checkpoints)
	check('Showtime preserved', preservation(), json(base + '/evidence/RETEST-V7-1/final-preservation.json').showtime)
	for (const name of ['table', 'property-select', 'list', 'home', 'framework']) {
		assert.ok(checkpoints[name].scripts.build)
		command('npm', ['--prefix', root + '/' + name, 'run', 'build'], name + '-build')
	}
	command('npm', ['run', 'build'], 'showtime-build')
	command('node', [resolve('node_modules/.bin/tsc'), '-p', recipe + '/models/tsconfig.json'], 'models-build')
	const targets = value => typeof value === 'string' ? [value] : Object.values(value || {}).flatMap(targets)
	const required = {
		'property-select': ['cjs/property-select.js', 'property-select.d.ts', 'front/pointer-transport.js'],
		table: ['column-add.js', 'column-add.d.ts', 'column-add.css', 'column-reorder.js'],
		list: ['list.css', 'column-move.svg', 'column-remove.svg'], home: ['cjs/output.html'], framework: []
	}
	const packed = []
	for (const name of Object.keys(checkpoints)) {
		const directory = root + '/' + name
		const manifest = json(directory + '/package.json')
		const pack = JSON.parse(command('npm', ['--prefix', directory, 'pack', '--dry-run', '--json',
			'--ignore-scripts', '--cache', '/tmp/property-select/D8-npm-cache'], name + '-pack', { cwd: directory }))[0]
		const files = new Set(pack.files.map(file => file.path))
		const checked = [...new Set([...targets(manifest.exports).map(file => file.replace(/^\.\//, '')),
			...(required[name] || [])])]
		for (const file of checked)
			check(name + ': packed ' + file, files.has(file) && existsSync(directory + '/' + file), true)
		const entry = require.resolve('@itrocks/' + name + (name === 'table' ? '/column-add.js' : ''))
		check(name + ': local resolution', realpathSync(entry).startsWith(realpathSync(directory) + '/'), true)
		packed.push({ name, version: pack.version, entry, checked, fileCount: files.size,
			hashes: Object.fromEntries(checked.map(file => [file, hash(directory + '/' + file)])) })
	}
	save('distribution', packed)
	const hashes = json(base + '/evidence/RETEST-V7-1/runtime-hashes.json')
	for (const [file, expected] of Object.entries(hashes))
		check('Accepted selector runtime: ' + file, hash(owner + '/' + file), expected)
	const esm = await import('@itrocks/property-select/property-select.js')
	check('CJS public controller', typeof require('@itrocks/property-select').PropertySelect, 'function')
	check('ESM public controller', typeof esm.PropertySelect, 'function')
	check('Public path normalisation', esm.normalisePath(['customer', 'address', 'city']), 'customer.address.city')
}

async function smoke()
{
	const runtime = process.env.PS_PLAYWRIGHT_MODULE
		|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
	process.env.PS_RETEST_NETWORK = output + '/network.json'
	require('./RETEST-V7-1-network.cjs')
	const { chromium } = require(runtime)
	const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
	proof.browser = browser.version()
	proof.playwright = require(runtime + '/package.json').version
	try {
		for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
			const mode = `${width}x${height}`
			const context = await browser.newContext({ viewport: { width, height } })
			await context.exposeBinding('d8Input', (_source, event) => proof.inputs.push({ mode, ...event }))
			await context.addInitScript(() => {
				for (const type of ['click', 'keydown', 'input']) document.addEventListener(type,
					event => window.d8Input({ type, trusted: event.isTrusted }), true)
			})
			const page = await context.newPage()
			page.on('pageerror', error => proof.console.push({ mode, type: 'pageerror', text: error.message }))
			page.on('console', message => {
				if (['warning', 'error'].includes(message.type()))
					proof.console.push({ mode, type: message.type(), text: message.text() })
			})
			page.on('requestfailed', request => proof.failed.push({ mode, url: request.url(), error: request.failure() }))
			page.on('response', response => proof.responses.push({ mode, url: response.url(), status: response.status() }))
			await page.goto(demo + '/')
			await page.locator('.ps-main[data-path="number"]').waitFor()
			await page.screenshot({ path: `${output}/standalone-${mode}-before.png` })
			await page.locator('.ps-main[data-path="number"]').click()
			await page.locator('.ps-add[data-path="customer"]').focus()
			await page.keyboard.press('Enter')
			check(mode + ': standalone terminal and object intentions',
				await page.locator('#intentions li[data-type="select"]').allTextContents(), ['number', 'customer'])
			await page.screenshot({ path: `${output}/standalone-${mode}-after.png` })
			await page.reload()
			await page.locator('.ps-main[data-path="number"]').waitFor()
			check(mode + ': standalone instance fresh after reload', await page.locator('#intentions li').count(), 0)
			await page.goto(app + '/property-select-invoice')
			const order = () => page.locator('table.objects thead th[data-property]')
				.evaluateAll(nodes => nodes.map(node => node.dataset.property))
			await page.locator('.add-column:visible').click()
			await page.locator('.ps-main[data-path="customer"]').waitFor()
			const before = await order()
			await page.screenshot({ path: `${output}/integrated-${mode}-before.png` })
			await page.locator('.ps-main[data-path="customer"]').click()
			await page.locator('.ps-main[data-path="customer.address"]').click()
			await page.locator('.ps-main[data-path="customer.address.city"]').click()
			await page.locator('.ps-main[data-path="customer.address.city.name"]').click()
			await page.locator('th[data-property="customer.address.city.name"]').waitFor()
			await page.locator('.ps-add[data-path="customer.address.city.country"]').focus()
			await page.keyboard.press('Enter')
			await page.locator('th[data-property="customer.address.city.country"]').waitFor()
			await page.waitForLoadState('networkidle')
			const columns = [...before, 'customer.address.city.name', 'customer.address.city.country']
			check(mode + ': exact terminal and object column order', await order(), columns)
			const cells = () => page.locator('table.objects tbody tr')
				.evaluateAll(rows => rows.map(row => ({ id: row.querySelector('input[name=id]')?.value,
					cells: [...row.querySelectorAll('td')].map(cell => cell.textContent.trim()) })))
			const data = await cells()
			proof.currentData = data
			check(mode + ': real synthetic rows', data.length > 0, true)
			check(mode + ': city and country display', JSON.stringify(data).includes('Recipe Paris')
				&& JSON.stringify(data).includes('RECIPE FRANCE'), true)
			const key = await page.locator('[data-selector-key]').getAttribute('data-selector-key')
			const state = async () => (await context.request.get(app + '/property-select/state/json?key='
				+ encodeURIComponent(key))).json()
			const stored = await state()
			check(mode + ': remembered real branch', stored.state.branch, ['customer', 'address', 'city'])
			check(mode + ': confirmed recents', stored.state.recent.length > 0, true)
			await page.screenshot({ path: `${output}/integrated-${mode}-added.png` })
			await page.reload()
			await page.locator('th[data-property="customer.address.city.country"]').waitFor()
			check(mode + ': reload preserves exact columns', await order(), columns)
			check(mode + ': reload preserves actual cells', await cells(), data)
			await page.locator('.add-column:visible').click()
			await page.locator('.ps-level[data-path="customer.address.city"][aria-current="location"]').waitFor()
			check(mode + ': session branch restored', (await state()).state.branch, stored.state.branch)
			check(mode + ': session recents restored', (await state()).state.recent, stored.state.recent)
			await page.screenshot({ path: `${output}/integrated-${mode}-reloaded.png` })
			proof.cases.push({ mode, app: page.url(), demo, input: 'trusted mouse and keyboard',
				columns, rows: data, stateBefore: stored, stateAfter: await state() })
			await page.waitForLoadState('networkidle')
			await context.close()
		}
		check('Every input trusted', proof.inputs.length > 0 && proof.inputs.every(event => event.trusted), true)
		check('No browser console errors or warnings', proof.console, [])
		proof.networkReview = 'Each failed request requires causal attribution in network.json'
		check('No HTTP error responses', proof.responses.filter(response => response.status >= 400), [])
	}
	finally { await browser.close() }
	const network = json(output + '/network.json')
	const summary = { status: network.status, failures: network.failures.length,
		unclassified: network.failures.filter(record => record.attribution === 'UNCLASSIFIED').length,
		attributions: network.failures.map(record => record.attribution) }
	save('network-summary', summary)
	check('Every failed request individually attributed', summary.unclassified, 0)
}

try {
	if (['all', 'build'].includes(stage)) await build()
	if (['all', 'services'].includes(stage)) await services()
	if (['all', 'smoke'].includes(stage)) await smoke()
	if (['all', 'smoke', 'final'].includes(stage)) {
		const http = []
		for (const url of [demo + '/', app + '/country', app + '/property-select-invoice']) {
			const response = await fetch(url)
			check('Live HTTP ' + url, response.status, 200)
			http.push({ url, status: response.status, bytes: (await response.text()).length })
		}
		save('http-' + stage, http)
		command('node', [recipe + '/control.mjs', 'status'], 'status-' + stage,
			{ env: { ...process.env, PS_APP_PORT: '14119' } })
		check('Showtime still preserved', preservation(),
			json(base + '/evidence/RETEST-V7-1/final-preservation.json').showtime)
	}
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.failure = error.stack
	throw error
}
finally {
	proof.finished = new Date().toISOString()
	save('results-' + stage, proof)
	console.log(proof.status, stage, proof.assertions.length, 'assertions; services retained at', app, demo)
}
