import assert            from 'node:assert/strict'
import { execFileSync }  from 'node:child_process'
import { mkdirSync }     from 'node:fs'
import { readFileSync }  from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'
import { setTimeout }    from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_V5_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V7-1/desktop')
const app = 'http://127.0.0.1:14091'
const demo = 'http://127.0.0.1:14092'
const proof = {
	assertions: [], contexts: [], inputs: [], network: [], errors: [], console: [], sql: [], screenshots: [],
	chromiumSandbox: true, node: process.version, playwright: require(runtime + '/package.json').version,
	seed: 'Synthetic 120 invoice roots; mandatory active scope; static standalone graph',
	checkpoints: Object.fromEntries(['property-select', 'table', 'list', 'home', 'framework'].map(owner => [owner, {
		sha: execFileSync('git', ['-C', 'node_modules/@itrocks/' + owner, 'rev-parse', 'HEAD'],
			{ encoding: 'utf8' }).trim(),
		version: JSON.parse(readFileSync('node_modules/@itrocks/' + owner + '/package.json')).version
	}]))
}
mkdirSync(output, { recursive: true })
let mode, page
function check(name, observed, expected)
{
	const record = { mode, name, observed, expected, status: 'PASS' }
	try { assert.deepEqual(observed, expected) }
	catch { record.status = 'FAIL' }
	proof.assertions.push(record)
	if (record.status === 'FAIL') console.log('FAIL', mode, name, JSON.stringify(observed))
}
async function wait(predicate, label)
{
	for (let i = 0; i < 150; i ++) {
		if (await predicate()) return
		await setTimeout(40)
	}
	throw new Error('Timeout: ' + label)
}
async function picture(name)
{
	const file = `${mode}-${name}.png`
	await page.screenshot({ path: output + '/' + file, fullPage: false })
	proof.screenshots.push(file)
}
const order = () => page.locator('table.objects thead [data-property]')
	.evaluateAll(nodes => nodes.map(node => node.dataset.property))
const state = async context => (await (await context.request.get(app
	+ '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist')).json()).state
const sql = async context => (await (await context.request.get(app
	+ '/property-select-observation/probe/json')).json())
