import assert               from 'node:assert/strict'
import { execFileSync }     from 'node:child_process'
import { mkdirSync }        from 'node:fs'
import { readFileSync }     from 'node:fs'
import { writeFileSync }    from 'node:fs'
import { createRequire }    from 'node:module'
import { resolve }          from 'node:path'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_TABLE_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/V2-TABLE')
const url = process.env.PS_TABLE_URL || 'http://127.0.0.1:13762/table-fixture'
const checkpoint = owner => ({
	sha: execFileSync('git', ['-C', `node_modules/@itrocks/${owner}`, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync(`node_modules/@itrocks/${owner}/package.json`)).version
})
const result = {
	assertions: [], contexts: [], health: [], inputs: [], requests: [], url,
	seed: 'public generic table fixture: two rows A1..D2, opaque ids, frozen Select/Actions',
	checkpoints: { table: checkpoint('table'), tracking: checkpoint('property-select') },
	node: process.version, playwright: require(`${runtime}/package.json`).version, chromiumSandbox: true
}
const initial = ['Select', 'a', 'b', 'c', 'd', 'Actions']
const metric = 'opaque/metric:7'
mkdirSync(output, { recursive: true })
let browser
let currentPage
let mode

function verify(name, expected, observed)
{
	const record = { mode, name, expected, observed, verdict: 'PASS' }
	try { assert.deepEqual(observed, expected, `${mode}: ${name}`) }
	catch { record.verdict = 'FAIL' }
	finally { result.assertions.push(record) }
}

async function snapshot(page)
{
	return page.evaluate(() => {
		const table = document.querySelector('table')
		return {
			cols: table.querySelectorAll('colgroup col').length,
			order: Array.from(table.tHead.rows[0].cells, cell => cell.dataset.columnId || cell.textContent),
			rows: Array.from(table.tBodies[0].rows, row => Array.from(row.cells, cell =>
				cell.querySelector('input') ? `checked:${cell.querySelector('input').checked}` : cell.textContent))
		}
	})
}

async function structure(page, name, order, loading = [])
{
	const observed = await snapshot(page)
	verify(`${name}: exact header/colgroup/body alignment`, {
		cols: order.length,
		order,
		rows: [1, 2].map(row => order.map(id => id === 'Select' ? `checked:${row === 1}`
			: id === 'Actions' ? 'Open' : loading.includes(id) ? `Loading / ${row}`
				: ['a', 'b', 'c', 'd'].includes(id) ? `${id.toUpperCase()}${row}` : `Metric ${id} / ${row}`))
	}, observed)
}

async function fresh(page)
{
	await page.goto(url)
	await page.waitForFunction(() => !!window.tableRecipe)
}

async function eventCount(page, id, state)
{
	return page.evaluate(({ id, state }) => window.tableRecipe.events
		.filter(event => event.id === id && event.state === state).length, { id, state })
}

async function loaded(page, id)
{
	await page.waitForFunction(id => Array.from(document.querySelectorAll('thead th'))
		.some(header => header.dataset.columnId === id && header.textContent === `Metric ${id}`), id)
}

async function drag(page, id, target)
{
	const cell = page.locator(`th[data-column-id="${id}"]`)
	await cell.scrollIntoViewIfNeeded()
	const box = await cell.boundingBox()
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
	await page.mouse.down()
	await page.mouse.move(target.x, target.y, { steps: 14 })
	await page.mouse.up()
}

try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	result.browser = browser.version()
	for (const entry of [
		{ mode: 'desktop', width: 1280, height: 720 },
		{ mode: 'narrow', width: 768, height: 900 },
		{ mode: 'portrait', width: 390, height: 844, reducedMotion: 'reduce' },
		{ mode: 'landscape', width: 844, height: 390, colorScheme: 'dark' }
	]) {
		mode = entry.mode
		const context = await browser.newContext({ viewport: { width: entry.width, height: entry.height },
			colorScheme: entry.colorScheme || 'light', reducedMotion: entry.reducedMotion || 'no-preference' })
		result.contexts.push({ ...entry, input: 'trusted mouse and keyboard', hasTouch: false, isMobile: false, url })
		const page = currentPage = await context.newPage()
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type())) result.health.push({ mode, type: message.type(),
				text: message.text() })
		})
		page.on('pageerror', error => result.health.push({ mode, type: 'pageerror', text: String(error) }))
		page.on('requestfailed', request => result.health.push({ mode, type: 'requestfailed', url: request.url(),
			failure: request.failure() }))
		page.on('response', response => {
			result.requests.push({ mode, url: response.url(), status: response.status() })
			if (response.status() >= 400) result.health.push({ mode, type: 'HTTP', status: response.status() })
		})
		await page.addInitScript(() => {
			window.verifierInputs = []
			for (const name of ['pointerdown', 'pointerup', 'keydown', 'click'])
				document.addEventListener(name, event => window.verifierInputs.push({ type: name,
					trusted: event.isTrusted, key: event.key, pointerType: event.pointerType }), true)
		})
		await fresh(page)
		await structure(page, 'fresh page', initial)
		await page.screenshot({ path: `${output}/${mode}-before.png`, fullPage: true })
		await page.locator('#add').click()
		await structure(page, 'immediate real loading column', [...initial.slice(0, -1), metric, 'Actions'], [metric])
		verify('loading cells busy and committed, no provisional', [3, 0], [
			await page.locator('[aria-busy="true"]').count(), await page.locator('.column-add-provisional').count()
		])
		await loaded(page, metric)
		await structure(page, 'asynchronous values', [...initial.slice(0, -1), metric, 'Actions'])
		verify('one commit', 1, await eventCount(page, metric, 'committed'))
		verify('one asynchronous completion', 1, await eventCount(page, metric, 'loaded'))
		// Public reveal/highlight have no gesture of their own: retain real typed input while invoking their contract.
		await page.locator('#focus').click()
		await page.keyboard.press('End')
		await page.keyboard.type(' kept')
		await page.evaluate(() => {
			document.querySelector('main').scrollLeft = 0
			window.tableRecipe.addition().reveal('opaque/metric:7')
			window.tableRecipe.addition().highlight('opaque/metric:7')
		})
		verify('reveal retains typed input and focus', ['focus', 'Untouched input kept'], await page.evaluate(() =>
			[document.activeElement.id, document.querySelector('#focus').value]))
		verify('metric maximally visible between frozen edges', true, await page.locator(`th[data-column-id="${metric}"]`)
			.evaluate(header => {
				const box = header.getBoundingClientRect()
				const cells = header.parentElement.cells
				const left = cells[0].getBoundingClientRect().right
				const right = cells[cells.length - 1].getBoundingClientRect().left
				const visible = Math.max(0, Math.min(box.right, right) - Math.max(box.left, left))
				return visible + 2 >= Math.min(box.width, right - left)
			}))
		verify('same flash reaches every column cell', 3, await page.locator('.column-add-highlight').count())
		const visual = await page.locator(`th[data-column-id="${metric}"]`).evaluate(cell => ({
			animation: getComputedStyle(cell).animationName, outline: getComputedStyle(cell).outlineStyle,
			background: getComputedStyle(cell).backgroundColor,
			keyframes: cell.getAnimations().flatMap(animation => animation.effect.getKeyframes()
				.map(frame => frame.backgroundColor).filter(Boolean))
		}))
		result.contexts.at(-1).flash = visual
		verify('motion setting', entry.reducedMotion ? 'none' : 'itrocks-column-add-flash', visual.animation)
		if (entry.reducedMotion) verify('reduced motion visible outline', 'solid', visual.outline)
		else verify('green then light keyframes exist', true, visual.keyframes.length >= 2)
		await page.screenshot({ path: `${output}/${mode}-flash.png` })
		await page.waitForFunction(() => !document.querySelector('.column-add-highlight'))
		verify('flash clears', 0, await page.locator('.column-add-highlight').count())
		await page.locator('#add').focus()
		await page.keyboard.press('Enter')
		verify('keyboard existing outcome', 'existing', await page.locator('#status').textContent())
		verify('keyboard focus stays on trigger', 'add', await page.evaluate(() => document.activeElement.id))
		verify('duplicate no commit or reload', [1, 1], [await eventCount(page, metric, 'committed'),
			await eventCount(page, metric, 'loaded')])
		await page.locator('#slow').dblclick()
		const additions = [...initial.slice(0, -1), metric, 'slow', 'Actions']
		await structure(page, 'rapid pending duplicate', additions, ['slow'])
		verify('slow committed once before load', [1, 0], [await eventCount(page, 'slow', 'committed'),
			await eventCount(page, 'slow', 'loaded')])
		await loaded(page, 'slow')
		await structure(page, 'slow complete', additions)
		await page.locator('#fail').click()
		await page.waitForFunction(() => document.querySelector('th[data-column-id="failure"]')
			.classList.contains('column-add-error'))
		const withFailure = [...additions.slice(0, -1), 'failure', 'Actions']
		await structure(page, 'recoverable error retains placeholders', withFailure, ['failure'])
		verify('error visibly marked on all cells', 3, await page.locator('.column-add-error').count())
		await page.locator('#retry').click()
		await loaded(page, 'failure')
		await structure(page, 'retry values without duplicate', withFailure)
		verify('retry one commit/error/load', [1, 1, 1], [await eventCount(page, 'failure', 'committed'),
			await eventCount(page, 'failure', 'error'), await eventCount(page, 'failure', 'loaded')])
		await page.locator('#invalid').click()
		verify('creation failure visible', true, (await page.locator('#status').textContent()).includes('creation failure'))
		await structure(page, 'creation failure changes no cells', withFailure)
		verify('creation failure no commit', 0, await eventCount(page, 'invalid', 'committed'))
		await page.locator('#preview').click()
		verify('provisional cells and no commit', [3, 0], [await page.locator('.column-add-provisional').count(),
			await eventCount(page, 'preview', 'committed')])
		await page.locator('#cancel').click()
		await page.waitForTimeout(1700)
		await structure(page, 'cancel ignores late async values', withFailure)
		verify('cancel no provisional remnants', 0, await page.locator('.column-add-provisional').count())
		await page.locator('#reset').click()
		await page.locator('#reset').click()
		await page.locator('#add').click()
		await structure(page, 'repeated reset retains ids', withFailure)
		verify('reset existing never recommits', 1, await eventCount(page, metric, 'committed'))
		await page.evaluate(() => { document.querySelector('main').scrollLeft = 0 })
		const frozenLeft = (await page.locator('th[data-freeze]').first().boundingBox()).x
		await page.locator('main').click({ position: { x: 10, y: 100 } })
		await page.keyboard.press('End')
		await page.mouse.wheel(1100, 0)
		await page.waitForTimeout(120)
		verify('frozen edges after horizontal input', [true, true], await page.evaluate(left => {
			const table = document.querySelector('table')
			const first = table.tHead.rows[0].cells[0].getBoundingClientRect()
			const last = table.tHead.rows[0].lastElementChild.getBoundingClientRect()
			return [Math.abs(first.left - left) < 2,
				Math.abs(last.right - document.querySelector('main').getBoundingClientRect().right) < 2]
		}, frozenLeft))
		verify('responsive document does not overflow', true, await page.evaluate(() =>
			document.documentElement.scrollWidth <= innerWidth))
		await page.screenshot({ path: `${output}/${mode}-after.png` })
		result.inputs.push({ mode, phase: 'add/error/reset', events: await page.evaluate(() => window.verifierInputs) })
		// Start regression on fresh DOM, then test exact row values after native header operations.
		await fresh(page)
		await page.locator('#reset').click()
		await page.locator('#reset').click()
		await page.locator('th[data-column-id="a"]').click()
		verify('one sort listener after repeated reset', 1, await page.evaluate(() =>
			window.tableRecipe.events.filter(event => event === 'sort:a').length))
		if (entry.width >= 768) {
			const beta = await page.locator('th[data-column-id="b"]').boundingBox()
			await drag(page, 'a', { x: beta.x + beta.width * 0.75, y: beta.y + beta.height / 2 })
			await structure(page, 'header reorder', ['Select', 'b', 'a', 'c', 'd', 'Actions'])
			verify('reorder does not sort', 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(event => event === 'sort:a').length))
			const alpha = await page.locator('th[data-column-id="a"]').boundingBox()
			await drag(page, 'a', { x: alpha.x + 25, y: alpha.y - 30 })
			await structure(page, 'header delete', ['Select', 'b', 'c', 'd', 'Actions'])
			const frozen = await page.locator('th[data-freeze]').first().boundingBox()
			await page.mouse.move(frozen.x + 20, frozen.y + 20)
			await page.mouse.down()
			await page.mouse.move(frozen.x + 130, frozen.y - 40, { steps: 10 })
			await page.mouse.up()
			await structure(page, 'frozen origin protected', ['Select', 'b', 'c', 'd', 'Actions'])
			await page.locator('#slow').click()
			const slow = await page.locator('th[data-column-id="slow"]').boundingBox()
			await page.mouse.move(slow.x + slow.width / 2, slow.y + slow.height / 2)
			await page.mouse.down()
			await page.mouse.move(slow.x + 10, slow.y + slow.height / 2, { steps: 8 })
			await loaded(page, 'slow')
			verify('async replacement retains active header drag', true,
				await page.locator('th[data-column-id="slow"]').evaluate(n => n.classList.contains('column-reorder')))
			await page.mouse.move(slow.x - 60, slow.y + slow.height / 2, { steps: 10 })
			await page.mouse.up()
			verify('async drag finishes exactly once', 1, await page.evaluate(() =>
				window.tableRecipe.events.filter(event => event === 'reordered:slow').length))
			verify('async drag classes clean', 0, await page.locator('th.column-reorder').count())
			const reordered = await snapshot(page)
			await structure(page, 'async replacement body alignment', reordered.order)
		}
		// A fresh page restores the fixture baseline; this generic fixture intentionally has no persistence adapter.
		result.inputs.push({ mode, phase: 'regressions', events: await page.evaluate(() => window.verifierInputs) })
		await page.reload()
		await page.waitForFunction(() => !!window.tableRecipe)
		await structure(page, 'full reload fresh state', initial)
		await page.locator('#slow').click()
		await page.locator('#preview').click()
		await page.locator('#reset').click()
		await page.waitForTimeout(1900)
		await structure(page, 'reset aborts committed and provisional late values',
			[...initial.slice(0, -1), 'slow', 'Actions'], ['slow'])
		verify('reset clears busy/provisional/flash', [0, 0, 0], [await page.locator('[aria-busy]').count(),
			await page.locator('.column-add-provisional').count(), await page.locator('.column-add-highlight').count()])
		verify('reset pending no late load', 0, await eventCount(page, 'slow', 'loaded'))
		await page.locator('#preview').click()
		await page.locator('#dispose').click()
		await page.waitForTimeout(1700)
		verify('disposal removes preview and releases late work', [0, 0], [
			await page.locator('th[data-column-id="preview"]').count(), await eventCount(page, 'preview', 'loaded')])
		await page.locator('#add').click()
		verify('disposed addition rejects', true, (await page.locator('#status').textContent()).includes('disposed'))
		result.inputs.push({ mode, phase: 'teardown', events: await page.evaluate(() => window.verifierInputs) })
		await context.close()
	}
	verify('all recorded browser inputs trusted', true,
		result.inputs.every(record => record.events.length && record.events.every(event => event.trusted)))
	verify('network and console health', [], result.health)
	assert.equal(result.assertions.filter(record => record.verdict === 'FAIL').length, 0, 'Failed browser assertions')
	result.verdict = 'PASS'
	console.log(`PASS: ${result.assertions.length} independent assertions; ${result.contexts.length} viewports`)
}
catch (error) {
	result.verdict = 'FAIL'
	result.error = String(error.stack)
	if (currentPage && !currentPage.isClosed())
		await currentPage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
	throw error
}
finally {
	writeFileSync(`${output}/results.json`, JSON.stringify(result, null, 2) + '\n')
	await browser?.close()
}
