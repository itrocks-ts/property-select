import assert                  from 'node:assert/strict'
import { mkdirSync }           from 'node:fs'
import { readFileSync }        from 'node:fs'
import { writeFileSync }       from 'node:fs'
import { createRequire }       from 'node:module'
import { resolve }             from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_L7_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/L7')
const app = 'http://127.0.0.1:13981'
const demo = 'http://127.0.0.1:13982'
const proof = { assertions: [], input: [], errors: [], failed: [], requests: [], contexts: [],
	chromiumSandbox: true, playwright: require(runtime + '/package.json').version }
mkdirSync(output, { recursive: true })
let page, mode
function check(name, actual, expected)
{
	let status = 'PASS'
	try { assert.deepEqual(actual, expected) }
	catch { status = 'FAIL'; console.error(mode, name, actual) }
	proof.assertions.push({ mode, name, actual, expected, status })
}
async function until(predicate, name)
{
	for (let attempt = 0; attempt < 160; attempt ++) {
		if (await predicate()) return
		await pause(40)
	}
	throw Error('Timeout: ' + name)
}
async function setup(browser, width, height, url)
{
	const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390,
		isMobile: width === 390 })
	proof.contexts.push({ mode, width, height, url })
	await context.exposeBinding('l7Input', (_source, event) => proof.input.push({ mode, ...event }))
	await context.addInitScript(() => {
		for (const type of ['click', 'keydown', 'pointerdown']) document.addEventListener(type,
			event => window.l7Input({ type, trusted: event.isTrusted }), true)
	})
	page = await context.newPage()
	page.setDefaultTimeout(7000)
	page.on('pageerror', error => proof.errors.push({ mode, message: error.message }))
	page.on('requestfailed', request => proof.failed.push({ mode, url: request.url(), error: request.failure() }))
	page.on('request', request => proof.requests.push({ mode, url: request.url(), resource: request.resourceType() }))
	await page.goto(url)
	return context
}
const rows = () => page.locator('.ps-main').evaluateAll(nodes => nodes.map(node => node.dataset.path))
const order = () => page.locator('table.objects thead th[data-property]')
	.evaluateAll(nodes => nodes.map(node => node.dataset.property))
