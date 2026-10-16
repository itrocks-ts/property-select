import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-TABLE')
const url = process.env.PS_TABLE_URL || 'http://127.0.0.1:13752/table-fixture'
const results = { url, seed: 'generic opaque ids, two rows, frozen selection/actions', assertions: [], health: [] }
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
results.browser = browser.version()
results.playwright = require(`${runtime}/package.json`).version
results.node = process.version
results.checkpoints = { table: '46adbb2f85105f3f33545f1b4bea9267d1c7c393 + L2-TABLE / 0.3.0',
	tracking: '863c9d1b03aa4672fa4fbb118f71deaa0319fb91 + L2-TABLE / 0.2.4' }
const check = (name, expected, observed) => {
	results.assertions.push({ name, expected, observed, verdict: JSON.stringify(expected) === JSON.stringify(observed)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
try {
	for (const [mode, width, height] of [
		['desktop', 1280, 720], ['narrow', 768, 900], ['portrait', 390, 844], ['landscape', 844, 390]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, colorScheme: mode === 'landscape'
			? 'dark' : 'light', reducedMotion: mode === 'portrait' ? 'reduce' : 'no-preference' })
		const page = await context.newPage()
		const label = name => `${mode}: ${name}`
		const count = () => page.locator('thead th').count()
		const order = () => page.locator('thead th').evaluateAll(headers =>
			headers.map(h => h.dataset.columnId || h.textContent))
		for (const event of ['pageerror', 'requestfailed'])
			page.on(event, error => results.health.push({ mode, event, error: String(error) }))
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type())) results.health.push({ mode, text: message.text() })
		})
		page.on('response', response => {
			if (response.status() >= 400) results.health.push({ mode, status: response.status(), url: response.url() })
		})
		await page.addInitScript(() => {
			window.fixtureInputs = []
			for (const type of ['click', 'keydown', 'pointerdown']) document.addEventListener(type, event =>
				window.fixtureInputs.push({ type, trusted: event.isTrusted, pointer: event.pointerType, key: event.key }), true)
		})
		await page.goto(url)
		await page.waitForFunction(() => !!window.tableRecipe)
		check(label('initial column count'), 6, await count())
		await page.screenshot({ path: `${output}/${mode}-before.png` })
		await page.locator('#add').focus()
		await page.keyboard.press('Space')
		await page.waitForFunction(() => document.querySelector('thead th[data-column-id="opaque/metric:7"]'))
		check(label('keyboard append before frozen actions'), ['Select', 'a', 'b', 'c', 'd', 'opaque/metric:7', 'Actions'],
			await order())
		check(label('keyboard focus preserved'), 'add', await page.evaluate(() => document.activeElement.id))
		check(label('selection preserved'), true, await page.locator('tbody input').first().isChecked())
		await page.waitForFunction(() => document.querySelector('thead th[data-column-id="opaque/metric:7"]')
			.textContent.includes('Metric'))
		check(label('actual loaded body values'), ['Metric opaque/metric:7 / 1', 'Metric opaque/metric:7 / 2'],
			await page.locator('tbody tr td:nth-last-child(2)').allTextContents())
		await page.locator('#add').click()
		check(label('duplicate does not move'), ['Select', 'a', 'b', 'c', 'd', 'opaque/metric:7', 'Actions'], await order())
		check(label('one new commit only'), 1, await page.evaluate(() => window.tableRecipe.events
			.filter(e => e.id === 'opaque/metric:7' && e.state === 'committed').length))
		await page.locator('#focus').focus()
		await page.evaluate(() => {
			window.tableRecipe.addition().reveal('a')
			window.tableRecipe.addition().highlight('a')
		})
		check(label('public reveal/highlight retains input focus'), 'focus',
			await page.evaluate(() => document.activeElement.id))
		const animation = await page.locator('th[data-column-id="a"]').evaluate(n => getComputedStyle(n).animationName)
		check(label('motion preference'), mode === 'portrait' ? 'none' : 'itrocks-column-add-flash', animation)
		await page.waitForFunction(() => !document.querySelector('.column-add-highlight'))
		check(label('flash has no lingering class'), 0, await page.locator('.column-add-highlight').count())
		await page.locator('#slow').dblclick()
		check(label('slow rapid action deduplicates'), 8, await count())
		check(label('committed loading differs from provisional'), true, await page.locator('th[data-column-id="slow"]')
			.evaluate(n => n.classList.contains('column-add-loading') && !n.classList.contains('column-add-provisional')))
		await page.waitForFunction(() => document.querySelector('th[data-column-id="slow"]')
				.textContent.includes('Metric'))
		await page.locator('#fail').click()
		await page.waitForFunction(() => document.querySelector('th[data-column-id="failure"]')
			.classList.contains('column-add-error'))
		check(label('load error retains real column'), 9, await count())
		await page.locator('#retry').click()
		await page.waitForFunction(() => document.querySelector('th[data-column-id="failure"]')
			.textContent.includes('Metric'))
		check(label('retry does not add another column'), 9, await count())
		await page.locator('#invalid').click()
		check(label('creation failure leaves table unchanged'), 9, await count())
		check(label('creation failure never commits'), 0, await page.evaluate(() => window.tableRecipe.events
			.filter(e => e.id === 'invalid' && e.state === 'committed').length))
		await page.locator('#preview').click()
		check(label('preview actual cells'), 3, await page.locator('.column-add-provisional').count())
		await page.locator('#cancel').click()
		await page.waitForTimeout(1700)
		check(label('cancel ignores late values'), 9, await count())
		check(label('cancel has no commit'), 0, await page.evaluate(() => window.tableRecipe.events
			.filter(e => e.id === 'preview' && e.state === 'committed').length))
		await page.locator('#reset').click()
		await page.locator('#add').click()
		check(label('reset retains opaque identity without duplicate'), 9, await count())
		await page.evaluate(() => { document.querySelector('main').scrollLeft = 0 })
		const left = (await page.locator('thead th').first().boundingBox()).x
		await page.evaluate(() => { document.querySelector('main').scrollLeft = 600 })
		check(label('left frozen column remains fixed'), left, (await page.locator('thead th').first().boundingBox()).x)
		check(label('right frozen column at visible edge'), true, await page.locator('thead th').last().evaluate(n =>
			Math.abs(n.getBoundingClientRect().right - document.querySelector('main').getBoundingClientRect().right) < 2))
		await page.screenshot({ path: `${output}/${mode}-after.png` })
		check(label('no document overflow'), true,
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		if (width >= 768) {
			await page.evaluate(() => { document.querySelector('main').scrollLeft = 0 })
			await page.locator('th[data-column-id="a"]').click()
			check(label('reset does not duplicate sort listener'), 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(e => e === 'sort:a').length))
			const frozen = await page.locator('thead th').first().boundingBox()
			await page.mouse.move(frozen.x + 20, frozen.y + 20)
			await page.mouse.down()
			await page.mouse.move(frozen.x + 120, frozen.y - 30, { steps: 8 })
			await page.mouse.up()
			check(label('frozen header cannot reorder or remove'), 9, await count())
			await page.reload()
			await page.waitForFunction(() => !!window.tableRecipe)
			await page.locator('th[data-column-id="a"]').click()
			check(label('native click sorts once'), 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(e => e === 'sort:a').length))
			const a = await page.locator('th[data-column-id="a"]').boundingBox()
			const b = await page.locator('th[data-column-id="b"]').boundingBox()
			await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
			await page.mouse.down()
			await page.mouse.move(b.x + 30, b.y + b.height / 2, { steps: 8 })
			await page.mouse.up()
			check(label('header reorder remains usable'), ['Select', 'b', 'a', 'c', 'd', 'Actions'], await order())
			check(label('drag suppresses sort'), 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(e => e === 'sort:a').length))
			const header = await page.locator('th[data-column-id="a"]').boundingBox()
			await page.mouse.move(header.x + 30, header.y + header.height / 2)
			await page.mouse.down()
			await page.mouse.move(header.x + 30, header.y - 30, { steps: 8 })
			await page.mouse.up()
			check(label('header removal still deletes every row cell'), [5, 5, 5], await page.locator('tr')
				.evaluateAll(rows => rows.map(row => row.cells.length)))
			check(label('colgroup follows removal'), 5, await page.locator('colgroup col').count())
			await page.locator('#slow').click()
			const slow = await page.locator('th[data-column-id="slow"]').boundingBox()
			await page.mouse.move(slow.x + slow.width / 2, slow.y + slow.height / 2)
			await page.mouse.down()
			await page.mouse.move(slow.x + 10, slow.y + slow.height / 2, { steps: 8 })
			await page.waitForFunction(() => document.querySelector('th[data-column-id="slow"]')
				.textContent.includes('Metric'))
			check(label('async header replacement preserves active gesture'), true, await page
				.locator('th[data-column-id="slow"]').evaluate(n => n.classList.contains('column-reorder')))
			await page.mouse.move(slow.x - 40, slow.y + slow.height / 2, { steps: 8 })
			await page.mouse.up()
			check(label('async replacement commits header reorder'), 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(e => e === 'reordered:slow').length))
			check(label('header gesture cleans up after async replacement'), 0,
				await page.locator('th.column-reorder').count())
		}
		const inputs = await page.evaluate(() => window.fixtureInputs)
		check(label('all recorded browser input is trusted'), true,
			inputs.length > 0 && inputs.every(input => input.trusted))
		await context.close()
	}
	check('browser health', [], results.health)
	results.verdict = 'PASS'
	console.log(`PASS: ${results.assertions.length} assertions`)
}
catch (error) {
	results.verdict = 'FAIL'
	results.error = String(error.stack)
	throw error
}
finally {
	writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n')
	await browser.close()
}
