import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require('/home/baptiste/.cache/codex-runtimes/codex-primary-runtime'
	+ '/dependencies/node/node_modules/playwright')
const recipe = resolve('node_modules/@itrocks/property-select/docs/orchestration/environment')
const output = resolve(recipe, '../evidence/RETEST-V7-1/state-standalone')
const directory = '/tmp/property-select/RETEST-V7-1-state-standalone'
const url = 'http://127.0.0.1:13912/state-fixture'
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_STANDALONE_PORT: '13912' }
const result = { assertions: [], commands: [], errors: [], console: [], networkFailures: [], screenshots: [],
	seed: 'static catalogue; sessionStorage test port; suggestionLimit 3', url, inputs: [] }
let browser, started = false, viewport
mkdirSync(output, { recursive: true })
function command(action)
{
	result.commands.push({ action, directory, output: execFileSync(process.execPath,
		[recipe + '/control.mjs', action], { env, encoding: 'utf8' }) })
	started = action === 'standalone'
}
function check(name, actual, expected)
{
	result.assertions.push({ name, viewport, actual, expected,
		status: JSON.stringify(actual) === JSON.stringify(expected) ? 'PASS' : 'FAIL' })
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
const main = (page, path) => page.locator(`.ps-main[data-path="${path}"]`)
const branch = page => page.locator('.ps-level').evaluateAll(nodes => nodes.map(node => node.dataset.path))
const suggestions = page => page.locator('.ps-suggestions button')
	.evaluateAll(nodes => nodes.map(node => node.dataset.path))
const state = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('selector'))?.state)
const current = (page, path) => page.waitForFunction(path =>
	document.querySelector('.ps-level[aria-current]')?.dataset.path === path, path)
const settled = page => page.waitForFunction(() => !['loading', 'idle'].includes(
	document.querySelector('.property-select').dataset.searchStatus))
