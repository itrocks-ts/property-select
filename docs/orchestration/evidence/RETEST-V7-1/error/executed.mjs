import assert            from 'node:assert/strict'
import { mkdirSync }     from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V7-1/error')
const app = 'http://127.0.0.1:14091'
const proof = { assertions: [], cases: [], inputs: [], responses: [], errors: [], chromiumSandbox: true }
mkdirSync(output, { recursive: true })
let mode, page
const check = (name, observed, expected) => {
	proof.assertions.push({ mode, name, observed, expected })
	assert.deepEqual(observed, expected, name)
}
const until = async (predicate, name) => {
	for (let index = 0; index < 120; index ++) {
		if (await predicate()) return
		await new Promise(resolve => setTimeout(resolve, 50))
	}
	throw Error('Timed out: ' + name)
}
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
proof.browser = browser.version()
proof.playwright = require(runtime + '/package.json').version
try {
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		mode = `${width}x${height}`
		const context = await browser.newContext({ viewport: { width, height } })
		await context.exposeBinding('retestInput', (_source, event) => proof.inputs.push({ mode, ...event }))
		await context.addInitScript(() => {
			for (const type of ['click', 'wheel', 'keydown', 'input']) document.addEventListener(type,
				event => window.retestInput({ type, trusted: event.isTrusted }), true)
		})
		page = await context.newPage()
		page.on('pageerror', error => proof.errors.push({ mode, error: error.message }))
		page.on('response', response => {
			if (response.status() >= 400 || response.url().includes('/state/'))
				proof.responses.push({ mode, url: response.url(),
					method: response.request().method(), status: response.status() })
		})
		await page.goto(app + '/property-select-invoice')
		await page.locator('.add-column:visible').click()
		await page.locator('.ps-main[data-path="deliveryAddress"]').click()
		await page.locator('.ps-main[data-path="deliveryAddress.city"]').click()
		await page.locator('.ps-main[data-path="deliveryAddress.city.name"]').click()
		await page.locator('th[data-property="deliveryAddress.city.name"]').waitFor()
		await page.locator('.ps-level[data-path=""]').click()
		await page.locator('.ps-query').fill('name')
		await until(async () => ['complete', 'limited'].includes(
			await page.locator('.property-select').getAttribute('data-search-status')), 'populated search')
		await page.waitForLoadState('networkidle')
		const key = await page.locator('[data-selector-key]').getAttribute('data-selector-key')
		const state = async () => (await context.request.get(
			app + '/property-select/state/json?key=' + encodeURIComponent(key))).json()
		const order = () => page.locator('table.objects thead th[data-property]')
			.evaluateAll(nodes => nodes.map(node => node.dataset.property))
		const preserved = value => ({ branch: value.state.branch, current: value.state.current,
			query: value.state.query, recent: value.state.recent })
		const before = await state()
		const columns = await order()
		const ordinaryStatus = await page.locator('.ps-status').textContent()
		check('remembered branch is non-empty', before.state.branch, ['deliveryAddress', 'city'])
		check('confirmed recents are non-empty', before.state.recent.length > 0, true)
		await page.evaluate(() => {
			window.retestStatuses = []
			const node = document.querySelector('.ps-status')
			new MutationObserver(() => window.retestStatuses.push({ time: performance.now(), text: node.textContent }))
				.observe(node, { childList: true, characterData: true, subtree: true })
		})
		const note = url => url.searchParams.get('column') === 'customer.name'
		let rejected = 0
		await page.route(note, async route => {
			await route.fetch()
			rejected ++
			await route.fulfill({ status: 503, contentType: 'application/json',
				body: JSON.stringify({ error: 'Retest service unavailable' }) })
		})
		await page.locator('.ps-main[data-path="customer.name"]').click()
		await until(async () => await page.locator('.ps-status').textContent()
			=== 'Retest service unavailable', '503 message')
		check('one actual column request received 503', rejected, 1)
		check('503 preserves exact committed columns', await order(), columns)
		const list = page.locator('.ps-properties')
		const box = await list.boundingBox()
		await page.mouse.move(box.x + box.width / 2, Math.min(box.y + 24, height - 5))
		for (const delta of [-500, 500, -500]) {
			await page.mouse.wheel(0, delta)
			await page.waitForTimeout(150)
			await page.waitForLoadState('networkidle')
			check('native scroll/save retains operation error ' + delta,
				await page.locator('.ps-status').textContent(), 'Retest service unavailable')
		}
		const after = await state()
		check('native scrolling caused durable state saves', after.revision > before.revision, true)
		check('503 and scroll preserve branch/query/recents', preserved(after), preserved(before))
		let failedWrites = 0
		const storage = url => url.pathname === '/property-select/state/json'
		await page.route(storage, async route => {
			if (route.request().method() !== 'PUT') return route.continue()
			failedWrites ++
			await route.fulfill({ status: 503, contentType: 'application/json',
				body: '{"error":"Retest storage unavailable"}' })
		})
		await page.mouse.wheel(0, 500)
		await page.locator('[data-action="retry"]').waitFor()
		check('native wheel reached failing HTTP storage', failedWrites > 0, true)
		check('simultaneous storage message visible', (await page.locator('.ps-persistence').innerText()).includes('Unable to save selector state (503). Try again.'), true)
		check('simultaneous failures preserve columns', await order(), columns)
		check('storage 503 retains operation error',
			await page.locator('.ps-status').textContent(), 'Retest service unavailable')
		await page.unroute(storage)
		await page.locator('[data-action="retry"]').click()
		await until(async () => await page.locator('.ps-persistence').textContent() === '', 'storage retry')
		check('native storage Retry retains operation error',
			await page.locator('.ps-status').textContent(), 'Retest service unavailable')
		check('storage recovery preserves branch/query/recents', preserved(await state()), preserved(before))
		await page.screenshot({ path: `${output}/${mode}-retained.png` })
		await page.unroute(note)
		await page.locator('.ps-main[data-path="customer.name"]').click()
		await page.locator('th[data-property="customer.name"]').waitFor()
		check('successful native selection retry adds once',
			(await order()).filter(path => path === 'customer.name').length, 1)
		check('successful selection restores ordinary search status',
			await page.locator('.ps-status').textContent(), ordinaryStatus)
		await page.waitForLoadState('networkidle')
		proof.cases.push({ mode, url: page.url(), before, after, final: await state(),
			statuses: await page.evaluate(() => window.retestStatuses), columns: await order() })
		await page.screenshot({ path: `${output}/${mode}-recovered.png` })
		await context.close()
	}
	check('all tested inputs are native trusted events', proof.inputs.every(event => event.trusted), true)
	check('no browser exception', proof.errors, [])
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.failure = error.stack
	if (page && !page.isClosed()) await page.screenshot({ path: output + '/failure.png' })
	throw error
}
finally {
	await browser.close()
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'independent assertions')
}
