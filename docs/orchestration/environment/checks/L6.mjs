import assert            from 'node:assert/strict'
import { execFileSync }  from 'node:child_process'
import { readFileSync }  from 'node:fs'
import { mkdirSync }     from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'
import { setTimeout }    from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_L6_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/L6')
const app = 'http://127.0.0.1:13963', demo = 'http://127.0.0.1:13964'
const proof = { assertions: [], contexts: [], inputs: [], errors: [], requests: [], screenshots: [],
	console: [], failedRequests: [],
	chromiumSandbox: true, playwright: require(runtime + '/package.json').version }
proof.checkpoints = Object.fromEntries(['property-select', 'home', 'list', 'table', 'framework'].map(owner => [owner, {
	base: execFileSync('git', ['-C', 'node_modules/@itrocks/' + owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync('node_modules/@itrocks/' + owner + '/package.json')).version
}]))
mkdirSync(output, { recursive: true })
let page, cdp, mode
function check(name, observed, expected)
{
	const item = { mode, name, observed, expected, status: 'PASS' }
	try { assert.deepEqual(observed, expected) }
	catch { item.status = 'FAIL'; console.log('FAIL', mode, name, observed) }
	proof.assertions.push(item)
}
async function wait(predicate, label)
{
	for (let i = 0; i < 120; i ++) {
		if (await predicate()) return
		await setTimeout(50)
	}
	throw new Error('Timeout: ' + label)
}
async function picture(label)
{
	const name = `${mode}-${label}.png`
	await page.screenshot({ path: output + '/' + name })
	proof.screenshots.push(name)
}
async function touch(type, points)
{
	await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, index) => ({
		x: point.x, y: point.y, id: index + 1, radiusX: 2, radiusY: 2, force: 1
	})) })
	await setTimeout(35)
}
async function point(selector, offset = 22)
{
	const node = page.locator(selector).first()
	await node.scrollIntoViewIfNeeded()
	const box = await node.boundingBox()
	assert.ok(box, 'Visible source ' + selector)
	return { x: box.x + Math.min(offset, box.width - 2), y: box.y + box.height / 2 }
}
async function start(selector)
{
	// Let asynchronous suggestions and pane animation settle before measuring the source.
	await setTimeout(250)
	const p = await point(selector)
	await touch('touchStart', [p])
	await touch('touchMove', [{ x: p.x + 24, y: p.y }])
	return p
}
async function setup(browser, viewport, isMobile, url)
{
	const context = await browser.newContext({ viewport, hasTouch: true, isMobile })
	proof.contexts.push({ mode, viewport, hasTouch: true, isMobile, url })
	await context.exposeBinding('l6Input', (_source, value) => proof.inputs.push({ mode, ...value }))
	await context.addInitScript(() => {
		for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'click'])
			document.addEventListener(type, event => void window.l6Input({ type, trusted: event.isTrusted,
				pointerType: event.pointerType, target: event.target.tagName,
				path: event.target.closest?.('[data-path]')?.dataset.path,
				x: event.clientX, y: event.clientY, detail: event.detail }), { capture: true, passive: true })
	})
	page = await context.newPage()
	page.on('pageerror', error => proof.errors.push({ mode, message: error.message }))
	page.on('console', event => {
		if (event.type() === 'error') proof.console.push({ mode, text: event.text() })
	})
	page.on('requestfailed', request => proof.failedRequests.push({ mode, url: request.url(),
		error: request.failure()?.errorText }))
	page.on('request', request => {
		if (request.url().includes('column=')) proof.requests.push({ mode, url: request.url() })
	})
	cdp = await context.newCDPSession(page)
	await page.goto(url)
	return context
}
const count = type => page.locator(`#intentions [data-type="${type}"]`).count()
const order = () => page.locator('table.objects thead [data-property]').evaluateAll(nodes =>
	nodes.map(node => node.dataset.property))
