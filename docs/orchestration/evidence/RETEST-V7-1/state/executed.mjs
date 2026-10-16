import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = process.env.PS_V4_OUTPUT || `${owner}/docs/orchestration/evidence/RETEST-V7-1/state`
const directory = process.env.PS_V4_DIRECTORY || '/tmp/property-select/V4'
const app = 'http://127.0.0.1:13911'
const standalone = 'http://127.0.0.1:13912'
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_APP_PORT: '13911', PS_STANDALONE_PORT: '13912',
	PS_FRAMEWORK_INITIALIZER: `${recipe}/checks/V4-fixture.cjs` }
const result = { assertions: [], errors: [], commands: [], screenshots: [], inputs: [],
	seed: 'synthetic invoice fixture', urls: [app + '/property-select-invoice', standalone + '/state-fixture'] }
const key = '/property-select-invoice/list'
const stateUrl = identity => `${app}/property-select/state/json?${new URLSearchParams({ key: identity || key })}`
const stateValue = query => ({ version: 1, branch: [], current: 0, query, recent: [], scroll: {} })
let browser, appStarted = false, standaloneStarted = false
mkdirSync(output, { recursive: true })
function check(name, actual, expected)
{
	result.assertions.push({ name, actual, expected, status: JSON.stringify(actual) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(actual, expected, name)
}
function command(action)
{
	result.commands.push({ action, directory, output: execFileSync(process.execPath,
		[`${recipe}/control.mjs`, action], { env, encoding: 'utf8' }) })
}
async function until(fn, message)
{
	for (let i = 0; i < 120; i ++) {
		const answer = await fn()
		if (answer) return answer
		await delay(100)
	}
	throw new Error(message)
}
async function ready(url)
{
	await until(async () => { try { return (await fetch(url)).ok } catch { return false } }, url)
}
async function read(context, identity = key)
{
	const response = await context.request.get(stateUrl(identity))
	assert.equal(response.status(), 200)
	return { ...await response.json(), generation: response.headers()['x-property-select-session'] }
}
async function write(context, prior, value, identity = key, method = 'put')
{
	return context.request[method](stateUrl(identity), { headers: { 'X-Property-Select-Session': prior.generation },
		data: { revision: prior.revision, state: value } })
}
async function saved(context, predicate)
{
	return until(async () => {
		const record = await read(context)
		return predicate(record.state) && record
	},
		'Expected state was not persisted')
}
const main = (page, path) => page.locator(`.ps-main[data-path="${path}"]`)
const shortcut = (page, path) => page.locator(`.ps-suggestions [data-path="${path}"]`)
const paths = page => page.locator('.ps-suggestions button').evaluateAll(nodes => nodes.map(n => n.dataset.path))
const branch = page => page.locator('.ps-level').evaluateAll(nodes => nodes.map(n => n.dataset.path))
const current = (page, path) => page.waitForFunction(path =>
	document.querySelector('.ps-level[aria-current]')?.dataset.path === path, path)
async function open(page)
{
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-query').waitFor({ state: 'visible' })
}
async function screenshot(page, name)
{
	await page.screenshot({ path: `${output}/${name}.png`, fullPage: true })
	result.screenshots.push({ name, url: page.url(), viewport: page.viewportSize(), input: 'mouse/keyboard' })
}
const gate = (context, data) => context.request.post(app + '/v4/gate/json', { data })
async function pending(context, id)
{
	await until(async () => (await (await gate(context, { operation: 'status' })).json()).pending.includes(id),
		'HTTP gate not reached')
}
try {
	check('isolated app has no ownership reservation', existsSync(`${directory}/app.pid`), false)
	check('isolated standalone has no ownership reservation', existsSync(`${directory}/standalone.pid`), false)
	// The isolated directory reuses the canonical database; no local database PID is expected.
	result.database = '127.0.0.1:13316; existing synthetic recipe'
	command('app')
	appStarted = true
	command('standalone')
	standaloneStarted = true
	await ready(app + '/country')
	await ready(standalone)
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	result.browser = browser.version()
	for (const viewport of [{ width: 1280, height: 720 }, { width: 768, height: 900 },
		{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
		const context = await browser.newContext({ viewport })
		await context.addInitScript(() => {
			window.v4Inputs = []
			for (const type of ['click', 'input', 'wheel']) document.addEventListener(type,
				event => window.v4Inputs.push({ type, trusted: event.isTrusted }), { capture: true, passive: true })
		})
		const page = await context.newPage()
		page.on('pageerror', error => result.errors.push(error.message))
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type())) result.errors.push(message.text())
		})
		const size = `${viewport.width}x${viewport.height}`
		await page.goto(standalone + '/state-fixture')
		await shortcut(page, 'customer.address.city').waitFor()
		check(`maximal branches ${size}`, await paths(page),
			['customer.address.city', 'customer.billingAddress.country', 'customer.address', 'customer.billingAddress'])
		await main(page, 'customer').click()
		await main(page, 'customer.name').click()
		await shortcut(page, 'customer').waitFor()
		check(`recent ancestor first ${size}`, (await paths(page))[0], 'customer')
		await main(page, 'customer.name').click()
		check(`no duplicate suggestion ${size}`, (await paths(page)).filter(path => path === 'customer').length, 1)
		await main(page, 'customer.address').click()
		await main(page, 'customer.address.city').click()
		await page.locator('.ps-query').fill('name')
		await screenshot(page, `standalone-before-${size}`)
		await shortcut(page, 'customer.billingAddress').click()
		await current(page, 'customer.billingAddress')
		check(`exact divergent shortcut ${size}`, await branch(page), ['', 'customer', 'customer.billingAddress'])
		check(`shortcut clears search ${size}`, await page.locator('.ps-query').inputValue(), '')
		await page.locator('#configuration').click()
		await until(async () => (await paths(page)).length === 3, 'configuration refresh')
		check(`changed configuration retains recent ${size}`, await paths(page),
			['customer', 'customer.address', 'customer.billingAddress'])
		await shortcut(page, 'customer.address').click()
		await page.locator('#invalidate').click()
		await current(page, 'customer')
		check(`removed branch truncated ${size}`, await branch(page), ['', 'customer'])
		await screenshot(page, `standalone-after-${size}`)
		check(`trusted standalone ${size}`, await page.evaluate(() =>
			window.v4Inputs.length > 0 && window.v4Inputs.every(event => event.trusted)), true)
		await page.goto(app + '/property-select-invoice')
		await open(page)
		await main(page, 'customer').click()
		await main(page, 'customer.name').click()
		await saved(context, state => state?.recent[0] === 'customer')
		const headers = () => page.locator('thead th[data-property]')
			.evaluateAll(nodes => nodes.map(n => n.dataset.property))
		const columns = await headers()
		await main(page, 'customer.name').click()
		check(`duplicate keeps exact DOM columns ${size}`, await headers(), columns)
		await page.locator('.ps-level[data-path=""]').click()
		await main(page, 'tags').hover()
		await page.locator('.ps-add[data-path="tags"]').click()
		await delay(200)
		check(`rejected plural keeps recents ${size}`, (await read(context)).state.recent, ['customer'])
		await shortcut(page, 'customer.address').click()
		await main(page, 'customer.address.city').click()
		await main(page, 'customer.address.city.country').click()
		await current(page, 'customer.address.city.country')
		await page.locator('.ps-level[data-path="customer.address"]').click()
		await page.locator('.ps-query').fill('name')
		const prior = await saved(context, state => state?.query === 'name' && state.current === 2)
		await screenshot(page, `integrated-before-${size}`)
		await page.locator('.right-pane-toggle').click()
		await page.locator('.right-pane-toggle').click()
		check(`fold preserves query ${size}`, await page.locator('.ps-query').inputValue(), 'name')
		await page.reload()
		await open(page)
		await current(page, 'customer.address')
		check(`reload exact branch ${size}`, await branch(page),
			['', 'customer', 'customer.address', 'customer.address.city', 'customer.address.city.country'])
		check(`reload query ${size}`, await page.locator('.ps-query').inputValue(), prior.state.query)
		check(`reload recent ${size}`, (await read(context)).state.recent, ['customer'])
		await screenshot(page, `integrated-after-${size}`)
		if (viewport.width === 1280) {
			const second = await browser.newContext({ viewport })
			const otherPage = await second.newPage()
			await otherPage.goto(app + '/property-select-invoice')
			await open(otherPage)
			await otherPage.locator('.ps-query').fill('second-session')
			await saved(second, state => state?.query === 'second-session')
			check('two browser contexts isolate queries', (await read(context)).state.query, 'name')
			check('canonical query variant', (await read(context, key + '?offset=50')).state.query, 'name')
			check('different route is empty', (await read(context, '/property-select-invoice-alt/list')).state, undefined)
			check('identifying segment is empty', (await read(context, '/property-select-invoice/1/list')).state, undefined)
			// Gate starts after the genuine HTTP request has acquired its session snapshot.
			const baseline = await read(context)
			const old = gate(context, { operation: 'write', id: 'old', key, revision: baseline.revision,
				state: stateValue('old') })
			await pending(second, 'old')
			check('newer write first', (await write(context, baseline, stateValue('new'))).status(), 200)
			await gate(second, { operation: 'release', id: 'old' })
			check('late old write conflicts', (await old).status(), 409)
			check('late response cannot overwrite', (await read(context)).state.query, 'new')
			const a = await read(context)
			const stale = gate(context, { operation: 'write', id: 'removed', key, revision: a.revision,
				state: stateValue('removed-old') })
			await pending(second, 'removed')
			const removed = await write(context, a, undefined, key, 'delete')
			check('remove is committed', removed.status(), 200)
			await gate(second, { operation: 'release', id: 'removed' })
			check('tombstone rejects in-flight write', (await stale).status(), 409)
			const tombstone = await read(context)
			check('tombstone has no state', tombstone.state, undefined)
			check('recreate using tombstone revision',
				(await write(context, tombstone, stateValue('recreated'))).status(), 200)
			const slow = gate(context, { operation: 'autosave', id: 'autosave' })
			await pending(second, 'autosave')
			const p = await read(context), q = await read(context, '/property-select-invoice-alt/list')
			const responses = await Promise.all([
				write(context, p, stateValue('race-primary')),
				write(context, q, stateValue('race-alternate'), '/property-select-invoice-alt/list'),
				context.request.get(app + '/property-select-invoice/list?columns=number,amount,customer.name')
			])
			check('concurrent actual state/list requests', responses.map(response => response.status()), [200, 200, 204])
			await gate(second, { operation: 'release', id: 'autosave' })
			check('delayed response autosave finishes', (await slow).status(), 200)
			command('stop-app')
			appStarted = false
			command('app')
			appStarted = true
			await ready(app + '/country')
			const durable = await (await gate(context, { operation: 'read' })).json()
			check('restart keeps first selector', durable.propertySelect[key].state.query, 'race-primary')
			check('restart keeps second selector',
				durable.propertySelect['/property-select-invoice-alt/list'].state.query, 'race-alternate')
			check('restart keeps actual list columns', durable.list['/property-select-invoice'].columns,
				['number', 'amount', 'customer.name'])
			check('restart keeps nested delayed autosave', durable.list['/property-select-invoice'].v4, 'autosave')
			check('restart preserves other browser session', (await read(second)).state.query, 'second-session')
			for (const operation of ['revoke', 'expire']) {
				const before = await read(context)
				const pendingWrite = gate(context, { operation: 'write', id: operation, key,
					revision: before.revision, state: stateValue('must-not-survive') })
				await pending(second, operation)
				await context.request.post(app + '/property-select-test/session/json', { data: { operation } })
				await gate(second, { operation: 'release', id: operation })
				check(`${operation} rejects acquired request`, (await pendingWrite).status(), 410)
				check(`${operation} rejects old browser generation`,
					(await write(context, before, stateValue('stale-generation'))).status(), 410)
				await page.reload()
				await open(page)
				await current(page, '')
				check(`${operation} reload clears state`, (await read(context)).state.query, '')
				check(`${operation} reload clears recent`, (await read(context)).state.recent, [])
			}
			await second.close()
		}
		await context.close()
	}
	result.status = 'PASS'
}
catch (error) {
	result.status = 'FAIL'
	result.failure = { message: error.message, stack: error.stack }
	process.exitCode = 1
}
finally {
	await browser?.close()
	if (appStarted) command('stop-app')
	if (standaloneStarted) command('stop-standalone')
	writeFileSync(`${output}/results.json`, JSON.stringify(result, null, 2) + '\n')
	console.log(JSON.stringify({ status: result.status, assertions: result.assertions.length, failure: result.failure }))
}