const sql = async context => (await context.request.get(app + '/property-select-observation/probe/json')).json()
async function open()
{
	await page.locator('.add-column:visible').click()
	await page.locator('.ps-main').first().waitFor()
}
async function hold(matcher)
{
	let arrived = 0, release, done
	const gate = new Promise(resolve => { release = resolve })
	const completed = new Promise(resolve => { done = resolve })
	const handler = async route => {
		const response = await route.fetch()
		arrived ++
		await gate
		try { await route.fulfill({ response }) }
		catch {} // Navigation/disposal deliberately aborts held requests.
		finally { done() }
	}
	await page.route(matcher, handler)
	return { arrived: () => arrived, async release() {
		release()
		await completed
		await page.unroute(matcher, handler)
	} }
}
let browser
try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	proof.browser = browser.version()
	for (const [width, height] of [[1280, 720], [390, 844]]) {
		mode = 'standalone-' + width
		const context = await setup(browser, width, height, demo)
		await page.locator('.ps-main').first().waitFor()
		for (let cycle = 0; cycle < 32; cycle ++) {
			await page.locator('#dispose').click()
			check('Dispose removes owned DOM ' + cycle, await page.locator('.property-select').count(), 0)
			await page.locator('#mount').click()
			await page.locator('.ps-main[data-path="number"]').click()
			check('Remount has one live selector ' + cycle, await page.locator('.property-select').count(), 1)
			check('Remount has one selection listener ' + cycle,
				await page.locator('#intentions [data-type="select"]').count(), cycle + 1)
		}
		await page.locator('#dispose').click()
		const template = await hold(url => url.pathname === '/assets/front/property-select.html')
		await page.locator('#mount').click()
		await until(() => template.arrived() === 1, 'pending template')
		await page.locator('#dispose').click()
		await template.release()
		await pause(100)
		check('Late template never remounts disposed DOM', await page.locator('.property-select').count(), 0)
		await page.locator('#mount').click()
		await page.locator('.ps-main').first().waitFor()
		check('Mount after pending template disposal succeeds', await page.locator('.property-select').count(), 1)
		await page.goto(demo + '/search-fixture?large')
		await page.locator('.ps-query').fill('name')
		await until(async () => await page.locator('.property-select').getAttribute('data-search-status') === 'limited',
			'large search limited')
		const graph = await page.evaluate(() => ({ calls: window.searchFixture.calls, peak: window.searchFixture.peak,
			search: window.searchFixture.search }))
		check('Large browser graph visits 25 contexts', graph.search.visited, 25)
		check('Large graph bounded providers', graph.peak <= 4, true)
		check('Large graph bounded DOM results', await page.locator('.ps-result').count() <= 8, true)
		await page.locator('.ps-query').fill('branch119 name')
		await page.locator('.ps-clear').click()
		check('Clear remains responsive under load', await page.locator('.ps-query').inputValue(), '')
		check('Clear restores 120 ordinary roots', await page.locator('.ps-main').count(), 120)
		await page.screenshot({ path: `${output}/${mode}-load.png` })
		await context.close()
	}
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		mode = 'integrated-' + width
		const context = await setup(browser, width, height, app + '/property-select-invoice')
		await open()
		await page.waitForLoadState('networkidle')
		const initialSQL = (await sql(context)).length
		const failedContext = url => url.pathname === '/property-select/context/json'
			&& url.searchParams.get('path') === 'deliveryAddress'
		await page.route(failedContext, route => route.abort('failed'))
		await page.locator('.ps-main[data-path="deliveryAddress"]').click()
		await until(async () => await page.locator('.ps-status').textContent() !== '', 'network metadata error')
		check('Network failure preserves root context',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), '')
		check('Root properties remain usable', (await rows()).includes('number'), true)
		await page.unroute(failedContext)
		await page.locator('.ps-main[data-path="deliveryAddress"]').click()
		await page.locator('.ps-main[data-path="deliveryAddress.city"]').waitFor()
		check('Retry navigation recovers context',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), 'deliveryAddress')
		check('Metadata network itinerary performs no business SQL', (await sql(context)).length, initialSQL)
		await page.locator('.ps-level[data-path=""]').click()
		await page.waitForLoadState('networkidle')
		const column = url => url.searchParams.get('column') === 'note' && !url.searchParams.has('validate')
		let valueFailure = false
		await page.route(column, route => { valueFailure = true; return route.abort('failed') })
		await page.locator('.ps-main[data-path="note"]').click()
		await until(() => valueFailure, 'click request failed')
		await pause(200)
		check('Failed click retains a visible recoverable error',
			(await page.locator('.ps-status').textContent()).length > 0, true)
		check('Failed click creates no column', (await order()).includes('note'), false)
		check('Value error preserves navigation',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), '')
		await page.unroute(column)
		await page.locator('.ps-main[data-path="note"]').click()
		await until(async () => (await order()).includes('note'), 'click retry')
		check('Click retry adds exactly one column', (await order()).filter(path => path === 'note').length, 1)
		await page.waitForLoadState('networkidle')
		await page.screenshot({ path: `${output}/${mode}-recovered.png` })
		await context.close()
	}
	mode = 'integrated-lifecycle'
	const context = await setup(browser, 1280, 720, app + '/property-select-invoice')
	for (let cycle = 0; cycle < 12; cycle ++) {
		await open()
		check('Dynamic mount has one selector ' + cycle, await page.locator('.property-select').count(), 1)
		check('Dynamic mount has one pane control ' + cycle, await page.locator('.right-pane-toggle:visible').count(), 1)
		await page.getByRole('link', { name: 'Accueil', exact: true }).click()
		await until(async () => await page.locator('.property-select').count() === 0, 'dynamic departure')
		check('Departure removes pane registration ' + cycle, await page.locator('.right-pane-toggle:visible').count(), 0)
		await page.goBack()
		await page.locator('.add-column:visible').waitFor()
	}
	await open()
	const pending = await hold(url => url.pathname === '/property-select/context/json'
		&& url.searchParams.get('path') === 'deliveryAddress')
	await page.locator('.ps-main[data-path="deliveryAddress"]').click()
	await until(() => pending.arrived() === 1, 'pending navigation')
	await page.getByRole('link', { name: 'Accueil', exact: true }).click()
	await until(async () => await page.locator('.property-select').count() === 0, 'pending departure')
	await pending.release()
	await pause(120)
	check('Late metadata cannot resurrect departed owner', await page.locator('.right-pane-toggle:visible').count(), 0)
	await page.goBack()
	await open()
	await page.waitForLoadState('networkidle')
	const state = await hold(url => url.pathname === '/property-select/state/json')
	await page.locator('.ps-query').fill('number')
	await until(() => state.arrived() >= 1, 'pending state write')
	await page.getByRole('link', { name: 'Accueil', exact: true }).click()
	await until(async () => await page.locator('.property-select').count() === 0, 'state departure')
	await state.release()
	await pause(120)
	check('Late state cannot resurrect departed owner', await page.locator('.right-pane-toggle:visible').count(), 0)
	await context.close()
	mode = 'http-permission-json-scope'
	const api = await browser.newContext()
	const get = async path => {
		const response = await api.request.get(app + path)
		const body = await response.json()
		proof.requests.push({ mode, path, status: response.status(), body })
		return { status: response.status(), body }
	}
	const beforeMeta = (await get('/property-select-observation/probe/json')).body.length
	await api.request.post(app + '/property-select-test/session/json', { data: { operation: 'invalidate' } })
	for (const operation of ['context', 'resolve']) {
		const denied = await get(`/property-select/${operation}/json?root=%2Fproperty-select-invoice&path=customer.address.city`)
		check('Full path authorisation ' + operation, denied.status, 403)
	}
	const limited = await get('/property-select/context/json?root=%2Fproperty-select-invoice&path=customer')
	check('Enumeration hides forbidden ancestry', limited.body.properties.some(p => p.name === 'address'), false)
	const deniedColumn = await get('/property-select-invoice/list?column=customer.address.city&rowIds=1,3,5')
	check('Column projection refuses forbidden paths with its documented error shape',
		[deniedColumn.status, deniedColumn.body], [400, { error: 'forbidden' }])
	check('Denied requests issue zero business SQL',
		(await get('/property-select-observation/probe/json')).body.length, beforeMeta)
	await api.request.post(app + '/property-select-test/session/json', { data: { operation: 'reset' } })
	const entities = await get('/property-select-invoice/list/json')
	const expected = Array.from({ length: 120 }, (_, i) => i + 1).filter(id => id <= 4 ? id !== 2 : id % 2 === 1)
	check('Entity JSON returns all 61 authorised roots',
		entities.body.map(row => Number(row.id)).sort((a, b) => a - b), expected)
	check('JSON entities retain ordinary properties', entities.body.every(row => typeof row.number === 'string'
		&& Object.hasOwn(row, 'active') && !Object.keys(row).some(key => key.includes('.'))), true)
	const visible = await get('/property-select-invoice/list?column=customer.address.city&rowIds=1,2,3,7,9,120')
	check('Visible ids intersect mandatory scope', visible.body.rows.map(row => row.id), [1, 3, 7, 9])
	const statements = (await get('/property-select-observation/probe/json')).body
	const projection = statements.at(-1)
	check('Scope and explicit identities are bound in SQL', projection.values, [1, '1', '2', '3', '7', '9', '120'])
	check('Visible reload is one bounded query',
		/ IN \(/.test(projection.sql) && projection.sql.includes('`active` = ?'), true)
	writeFileSync(output + '/integration-sql.json', JSON.stringify(statements, null, 2) + '\n')
	await api.close()
	const scripts = proof.requests.filter(request => request.resource === 'script')
	check('Standalone browser imports stay within the public selector and static fixtures',
		scripts.filter(request => request.mode.startsWith('standalone')).every(request =>
			new URL(request.url).origin === demo && !/@itrocks|\/cjs\//.test(request.url)), true)
	check('Delivered browser imports contain no server/SQL runtime modules', scripts.every(request =>
		!/\/cjs\/|node:|\/(mysql|sql-build|sql-join)\//.test(request.url)), true)
	check('All feature inputs use trusted browser events', proof.input.every(input => input.trusted), true)
	check('No browser exception', proof.errors, [])
	proof.status = proof.assertions.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
}
catch (error) {
	proof.status = 'ERROR'
	proof.failure = error.stack
	console.error(error)
	if (page && !page.isClosed()) await page.screenshot({ path: output + '/failure.png' }).catch(() => {})
}
finally {
	await browser?.close()
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'L7 assertions')
	if (proof.status !== 'PASS') process.exitCode = 1
}
