import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = process.env.PS_L5_OUTPUT
	|| resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L5')
const app = process.env.PS_L5_APP || 'http://127.0.0.1:13933'
const standalone = process.env.PS_L5_STANDALONE || 'http://127.0.0.1:13934'
const proof = { assertions: [], errors: [], console: [], inputs: [], saves: [], values: [], sql: [], screenshots: [] }
mkdirSync(output, { recursive: true })
const check = (name, actual, expected) => {
	proof.assertions.push({ name, actual, expected, status: JSON.stringify(actual) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(actual, expected, name)
}
async function until(predicate, name)
{
	for (let count = 0; count < 120; count ++) {
		if (await predicate()) return
		await delay(50)
	}
	throw new Error('Timed out: ' + name)
}
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
proof.browser = browser.version()
let activePage
async function instrument(context)
{
	await context.exposeBinding('l5Input', (_source, item) => proof.inputs.push(item))
	await context.addInitScript(() => {
		for (const type of ['pointerdown', 'pointermove', 'pointerup', 'keydown'])
			document.addEventListener(type, event => void window.l5Input({ type, trusted: event.isTrusted,
				pointerType: event.pointerType }), { capture: true, passive: true })
	})
}
async function observe(page)
{
	page.on('pageerror', error => proof.errors.push(error.message))
	page.on('console', item => { if (item.type() === 'error') proof.console.push(item.text()) })
	page.on('response', response => {
		if (response.url().includes('?column='))
			(proof.responses ||= []).push({ url: response.url(), status: response.status() })
	})
	page.on('request', request => {
		const url = new URL(request.url())
		if (url.searchParams.has('columns')) proof.saves.push(url.searchParams.get('columns'))
		if (url.searchParams.has('column') && !url.searchParams.has('validate'))
			proof.values.push(url.searchParams.get('column'))
	})
}
async function screenshot(page, name)
{
	await page.screenshot({ path: `${output}/${name}.png`, fullPage: true })
	proof.screenshots.push(name + '.png')
}
const headers = page => page.locator('table.objects thead [data-property]').evaluateAll(nodes =>
	nodes.map(node => node.dataset.property))
const recent = async context => (await (await context.request.get(app
	+ '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist')).json()).state?.recent ?? []
const observations = async context =>
	(await (await context.request.get(app + '/property-select-observation/probe/json')).json())
async function open(page)
{
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-main').first().waitFor()
}
async function search(page, query)
{
	await page.locator('.ps-query').fill(query)
	await until(async () => ['complete', 'limited', 'empty'].includes(
		await page.locator('.property-select').getAttribute('data-search-status')), 'Search completion')
}
async function begin(page, path, selector = '.ps-main')
{
	const source = page.locator(`${selector}[data-path="${path}"]`).first()
	await source.scrollIntoViewIfNeeded()
	const rect = await source.boundingBox()
	await page.mouse.move(rect.x + Math.min(35, rect.width / 2), rect.y + rect.height / 2)
	await page.mouse.down()
	await page.mouse.move(rect.x - 22, rect.y + rect.height / 2, { steps: 5 })
	await until(async () => await page.locator('table.objects thead [data-property="' + path + '"]').count(), 'Preview')
}
async function target(page, side = 'left')
{
	const header = page.locator('table.objects thead [data-property]')
	const rect = await (side === 'left' ? header.first() : header.last()).boundingBox()
	const bounds = await page.evaluate(async () => {
		const { getTables } = await import('/@itrocks/table/table.js')
		const table = getTables().find(table => table.element.matches('table.objects'))
		const scroll = table.plugins.TableColumnReorder.scrollContainer()?.getBoundingClientRect()
		const inner = table.plugins.TableFreeze.visibleInnerRect()
		return { left: Math.max(inner.left, scroll?.left ?? 0), right: Math.min(inner.right, scroll?.right ?? inner.right) }
	})
	return { x: side === 'left' ? Math.max(rect.x + 15, bounds.left + 15)
		: Math.min(rect.x + rect.width - 15, bounds.right - 15), y: rect.y + 130 }
}
async function move(page, point)
{
	await page.mouse.move(point.x, point.y, { steps: 10 })
	await delay(80)
	const geometry = proof.geometry ||= []
	geometry.push({ point, headers: await page.locator('table.objects thead th').evaluateAll(nodes =>
		nodes.map(node => ({ path: node.dataset.property, rect: node.getBoundingClientRect().toJSON() }))) })
}
async function holdValues(page, path, failure = false)
{
	let release, reached = false
	const gate = new Promise(resolve => { release = resolve })
	const pattern = '**/*?column=' + encodeURIComponent(path) + '&rowIds=*'
	await page.route(pattern, async route => {
		const response = await route.fetch()
		reached = true
		await gate
		try {
			if (failure) await route.fulfill({
				status: 503, contentType: 'application/json', body: '{"error":"Synthetic values failure"}'
			})
			else await route.fulfill({ response })
		}
		catch { /* The source may have navigated or aborted while the real response was held. */ }
	})
	return { wait: () => until(() => reached, 'Actual SQL response held'), release: async () => {
		release()
		await delay(150)
		await page.unroute(pattern)
	} }
}
try {
	for (const viewport of [{ width: 1280, height: 720 }, { width: 768, height: 900 }]
		.filter(viewport => !process.env.PS_L5_WIDTH || viewport.width === Number(process.env.PS_L5_WIDTH))) {
		const context = await browser.newContext({ viewport })
		await instrument(context)
		const page = await context.newPage()
		activePage = page
		await observe(page)
		await page.goto(app + '/property-select-invoice')
		await open(page)
		const initial = await headers(page)
		const path = 'customer.address.city.name'
		await search(page, 'city name')
		const sqlBefore = (await observations(context)).length
		const journalBefore = readFileSync('/tmp/showtime-property-select-env/queries.log', 'utf8').length
		const savesBefore = proof.saves.length
		const valuesBefore = proof.values.length
		const gate = await holdValues(page, path)
		await begin(page, path)
		await gate.wait()
		check(`${viewport.width}: placeholders are real table cells`, await page.locator(
			'table.objects tbody .column-add-provisional').count() > 0, true)
		for (const side of ['left', 'right', 'left', 'right', 'left']) await move(page, await target(page, side))
		check(`${viewport.width}: movement makes one value request`, proof.values.length - valuesBefore, 1)
		check(`${viewport.width}: preview does not save columns`, proof.saves.length, savesBefore)
		check(`${viewport.width}: preview does not add recents`, await recent(context), [])
		await page.locator(`.ps-add[data-path="${path}"]`).focus()
		await page.keyboard.press('Enter')
		await delay(80)
		check(`${viewport.width}: overlapping keyboard selection cannot duplicate preview`,
			await page.locator(`thead [data-property="${path}"]`).count(), 1)
		check(`${viewport.width}: preview displays the addition indicator`,
			await page.locator('thead .column-add-provisional').evaluate(node =>
				getComputedStyle(node, '::before').content.includes('+')), true)
		await screenshot(page, `preview-${viewport.width}`)
		await page.mouse.up()
		await until(async () => !await page.locator('thead .column-add-provisional').count(), 'Committed before values')
		await until(() => proof.saves.length > savesBefore, 'Drop persistence')
		check(`${viewport.width}: valid drop commits while values are held`,
			await page.locator('thead .column-add-loading').count(), 1)
		await gate.release()
		await until(async () => !await page.locator('thead .column-add-loading').count(), 'Values completed')
		check(`${viewport.width}: real projected city value`, await page.locator('table.objects tbody tr').first()
			.locator('td').allTextContents().then(values => values.some(value => value.includes('Paris'))), true)
		await until(async () => (await recent(context)).includes('customer.address.city'), 'Added recent')
		const sql = (await observations(context)).slice(sqlBefore)
		proof.sql.push({ viewport, statements: sql, journal: readFileSync('/tmp/showtime-property-select-env/queries.log',
			'utf8').slice(journalBefore) })
		check(`${viewport.width}: preview movement executes one projection`, sql.filter(entry =>
			String(entry.sql).includes('SELECT') && String(entry.sql).includes('ps_invoice')).length, 1)
		const committed = await headers(page)
		check(`${viewport.width}: inserts at accepted position`, committed[0], path)
		const recents = await recent(context)
		await begin(page, path)
		await move(page, await target(page, 'right'))
		await page.mouse.up()
		await until(async () => (await headers(page)).at(-1) === path, 'Existing moved')
		await delay(200)
		check(`${viewport.width}: moving existing keeps one column`,
			(await headers(page)).filter(item => item === path).length, 1)
		check(`${viewport.width}: moving existing keeps recents`, await recent(context), recents)
		const moved = await headers(page)
		for (const reason of ['above', 'below', 'left', 'Escape']) {
			await begin(page, path)
			await move(page, await target(page))
			if (reason === 'Escape') await page.keyboard.press('Escape')
			else await page.mouse.move(reason === 'left' ? 0 : 250, reason === 'above' ? 65 : reason === 'below'
				? viewport.height - 10 : 250)
			await page.mouse.up()
			await delay(100)
			check(`${viewport.width}: existing ${reason} restores order`, await headers(page), moved)
		}
		await search(page, 'issued')
		for (const reason of ['outside', 'Escape']) {
			const slow = await holdValues(page, 'issuedAt')
			const saveCount = proof.saves.length
			await begin(page, 'issuedAt')
			await slow.wait()
			await move(page, await target(page))
			if (reason === 'Escape') await page.keyboard.press('Escape')
			else await page.mouse.move(260, 60)
			await page.mouse.up()
			await slow.release()
			check(`${viewport.width}: new ${reason} leaves no late preview`, await headers(page), moved)
			check(`${viewport.width}: new ${reason} saves nothing`, proof.saves.length, saveCount)
		}
		await search(page, 'note')
		const failed = await holdValues(page, 'note', true)
		await begin(page, 'note')
		await failed.wait()
		await failed.release()
		await until(async () => await page.locator('thead .column-add-error').count(), 'Value error')
		await move(page, await target(page))
		await page.mouse.up()
		await until(async () => !await page.locator('thead .column-add-provisional').count(), 'Error drop accepted')
		check(`${viewport.width}: data failure retains a committed column`, (await headers(page)).includes('note'), true)
		await page.locator('.column-retry').click()
		await until(async () => !await page.locator('thead .column-add-error').count(), 'Value retry')
		await search(page, 'city name')
		await begin(page, 'customer.address.city', '.ps-result-path button')
		await until(async () => !await page.locator('thead .column-add-loading').count(), 'Object preview values')
		await move(page, await target(page))
		await move(page, await target(page))
		await screenshot(page, `object-preview-${viewport.width}`)
		await page.mouse.up()
		await until(async () => !await page.locator('thead .column-add-provisional, thead .column-add-loading').count(),
			'Intermediate object loaded and committed')
		check(`${viewport.width}: result segment inserts its own object path`, (await headers(page))
			.includes('customer.address.city'), true)
		await search(page, 'customer')
		const savedBeforeRejection = proof.saves.length
		await begin(page, 'customer')
		await move(page, await target(page))
		await page.mouse.up()
		await until(async () => !await page.locator('thead [data-property="customer"]').count(), 'Unsupported rollback')
		check(`${viewport.width}: unsupported representation does not persist`, proof.saves.length, savedBeforeRejection)
		await screenshot(page, `committed-${viewport.width}`)
		const beforeReload = await headers(page)
		await page.reload()
		await open(page)
		check(`${viewport.width}: committed order reloads`, await headers(page), beforeReload)
		await search(page, 'issued')
		const leaving = await holdValues(page, 'issuedAt')
		const beforeLeave = proof.saves.length
		await begin(page, 'issuedAt')
		await leaving.wait()
		await page.evaluate(async () => {
			const { xTargetCall } = await import('/@itrocks/xtarget/xtarget.js')
			await xTargetCall('/country', 'main')
		})
		await until(async () => !await page.locator('.property-select').count(), 'Detached view disposed')
		await page.mouse.up()
		await leaving.release()
		check(`${viewport.width}: XTarget departure never resurrects preview`,
			await page.locator('.column-add-provisional').count(), 0)
		check(`${viewport.width}: XTarget departure saves nothing`, proof.saves.length, beforeLeave)
		check(`${viewport.width}: departed pane remains absent`, await page.locator('.right-pane-toggle').isVisible(), false)
		await context.close()
	}
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	await instrument(context)
	const page = await context.newPage()
		activePage = page
	await observe(page)
	await page.goto(standalone)
	await page.locator('.ps-main[data-path="customer"]').click()
	await page.locator('.ps-main[data-path="customer.address"]').click()
	await page.locator('.ps-main[data-path="customer.address.city"]').waitFor()
	const segment = page.locator('.ps-level[data-path="customer"]')
	const rect = await segment.boundingBox()
	await page.mouse.move(rect.x + 20, rect.y + 20)
	await page.mouse.down()
	await page.mouse.move(rect.x + 80, rect.y + 30, { steps: 6 })
	await delay(150)
	await page.mouse.move(800, 400, { steps: 10 })
	await page.mouse.up()
	await until(async () => await page.locator('#intentions [data-type="end"]').count(), 'Generic end')
	check('generic breadcrumb transports its true ancestor path', await page.locator('#intentions [data-type="begin"]')
		.innerText(), 'customer')
	check('generic source has one terminal event and no residual click',
		await page.locator('#intentions [data-type="end"]')
		.count(), 1)
	check('generic source keeps navigation after drag',
		await page.locator('.ps-level[aria-current]').getAttribute('data-path'),
		'customer.address')
	check('generic demo creates no table', await page.locator('table').count(), 0)
	const root = await page.locator('.ps-level[data-path=""]').boundingBox()
	await page.mouse.move(root.x + 15, root.y + 15)
	await page.mouse.down()
	await page.mouse.move(root.x + 100, root.y + 25, { steps: 5 })
	await page.mouse.up()
	check('root never begins a drag', await page.locator('#intentions [data-type="begin"]').count(), 1)
	await page.evaluate(() => document.addEventListener('pointerdown', event => {
		window.l5Pointer = event.pointerId
	}, { once: true }))
	const source = await page.locator('.ps-main[data-path="customer.address.city"]').boundingBox()
	await page.mouse.move(source.x + 20, source.y + 20)
	await page.mouse.down()
	await page.mouse.move(source.x + 100, source.y + 20, { steps: 5 })
	await until(async () => await page.locator('#intentions [data-type="begin"]').count() === 2, 'Second source begin')
	await page.evaluate(() => document.documentElement.releasePointerCapture(window.l5Pointer))
	await page.mouse.move(800, 400)
	await page.mouse.up()
	await until(async () => await page.locator('#intentions [data-type="cancel"]').count() === 1,
		'Lost capture cancellation')
	check('browser lost capture cancels exactly once without end', await page.locator('#intentions [data-type="end"]')
		.count(), 1)
	await page.mouse.move(source.x + 20, source.y + 20)
	await page.mouse.down()
	await page.mouse.move(source.x + 100, source.y + 20, { steps: 5 })
	await until(async () => await page.locator('#intentions [data-type="begin"]').count() === 3, 'Third source begin')
	await page.locator('#dispose').focus()
	await page.keyboard.press('Enter')
	await page.mouse.up()
	check('keyboard disposal cancels the surviving source exactly once',
		await page.locator('#intentions [data-type="cancel"]')
		.count(), 2)
	await page.locator('#mount').click()
	await page.locator('.ps-main[data-path="number"]').click()
	check('remount has one selection listener', await page.locator('#intentions [data-type="select"]').count(), 1)
	await screenshot(page, 'standalone-intentions')
	check('native browser inputs are trusted', proof.inputs.every(input => input.trusted), true)
	check('browser exceptions', proof.errors, [])
	await context.close()
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.failure = error.stack
	if (activePage && !activePage.isClosed()) {
		await screenshot(activePage, 'failure')
		proof.dom = await activePage.locator('body').innerText()
	}
	throw error
}
finally {
	await browser.close()
	writeFileSync(output + '/browser.json', JSON.stringify(proof, null, 2) + '\n')
}
