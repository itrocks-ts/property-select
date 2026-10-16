import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE || runtime)
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/RETEST-V7-1/integration`
const directory = '/tmp/property-select/RETEST-V7-1-integration'
const origin = 'http://127.0.0.1:13829'
const standalone = 'http://127.0.0.1:13830/'
const city = 'customer.address.city'
const country = `${city}.country`
const deep = `${country}.name`
const env = {
	...process.env, PS_APP_PORT: '13829', PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/checks/V2-initialise.mjs`, PS_STANDALONE_PORT: '13830'
}
const results = {
	abortedSignals: [], checks: [], commands: [], health: [], http: [], inputs: [], requests: [], sql: [], emptyResponses: [],
	checkpoints: JSON.parse(readFileSync(`${output}/checkpoints.json`)),
	seed: 'environment/fixtures.sql; original 120 roots; mandatory active=true',
	urls: { integrated: `${origin}/property-select-invoice`, standalone }
}
// Independent expected records derive from the readable fixture seed, never from returned SQL or DOM.
const roots = Array.from({ length: 120 }, (_, index) => {
	const id = index + 1
	const customer = id <= 4 ? [1, 2, 3, null][index] : id % 4 === 0 ? null : id % 3 + 1
	const active = id <= 4 ? id !== 2 : id % 2 === 1
	const name = customer === 1 ? 'Recipe Paris' : customer === 2 ? 'Recipe London' : ''
	const nation = customer === 1 ? 'RECIPE FRANCE' : customer === 2 ? 'RECIPE UNITED KINGDOM' : ''
	return { active, city: name ? `${name} ${nation}` : '', customer, id, nation,
		number: `REC-${String(id).padStart(3, '0')}` }
}).filter(root => root.active)
let browser, appStarted = false, standaloneStarted = false, currentPage, journalStart
mkdirSync(output, { recursive: true })
function save(name, value)
{
	writeFileSync(`${output}/${name}`, typeof value === 'string' ? value : JSON.stringify(value, null, '\t') + '\n')
}
function check(name, expected, observed)
{
	const pass = JSON.stringify(expected) === JSON.stringify(observed)
	results.checks.push({ expected, name, observed, verdict: pass ? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
function command(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	results.commands.push({ action, env: {
		PS_APP_PORT: env.PS_APP_PORT, PS_ENV_DIRECTORY: directory,
		PS_FRAMEWORK_INITIALIZER: env.PS_FRAMEWORK_INITIALIZER, PS_STANDALONE_PORT: env.PS_STANDALONE_PORT
	}, stdout })
}
async function free(port)
{
	await new Promise((yes, no) => {
		const server = net.createServer().once('error', no)
		server.listen(port, '127.0.0.1', () => server.close(yes))
	})
}
async function ready(url)
{
	for (let i = 0; i < 100; i ++) {
		try { if ((await fetch(url)).ok) return }
		catch {}
		await delay(100)
	}
	throw new Error(`Server unavailable: ${url}`)
}
async function rows(page)
{
	return page.locator('table.objects tbody tr').evaluateAll(rows => rows.map(row => ({
		id: Number(row.querySelector('input[name=id]').value),
		values: [...row.querySelectorAll('td')].map(cell => cell.textContent.trim())
	})))
}
async function paths(page)
{
	return page.locator('th[data-property]').evaluateAll(headers => headers.map(header => header.dataset.property))
}
async function verifyRows(page, expected, label)
{
	const actual = await rows(page)
	const columns = await paths(page)
	check(`${label}: root identities in order`, expected.map(root => root.id), actual.map(row => row.id))
	for (const path of ['number', city, deep]) {
		const index = columns.indexOf(path)
		if (index >= 0) check(`${label}: ${path} every converted/absent value`,
			expected.map(root => path === city ? root.city : path === deep ? root.nation : root.number),
			actual.map(row => row.values[index]))
	}
}
async function queries(context)
{
	return (await context.request.get(`${origin}/property-select-observation/probe/json`)).json()
}
async function snapshot(page, name)
{
	await page.screenshot({ path: `${output}/${name}.png` })
}
try {
	check('independent root scope oracle', 61, roots.length)
	for (const service of ['app', 'standalone']) check(`${service}: no existing reservation`, false,
		existsSync(`${directory}/${service}.pid`))
	await free(13829)
	await free(13830)
	journalStart = readFileSync('/tmp/showtime-property-select-env/queries.log').length
	command('app')
	appStarted = true
	command('standalone')
	standaloneStarted = true
	await ready(`${origin}/country`)
	await ready(standalone)
	save('ownership.json', ['app', 'standalone'].map(name => JSON.parse(readFileSync(`${directory}/${name}.owner.json`))))
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	results.browser = { version: browser.version(), sandbox: true,
		playwright: require(`${runtime}/package.json`).version }
	for (const [mode, width, height, touch] of [
		['desktop', 1280, 720, false], ['narrow', 768, 900, false],
		['portrait', 390, 844, true], ['landscape', 844, 390, true]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch })

		await context.exposeBinding('v7AbortObserved', (_source, url) => results.abortedSignals.push({ mode, url }))
		await context.addInitScript(() => {
			const originalFetch = window.fetch
			window.fetch = function(input, options) {
				const url = new URL(typeof input === 'string' ? input : input.url, location.href).href
				options?.signal?.addEventListener('abort', () => void window.v7AbortObserved(url), { once: true })
				return originalFetch.apply(this, arguments)
			}
		})
		const page = await context.newPage()
		currentPage = page
		page.setDefaultTimeout(10000)
		page.on('response', response => {
			if (response.status() >= 400) results.http.push({ mode, status: response.status(), url: response.url() })
		})
		page.on('pageerror', error => results.health.push({ mode, kind: 'exception', text: error.message }))
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type()) && !message.text().includes('400 (Bad Request)'))
				results.health.push({ mode, kind: message.type(), text: message.text() })
		})
		page.on('requestfailed', async request => {
			const response = await request.response()
			const record = { mode, kind: 'request', url: request.url(),
				status: response?.status(), text: request.failure()?.errorText }
			if (record.status === 204 && record.text === 'net::ERR_ABORTED') results.emptyResponses.push(record)
			else results.health.push(record)
		})
		page.on('request', request => results.requests.push({
			mode, url: request.url(), xhr: request.headers()['xhr-info']
		}))
		await page.addInitScript(() => {
			window.v2Inputs = []
			for (const type of ['click', 'keydown', 'pointerdown', 'touchmove', 'touchcancel'])
				document.addEventListener(type, event => window.v2Inputs.push({
					type, trusted: event.isTrusted, pointerType: event.pointerType, key: event.key
				}), true)
		})
		const activate = async locator => {
			const navigation = await locator.evaluate(node =>
				node.dataset.action === 'navigate' || node.dataset.action === 'activate'
				&& node.parentElement.dataset.kind === 'relation' ? node.dataset.path : undefined)
			await (touch ? locator.tap() : locator.click())
			if (navigation !== undefined) await page.waitForFunction(path =>
				document.querySelector('.ps-level[aria-current]')?.dataset.path === path, navigation)
		}
		const main = path => page.locator(`.ps-main[data-path="${path}"]`)
		const plus = path => page.locator(`.ps-add[data-path="${path}"]`)
		const crumb = path => page.locator(`.ps-level[data-path="${path}"]`)
		const choose = async path => {
			if (!touch) await main(path).hover()
			await activate(plus(path))
		}
		const branch = () => page.locator('.ps-level').evaluateAll(nodes => nodes.map(node => node.dataset.path))
		const current = () => page.locator('.ps-level[aria-current]').getAttribute('data-path')
		await page.goto(results.urls.integrated)
		await page.locator('.add-column:not([hidden])').waitFor()
		await verifyRows(page, roots.slice(0, 50), `${mode}: initial page`)
		check(`${mode}: initial count`, '61', (await page.locator('.summary').innerText()).match(/61/)?.[0])
		check(`${mode}: starts folded`, true, await page.locator('.right-pane').isHidden())
		await snapshot(page, `${mode}-before`)
		await page.locator('tbody input[name=id]').first().check()
		await activate(page.locator('.add-column'))
		for (const path of ['customer', 'customer.address', city, country]) await activate(main(path))
		const fullBranch = ['', 'customer', 'customer.address', city, country]
		check(`${mode}: deep branch`, fullBranch, await branch())
		await activate(crumb('customer.address'))
		await activate(crumb(city))
		check(`${mode}: remembered descendants`, fullBranch, await branch())
		await activate(crumb('customer.address'))
		const before = (await queries(context)).length
		let release
		const held = new Promise(resolve => { release = resolve })
		await page.route('**/*?column=*', async route => { await held; await route.continue() })
		await choose(city)
		await choose(city)
		check(`${mode}: no premature committed column`, ['number', 'amount'], await paths(page))
		release()
		await page.locator(`th[data-property="${city}"]`).waitFor()
		await page.waitForFunction(path => document.querySelector(`th[data-property="${path}"]`)
			.classList.contains('column-add-highlight'), city)
		await page.unroute('**/*?column=*')
		check(`${mode}: canonical duplicate committed once at end`, ['number', 'amount', city], await paths(page))
		await verifyRows(page, roots.slice(0, 50), `${mode}: City addition`)
		const addedQueries = (await queries(context)).slice(before)
		results.sql.push({ mode, action: 'City pending double click', statements: addedQueries })
		check(`${mode}: one bounded query without rendering reads`, 1, addedQueries.length)
		check(`${mode}: exactly the loaded ids and scope bound`, [1, ...roots.slice(0, 50).map(root => root.id)],
			addedQueries[0].values.map(value => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value))
		check(`${mode}: representative joins and no full entity projection`, true,
			/ps_city/.test(addedQueries[0].sql) && /ps_country/.test(addedQueries[0].sql)
			&& !/issued_at|delivery_address|\bnote\b/.test(addedQueries[0].sql))
		check(`${mode}: addition preserves context`, 'customer.address', await current())
		check(`${mode}: added confirmation highlight`, true,
			await page.locator(`th[data-property="${city}"]`)
				.evaluate(node => node.classList.contains('column-add-highlight')))
		if (!touch) check(`${mode}: addition preserves focus`, true,
			await plus(city).evaluate(node => node === document.activeElement))
		const existingStart = (await queries(context)).length
		await choose(city)
		check(`${mode}: existing keeps column order`, ['number', 'amount', city], await paths(page))
		check(`${mode}: existing keeps row selection`, true, await page.locator('tbody input[name=id]').first().isChecked())
		check(`${mode}: existing causes no SQL`, existingStart, (await queries(context)).length)
		check(`${mode}: existing gets the same confirmation flash`, true,
			await page.locator(`th[data-property="${city}"]`)
				.evaluate(node => node.classList.contains('column-add-highlight')))
		if (!touch) check(`${mode}: existing retains keyboard focus`, true,
			await plus(city).evaluate(node => node === document.activeElement))
		await activate(main(city))
		await activate(main(country))
		if (!touch) await main(deep).press('Enter')
		else await activate(main(deep))
		await page.locator(`th[data-property="${deep}"]`).waitFor()
		await verifyRows(page, roots.slice(0, 50), `${mode}: mixed City and Country.Name`)
		check(`${mode}: deep terminal keeps current country`, country, await current())
		await snapshot(page, `${mode}-after`)
		await activate(page.locator('.right-pane-toggle'))
		check(`${mode}: close returns trigger focus`, true,
			await page.locator('.right-pane-toggle').evaluate(node => node === document.activeElement))
		await snapshot(page, `${mode}-closed-values`)
		// Test-only geometry stress guarantees horizontal overflow even when all four columns fit desktop.
		await page.locator('th[data-property]').evaluateAll(nodes => nodes.forEach(node => node.style.minWidth = '420px'))
		const buttonBefore = await page.locator('.add-column').boundingBox()
		await page.locator('table.objects').hover()
		await page.mouse.wheel(-10000, 0)
		await delay(150)
		check(`${mode}: header command at left end`, buttonBefore, await page.locator('.add-column').boundingBox())
		await page.mouse.wheel(10000, 0)
		await delay(150)
		check(`${mode}: horizontally scrolled table`, true,
			await page.locator('table.objects').evaluate(node => node.scrollLeft > 0))
		check(`${mode}: header button stays anchored`, buttonBefore, await page.locator('.add-column').boundingBox())
		check(`${mode}: header command inside viewport`, true,
			buttonBefore.x >= 0 && buttonBefore.x + buttonBefore.width <= width)
		await activate(page.locator('.add-column'))
		check(`${mode}: reopen preserves context`, country, await current())
		await activate(crumb('customer'))
		await activate(main('customer.parent'))
		check(`${mode}: divergent branch`, ['', 'customer', 'customer.parent'], await branch())
		await activate(crumb(''))
		const pluralStart = (await queries(context)).length
		for (const path of ['lines', 'tags']) {
			await choose(path)
			await page.locator('.ps-status').filter({ hasText: 'multiple values' }).waitFor()
			check(`${mode}: ${path} refuses without altering columns`, ['number', 'amount', city, deep], await paths(page))
		}
		check(`${mode}: plural refusal executes no query`, pluralStart, (await queries(context)).length)
		await page.reload()
		await page.locator('.add-column:not([hidden])').waitFor()
		check(`${mode}: reload persists exact canonical paths`, ['number', 'amount', city, deep], await paths(page))
		await verifyRows(page, roots.slice(0, 50), `${mode}: reload actual values`)
		if (mode === 'desktop') {
			await page.locator('table.objects').hover()
			await page.mouse.wheel(0, 100000)
			await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 61)
			await verifyRows(page, roots, 'feed complete')
			await page.locator(`th[data-property="${city}"] .label`).click()
			await page.locator(`th[data-property="${city}"][data-sort="1"]`).waitFor()
			await page.locator('.add-column:not([hidden])').waitFor()
			const sorted = [...roots].sort((a, b) => a.city.localeCompare(b.city) || a.id - b.id)
			const sortRequest = results.requests.findLast(request => request.url.includes('sort='))
			const target = JSON.parse(sortRequest.xhr)
			const sortLimit = target.targetHeight ? Math.ceil(target.targetHeight / 30) : target.visibleRows ?? 50
			await verifyRows(page, sorted.slice(0, sortLimit), 'object sort first page with duplicate values')
			await page.locator('table.objects').hover()
			await page.mouse.wheel(0, 100000)
			for (let step = 0; step < 10 && await page.locator('tbody tr').count() < 61; step ++) {
				await delay(150)
				await page.mouse.wheel(0, 100000)
			}
			await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 61)
			await verifyRows(page, sorted, 'object sorted feed complete')
			check('fragment replacements mount one selector', 1, await page.locator('.property-select').count())
			const filter = page.locator(`input[data-property-filter="${deep}"]`)
			await filter.fill('RECIPE FRANCE')
			await filter.press('Enter')
			await page.waitForFunction(() => document.querySelector('.summary')?.textContent.includes('20'))
			await verifyRows(page, roots.filter(root => root.nation === 'RECIPE FRANCE'), 'deep filter all values')
			check('deep filter input retained', 'RECIPE FRANCE', await filter.inputValue())
			await page.reload()
			await verifyRows(page, roots.filter(root => root.nation === 'RECIPE FRANCE'), 'filtered reload')
			const removable = page.locator(`th[data-property="${deep}"] .label`)
			await removable.scrollIntoViewIfNeeded()
			const removableBox = await removable.boundingBox()
			await page.mouse.move(removableBox.x + removableBox.width / 2, removableBox.y + removableBox.height / 2)
			await page.mouse.down()
			await page.mouse.move(removableBox.x + 30, removableBox.y - 45, { steps: 14 })
			await page.mouse.up()
			await page.locator(`th[data-property="${deep}"]`).waitFor({ state: 'detached' })
			await delay(200)
			await page.reload()
			check('filter path really hidden', ['number', 'amount', city], await paths(page))
			await verifyRows(page, roots.filter(root => root.nation === 'RECIPE FRANCE'), 'hidden filter remains scoped')
			check('hidden filter count', true, (await page.locator('.summary').innerText()).includes('20'))
			await snapshot(page, 'desktop-hidden-filter')
			const restricted = await context.request.get(`${origin}/property-select-invoice/list?column=${deep}`
				+ '&rowIds=1,2,3,7,9')
			const restrictedValues = await restricted.json()
			check('public visible ids intersect hidden criterion and mandatory scope', [1, 9],
				restrictedValues.rows.map(row => row.id))
			check('public visible ids keep final property conversion', ['RECIPE FRANCE', 'RECIPE FRANCE'],
				restrictedValues.rows.map(row => row.html))
			const emptyIds = await context.request.get(`${origin}/property-select-invoice/list?column=${deep}&rowIds=`)
			check('public empty visible identities return no roots', [], (await emptyIds.json()).rows)
		}
		results.inputs.push({ mode, environment: 'integrated', width, height, touch,
			events: await page.evaluate(() => window.v2Inputs) })
		await page.goto(`${origin}/country`)
		await page.locator('tbody tr').first().waitFor()
		check(`${mode}: control has both synthetic countries`, ['Recipe France', 'Recipe United Kingdom'],
			await page.locator('tbody tr td').allTextContents())
		check(`${mode}: control has no selector`, 0, await page.locator('.property-select').count())
		await page.goto(standalone)
		await main('customer').waitFor()
		check(`${mode}: standalone one list and no table`, [1, 0],
			[await page.locator('.ps-properties').count(), await page.locator('table').count()])
		await snapshot(page, `${mode}-standalone-before`)
		for (const path of ['customer', 'customer.address', city, country]) await activate(main(path))
		check(`${mode}: standalone branch`, fullBranch, await branch())
		await activate(crumb('customer.address'))
		await activate(crumb(city))
		check(`${mode}: standalone remembers descendant`, fullBranch, await branch())
		await activate(crumb('customer.address'))
		await choose(city)
		check(`${mode}: standalone object intention once`, [city], await page.locator('#intentions li').allTextContents())
		check(`${mode}: standalone plus does not navigate`, 'customer.address', await current())
		await activate(main('customer.address.country'))
		check(`${mode}: standalone divergent suffix`, ['', 'customer', 'customer.address', 'customer.address.country'],
			await branch())
		const terminal = 'customer.address.country.name'
		if (touch) {
			check(`${mode}: no-hover terminal plus hidden`, false, await plus(terminal).isVisible())
			await activate(main(terminal))
		}
		else {
			const beforeBox = await main(terminal).boundingBox()
			await main(terminal).hover()
			check(`${mode}: hover does not move main`, beforeBox, await main(terminal).boundingBox())
			await main(terminal).press('Tab')
			check(`${mode}: tab reaches adjacent plus`, true,
				await plus(terminal).evaluate(node => node === document.activeElement))
			await page.keyboard.press('Space')
		}
		check(`${mode}: terminal intention once`, [city, terminal], await page.locator('#intentions li').allTextContents())
		await snapshot(page, `${mode}-standalone-after`)
		check(`${mode}: no document horizontal overflow`, true,
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		results.inputs.push({ mode, environment: 'standalone', width, height, touch,
			events: await page.evaluate(() => window.v2Inputs) })
		await activate(page.locator('#dispose'))
		check(`${mode}: standalone cleanup removes surface`, 0, await page.locator('.property-select').count())
		await activate(page.locator('#mount'))
		await main('customer').waitFor()
		check(`${mode}: standalone remount once`, 1, await page.locator('.property-select').count())
		await page.reload()
		await main('customer').waitFor()
		check(`${mode}: fresh standalone root`, '', await current())
		await context.close()
	}
	const rendered = await (await fetch(`${origin}/v2-observation/probe/json`)).json()
	save('typed-rendering.json', rendered)
	check('actual City renderer receives typed objects', true,
		rendered.some(cell => cell.kind === 'value') && rendered.filter(cell => cell.kind === 'value')
		.every(cell => cell.cityPrototype && cell.countryPrototype))
	check('actual City renderer receives declared loaded fields', true,
		rendered.filter(cell => cell.kind === 'value')
		.every(cell => cell.declaredFields.every(field => cell.loadedFields.includes(field))))
	check('absent relations reach rendering as absent cells', true, rendered.some(cell => cell.kind === 'absent'))
	check('all product input events trusted', true,
		results.inputs.every(run => run.events.every(event => event.trusted)))
	check('only explicit plural refusals produce HTTP errors', Array(8).fill(400),
		results.http.map(entry => entry.status))

		results.expectedCancellations = results.health.filter(record => record.kind === 'request'
			&& record.text === 'net::ERR_ABORTED' && /\/property-select\/(context|resolve)\/json\?/.test(record.url)
			&& results.abortedSignals.some(signal => signal.mode === record.mode && signal.url === record.url))
		check('browser console/network health excluding observed metadata signal cancellation', [],
			results.health.filter(record => !results.expectedCancellations.includes(record)))
	results.verdict = 'PASS'
}
catch (error) {
	results.verdict = 'FAIL'
	results.error = { message: error.message, stack: error.stack }
	if (currentPage && !currentPage.isClosed()) {
		await snapshot(currentPage, 'failure').catch(() => {})
		save('failure.html', await currentPage.content().catch(() => ''))
	}
	throw error
}
finally {
	if (appStarted) {
		try { save('executed-sql.json', await (await fetch(`${origin}/property-select-observation/probe/json`)).json()) }
		catch {}
	}
	if (journalStart !== undefined) {
		const journal = readFileSync('/tmp/showtime-property-select-env/queries.log').subarray(journalStart)
		save('mysql-general.log', journal.toString().split('\n').map(line => line.trimEnd()).join('\n'))
		results.journal = { bytes: journal.length, sha256: createHash('sha256').update(journal).digest('hex') }
	}
	if (browser) await browser.close()
	if (appStarted) command('stop-app')
	if (standaloneStarted) command('stop-standalone')
	save('results.json', results)
}
console.log(`PASS: ${results.checks.length} independent browser assertions`)
