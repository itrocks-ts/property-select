import assert                  from 'node:assert/strict'
import { execFileSync }        from 'node:child_process'
import { existsSync }          from 'node:fs'
import { mkdirSync }           from 'node:fs'
import { readFileSync }        from 'node:fs'
import { writeFileSync }       from 'node:fs'
import { createRequire }       from 'node:module'
import net                     from 'node:net'
import { resolve }             from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/L4`
const directory = '/tmp/property-select/L4'
const app = 'http://127.0.0.1:13901', standalone = 'http://127.0.0.1:13902'
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_APP_PORT: '13901', PS_STANDALONE_PORT: '13902',
	PS_FRAMEWORK_INITIALIZER: `${recipe}/session/fixture.cjs` }
const result = { input: [], transport: [], checks: [], commands: [], errors: [], screenshots: [],
	seed: 'synthetic invoice fixture',
	urls: [app + '/property-select-invoice', standalone + '/state-fixture'] }
mkdirSync(output, { recursive: true })
function check(name, observed, expected)
{
	result.checks.push({ name, observed, expected,
		status: JSON.stringify(observed) === JSON.stringify(expected) ? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
function command(action)
{
	result.commands.push({ action, env: { PS_ENV_DIRECTORY: directory, PS_APP_PORT: '13901', PS_STANDALONE_PORT: '13902',
		PS_FRAMEWORK_INITIALIZER: env.PS_FRAMEWORK_INITIALIZER },
		stdout: execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' }) })
}
async function ready(url)
{
	for (let attempt = 0; attempt < 100; attempt ++) {
		try { if ((await fetch(url)).ok) return } catch {}
		await delay(100)
	}
	throw new Error(`Unavailable: ${url}`)
}
async function free(port)
{
	await new Promise((yes, no) => {
		const server = net.createServer().once('error', no)
		server.listen(port, '127.0.0.1', () => server.close(yes))
	})
}
const key = '/property-select-invoice/list'
const stateUrl = (identity = key) => `${app}/property-select/state/json?${new URLSearchParams({ key: identity })}`
const generations = new Map()
async function state(context, identity = key)
{
	const response = await context.request.get(stateUrl(identity))
	assert.equal(response.status(), 200, 'State endpoint')
	generations.set(context, response.headers()['x-property-select-session'])
	return response.json()
}
async function waitState(context, predicate)
{
	for (let i = 0; i < 100; i ++) {
		const record = await state(context)
		if (predicate(record.state)) return record
		await delay(100)
	}
	throw new Error('State was not persisted')
}
async function contextPath(page, path)
{
	await page.waitForFunction(path => document.querySelector('.ps-level[aria-current]')?.dataset.path === path, path)
}
const openRelation = (page, path) => page.locator(`.ps-open[data-path="${path}"]`)
const main = (page, path) => page.locator(`.ps-main[data-path="${path}"]`)
const shortcut = (page, path) => page.locator(`.ps-suggestions [data-path="${path}"]`)
async function open(page)
{
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-query').waitFor({ state: 'visible' })
}
let browser, appStarted = false, standaloneStarted = false
try {
	for (const service of ['app', 'standalone']) assert.equal(existsSync(`${directory}/${service}.pid`), false)
	await free(13901); await free(13902)
	command('app'); appStarted = true
	command('standalone'); standaloneStarted = true
	await ready(app + '/country'); await ready(standalone)
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	result.browser = browser.version()
	for (const viewport of [{ width: 1280, height: 720 }, { width: 768, height: 900 },
		{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
		const context = await browser.newContext({ viewport })
		await context.addInitScript(() => {
			window.l4Inputs = []
			for (const type of ['click', 'input', 'wheel']) document.addEventListener(type,
				event => window.l4Inputs.push({ type, trusted: event.isTrusted }), { capture: true, passive: true })
		})
		const page = await context.newPage()
		const suffix = `${viewport.width}x${viewport.height}`
		page.on('pageerror', error => result.errors.push(error.message))
		page.on('response', async response => {
			if (response.url().includes('/property-select/state/')) result.transport.push({ url: response.url(),
				method: response.request().method(), status: response.status(), body: await response.text().catch(() => '') })
		})
		await page.goto(standalone + '/state-fixture')
		await shortcut(page, 'customer.address.city').waitFor()
		check(`standalone maximal used ${suffix}`, await page.locator('.ps-suggestions button').evaluateAll(
			nodes => nodes.map(node => node.dataset.path)),
		['customer.address.city', 'customer.billingAddress.country', 'customer.address', 'customer.billingAddress'])
		await main(page, 'customer').hover()
		await openRelation(page, 'customer').click()
		await main(page, 'customer.name').click()
		await shortcut(page, 'customer').waitFor()
		await page.locator('.ps-query').fill('code')
		await shortcut(page, 'customer.address').click()
		await contextPath(page, 'customer.address')
		check(`shortcut clears query ${suffix}`, await page.locator('.ps-query').inputValue(), '')
		check(`shortcut exact branch ${suffix}`, await page.locator('.ps-level').evaluateAll(
			nodes => nodes.map(n => n.dataset.path)),
			['', 'customer', 'customer.address'])
		await page.locator('#configuration').click()
		await shortcut(page, 'customer.billingAddress.country').waitFor({ state: 'detached' })
		check(`configuration retains recent ${suffix}`,
			await page.locator('.ps-suggestions button').first().getAttribute('data-path'), 'customer')
		await page.locator('#invalidate').click()
		await contextPath(page, 'customer')
		await page.screenshot({ path: `${output}/standalone-${suffix}.png`, fullPage: true })
		result.screenshots.push(`standalone-${suffix}.png`)
		const input = await page.evaluate(() => window.l4Inputs)
		result.input.push({ interface: 'standalone', viewport, events: input })
		check(`trusted standalone input ${suffix}`, input.length > 0 && input.every(event => event.trusted), true)
		await page.goto(app + '/property-select-invoice')
		await open(page)
		await shortcut(page, 'customer.address').waitFor()
		await main(page, 'customer').hover()
		await openRelation(page, 'customer').click()
		await main(page, 'customer.name').click()
		await shortcut(page, 'customer').waitFor()
		const firstRecent = (await waitState(context, value => value?.recent.includes('customer'))).state.recent
		await main(page, 'customer.name').click()
		await delay(200)
		check(`click duplicate leaves recents ${suffix}`, (await state(context)).state.recent, firstRecent)
		await main(page, 'customer.address').hover()
		await openRelation(page, 'customer.address').click()
		await main(page, 'customer.address.city').hover()
		await openRelation(page, 'customer.address.city').click()
		await main(page, 'customer.address.city.country').hover()
		await openRelation(page, 'customer.address.city.country').click()
		await contextPath(page, 'customer.address.city.country')
		await page.locator('.ps-level[data-path="customer.address"]').click()
		await page.locator('.ps-query').fill('name')
		const saved = await waitState(context,
			value => value?.query === 'name' && value.current === 2 && value.branch.length === 4)
		await page.reload(); await open(page); await contextPath(page, 'customer.address')
		check(`reload query ${suffix}`, await page.locator('.ps-query').inputValue(), 'name')
		check(`reload deepest branch ${suffix}`, await page.locator('.ps-level').last().getAttribute('data-path'),
			'customer.address.city.country')
		check(`reload recents ${suffix}`, (await state(context)).state.recent, saved.state.recent)
		await page.screenshot({ path: `${output}/integrated-${suffix}.png`, fullPage: true })
		result.screenshots.push(`integrated-${suffix}.png`)
		if (viewport.width === 1280) {
			const second = await browser.newContext({ viewport })
			check('second actual session starts empty', (await state(second)).state, undefined)
			check('distinct key starts empty', (await state(context, '/property-select-invoice-alt/list')).state, undefined)
			check('query arguments canonicalise to same key', (await state(context, key + '?page=2')).state.query, 'name')
			command('stop-app'); appStarted = false
			command('app'); appStarted = true
			await ready(app + '/country')
			await page.reload(); await open(page); await contextPath(page, 'customer.address')
			check('durable restart keeps query', await page.locator('.ps-query').inputValue(), 'name')
			await page.locator('.ps-level[data-path=""]').click()
			await page.waitForFunction(() =>
				!['loading', 'idle'].includes(document.querySelector('.property-select').dataset.searchStatus))
			await page.locator('.ps-properties').hover()
			await page.mouse.wheel(0, 400)
			await delay(300)
			const scroll = await page.locator('.ps-properties').evaluate(node => node.scrollTop)
			assert.ok(scroll > 0, 'Real wheel scroll moves properties')
			await waitState(context, value => value?.scroll['properties::name']?.top === scroll)
			await page.locator('.right-pane-toggle').click()
			await page.locator('.right-pane-toggle').click()
			check('fold/reopen retains real scroll',
				await page.locator('.ps-properties').evaluate(node => node.scrollTop), scroll)
			await page.reload(); await open(page)
			await page.waitForFunction(top => document.querySelector('.ps-properties').scrollTop === top, scroll)
			check('reload restores real wheel scroll',
				await page.locator('.ps-properties').evaluate(node => node.scrollTop), scroll)
			await context.request.post(app + '/property-select-test/session/json', { data: { operation: 'invalidate' } })
			// Restore a saved deep branch after metadata permissions changed.
			const prior = await state(context)
			await context.request.put(stateUrl(), {
				headers: { 'X-Property-Select-Session': generations.get(context) },
				data: { revision: prior.revision, state: saved.state }
			})
			await page.reload(); await open(page); await contextPath(page, 'customer')
			check('invalid restored branch truncates',
				await page.locator('.ps-level').last().getAttribute('data-path'), 'customer')
			check('invalid advice disappears', await shortcut(page, 'customer.address').count(), 0)
			await context.request.post(app + '/property-select-test/session/json', { data: { operation: 'reset' } })
			await page.route('**/property-select/state/json?*', route => route.request().method() === 'PUT'
				? route.fulfill({ status: 503, body: '{}' }) : route.continue())
			await page.locator('.ps-query').fill('retained locally')
			await page.locator('[data-action="retry"]').waitFor()
			check('storage error preserves local query', await page.locator('.ps-query').inputValue(), 'retained locally')
			await page.unroute('**/property-select/state/json?*')
			await page.locator('[data-action="retry"]').click()
			await waitState(context, value => value?.query === 'retained locally')
			await page.locator('[data-action="retry"]').waitFor({ state: 'detached' })
			for (const operation of ['revoke', 'expire']) {
				const previous = await state(context)
				const oldGeneration = generations.get(context)
				await context.request.post(app + '/property-select-test/session/json', { data: { operation } })
				const stale = await context.request.put(stateUrl(), {
					headers: { 'X-Property-Select-Session': oldGeneration },
					data: { revision: previous.revision, state: previous.state }
				})
				check(`${operation} rejects mounted old session writes`, stale.status(), 410)
				await page.reload(); await open(page); await contextPath(page, '')
				check(`${operation} forgets query`, await page.locator('.ps-query').inputValue(), '')
				check(`${operation} forgets recents`, (await state(context)).state.recent, [])
			}
			await second.close()
		}
		const integratedInput = await page.evaluate(() => window.l4Inputs)
		result.input.push({ interface: 'framework', viewport, events: integratedInput })
		check(`trusted framework input ${suffix}`,
			integratedInput.length > 0 && integratedInput.every(event => event.trusted), true)
		await context.close()
	}
	check('browser exceptions', result.errors, [])
	result.status = 'PASS'
}
catch (error) { result.status = 'FAIL'; result.failure = error.stack; process.exitCode = 1 }
finally {
	await browser?.close()
	if (appStarted) command('stop-app')
	if (standaloneStarted) command('stop-standalone')
	writeFileSync(`${output}/browser.json`, JSON.stringify(result, null, 2) + '\n')
	console.log(JSON.stringify({ status: result.status, checks: result.checks.length, failure: result.failure }))
}
