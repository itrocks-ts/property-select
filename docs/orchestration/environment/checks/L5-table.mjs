import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L5/table-contract')
mkdirSync(output, { recursive: true })
const result = { assertions: [], errors: [], kind: 'real DOM public-port fault injection; no native source claim' }
const check = (name, actual, expected) => {
	const status = JSON.stringify(actual) === JSON.stringify(expected) ? 'PASS' : 'FAIL'
	result.assertions.push({ name, actual, expected, status })
	assert.deepEqual(actual, expected, name)
}
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
result.browser = browser.version()
try {
	const page = await browser.newPage({ viewport: { width: 768, height: 900 } })
	page.on('pageerror', error => result.errors.push(error.message))
	await page.goto('http://127.0.0.1:13934/table-fixture')
	await page.waitForFunction(() => window.tableRecipe)
	const original = await page.locator('thead th').allTextContents()
	await page.evaluate(() => {
		const { addition, content, table } = window.tableRecipe
		window.l5 = { sample: x => ({ clientX: x, clientY: document.querySelector('table').getBoundingClientRect().top + 40,
			pointerId: 10, pointerType: 'mouse' }), loads: 0 }
		const source = { id: 'external/opaque', create: () => content('Preview'), load: () => {
			window.l5.loads ++
			return new Promise(resolve => { window.l5.release = () => resolve(content('Loaded')) })
		} }
		window.l5.operation = addition().beginExternal(source, window.l5.sample(650))
		window.l5.right = table().plugins.TableFreeze.visibleInnerRect().right - 5
		window.l5.operation.move(window.l5.sample(window.l5.right))
	})
	await delay(500)
	const rightScroll = await page.locator('main').evaluate(node => node.scrollLeft)
	check('external preview auto-scrolls at visible right edge', rightScroll > 100, true)
	await page.evaluate(() => {
		const left = window.tableRecipe.table().plugins.TableFreeze.visibleInnerRect().left + 5
		window.l5.operation.move(window.l5.sample(left))
	})
	await delay(500)
	check('external preview auto-scrolls at visible left edge',
		await page.locator('main').evaluate(node => node.scrollLeft)
		< rightScroll, true)
	check('movement never reloads values', await page.evaluate(() => window.l5.loads), 1)
	await page.evaluate(() => window.l5.release())
	await delay(100)
	check('asynchronous replacement preserves external marker',
		await page.locator('thead .column-reorder.column-add-provisional')
		.count(), 1)
	await page.screenshot({ path: output + '/external-frozen-preview.png', fullPage: true })
	await page.evaluate(() => window.l5.operation.cancel())
	check('cancel restores exact original columns', await page.locator('thead th').allTextContents(), original)
	for (const mode of ['cancel', 'dispose', 'reset']) {
		await page.reload()
		await page.waitForFunction(() => window.tableRecipe)
		await page.evaluate(mode => {
			const { addition, content, table } = window.tableRecipe
			const rect = table().element.getBoundingClientRect()
			window.late = { resolve: undefined }
			const operation = addition().beginExternal({ id: 'late', create: () => content('Pending'),
				load: () => new Promise(resolve => { window.late.resolve = () => resolve(content('Too late')) }) },
				{ clientX: rect.left + 200, clientY: rect.top + 30, pointerId: 3, pointerType: 'mouse' })
			if (mode === 'cancel') operation.cancel()
			if (mode === 'dispose') addition().dispose()
			if (mode === 'reset') table().reset()
			window.late.resolve()
		}, mode)
		await delay(100)
		check(mode + ': late callback cannot recreate preview', await page.locator('thead th').allTextContents(), original)
		check(mode + ': no remaining movement classes',
			await page.locator('.column-reorder, .column-add-provisional').count(), 0)
	}
	await page.reload()
	await page.waitForFunction(() => window.tableRecipe)
	const concurrent = await page.evaluate(async () => {
		const { addition, content, table } = window.tableRecipe
		const rect = table().element.getBoundingClientRect()
		const sample = { clientX: rect.left + 220, clientY: rect.top + 30, pointerId: 10, pointerType: 'mouse' }
		const operation = addition().beginExternal({ id: 'pending', create: () => content('Pending'),
			accept: () => new Promise(resolve => { window.accept = resolve }) }, sample)
		const finished = operation.finish(sample)
		await Promise.resolve()
		let rejected = false
		try { addition().beginExternal({ id: 'pending', create: () => content('Duplicate') }, sample) }
		catch { rejected = true }
		let live = false
		try { table().plugins.TableColumnReorder.moveColumn(table().element.tHead.rows[0].cells[1], 2) }
		catch { live = true }
		operation.cancel()
		window.accept()
		return { rejected, result: await finished, live }
	})
	check('pending admission retains exclusivity and cancellation wins', concurrent,
		{ rejected: true, result: 'cancelled', live: true })
	await page.reload()
	await page.waitForFunction(() => window.tableRecipe)
	const changed = await page.evaluate(async () => {
		const { addition, content, table } = window.tableRecipe
		const element = table().element
		const extra = element.tBodies[0].rows[0].cloneNode(true)
		const rect = element.getBoundingClientRect()
		const sample = { clientX: rect.left + 180, clientY: rect.top + 30, pointerId: 11, pointerType: 'mouse' }
		const operation = addition().beginExternal({ id: 'new-row', create: () => content('Pending') }, sample)
		operation.move(sample)
		await new Promise(resolve => requestAnimationFrame(resolve))
		element.tBodies[0].append(extra)
		operation.cancel()
		return [...element.rows].map(row => row.cells.length)
	})
	check('changed row view rollback leaves new rows aligned', changed, [6, 6, 6, 6])
	check('browser exceptions', result.errors, [])
	result.status = 'PASS'
}
catch (error) {
	result.status = 'FAIL'
	result.failure = error.stack
	throw error
}
finally {
	await browser.close()
	writeFileSync(output + '/results.json', JSON.stringify(result, null, 2) + '\n')
}
