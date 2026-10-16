import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const origin = process.env.PS_LIST_ORIGIN || 'http://127.0.0.1:13819'
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-LIST')
mkdirSync(output, { recursive: true })
const results = { url: origin + '/property-select-invoice', checks: [], health: [], http: [], inputs: [] }
const check = (name, expected, actual) => {
	results.checks.push({ actual, expected, name, verdict: JSON.stringify(actual) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(actual, expected, name)
}
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
results.browser = browser.version()
const column = 'customer.address.city'
const deep = column + '.name'
try {
	for (const [mode, width, height, touch] of [
		['desktop', 1280, 720, false], ['narrow', 768, 900, false],
		['portrait', 390, 844, true], ['landscape', 844, 390, true]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch })
		const page = await context.newPage()
		page.on('response', response => {
			if (response.status() >= 400) results.http.push({ status: response.status(), url: response.url() })
		})
		page.on('pageerror', error => results.health.push({ mode, error: error.message }))
		page.on('console', message => {
			if (['error', 'warning'].includes(message.type()) && !message.text().includes('400 (Bad Request)'))
				results.health.push({ mode, error: message.text() })
		})
		await page.addInitScript(() => {
			window.inputRecords = []
			for (const name of ['click', 'keydown', 'pointerdown']) document.addEventListener(name, event => {
				window.inputRecords.push({ name, pointer: event.pointerType, trusted: event.isTrusted })
			}, true)
		})
		await page.goto(results.url)
		await page.locator('.add-column:not([hidden])').waitFor()
		check(mode + ': folded initial pane', true, await page.locator('.right-pane').isHidden())
		check(mode + ': scope total', true, (await page.locator('.summary').innerText()).includes('61'))
		check(mode + ': first page', 50, await page.locator('tbody tr').count())
		const click = async selector => {
			const target = page.locator(selector)
			if (!touch && await target.evaluate(element => element.classList.contains('ps-add')))
				await target.locator('..').hover()
			return touch ? target.tap() : target.click()
		}
		await page.locator('tbody input[name=id]').first().check()
		await click('.add-column')
		await page.locator('.ps-properties button').first().waitFor()
		for (const path of ['customer', 'customer.address'])
			await click(`button[data-path="${path}"][data-action="activate"]`)
		const prior = await (await context.request.get(origin + '/property-select-observation/probe/json')).json()
		let release
		const held = new Promise(resolve => { release = resolve })
		await page.route('**/*?column=*', async route => { await held; await route.continue() })
		const plus = `button[data-path="${column}"][data-action="select"]`
		await click(plus)
		await click(plus)
		release()
		await page.locator(`th[data-property="${column}"]`).waitFor()
		await page.waitForFunction(path => !document.querySelector(`th[data-property="${path}"]`).classList
			.contains('column-add-loading'), column)
		await page.unroute('**/*?column=*')
		check(mode + ': pending duplicate has one column', 1, await page.locator(`th[data-property="${column}"]`).count())
		check(mode + ': new object rendering', 'Recipe Paris RECIPE FRANCE',
			await page.locator('tbody tr').first().locator('td').last().innerText())
		check(mode + ': click keeps pane open', true, await page.locator('.right-pane').isVisible())
		check(mode + ': click retains address context', 'customer.address',
			await page.locator('[aria-current="location"]').getAttribute('data-path'))
		if (!touch) check(mode + ': selection keeps focus', true, await page.locator(plus)
			.evaluate(element => element === document.activeElement))
		const after = await (await context.request.get(origin + '/property-select-observation/probe/json')).json()
		const statements = after.slice(prior.length)
		check(mode + ': duplicate executes one projection and no rendering reads', 1, statements.length)
		check(mode + ': bounded visible ids and scope', true,
			statements[0].sql.includes(' IN (') && statements[0].sql.includes('active'))
		check(mode + ': scalar representation fields projected', true,
			statements[0].sql.includes('ps_country') && statements[0].sql.includes('ps_city'))
		check(mode + ': added confirmation flashes actual column', true,
			await page.locator(`th[data-property="${column}"]`)
				.evaluate(header => header.classList.contains('column-add-highlight')))
		const order = await page.locator('th[data-property]')
			.evaluateAll(headers => headers.map(header => header.dataset.property))
		await click(plus)
		check(mode + ': existing column keeps order', order,
			await page.locator('th[data-property]').evaluateAll(headers => headers.map(header => header.dataset.property)))
		check(mode + ': existing reveal preserves row selection', true,
			await page.locator('tbody input[name=id]').first().isChecked())
		check(mode + ': existing column needs no query', after.length,
			(await (await context.request.get(origin + '/property-select-observation/probe/json')).json()).length)
		await click(`button[data-path="${column}"][data-action="activate"]`)
		await click(`button[data-path="${deep}"][data-action="activate"]`)
		await page.locator(`th[data-property="${deep}"]`).waitFor()
		check(mode + ': deep terminal matches object', 'Recipe Paris',
			await page.locator('tbody tr').first().locator('td').last().innerText())
		await page.screenshot({ path: `${output}/${mode}-columns.png` })
		await click('.right-pane-toggle')
		check(mode + ': close returns command focus', true,
			await page.locator('.right-pane-toggle').evaluate(element => element === document.activeElement))
		await page.screenshot({ path: `${output}/${mode}-closed.png` })
		const beforeRect = await page.locator('.add-column').boundingBox()
		await page.locator('table.objects').evaluate(table => { table.scrollLeft = table.scrollWidth })
		check(mode + ': header button remains anchored', beforeRect, await page.locator('.add-column').boundingBox())
		check(mode + ': header button in main bounds', true, beforeRect.x + beforeRect.width <= width + 1)
		await click('.add-column')
		check(mode + ': reopen preserves context', deep.slice(0, -5),
			await page.locator('[aria-current="location"]').getAttribute('data-path'))
		await click('button[data-path=""][data-action="navigate"]')
		const beforePluralResponse = await context.request.get(origin + '/property-select-observation/probe/json')
		const beforePlural = (await beforePluralResponse.json()).length
		await click('button[data-path="lines"][data-action="select"]')
		await page.locator('.ps-status').filter({ hasText: 'multiple values' }).waitFor()
		check(mode + ': plural leaves columns intact', 4, await page.locator('th[data-property]').count())
		check(mode + ': plural executes no SQL', beforePlural,
			(await (await context.request.get(origin + '/property-select-observation/probe/json')).json()).length)
		await page.reload()
		await page.locator('.add-column:not([hidden])').waitFor()
		check(mode + ': reload preserves saved paths', ['number', 'amount', column, deep],
			await page.locator('th[data-property]').evaluateAll(headers => headers.map(header => header.dataset.property)))
		check(mode + ': reload renders representative values', 'Recipe Paris RECIPE FRANCE',
			await page.locator('tbody tr').first().locator('td').nth(2).innerText())
		if (mode === 'desktop') {
			await page.locator('table.objects').evaluate(table => { table.scrollTop = table.scrollHeight })
			await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 61)
			check('feed: fixed scope, distinct roots', 61, await page.locator('tbody input[name=id]')
				.evaluateAll(inputs => new Set(inputs.map(input => input.value)).size))
			await page.locator(`th[data-property="${column}"] .label`).click()
			await page.locator(`th[data-property="${column}"][data-sort="1"]`).waitFor()
			await page.locator('.add-column:not([hidden])').waitFor()
			check('sort: replaced view has one selector', 1, await page.locator('.property-select').count())
			const sql = await (await context.request.get(origin + '/property-select-observation/probe/json')).json()
			check('sort: object orders by representation and identity', true,
				sql.some(entry => /ORDER BY.*name.*name.*city_id|ORDER BY.*name.*name.*id/s.test(entry.sql)))
			await page.locator(`input[data-property-filter="${deep}"]`).fill('Recipe Paris')
			await page.locator(`input[data-property-filter="${deep}"]`).press('Enter')
			await page.waitForFunction(() => document.querySelector('.summary')?.textContent.includes('20'))
			check('filter: scoped nested count', true, (await page.locator('.summary').innerText()).includes('20'))
			check('filter: nested value survives rendering', 'Recipe Paris',
				await page.locator(`input[data-property-filter="${deep}"]`).inputValue())
			check('filter: all projected roots match', true, (await page.locator('tbody tr td:last-child').allTextContents())
				.every(value => value === 'Recipe Paris'))
			await page.reload()
			check('filter: session reload retains criterion', 'Recipe Paris',
				await page.locator(`input[data-property-filter="${deep}"]`).inputValue())
			const saved = await context.request.get(origin + '/property-select-invoice/list?columns=number')
			check('hidden filter: removing column saves', 204, saved.status())
			await page.reload()
			check('hidden filter: count persists without displayed path', true,
				(await page.locator('.summary').innerText()).includes('20'))
			await page.goto(origin + '/country')
			check('control: country renders through projection', true,
				(await page.locator('tbody').innerText()).includes('Recipe France'))
			check('cleanup: control route has no registered selector', 0, await page.locator('.property-select').count())
		}
		results.inputs.push({ mode, events: await page.evaluate(() => window.inputRecords) })
		await context.close()
	}
	check('only expected plural refusals reach HTTP error status', Array(4).fill({ status: 400, path: 'lines' }),
		results.http.map(response => ({ status: response.status, path: new URL(response.url).searchParams.get('column') })))
	check('browser health', [], results.health)
}
finally {
	writeFileSync(`${output}/browser.json`, JSON.stringify(results, null, '\t') + '\n')
	await browser.close()
}
console.log(`PASS: ${results.checks.length} browser assertions`)