const saves = () => proof.network.filter(item => item.kind === 'save').length
const values = () => proof.network.filter(item => item.kind === 'values').length
async function setup(browser, viewport, url)
{
	const context = await browser.newContext({ viewport })
	proof.contexts.push({ mode, viewport, hasTouch: false, isMobile: false, url })
	await context.exposeBinding('v5Input', (_source, value) => proof.inputs.push({ mode, ...value }))
	await context.addInitScript(() => {
		for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'keydown'])
			document.addEventListener(type, event => {
				window.v5Pointer = event.pointerId ?? window.v5Pointer
				void window.v5Input({ type, trusted: event.isTrusted, pointerType: event.pointerType })
			}, { capture: true, passive: true })
	})
	page = await context.newPage()
	page.on('pageerror', error => proof.errors.push({ mode, error: error.message }))
	page.on('console', entry => {
		if (entry.type() === 'error') proof.console.push({ mode, text: entry.text() })
	})
	page.on('request', request => {
		const url = new URL(request.url())
		const kind = url.searchParams.has('columns') ? 'save'
			: url.searchParams.has('column') ? url.searchParams.has('validate') ? 'admission' : 'values' : undefined
		if (kind) proof.network.push({ mode, kind, url: request.url() })
	})
	page.on('requestfailed', request => (proof.failedRequests ||= []).push({ mode, url: request.url(),
		error: request.failure()?.errorText }))
	await page.goto(url)
	return context
}
async function open()
{
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-main').first().waitFor()
}
async function query(text)
{
	await page.locator('.ps-query').fill(text)
	await wait(async () => ['complete', 'limited', 'empty'].includes(
		await page.locator('.property-select').getAttribute('data-search-status')), 'Search ' + text)
}
async function press(selector)
{
	const node = page.locator(selector).first()
	await node.scrollIntoViewIfNeeded()
	const box = await node.boundingBox()
	await page.mouse.move(box.x + Math.min(box.width / 2, 28), box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(box.x - 25, box.y + box.height / 2, { steps: 8 })
}
async function begin(path, selector = '.ps-main')
{
	await press(`${selector}[data-path="${path}"]`)
	await wait(async () => await page.locator(`table.objects thead [data-property="${path}"]`).count(), 'Preview ' + path)
}
async function point(path, fraction = 0.5)
{
	const rect = await page.locator(`table.objects thead [data-property="${path}"]`).boundingBox()
	const bounds = await page.evaluate(async () => {
		const { getTables } = await import('/@itrocks/table/table.js')
		const table = getTables().find(value => value.element.matches('table.objects'))
		const scroll = table.plugins.TableColumnReorder.scrollContainer()?.getBoundingClientRect()
		const inner = table.plugins.TableFreeze.visibleInnerRect()
		return { left: Math.max(scroll?.left ?? 0, inner.left), right: Math.min(scroll?.right ?? inner.right, inner.right) }
	})
	return { x: Math.max(bounds.left + 12, Math.min(bounds.right - 12, rect.x + rect.width * fraction)),
		y: Math.min(rect.y + rect.height + 80, page.viewportSize().height - 80), bounds }
}
async function move(point)
{
	await page.mouse.move(point.x, point.y, { steps: 12 })
	await setTimeout(100)
}
async function place(path, index)
{
	for (let attempt = 0; attempt < 12; attempt ++) {
		const paths = await order()
		const current = paths.indexOf(path)
		const anchor = paths[current < index ? current + 1 : current - 1]
		if (current === index) {
			await move(await point(path))
			return
		}
		const target = await point(anchor, current < index ? 0.95 : 0.05)
		await move(target)
		await setTimeout(180)
	}
	check('Requested placement is reachable for ' + path, (await order()).indexOf(path), index)
}
async function settle()
{
	await wait(async () => !await page.locator('thead .column-add-provisional').count(), 'Settled transaction')
	await setTimeout(220)
}
async function hold(path, failure = false)
{
	let release, reached = false
	const gate = new Promise(resolve => { release = resolve })
	const pattern = '**/*?column=' + encodeURIComponent(path) + '&rowIds=*'
	await page.route(pattern, async route => {
		const response = await route.fetch()
		reached = true
		await gate
		try {
			await route.fulfill(failure ? { status: 503, contentType: 'application/json',
				body: '{"error":"Independent V5 injected values failure"}' } : { response })
		}
		catch { /* Aborted source or departed document: late response is deliberately discarded. */ }
	})
	return { wait: () => wait(() => reached, 'Real backend response'), release: async () => {
		release()
		await setTimeout(180)
		await page.unroute(pattern)
	} }
}
async function reloaded(expected, context, recents)
{
	await page.reload()
	await open()
	check('Reload exact order/count', await order(), expected)
	check('Reload keeps recents', (await state(context))?.recent ?? [], recents)
	check('All rows align with header count', await page.locator('table.objects tr').evaluateAll(rows =>
		rows.every(row => row.cells.length === rows[0].cells.length)), true)
}
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
proof.browser = browser.version()
try {
	for (const width of [1280, 768]) {
		mode = 'integrated-' + width
		const context = await setup(browser, { width, height: width === 1280 ? 720 : 900 },
			app + '/property-select-invoice')
		await open()
		check('Clean baseline', await order(), ['number', 'amount'])
		await picture('before')
		await query('city name')
		const path = 'customer.address.city.name'
		const journal = readFileSync('/tmp/showtime-property-select-env/queries.log', 'utf8').length
		const beforeSQL = (await sql(context)).length
		const beforeSave = saves(), beforeValues = values()
		const delayed = await hold(path)
		await begin(path)
		await delayed.wait()
		check('Immediate header and one placeholder per row', await page.locator('tbody .column-add-provisional').count(),
			await page.locator('table.objects tbody tr').count())
		for (const [name, fraction] of [['number', 0.1], ['number', 0.9], ['amount', 0.9], ['number', 0.1]]) {
			await move(await point(name, fraction))
			check('No extra request at position ' + name + fraction, values() - beforeValues, 1)
			check('No extra SQL at position ' + name + fraction, (await sql(context)).length - beforeSQL, 1)
		}
		const durable = await (await context.request.post(app + '/v4/gate/json',
			{ data: { operation: 'read' } })).json()
		check('Durable list has no provisional path', JSON.stringify(durable.list ?? {}).includes(path), false)
		check('No provisional configuration save', saves(), beforeSave)
		check('No provisional recent', (await state(context))?.recent ?? [], [])
		check('Selector source retained', await page.locator(`.ps-main[data-path="${path}"]`).count(), 1)
		check('Actual green addition marker', await page.locator('thead .column-add-provisional').evaluate(node =>
			getComputedStyle(node, '::before').content.includes('+')), true)
		await page.locator(`.ps-add[data-path="${path}"]`).focus()
		await page.keyboard.press('Enter')
		await page.locator('.ps-add[data-path="deliveryAddress.city.name"]').focus()
		await page.keyboard.press('Enter')
		await setTimeout(100)
		check('Same and other concurrent add do not persist during preview', saves(), beforeSave)
		check('Concurrent attempts leave unique paths', new Set(await order()).size, (await order()).length)
		await picture('slow-preview')
		await page.mouse.up()
		await settle()
		check('Drop commits before data completes', await order(), [path, 'number', 'amount'])
		check('Committed column remains loading', await page.locator('thead .column-add-loading').count(), 1)
		await delayed.release()
		await wait(async () => !await page.locator('thead .column-add-loading').count(), 'Loaded values')
		check('Real row projection is Paris', (await page.locator('table.objects tbody tr').first()
			.locator('td').allTextContents()).some(text => text.trim() === 'Recipe Paris'), true)
		await wait(async () => (await state(context))?.recent.includes('customer.address.city'), 'Persisted recent')
		proof.sql.push({ mode, entries: (await sql(context)).slice(beforeSQL), journal:
			readFileSync('/tmp/showtime-property-select-env/queries.log', 'utf8').slice(journal) })
		check('SQL uses only loaded row identities', proof.sql.at(-1).entries[0].values.slice(1),
			await page.locator('table.objects tbody input[name=id]').evaluateAll(nodes => nodes.map(node => node.value)))
		let expected = [path, 'number', 'amount']
		await reloaded(expected, context, ['customer.address.city'])
		for (const [newPath, anchor, fraction, expectedNext] of [
			['note', 'number', 0.9, [path, 'number', 'note', 'amount']],
			['issuedAt', 'amount', 0.9, [path, 'number', 'note', 'amount', 'issuedAt']]
		]) {
			await query(newPath === 'issuedAt' ? 'issued' : newPath)
			await begin(newPath)
			await wait(async () => !await page.locator('thead .column-add-loading').count(), 'Preview loaded')
			await place(newPath, expectedNext.indexOf(newPath))
			await page.mouse.up()
			await settle()
			check('Exact accepted insertion ' + newPath, await order(), expectedNext)
			expected = expectedNext
		}
		await query('city name')
		await begin(path)
		await place(path, 4)
		await page.mouse.up()
		await settle()
		expected = ['number', 'note', 'amount', 'issuedAt', path]
		check('Existing path moved to last without duplication', await order(), expected)
		const recents = (await state(context)).recent
		for (const reason of ['above', 'below', 'outside', 'Escape', 'lostcapture']) {
			const before = saves()
			await begin(path)
			await move(await point('number', 0.1))
			if (reason === 'Escape') await page.keyboard.press('Escape')
			else if (reason === 'lostcapture')
				await page.evaluate(() => document.documentElement.releasePointerCapture(window.v5Pointer))
			else await move({ x: reason === 'outside' ? 0 : 200,
				y: reason === 'above' ? 65 : reason === 'below' ? page.viewportSize().height - 5 : 220 })
			await page.mouse.up()
			await settle()
			check('Existing cancellation restores exact order: ' + reason, await order(), expected)
			check('Existing cancellation saves nothing: ' + reason, saves(), before)
			check('Existing cancellation preserves recent: ' + reason, (await state(context)).recent, recents)
		}
		await query('active')
		for (const reason of ['above', 'below', 'outside', 'Escape', 'lostcapture']) {
			const before = saves()
			const delayed = await hold('active')
			await begin('active')
			await delayed.wait()
			await move(await point('number', 0.1))
			if (reason === 'Escape') await page.keyboard.press('Escape')
			else if (reason === 'lostcapture')
				await page.evaluate(() => document.documentElement.releasePointerCapture(window.v5Pointer))
			else await move({ x: reason === 'outside' ? 0 : 200,
				y: reason === 'above' ? 65 : reason === 'below' ? page.viewportSize().height - 5 : 220 })
			await page.mouse.up()
			await delayed.release()
			await settle()
			check('Late cancelled values cannot resurrect: ' + reason, await order(), expected)
			check('New cancellation saves nothing: ' + reason, saves(), before)
		}
		await picture('after-cancellation')
		await reloaded(expected, context, recents)
		await query('active')
		const failed = await hold('active', true)
		await begin('active')
		await failed.wait()
		await failed.release()
		await wait(async () => await page.locator('thead .column-add-error').count(), 'Error preview')
		await move(await point('number', 0.1))
		await page.mouse.up()
		await settle()
		check('Failed values still admit column', (await order()).includes('active'), true)
		const failedOrder = await order(), failedSave = saves()
		await page.locator('.column-retry').click()
		await wait(async () => !await page.locator('thead .column-add-error').count(), 'Retry values')
		check('Retry keeps exact order', await order(), failedOrder)
		check('Retry does not persist another addition', saves(), failedSave)
		await query('city name')
		await begin('customer.address.city', '.ps-result-path button')
		await wait(async () => !await page.locator('thead .column-add-loading').count(), 'Object segment data')
		await setTimeout(150)
		await place('customer.address.city', 0)
		await page.mouse.up()
		await settle()
		check('Intermediate segment transports own path', (await order()).includes('customer.address.city'), true)
		await query('delivery city name')
		const leaving = await hold('deliveryAddress.city.name')
		await begin('deliveryAddress.city.name')
		await leaving.wait()
		if (width === 768) {
			const scrollingValues = values(), scrollingSQL = (await sql(context)).length
			const geometry = async () => page.evaluate(async () => {
				const { getTables } = await import('/@itrocks/table/table.js')
				const table = getTables().find(value => value.element.matches('table.objects'))
				const scroll = table.plugins.TableColumnReorder.scrollContainer()
				const inner = table.plugins.TableFreeze.visibleInnerRect()
				const box = scroll.getBoundingClientRect()
				return { left: Math.max(inner.left, box.left), right: Math.min(inner.right, box.right),
					scroll: scroll.scrollLeft, y: table.element.tHead.getBoundingClientRect().bottom + 50 }
			})
			const initial = await geometry()
			await move({ x: initial.right - 4, y: initial.y })
			await setTimeout(600)
			const right = await geometry()
			check('Real pointer autoscrolls right', right.scroll > initial.scroll + 40, true)
			await move({ x: right.left + 4, y: right.y })
			await setTimeout(600)
			const left = await geometry()
			check('Real pointer autoscrolls left at frozen edge', left.scroll < right.scroll - 40, true)
			proof.autoscroll = { initial, right, left }
			check('Autoscroll adds no value request', values(), scrollingValues)
			check('Autoscroll adds no SQL projection', (await sql(context)).length, scrollingSQL)
		}
		const beforeDeparture = saves()
		await page.getByRole('link', { name: 'Accueil', exact: true }).focus()
		await page.keyboard.press('Enter')
		await wait(async () => !await page.locator('.property-select').count(), 'Real navigation removes source')
		await page.mouse.up()
		await leaving.release()
		check('Departure has no late preview', await page.locator('.column-add-provisional').count(), 0)
		check('Departure saves no preview', saves(), beforeDeparture)
		check('Departed pane never reopens', await page.locator('.right-pane-toggle:visible').count(), 0)
		await picture('departed')
		await context.close()
	}
	check('All browser input is trusted', proof.inputs.every(input => input.trusted), true)
	check('Browser exceptions', proof.errors, [])
	proof.status = proof.assertions.every(value => value.status === 'PASS') ? 'PASS' : 'FAIL'
}
catch (error) {
	proof.status = 'ERROR'
	proof.failure = error.stack
	if (page && !page.isClosed()) {
		await picture('failure')
		proof.failureDOM = await page.locator('body').innerText()
	}
	console.error(error)
}
finally {
	await browser.close()
	const { sql: statements, ...browserProof } = proof
	writeFileSync(output + '/sql.json', JSON.stringify(statements, null, 2) + '\n')
	writeFileSync(output + '/results.json', JSON.stringify({ ...browserProof, sqlEvidence: 'sql.json' }, null, 2)
		+ '\n')
	console.log(proof.status, proof.assertions.length, 'assertions;', output)
	if (proof.status !== 'PASS') process.exitCode = 1
}