async function screenshot(page, name)
{
	name += `-${viewport.width}x${viewport.height}.png`
	await page.screenshot({ path: output + '/' + name, fullPage: true })
	result.screenshots.push({ name, viewport, url: page.url() })
}
try {
	command('standalone')
	await until(async () => { try { return (await fetch(url)).ok } catch { return false } }, 'Standalone startup')
	browser = await chromium.launch({ headless: true, chromiumSandbox: true })
	result.browser = browser.version()
	for (viewport of [{ width: 1280, height: 720 }, { width: 768, height: 900 },
		{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
		const context = await browser.newContext({ viewport })
		await context.route('**/state-fixture.js', route => route.fulfill({
			contentType: 'text/javascript', path: recipe + '/checks/RETEST-V4-1-standalone-fixture.js'
		}))
		await context.addInitScript(() => {
			window.retestInputs = []
			for (const type of ['click', 'keydown', 'input', 'wheel']) document.addEventListener(type,
				event => window.retestInputs.push({ type, trusted: event.isTrusted }), { capture: true, passive: true })
		})
		const page = await context.newPage()
		page.on('pageerror', error => result.errors.push(error.message))
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type())) result.console.push(message.text())
		})
		page.on('requestfailed', request => result.networkFailures.push({ url: request.url(), error: request.failure() }))
		await page.goto(url)
		await current(page, '')
		check('configured bound and maximal priorities', await suggestions(page),
			['customer.address.city', 'customer.billingAddress.country', 'customer.address'])
		check('metadata label without translator', await page.locator('.ps-suggestions button').first().innerText(),
			'Customer › Address › City')
		await main(page, 'customer').focus()
		await page.keyboard.press('Enter')
		await main(page, 'customer.name').click()
		await until(async () => (await state(page))?.recent[0] === 'customer', 'Confirmed recent')
		check('confirmed terminal destination', (await state(page)).recent, ['customer'])
		check('consumer commits one chosen path', JSON.parse(await page.locator('#chosen').innerText()), ['customer.name'])
		await main(page, 'customer.name').click()
		check('duplicate has no second commit', JSON.parse(await page.locator('#chosen').innerText()), ['customer.name'])
		await page.locator('#reject').click()
		await main(page, 'customer.address').hover()
		await page.locator('.ps-add[data-path="customer.address"]').click()
		await page.waitForFunction(() => document.querySelector('.ps-status').textContent.includes('rejected'))
		check('rejected choice preserves recent', (await state(page)).recent, ['customer'])
		await main(page, 'customer.address').click()
		await main(page, 'customer.address.city').click()
		await main(page, 'customer.address.city.country').click()
		await current(page, 'customer.address.city.country')
		await page.locator('.ps-level[data-path="customer.address"]').click()
		await page.locator('.ps-query').fill('name')
		await until(async () => (await state(page))?.current === 2 && (await state(page))?.query === 'name', 'Saved branch')
		const prior = await state(page)
		await screenshot(page, 'remembered-before')
		await page.locator('#fold').click()
		await page.locator('#fold').click()
		check('fold preserves complete state', await state(page), prior)
		await page.reload()
		await current(page, 'customer.address')
		check('full reload keeps deepest branch', await branch(page),
			['', 'customer', 'customer.address', 'customer.address.city', 'customer.address.city.country'])
		check('full reload keeps query and recents',
			[(await state(page)).query, (await state(page)).recent], ['name', ['customer']])
		await page.locator('.ps-suggestions [data-path="customer"]').click()
		await current(page, 'customer')
		check('shortcut drops remembered suffix', await branch(page), ['', 'customer'])
		check('shortcut clears query', await page.locator('.ps-query').inputValue(), '')
		await page.locator('.ps-level[data-path=""]').click()
		await page.locator('.ps-query').fill('name')
		await settled(page)
		await page.locator('.ps-properties').hover()
		await page.mouse.wheel(0, 400)
		await until(async () => await page.locator('.ps-properties').evaluate(node => node.scrollTop > 0), 'Native wheel')
		const top = await page.locator('.ps-properties').evaluate(node => node.scrollTop)
		await until(async () => (await state(page))?.scroll['properties::name']?.top === top, 'Saved scroll')
		await page.locator('#fold').click()
		await page.locator('#fold').click()
		check('fold restores wheel scroll', await page.locator('.ps-properties').evaluate(node => node.scrollTop), top)
		await page.reload()
		await settled(page)
		await page.waitForFunction(top => document.querySelector('.ps-properties').scrollTop === top, top)
		check('full reload restores wheel scroll',
			await page.locator('.ps-properties').evaluate(node => node.scrollTop), top)
		await screenshot(page, 'restored-after')
		await page.locator('#failure').click()
		await page.locator('.ps-query').fill('failed-local-query')
		await page.locator('[data-action="retry"]').waitFor()
		check('storage failure keeps local query', await page.locator('.ps-query').inputValue(), 'failed-local-query')
		check('storage failure preserves durable query', (await state(page)).query, 'name')
		await screenshot(page, 'storage-failure')
		await page.locator('#failure').click()
		await page.locator('[data-action="retry"]').click()
		await until(async () => (await state(page))?.query === 'failed-local-query', 'Recovered storage')
		check('Retry recovers latest snapshot', (await state(page)).query, 'failed-local-query')
		await page.locator('#configuration').click()
		await until(async () => (await suggestions(page)).includes('customer.billingAddress'), 'Configuration')
		check('changed configuration preserves recents and advice priority', await suggestions(page),
			['customer', 'customer.address', 'customer.billingAddress'])
		await page.locator('.ps-suggestions [data-path="customer.address"]').click()
		await main(page, 'customer.address.city').click()
		await current(page, 'customer.address.city')
		await page.locator('.ps-query').fill('name')
		await until(async () => (await state(page))?.current === 3 && (await state(page))?.query === 'name',
			'Pre-invalidation')
		await page.locator('#invalidate').click()
		await page.reload()
		await current(page, 'customer')
		await settled(page)
		check('invalidated branch truncates', await branch(page), ['', 'customer'])
		check('invalidated suggestions disappear',
			await page.locator('.ps-suggestions [data-path="customer.address"]').count(), 0)
		check('restored query reruns allowed result', await main(page, 'customer.name').count(), 1)
		check('restored query excludes removed paths',
			await page.locator('.ps-main[data-path^="customer.address"]').count(), 0)
		await screenshot(page, 'metadata-restored')
		check('native interactions trusted',
			await page.evaluate(() => window.retestInputs.every(event => event.trusted)), true)
		await page.locator('#expire').click()
		await current(page, '')
		check('ended fixture session clears state', [(await state(page)).branch, (await state(page)).query,
			(await state(page)).recent, (await state(page)).scroll], [[], '', [], {}])
		await context.close()
	}
	check('no browser exceptions', result.errors, [])
	check('no browser console errors', result.console, [])
	result.status = 'PASS'
}
catch (error) {
	result.status = 'FAIL'
	result.failure = { message: error.message, stack: error.stack }
	process.exitCode = 1
}
finally {
	await browser?.close()
	if (started) command('stop-standalone')
	writeFileSync(output + '/results.json', JSON.stringify(result, null, 2) + '\n')
	console.log(JSON.stringify({ status: result.status, assertions: result.assertions.length, failure: result.failure }))
}
