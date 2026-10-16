import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { isDeepStrictEqual } from 'node:util'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = process.env.PS_FIX_V3_OUTPUT || `${owner}/docs/orchestration/evidence/FIX-V3-1/focused`
const directory = '/tmp/property-select/FIX-V3-1'
const app = 'http://127.0.0.1:13877'
const standalone = 'http://127.0.0.1:13878'
const env = { ...process.env, PS_APP_PORT: '13877', PS_STANDALONE_PORT: '13878', PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/list/fixture.cjs` }
const results = { checks: [], commands: [], inputs: [], health: [], observations: [],
	checkpoint: execFileSync('git', ['-C', owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync(`${owner}/package.json`)).version,
	seed: 'Existing synthetic search graph, focusLimit graph and invoice metadata; no database reset' }
const started = []
let browser, page
function check(name, observed, expected)
{
	results.checks.push({ name, observed, expected, status: isDeepStrictEqual(observed, expected) ? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
function control(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	results.commands.push({ action, stdout, environment: Object.fromEntries(Object.entries(env)
		.filter(([key]) => key.startsWith('PS_'))) })
}
async function ready(url)
{
	for (let i = 0; i < 150; i ++) {
		try { if ((await fetch(url)).ok) return }
		catch {}
		await pause(100)
	}
	throw new Error(`Unavailable ${url}`)
}
const main = path => page.locator(`.ps-main[data-path="${path}"]`)
const paths = () => page.locator('.ps-main').evaluateAll(nodes => nodes.map(node => node.dataset.path))
const status = () => page.locator('.property-select').getAttribute('data-search-status')
const settled = () => page.waitForFunction(() => !['idle', 'loading', undefined].includes(
	document.querySelector('.property-select')?.dataset.searchStatus))
const context = path => page.waitForFunction(path =>
	document.querySelector('[aria-current="location"]')?.dataset.path === path, path)
async function open(integrated, parameters = '')
{
	await page.goto(integrated ? `${app}/property-select-invoice` : `${standalone}/search-fixture${parameters}`)
	if (integrated) await page.locator('.add-column:not([hidden])').click()
	await main(parameters.includes('focusLimit') ? 'slow' : 'tags').waitFor()
}
async function record(name)
{
	results.observations.push({ name, url: page.url(), viewport: page.viewportSize(), paths: await paths(),
		active: await page.evaluate(() => document.activeElement?.dataset.focus), status: await status() })
}
mkdirSync(output, { recursive: true })
try {
	for (const [action, port] of [['app', 13877], ['standalone', 13878]]) {
		assert.equal(existsSync(`${directory}/${action}.pid`), false)
		await new Promise((yes, no) => {
			const server = net.createServer().once('error', no)
			server.listen(port, '127.0.0.1', () => server.close(yes))
		})
		control(action)
		started.push(action)
	}
	await ready(`${app}/country`)
	await ready(standalone)
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	results.browser = browser.version()
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		const bc = await browser.newContext({ viewport: { width, height } })
		page = await bc.newPage()
		await page.addInitScript(() => {
			window.fixInputs = []
			for (const type of ['click', 'input', 'keydown']) document.addEventListener(type, event =>
				window.fixInputs.push({ type, trusted: event.isTrusted }), true)
		})
		page.on('pageerror', error => results.health.push(String(error)))
		// Extend fixture latency only, preserving actual provider calls and browser input.
		await page.route(`${standalone}/search.js`, route => route.fulfill({ contentType: 'text/javascript',
			body: readFileSync(`${recipe}/demo/search.js`, 'utf8').replaceAll('180', '800') }))
		for (const integrated of [false, true]) {
			const label = `${integrated ? 'integrated' : 'standalone'}-${width}`
			// Both failures are recoverable provider failures; no product handler is called by the driver.
			await page.route('**/property-select/context/json?*', async route => {
				if (new URL(route.request().url()).searchParams.get('path') === 'customer')
					await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
				else await route.continue()
			})
			await open(integrated, '?error')
			await page.locator('.ps-query').fill('name')
			await settled()
			check(`${label} recoverable search error`, await status(), 'error')
			await page.locator('.ps-clear').click()
			await main('tags').click()
			await context('tags')
			check(`${label} complete ordinary rows after error/Clear`, await paths(), ['tags.invoices', 'tags.name'])
			check(`${label} no retained ordinary rows`, await page.locator('[data-retained]').count(), 0)
			await page.screenshot({ path: `${output}/${label}-recovered.png` })
			await record(`${label} error recovery`)
			await page.unroute('**/property-select/context/json?*')
			// Retaining a root search row must not leak it into the destination search.
			await open(integrated)
			await page.locator('.ps-query').fill('tags')
			await main('tags').waitFor()
			await main('tags').click()
			await context('tags')
			await settled()
			check(`${label} relation search is local`, (await paths()).every(path => path.startsWith('tags.')), true)
			check(`${label} obsolete root relation removed`, await main('tags').count(), 0)
			await page.locator('.ps-clear').click()
			check(`${label} Clear complete adjacent rows`, await paths(), ['tags.invoices', 'tags.name'])
			for (const plus of [false, true]) {
				if (integrated) await page.route('**/property-select/context/json?*', async route => {
					const response = await route.fetch()
					if (new URL(route.request().url()).searchParams.get('path') === 'customer') await pause(800)
					await route.fulfill({ response })
				})
				await open(integrated)
				await page.locator('.ps-query').fill('name')
				await main('tags.name').waitFor()
				await page.keyboard.press('Tab')
				await page.keyboard.press('Tab')
				if (plus) await page.keyboard.press('Tab')
				const action = plus ? 'select' : 'main'
				check(`${label} ${action} keyboard focus`, await page.evaluate(() =>
					document.activeElement?.dataset.focus), `${action}:tags.name`)
				await page.evaluate(() => { window.fixFocus = document.activeElement })
				check(`${label} ${action} captured during pending enrichment`, await status(), 'loading')
				await settled()
				check(`${label} ${action} exact focus survives`, await page.evaluate(() =>
					window.fixFocus === document.activeElement && window.fixFocus.isConnected), true)
				await record(`${label} ${action} enrichment`)
				if (integrated) await page.unroute('**/property-select/context/json?*')
				if (integrated) {
					// Exercise the real integration's default 100-row budget with supplemental metadata only.
					await page.route('**/property-select/context/json?*', async route => {
						const response = await route.fetch()
						if (new URL(route.request().url()).searchParams.get('path') !== 'customer') {
							await route.fulfill({ response })
							return
						}
						const body = await response.json()
						body.properties.push(...Array.from({ length: 101 }, (_, index) => ({
							kind: 'terminal', label: `Budget name ${index}`, name: `budgetName${index}`,
							order: index - 200, path: `customer.budgetName${index}`
						})))
						await pause(800)
						await route.fulfill({ response, json: body })
					})
					await open(true)
					await page.locator('.ps-query').fill('name')
					await main('tags.name').waitFor()
					await page.keyboard.press('Tab')
					await page.keyboard.press('Tab')
					if (plus) await page.keyboard.press('Tab')
					await page.evaluate(() => { window.fixFocus = document.activeElement })
					await settled()
					const budget = `${label} ${action} default budget`
					check(`${budget} exact focused button retained`, await page.evaluate(() =>
						window.fixFocus === document.activeElement && window.fixFocus.isConnected), true)
					check(`${budget} 100-row ceiling`, (await paths()).length, 100)
					check(`${budget} obsolete rank retained until blur`, await paths().then(paths =>
						paths.at(-1)), 'tags.name')
					const response = page.waitForResponse(response =>
						new URL(response.url()).searchParams.get('column') === 'tags.name')
					await page.keyboard.press('Enter')
					check(`${budget} retained action reaches real plural refusal`, (await response).status(), 400)
					await page.locator('.ps-query').click()
					await main('tags.name').waitFor({ state: 'detached' })
					check(`${budget} final rank after blur`, (await paths()).every(path =>
						path.startsWith('customer.budgetName')), true)
					check(`${budget} retained marker released`, await page.locator('[data-retained]').count(), 0)
					await record(budget)
					await page.unroute('**/property-select/context/json?*')
				}
			}
			check(`${label} trusted inputs`, await page.evaluate(() =>
				window.fixInputs.length > 0 && window.fixInputs.every(input => input.trusted)), true)
			results.inputs.push({ label, events: await page.evaluate(() => window.fixInputs) })
		}
		for (const plus of [false, true]) {
			await open(false, '?focusLimit')
			await page.locator('.ps-query').fill('name')
			await main('slow.name').waitFor()
			await page.keyboard.press('Tab')
			await page.keyboard.press('Tab')
			if (plus) await page.keyboard.press('Tab')
			await page.evaluate(() => { window.fixFocus = document.activeElement })
			await settled()
			const label = `budget-${width}-${plus ? 'plus' : 'main'}`
			check(`${label} retained focus identity`, await page.evaluate(() =>
				window.fixFocus === document.activeElement && window.fixFocus.isConnected), true)
			check(`${label} one visible retained row`, await paths(), ['slow.name'])
			await page.keyboard.press('Enter')
			await page.locator('#intentions li').waitFor()
			check(`${label} retained action emits exact path once`, await page.locator('#intentions li').allTextContents(),
				['slow.name'])
			await page.locator('.ps-query').click()
			await main('fast.name').waitFor()
			check(`${label} final ranking after blur`, await paths(), ['fast.name'])
			check(`${label} retained marker removed`, await page.locator('[data-retained]').count(), 0)
			await record(label)
		}
		await bc.close()
	}
	check('No browser exceptions', results.health, [])
	results.status = 'PASS'
}
catch (error) {
	results.status = 'FAIL'
	results.failure = String(error)
	if (page) {
		await page.screenshot({ path: `${output}/failure.png` }).catch(() => {})
		await record('failure').catch(() => {})
	}
	process.exitCode = 1
}
finally {
	await browser?.close()
	for (const action of started.reverse()) control(`stop-${action}`)
	writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n')
}
console.log(JSON.stringify({ status: results.status, checks: results.checks.length, failure: results.failure }))
