import assert            from 'node:assert/strict'
import { mkdirSync }     from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'
import { setTimeout }    from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_V5_SUPPORT_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/V5/support')
const base = process.env.PS_V5_SUPPORT_DEMO || 'http://127.0.0.1:13954'
const app = process.env.PS_V5_SUPPORT_APP || 'http://127.0.0.1:13953'
const proof = { assertions: [], contexts: [], errors: [], inputs: [], screenshots: [], chromiumSandbox: true }
mkdirSync(output, { recursive: true })
let mode, page
function check(name, observed, expected)
{
	const item = { mode, name, observed, expected, status: 'PASS' }
	try { assert.deepEqual(observed, expected) }
	catch {
		item.status = 'FAIL'
		console.log('FAIL', mode, name, observed)
	}
	proof.assertions.push(item)
}
async function wait(predicate, label)
{
	for (let i = 0; i < 100; i ++) {
		if (await predicate()) return
		await setTimeout(50)
	}
	throw new Error('Timeout: ' + label)
}
async function picture(name)
{
	const file = `${mode}-${name}.png`
	await page.screenshot({ path: output + '/' + file })
	proof.screenshots.push(file)
}
async function start(selector)
{
	const node = page.locator(selector).first()
	await node.scrollIntoViewIfNeeded()
	const r = await node.boundingBox()
	await page.mouse.move(r.x + Math.min(r.width / 2, 25), r.y + r.height / 2)
	await page.mouse.down()
	await page.mouse.move(r.x + Math.min(r.width / 2, 25) + 45, r.y + r.height / 2, { steps: 8 })
	await setTimeout(100)
}
const order = () => page.locator('thead th').evaluateAll(nodes =>
	nodes.map(node => node.dataset.columnId ?? node.textContent))
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
proof.browser = browser.version()
try {
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		mode = 'standalone-' + width
		const context = await browser.newContext({ viewport: { width, height } })
		proof.contexts.push({ mode, width, height, hasTouch: false, isMobile: false, url: base })
		await context.exposeBinding('v5Input', (_source, input) => proof.inputs.push({ mode, ...input }))
		await context.addInitScript(() => {
			for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'keydown'])
				document.addEventListener(type, event => void window.v5Input({ type, trusted: event.isTrusted }), true)
		})
		page = await context.newPage()
		page.on('pageerror', error => proof.errors.push({ mode, message: error.message }))
		await page.goto(base)
		await page.locator('.ps-main').first().waitFor()
		check('Responsive shell fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
		await picture('before')
		await start('.ps-main[data-path="number"]')
		await page.mouse.move(width * 0.65, height * 0.55, { steps: 12 })
		await page.mouse.up()
		await wait(async () => await page.locator('#intentions [data-type="end"]').count(), 'End intention')
		check('Terminal path transported', await page.locator('#intentions [data-type="begin"]').allTextContents(),
			['number'])
		check('No residual select', await page.locator('#intentions [data-type="select"]').count(), 0)
		await page.locator('.ps-main[data-path="customer"]').click()
		await page.locator('.ps-main[data-path="customer.address"]').click()
		await start('.ps-level[data-path="customer"]')
		await page.keyboard.press('Escape')
		await page.mouse.up()
		check('Ancestor drag supplies stable path', await page.locator('#intentions [data-type="begin"]')
			.last().textContent(), 'customer')
		check('Escape emits one cancellation', await page.locator('#intentions [data-type="cancel"]').count(), 1)
		check('Drag preserves navigation', await page.locator('.ps-level[aria-current]').getAttribute('data-path'),
			'customer.address')
		await start('.ps-level[data-path=""]')
		await page.mouse.up()
		check('Root cannot transport', await page.locator('#intentions [data-type="begin"]').count(), 2)
		await start('.ps-main[data-path="number"]')
		await page.locator('#dispose').focus()
		await page.keyboard.press('Enter')
		await page.mouse.up()
		check('Disposal cancels once', await page.locator('#intentions [data-type="cancel"]').count(), 2)
		await page.locator('#mount').click()
		await page.locator('.ps-main[data-path="number"]').click()
		check('Remount has one selection listener', await page.locator('#intentions [data-type="select"]').count(), 1)
		await page.locator('.ps-query').fill('country code')
		await wait(async () => ['complete', 'limited'].includes(
			await page.locator('.property-select').getAttribute('data-search-status')), 'Country search')
		for (const path of ['customer.address.country', 'customer.billingAddress.country']) {
			await start(`.ps-result-path button[data-path="${path}"]`)
			await page.mouse.move(width * 0.8, height * 0.5, { steps: 10 })
			await page.mouse.up()
			await setTimeout(80)
			check('Distinct country segment transports its full path: ' + path,
				await page.locator('#intentions [data-type="begin"]').last().textContent(), path)
		}
		check('Standalone owns no table', await page.locator('table').count(), 0)
		await picture('after')
		await page.goto(app + '/property-select-invoice')
		await page.locator('.add-column:not([hidden])').click()
		await page.locator('.ps-main').first().waitFor()
		check('Integrated responsive shell fits', await page.evaluate(() =>
			document.documentElement.scrollWidth <= innerWidth), true)
		await picture('integrated-shell')
		await context.close()
	}
	for (const width of [1280, 768]) {
		mode = 'header-' + width
		const context = await browser.newContext({ viewport: { width, height: 900 } })
		page = await context.newPage()
		page.on('pageerror', error => proof.errors.push({ mode, message: error.message }))
		await page.goto(base + '/table-fixture')
		await page.waitForFunction(() => window.tableRecipe)
		const initial = ['Select', 'a', 'b', 'c', 'd', 'Actions']
		check('Generic baseline', await order(), initial)
		await page.locator('th[data-column-id="a"]').click()
		const b = await page.locator('th[data-column-id="b"]').boundingBox()
		await start('th[data-column-id="a"]')
		await page.mouse.move(b.x + b.width * 0.8, b.y + b.height / 2, { steps: 12 })
		await page.mouse.up()
		check('Header reorders through native pointer', await order(), ['Select', 'b', 'a', 'c', 'd', 'Actions'])
		check('Header drag does not sort', await page.evaluate(() => window.tableRecipe.events
			.filter(event => event === 'sort:a').length), 1)
		await start('th[data-column-id="a"]')
		const a = await page.locator('th[data-column-id="a"]').boundingBox()
		await page.mouse.move(a.x + 20, a.y - 35, { steps: 10 })
		await page.mouse.up()
		check('Header outside removes whereas selector outside restores', await order(),
			['Select', 'b', 'c', 'd', 'Actions'])
		check('Header removal callback once', await page.evaluate(() => window.tableRecipe.events
			.filter(event => event === 'removed:a').length), 1)
		check('Header row body alignment', await page.locator('tbody tr').evaluateAll(rows =>
			rows.map(row => Array.from(row.cells, cell => cell.querySelector('input') ? 'Select' : cell.textContent))),
			[['Select', 'B1', 'C1', 'D1', 'Open'], ['Select', 'B2', 'C2', 'D2', 'Open']])
		await picture('native-header-after')
		await page.reload()
		await page.waitForFunction(() => window.tableRecipe)
		for (const termination of ['cancel', 'reset', 'dispose']) {
			const result = await page.evaluate(async termination => {
				const { addition, content, table } = window.tableRecipe
				const element = table().element
				const before = Array.from(element.tHead.rows[0].cells, cell => cell.dataset.columnId || cell.textContent)
				const r = element.getBoundingClientRect()
				const sample = { pointerId: 49, pointerType: 'mouse', clientX: r.left + 200, clientY: r.top + 60 }
				let complete, admit
				const operation = addition().beginExternal({ id: 'v5-system', create: () => content('Pending'),
					load: () => new Promise(resolve => { complete = () => resolve(content('Too late')) }),
					accept: () => new Promise(resolve => { admit = resolve }) }, sample)
				operation.move(sample)
				const ended = operation.finish(sample)
				await Promise.resolve()
				if (termination === 'cancel') operation.cancel()
				if (termination === 'reset') table().reset()
				if (termination === 'dispose') addition().dispose()
				complete()
				admit?.()
				await new Promise(resolve => setTimeout(resolve, 100))
				return { before, after: Array.from(element.tHead.rows[0].cells,
					cell => cell.dataset.columnId || cell.textContent), terminal: await ended,
					remnants: element.querySelectorAll('.column-add-provisional, .column-reorder').length }
			}, termination)
			check('Public lifecycle ' + termination + ' cancels pending admission and late values', result,
				{ before: initial, after: initial, terminal: 'cancelled', remnants: 0 })
			await page.reload()
			await page.waitForFunction(() => window.tableRecipe)
		}
		await context.close()
	}
	check('Recorded inputs trusted', proof.inputs.every(input => input.trusted), true)
	check('Browser exceptions', proof.errors, [])
	proof.status = proof.assertions.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
}
catch (error) {
	proof.status = 'ERROR'
	proof.failure = error.stack
	console.error(error)
	if (page && !page.isClosed()) await picture('failure')
}
finally {
	await browser.close()
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'support assertions')
	if (proof.status !== 'PASS') process.exitCode = 1
}
