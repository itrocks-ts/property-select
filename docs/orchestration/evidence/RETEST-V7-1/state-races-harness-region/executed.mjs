import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { isDeepStrictEqual } from 'node:util'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const recipe = resolve('node_modules/@itrocks/property-select/docs/orchestration/environment')
const output = process.env.PS_V4_OUTPUT || resolve(recipe, '../evidence/RETEST-V7-1/state-races')
const directory = process.env.PS_V4_DIRECTORY || '/tmp/property-select/RETEST-V4-1-challenges'
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
	result.assertions.push({ name, actual, expected, status: isDeepStrictEqual(actual, expected)
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
	page.on('console', message => {
		if (['warning', 'error'].includes(message.type())) (result.console ||= []).push(message.text())
	})
	await page.goto(result.url)
	await open(page)
	await saved(context, state => state?.query === '')
	for (const operation of ['revoke', 'expire']) {
		await page.locator('.ps-query').fill('name')
		await settled(page)
		await page.locator('.ps-properties').hover()
		await page.mouse.wheel(0, 400)
		await until(async () => await page.locator('.ps-properties').evaluate(node => node.scrollTop > 0), 'Wheel position')
		await saved(context, state => state?.scroll['properties::name']?.top > 0)
		await page.locator('.ps-query').fill('')
		await main(page, 'customer').click()
		await main(page, 'customer.name').click()
		await saved(context, state => state?.recent[0] === 'customer')
		await main(page, 'customer.address').click()
		await main(page, 'customer.address.city').click()
		await main(page, 'customer.address.city.country').click()
		await current(page, 'customer.address.city.country')
		await page.locator('.ps-level[data-path="customer.address"]').click()
		await page.locator('.ps-query').fill('name')
		await saved(context, state => state?.current === 2 && state.query === 'name')
		const before = (await read(context)).state
		check(operation + ': nonempty remembered state', [before.branch, before.current, before.recent,
			before.scroll['properties::name'].top > 0], [['customer', 'address', 'city', 'country'], 2, ['customer'], true])
		await screenshot(page, operation + '-nonempty-before')
		await gate(helper, { operation: 'arm', id: operation })
		const response = stateResponse(page)
		await page.locator('.ps-query').fill('must-not-resurrect')
		await until(async () => (await (await gate(helper, { operation: 'status' })).json()).pending
			.includes(operation), 'Acquired PUT')
		await settled(page)
		await session(context, operation)
		await gate(helper, { operation: 'release', id: operation })
		check(operation + ': exact stale response', (await response).status(), 410)
		await until(async () => (await page.locator('.ps-status').innerText()).includes('Reload the page.'),
			'Reload guidance')
		command('stop-app')
		command('app')
		await ready()
		check(operation + ': all durable state absent after restart', (await read(context)).state, undefined)
		await page.reload()
		await open(page)
		await saved(context, state => state?.query === '')
		check(operation + ': all mounted state reset', (await read(context)).state,
			{ version: 1, branch: [], current: 0, query: '', recent: [], scroll: {} })
		await screenshot(page, operation + '-empty-after')
	}
	// Stop the mounted writer while retaining its real session and use production state routes.
	await page.goto(app + '/country')
	const key = '/property-select-invoice/list'
	const alternative = '/property-select-invoice-alt/list'
	const endpointFor = key => app + '/property-select/state/json?' + new URLSearchParams({ key })
	const readKey = async key => {
		const response = await context.request.get(endpointFor(key))
		assert.equal(response.status(), 200)
		return { ...await response.json(), generation: response.headers()['x-property-select-session'] }
	}
	const put = async (key, previous, query) => context.request.put(endpointFor(key), { headers: {
		'X-Property-Select-Session': previous.generation }, data: { revision: previous.revision,
		state: { version: 1, branch: [], current: 0, query, recent: [], scroll: {} } } })
	for (const order of ['autosave-first', 'state-first']) {
		const first = await readKey(key), other = await readKey(alternative)
		await gate(helper, { operation: 'arm', id: 'state-' + order })
		const pending = put(key, first, order)
		await until(async () => (await (await gate(helper, { operation: 'status' })).json()).pending
			.includes('state-' + order), 'Acquired production write')
		const autosave = gate(context, { operation: 'autosave', id: order })
		await until(async () => (await (await gate(helper, { operation: 'status' })).json()).pending.includes(order),
			'Acquired delayed autosave')
		check(order + ': distinct key commits', (await put(alternative, other, 'other-' + order)).status(), 200)
		check(order + ': list config commits', (await context.request.get(app
			+ '/property-select-invoice/list?columns=number,amount,customer.address.city.name')).status(), 204)
		if (order === 'autosave-first') {
			await gate(helper, { operation: 'release', id: order })
			check(order + ': autosave response', (await autosave).status(), 200)
			await gate(helper, { operation: 'release', id: 'state-' + order })
			check(order + ': production write response', (await pending).status(), 200)
		}
		else {
			await gate(helper, { operation: 'release', id: 'state-' + order })
			check(order + ': production write response', (await pending).status(), 200)
			await gate(helper, { operation: 'release', id: order })
			check(order + ': autosave response', (await autosave).status(), 200)
		}
		command('stop-app')
		command('app')
		await ready()
		const durable = await (await gate(context, { operation: 'read' })).json()
		check(order + ': durable selector namespaces', [durable.propertySelect[key].state.query,
			durable.propertySelect[alternative].state.query], [order, 'other-' + order])
		check(order + ': durable real list columns', durable.list['/property-select-invoice'].columns,
			['number', 'amount', 'customer.address.city.name'])
		check(order + ': durable autosave nested edit', durable.list['/property-select-invoice'].v4, order)
	}
	check('no browser exception', result.errors, [])
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