const folded = () => page.locator('.right-pane').evaluate(node => node.hidden)
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
proof.browser = browser.version()
try {
	for (const [width, height] of process.env.PS_L6_SCOPE === 'integration' ? [] : [[390, 844], [844, 390]]) {
		mode = 'standalone-' + width
		const context = await setup(browser, { width, height }, true, demo)
		await page.locator('.ps-main').first().waitFor()
		check('No horizontal page overflow', await page.evaluate(() =>
			document.documentElement.scrollWidth <= innerWidth), true)
		check('Touch action before contact', await page.locator('.ps-main').first().evaluate(node =>
			getComputedStyle(node).touchAction), 'pan-y pinch-zoom')
		check('Relation plus available without hover',
			await page.locator('.ps-add[data-path="customer"]').isVisible(), true)
		check('Terminal has no plus', await page.locator('.ps-add[data-path="number"]').isVisible(), false)
		await page.locator('.ps-main[data-path="number"]').tap()
		check('Tap selects exactly once', await count('select'), 1)
		await page.locator('.ps-add[data-path="customer"]').tap()
		check('Object plus selects without navigation', await count('select'), 2)
		check('Plus keeps root', await page.locator('.ps-level[aria-current]').getAttribute('data-path'), '')
		let p = await point('.ps-main[data-path="number"]')
		await touch('touchStart', [p])
		await setTimeout(800)
		check('Stationary hold does not begin', await count('begin'), 0)
		await touch('touchEnd', [])
		const clicks = await count('select')
		p = await start('.ps-main[data-path="number"]')
		await touch('touchMove', [{ x: p.x + 28, y: p.y + 90 }])
		await touch('touchEnd', [])
		await wait(async () => await count('end') === 1, 'standalone end')
		check('Horizontal then vertical stays transported', await count('begin'), 1)
		check('No residual selection', await count('select'), clicks)
		p = await point('.ps-main[data-path="number"]', 170)
		await touch('touchStart', [p])
		await touch('touchMove', [{ x: p.x + 40, y: p.y }])
		await touch('touchEnd', [])
		check('Right source zone cannot start', await count('begin'), 1)
		await page.addStyleTag({ content: '.ps-properties { max-height: 60px }' })
		await page.locator('.ps-properties').evaluate(node => { node.scrollTop = 0 })
		p = await point('.ps-main[data-path="customer"]')
		await touch('touchStart', [p])
		for (let i = 1; i <= 7; i ++) await touch('touchMove', [{ x: p.x + i, y: p.y - i * 10 }])
		await touch('touchMove', [{ x: p.x + 90, y: p.y - 80 }])
		await touch('touchEnd', [])
		check('Vertical motion performs native list scroll', await page.locator('.ps-properties')
			.evaluate(node => node.scrollTop > 0), true)
		check('Vertical then horizontal never changes intent', await count('begin'), 1)
		await start('.ps-main[data-path="number"]')
		await touch('touchCancel', [])
		check('Browser pointercancel terminates once', await count('cancel'), 1)
		await start('.ps-main[data-path="number"]')
		await page.keyboard.press('Escape')
		await touch('touchEnd', [])
		check('Escape terminates once', await count('cancel'), 2)
		await setTimeout(400)
		await page.locator('.ps-main[data-path="customer"]').tap()
		await page.locator('.ps-main[data-path="customer.address"]').tap()
		await page.locator('.ps-main[data-path="customer.address.city"]').tap()
		await page.locator('.ps-main[data-path="customer.address.city.country"]').tap()
		const levels = await page.locator('.ps-level').count()
		await page.locator('.ps-breadcrumb').evaluate(node => { node.scrollLeft = 0 })
		p = await point('.ps-level[data-path="customer"]')
		await touch('touchStart', [p])
		for (let i = 1; i <= 6; i ++) await touch('touchMove', [{ x: p.x - i * 12, y: p.y }])
		await touch('touchEnd', [])
		check('Long breadcrumb retains all five levels', levels, 5)
		check('Breadcrumb swipe never transports', await count('begin'), 3)
		if (width === 390) check('Breadcrumb scrolls horizontally', await page.locator('.ps-breadcrumb')
			.evaluate(node => node.scrollLeft > 0), true)
		await picture('navigation')
		await page.goto(demo)
		await page.locator('.ps-main').first().waitFor()
		p = await point('.ps-main[data-path="number"]')
		const initialScale = await page.evaluate(() => visualViewport.scale)
		await touch('touchStart', [{ x: p.x + 60, y: p.y }, { x: p.x + 120, y: p.y }])
		for (let i = 1; i <= 8; i ++) await touch('touchMove', [
			{ x: p.x + 60 - i * 4, y: p.y - i * 2 }, { x: p.x + 120 + i * 8, y: p.y + i * 2 }
		])
		await touch('touchEnd', [])
		check('Pinch changes real visual viewport scale', await page.evaluate(scale => visualViewport.scale > scale,
			initialScale), true)
		check('Pinch creates no transport', await count('begin'), 0)
		await context.close()
	}
	for (const [width, height] of process.env.PS_L6_SCOPE === 'standalone'
		? [] : [[390, 844], [844, 390], [768, 900], [1280, 720]]) {
		mode = 'integration-' + width
		const mobile = width === 390 || width === 844
		const context = await setup(browser, { width, height }, mobile, app + '/property-select-invoice')
		await page.locator('.add-column:not([hidden])').tap()
		await page.locator('.ps-main').first().waitFor()
		check('Mobile main inert / desktop interactive', await page.locator('main').evaluate(node => node.inert), mobile)
		check('Pane fits viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
		await setTimeout(400)
		await page.locator('.ps-main[data-path="customer"]').tap()
		await page.locator('.ps-main[data-path="customer.address"]').tap()
		const original = await order()
		let release, acquired = false
		const gate = new Promise(resolve => { release = resolve })
		await page.route(url => url.searchParams.get('validate') === '1', async route => {
			const response = await route.fetch()
			acquired = true
			await gate
			await route.fulfill({ response })
		})
		await start('.ps-main[data-path="customer.address.city"]')
		await wait(async () => acquired, 'real admission fetched')
		check('Recognition folds mobile only', await folded(), mobile)
		check('Actual provisional column exists', await page.locator('thead .column-add-provisional').count(), 1)
		await picture('preview')
		const table = await page.locator('table.objects').boundingBox()
		const destination = { x: Math.min(width - 70, table.x + 160), y: Math.min(height - 50, table.y + 120) }
		await touch('touchMove', [destination])
		await touch('touchEnd', [])
		check('Mobile remains folded while admission is pending', await folded(), mobile)
		release()
		await wait(async () => !(await folded()), 'restored accepted pane')
		await wait(async () => !(await page.locator('.column-add-provisional').count()), 'committed preview')
		check('Accepted column exists once', (await order()).filter(path => path === 'customer.address.city').length, 1)
		check('Restoration does not focus query',
			await page.evaluate(() => document.activeElement?.className === 'ps-query'), false)
		check('Navigation restored', await page.locator('.ps-level[aria-current]').getAttribute('data-path'),
			'customer.address')
		await page.unrouteAll({ behavior: 'wait' })
		const saved = await order()
		for (const cancellation of ['outside', 'pointercancel', 'Escape']) {
			await start('.ps-main[data-path="customer.address.city"]')
			await wait(async () => await page.locator('thead .column-reorder-dragged').count()
				|| (mobile && await folded()) || !mobile, 'recognised existing column')
			await setTimeout(80)
			if (cancellation === 'outside') {
				await touch('touchMove', [{ x: 3, y: 3 }])
				await touch('touchEnd', [])
			}
			else if (cancellation === 'pointercancel') await touch('touchCancel', [])
			else {
				await page.keyboard.press('Escape')
				await touch('touchEnd', [])
			}
			await wait(async () => !(await folded()), cancellation + ' restored')
			check(cancellation + ' restores exact column order', await order(), saved)
			check(cancellation + ' no query focus',
				await page.evaluate(() => document.activeElement?.className === 'ps-query'), false)
		}
		await page.locator('.right-pane-toggle').tap()
		check('Explicit close focus is visible command', await page.evaluate(() =>
			document.activeElement.classList.contains('right-pane-toggle')), true)
		await page.locator('.add-column').tap()
		check('Header opens same pane', await page.locator('.right-pane').count(), 1)
		await picture('restored')
		await page.reload()
		await page.locator('.add-column:not([hidden])').waitFor()
		check('Reload retains committed order', await order(), saved)
		await page.setViewportSize({ width: 1280, height: 720 })
		await page.locator('.add-column').click()
		await page.locator('.ps-main[data-path="customer.address.city"]').waitFor()
		const p = await point('.ps-main[data-path="customer.address.city"]')
		await page.mouse.move(p.x, p.y)
		await page.mouse.down()
		await page.mouse.move(p.x + 25, p.y)
		await setTimeout(100)
		check('Mouse after touch and resize leaves desktop pane open', await folded(), false)
		await page.keyboard.press('Escape')
		await page.mouse.up()
		check('Mouse cancellation keeps order', await order(), saved)
		await page.locator('.ps-main[data-path="customer.address.city"]').focus()
		await page.keyboard.press('Enter')
		await page.locator('.ps-main[data-path="customer.address.city.name"]').waitFor()
		check('Keyboard navigation after touch remains available',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), 'customer.address.city')
		check('One compatible model retains branch after resize', await page.locator('.property-select').count(), 1)
		if (mobile) {
			await page.setViewportSize({ width, height })
			await page.locator('.ps-level[data-path=""]').tap()
			await page.locator('.ps-query').fill('active')
			await page.locator('.ps-main[data-path="active"]').waitFor()
			await page.addStyleTag({ content: 'table.objects th[data-property] { min-width: 360px }' })
			let resume, arrived = 0
			const late = new Promise(resolve => { resume = resolve })
			await page.route(url => url.searchParams.get('column') === 'active', async route => {
				const response = await route.fetch()
				arrived ++
				await late
				try { await route.fulfill({ response }) } catch { /* Cancelled HTTP transport. */ }
			})
			await start('.ps-main[data-path="active"]')
			await wait(() => arrived === 2, 'real admission and values held')
			const geometry = () => page.evaluate(async () => {
				const { getTables } = await import('/@itrocks/table/table.js')
				const table = getTables().find(value => value.element.matches('table.objects'))
				const scroll = table.plugins.TableColumnReorder.scrollContainer()
				const inner = table.plugins.TableFreeze.visibleInnerRect()
				const box = scroll.getBoundingClientRect()
				return { left: Math.max(inner.left, box.left), right: Math.min(inner.right, box.right),
					scroll: scroll.scrollLeft, maximum: scroll.scrollWidth - scroll.clientWidth,
					y: table.element.tHead.getBoundingClientRect().bottom + 45 }
			})
			const before = await geometry()
			await touch('touchMove', [{ x: before.right - 4, y: before.y }])
			await setTimeout(650)
			const right = await geometry()
			check('Touch uses table edge scrolling right', right.scroll > before.scroll + 40, true)
			await touch('touchMove', [{ x: right.left + 4, y: right.y }])
			await setTimeout(650)
			const left = await geometry()
			check('Touch uses frozen table edge scrolling left', left.scroll < right.scroll - 40, true)
			proof.geometry ||= []
			proof.geometry.push({ mode, before, right, left })
			await page.setViewportSize({ width: 1280, height: 720 })
			await wait(async () => !(await folded()), 'active desktop resize')
			check('Active token follows desktop layout', await folded(), false)
			await page.setViewportSize({ width, height })
			await wait(folded, 'active mobile resize')
			check('Rotation never duplicates preview or requests', [
				await page.locator('thead .column-add-provisional').count(),
				arrived], [1, 2])
			await touch('touchCancel', [])
			await wait(async () => !(await folded()), 'cancel before responses')
			check('Cancellation restores before pending HTTP settles', await order(), saved)
			resume()
			await page.unrouteAll({ behavior: 'wait' })
			await setTimeout(200)
			check('Late admission and values cannot resurrect cancelled column', await order(), saved)
			check('Restoration preserves query', await page.locator('.ps-query').inputValue(), 'active')
			await page.emulateMedia({ reducedMotion: 'reduce' })
			check('Reduced motion removes pane animation', await page.locator('.right-pane')
				.evaluate(node => getComputedStyle(node).animationName), 'none')
			await page.locator('.right-pane-toggle').tap()
			await wait(folded, 'explicit fold')
			for (const delta of [2000, -2000]) {
				await page.mouse.move(width / 2, Math.min(height - 60, before.y))
				await page.mouse.wheel(delta, 0)
				await setTimeout(300)
				const scrolled = await geometry()
				check('Table reaches horizontal end ' + delta, Math.abs(scrolled.scroll
					- (delta > 0 ? scrolled.maximum : 0)) < 2, true)
				const box = await page.locator('.add-column').boundingBox()
				check('Header command remains on screen after horizontal scroll ' + delta,
					box.x >= 0 && box.x + box.width <= width + 1, true)
			}
			await page.locator('.add-column').tap()
			await start('.ps-main[data-path="active"]')
			await wait(folded, 'departure transport')
			await page.getByRole('link', { name: 'Accueil', exact: true }).focus()
			await page.keyboard.press('Enter')
			await wait(async () => !(await page.locator('.property-select').count()), 'departure removes selector')
			await touch('touchEnd', [])
			check('Departure cannot restore the old pane', await page.locator('.right-pane-toggle:visible').count(), 0)
			check('Departure removes provisional cells', await page.locator('.column-add-provisional').count(), 0)
			await picture('departed')
		}

		await context.close()
	}
	check('No browser exceptions', proof.errors, [])
	check('No console errors', proof.console, [])
	check('Only intentional request cancellation', proof.failedRequests
		.filter(request => request.error !== 'net::ERR_ABORTED'), [])
	check('All observed touch events trusted', proof.inputs.filter(item => item.pointerType === 'touch')
		.every(item => item.trusted), true)
}
catch (error) {
	proof.failure = error.stack
	if (page && !page.isClosed()) await picture('failure')
	console.error(error)
	process.exitCode = 1
}
finally {
	await browser.close()
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	const failed = proof.assertions.filter(item => item.status === 'FAIL')
	console.log(JSON.stringify({ assertions: proof.assertions.length, failed: failed.length, failure: proof.failure }))
	if (failed.length) process.exitCode = 1
}
