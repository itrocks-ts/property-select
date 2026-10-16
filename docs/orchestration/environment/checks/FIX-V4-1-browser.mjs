import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const recipe = resolve('node_modules/@itrocks/property-select/docs/orchestration/environment')
const output = process.env.PS_V4_OUTPUT || resolve(recipe, '../evidence/FIX-V4-1/additional')
const directory = process.env.PS_V4_DIRECTORY || '/tmp/property-select/FIX-V4-1-additional'
const app = 'http://127.0.0.1:13911'
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_APP_PORT: '13911',
	PS_FRAMEWORK_INITIALIZER: recipe + '/checks/V4-fixture.cjs' }
const endpoint = app + '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist'
const result = { assertions: [], commands: [], errors: [], responses: [], screenshots: [],
	url: app + '/property-select-invoice', viewport: { width: 1280, height: 720 }, input: 'mouse/keyboard',
	seed: 'synthetic invoice fixture; existing database 13316' }
let browser, started = false
mkdirSync(output, { recursive: true })
function command(action)
{
	result.commands.push({ action, directory, output: execFileSync(process.execPath,
		[recipe + '/control.mjs', action], { env, encoding: 'utf8' }) })
	started = action === 'app'
}
function check(name, actual, expected)
{
	result.assertions.push({ name, actual, expected, status: JSON.stringify(actual) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(actual, expected, name)
}
async function until(predicate, message)
{
	for (let i = 0; i < 150; i ++) {
		if (await predicate()) return
		await delay(100)
	}
	throw new Error(message)
}
async function ready()
{
	await until(async () => { try { return (await fetch(app + '/country')).ok } catch { return false } }, 'App startup')
}
const gate = (context, data) => context.request.post(app + '/v4/gate/json', { data })
const session = (context, operation) => context.request.post(app + '/property-select-test/session/json',
	{ data: { operation } })
async function read(context)
{
	const response = await context.request.get(endpoint)
	assert.equal(response.status(), 200)
	return response.json()
}
async function saved(context, predicate)
{
	await until(async () => predicate((await read(context)).state), 'Persisted state')
}
async function open(page)
{
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-query').waitFor({ state: 'visible' })
}
async function settled(page)
{
	await page.waitForFunction(() => !['loading', 'idle'].includes(
		document.querySelector('.property-select').dataset.searchStatus))
}
async function screenshot(page, name)
{
	await page.screenshot({ path: `${output}/${name}.png`, fullPage: true })
	result.screenshots.push(name + '.png')
}
const current = (page, path) => page.waitForFunction(path =>
	document.querySelector('.ps-level[aria-current]')?.dataset.path === path, path)
const main = (page, path) => page.locator(`.ps-main[data-path="${path}"]`)
const stateResponse = page => page.waitForResponse(response =>
	response.url().includes('/property-select/state/json') && response.request().method() === 'PUT')
try {
	command('app')
	await ready()
	browser = await chromium.launch({ headless: true, chromiumSandbox: true })
	result.browser = browser.version()
	const context = await browser.newContext({ viewport: result.viewport })
	const helper = await browser.newContext()
	const page = await context.newPage()
	page.on('pageerror', error => result.errors.push(error.message))
	page.on('response', response => {
		if (response.url().includes('/property-select/state/json') && response.request().method() === 'PUT')
			result.responses.push({ method: 'PUT', status: response.status() })
	})
	await page.goto(result.url)
	await open(page)
	await saved(context, state => state?.query === '')
	for (const operation of ['revoke', 'expire']) {
		await gate(helper, { operation: 'arm', id: operation })
		const response = stateResponse(page)
		await page.locator('.ps-query').fill('obsolete-' + operation)
		await until(async () => (await (await gate(helper, { operation: 'status' })).json()).pending
			.includes(operation), 'Acquired browser PUT')
		await settled(page)
		check(operation + ': session ends', (await session(context, operation)).status(), 200)
		await gate(helper, { operation: 'release', id: operation })
		check(operation + ': acquired browser PUT is 410', (await response).status(), 410)
		await until(async () => (await page.locator('.ps-status').innerText()).includes('Reload the page.'),
			'Reload advice')
		check(operation + ': browser requests Reload', await page.locator('.ps-status').innerText(),
			'The selector session has ended. Reload the page.')
		await screenshot(page, operation + '-reload-guidance')
		const retry = stateResponse(page)
		await page.locator('[data-action="retry"]').click()
		check(operation + ': stale Retry is still 410', (await retry).status(), 410)
		check(operation + ': stale Retry creates no state', (await read(context)).state, undefined)
		command('stop-app')
		command('app')
		await ready()
		check(operation + ': no state after process restart', (await read(context)).state, undefined)
		await page.reload()
		await open(page)
		await current(page, '')
		check(operation + ': full reload clears local query', await page.locator('.ps-query').inputValue(), '')
		await page.locator('.ps-query').fill('recovered-' + operation)
		await saved(context, state => state?.query === 'recovered-' + operation)
		check(operation + ': current generation persists', (await read(context)).state.query, 'recovered-' + operation)
	}
	await gate(helper, { operation: 'failure', enabled: true })
	const failure = stateResponse(page)
	await page.locator('.ps-query').fill('retry-storage-failure')
	check('ordinary transaction error is 500', (await failure).status(), 500)
	await page.locator('[data-action="retry"]').waitFor()
	check('failed save retains local input', await page.locator('.ps-query').inputValue(), 'retry-storage-failure')
	await screenshot(page, 'ordinary-storage-failure')
	await gate(helper, { operation: 'failure', enabled: false })
	const retry = stateResponse(page)
	await page.locator('[data-action="retry"]').click()
	check('ordinary Retry succeeds', (await retry).status(), 200)
	await saved(context, state => state?.query === 'retry-storage-failure')
	await page.locator('[data-action="retry"]').waitFor({ state: 'detached' })
	await page.locator('.ps-query').fill('')
	await main(page, 'customer').click()
	await main(page, 'customer.name').click()
	await saved(context, state => state?.recent[0] === 'customer')
	check('save real list configuration', (await context.request.get(app
		+ '/property-select-invoice/list?columns=number,customer.address.city.name')).status(), 204)
	await page.reload()
	await open(page)
	check('configuration reload renders saved columns', await page.locator('thead th[data-property]')
		.evaluateAll(nodes => nodes.map(node => node.dataset.property)), ['number', 'customer.address.city.name'])
	check('configuration refresh keeps recent and updates used branch', await page.locator('.ps-suggestions button')
		.evaluateAll(nodes => nodes.map(node => node.dataset.path)),
		['customer', 'customer.address.city', 'customer.address', 'deliveryAddress', 'tags'])
	await context.request.get(app + '/property-select-invoice/list?columns=number,customer.name')
	await page.reload()
	await open(page)
	await page.locator('.ps-level[data-path=""]').click()
	await page.locator('.ps-query').fill('name')
	await settled(page)
	await page.locator('.ps-properties').hover()
	await page.mouse.wheel(0, 400)
	await until(async () => (await page.locator('.ps-properties').evaluate(node => node.scrollTop)) > 0, 'Native scroll')
	const scroll = await page.locator('.ps-properties').evaluate(node => node.scrollTop)
	await saved(context, state => state?.scroll['properties::name']?.top === scroll)
	await page.locator('.right-pane-toggle').click()
	await page.locator('.right-pane-toggle').click()
	check('fold retains native wheel position',
		await page.locator('.ps-properties').evaluate(node => node.scrollTop), scroll)
	await page.reload()
	await open(page)
	await page.waitForFunction(top => document.querySelector('.ps-properties').scrollTop === top, scroll)
	check('reload restores native wheel position',
		await page.locator('.ps-properties').evaluate(node => node.scrollTop), scroll)
	await page.locator('.ps-query').fill('')
	await main(page, 'customer').click()
	await main(page, 'customer.address').click()
	await main(page, 'customer.address.city').click()
	await current(page, 'customer.address.city')
	await page.locator('.ps-query').fill('name')
	await saved(context, state => state?.current === 3 && state.query === 'name')
	await session(context, 'invalidate')
	await page.reload()
	await open(page)
	await current(page, 'customer')
	await settled(page)
	check('removed metadata truncates remembered branch', await page.locator('.ps-level')
		.evaluateAll(nodes => nodes.map(node => node.dataset.path)), ['', 'customer'])
	check('removed metadata drops advice',
		await page.locator('.ps-suggestions [data-path="customer.address"]').count(), 0)
	check('truncation preserves and restarts search', await page.locator('.ps-query').inputValue(), 'name')
	check('restarted search contains allowed local result', await main(page, 'customer.name').count(), 1)
	check('restarted search excludes removed paths',
		await page.locator('.ps-main[data-path^="customer.address"]').count(), 0)
	await screenshot(page, 'restored-search')
	await session(context, 'reset')
	check('page exceptions', result.errors, [])
	await helper.close()
	await context.close()
	result.status = 'PASS'
}
catch (error) {
	result.status = 'FAIL'
	result.failure = { message: error.message, stack: error.stack }
	process.exitCode = 1
}
finally {
	await browser?.close()
	if (started) command('stop-app')
	writeFileSync(output + '/results.json', JSON.stringify(result, null, 2) + '\n')
	console.log(JSON.stringify({ status: result.status, assertions: result.assertions.length, failure: result.failure }))
}
