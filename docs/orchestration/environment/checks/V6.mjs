import assert                  from 'node:assert/strict'
import { mkdirSync }           from 'node:fs'
import { readFileSync }         from 'node:fs'
import { writeFileSync }        from 'node:fs'
import { createRequire }        from 'node:module'
import { resolve }              from 'node:path'
import { setTimeout as pause }  from 'node:timers/promises'
const require = createRequire(import.meta.url)
const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_V6_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/V6')
const app = 'http://127.0.0.1:13973'
const demo = 'http://127.0.0.1:13974'
const proof = { assertions: [], contexts: [], input: [], commands: [], network: [], screenshots: [], errors: [],
	console: [], failed: [], chromiumSandbox: true, playwright: require(runtime + '/package.json').version,
	seed: '120 synthetic invoices; 61 active roots; static standalone catalogue',
	checkpoints: JSON.parse(readFileSync(resolve('node_modules/@itrocks/property-select/docs/orchestration'
		+ '/evidence/V6/checkpoints.json'))) }
const queries = []
let page, cdp, mode
mkdirSync(output, { recursive: true })
function check(name, actual, expected)
{
	let status = 'PASS'
	try { assert.deepEqual(actual, expected) }
	catch {
		status = 'FAIL'
		console.log('FAIL', mode, name, JSON.stringify(actual))
	}
	proof.assertions.push({ mode, name, expected, actual, status })
}
async function until(predicate, description)
{
	for (let attempt = 0; attempt < 160; attempt ++) {
		if (await predicate()) return
		await pause(40)
	}
	throw Error('Timeout: ' + description)
}
async function screenshot(label)
{
	await pause(170)
	const file = `${mode}-${label}.png`
	await page.screenshot({ path: output + '/' + file })
	proof.screenshots.push({ mode, file, url: page.url() })
}
async function setup(browser, width, height, mobile, url)
{
	const context = await browser.newContext({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile })
	proof.contexts.push({ mode, viewport: { width, height }, hasTouch: mobile, isMobile: mobile, url })
	const currentMode = mode
	await context.exposeBinding('v6Observe', (_source, event) => proof.input.push({ mode: currentMode, ...event }))
	await context.addInitScript(() => {
		for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'keydown', 'click'])
			document.addEventListener(type, event => void window.v6Observe({ type, trusted: event.isTrusted,
				pointerType: event.pointerType, x: event.clientX, y: event.clientY,
				path: event.target.closest?.('[data-path]')?.dataset.path }), { capture: true, passive: true })
	})
	page = await context.newPage()
	page.setDefaultTimeout(8000)
	page.on('pageerror', error => proof.errors.push({ mode: currentMode, text: error.message }))
	page.on('console', message => {
		if (['error', 'warning'].includes(message.type())) proof.console.push({ mode: currentMode, text: message.text() })
	})
	page.on('requestfailed', request => proof.failed.push({ mode: currentMode, url: request.url(),
		error: request.failure()?.errorText }))
	page.on('request', request => {
		const url = new URL(request.url())
		if (url.searchParams.has('column') || url.searchParams.has('columns'))
			proof.network.push({ mode: currentMode, url: request.url(), kind: url.searchParams.has('columns')
				? 'save' : url.searchParams.has('validate') ? 'admission' : 'values' })
	})
	cdp = await context.newCDPSession(page)
	await page.goto(url)
	return context
}
async function touch(type, points = [])
{
	proof.commands.push({ mode, type, points })
	await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, index) => ({
		...p, id: index + 1, radiusX: 3, radiusY: 3, force: 1
	})) })
	await pause(45)
}
async function centre(selector, dx = 16)
{
	const target = page.locator(selector).first()
	await target.scrollIntoViewIfNeeded()
	const box = await target.boundingBox()
	assert.ok(box, selector)
	return { x: box.x + Math.min(dx, box.width - 2), y: box.y + box.height / 2 }
}
async function gesture(selector, mobile, dx = 32, dy = 0)
{
	await pause(300)
	const p = await centre(selector)
	if (mobile) {
		await touch('touchStart', [p])
		await touch('touchMove', [{ x: p.x + dx, y: p.y + dy }])
	}
	else {
		await page.mouse.move(p.x, p.y)
		await page.mouse.down()
		await page.mouse.move(p.x - dx, p.y + dy, { steps: 4 })
	}
	return p
}
const intention = type => page.locator(`#intentions [data-type="${type}"]`).count()
const order = () => page.locator('table.objects thead [data-property]')
	.evaluateAll(nodes => nodes.map(node => node.dataset.property))
const hidden = () => page.locator('.right-pane').evaluate(node => node.hidden)
const active = () => page.evaluate(() => ({ search: document.activeElement?.matches('.ps-query'),
	inHidden: !!document.activeElement?.closest('[hidden], [inert]'),
	className: document.activeElement?.className }))
const snapshot = async context => (await (await context.request.get(app
	+ '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist')).json()).state
const sql = async context => (await (await context.request.get(app + '/property-select-observation/probe/json')).json())
const saves = () => proof.network.filter(item => item.mode === mode && item.kind === 'save').length
async function search(value)
{
	await page.locator('.ps-query').fill(value)
	await until(async () => ['complete', 'limited', 'empty'].includes(await page.locator('.property-select')
		.getAttribute('data-search-status')), 'search settled')
}
async function activate(selector, mobile)
{
	if (mobile) await page.locator(selector).first().tap()
	else {
		if (selector.includes('.ps-add')) await page.locator(selector).first().locator('..').hover()
		await page.locator(selector).first().click()
	}
}
async function hold(path)
{
	let resume
	const releases = new Promise(resolve => { resume = resolve })
	let received = 0
	const handler = async route => {
		const response = await route.fetch()
		received ++
		await releases
		try { await route.fulfill({ response }) } catch { /* A cancelled browser request can already be closed. */ }
	}
	const matcher = url => url.searchParams.get('column') === path
	await page.route(matcher, handler)
	return { received: () => received,
		release: async () => {
			resume()
			await page.unroute(matcher, handler)
			await pause(180)
		} }
}
async function geometry()
{
	return page.evaluate(async () => {
		const { getTables } = await import('/@itrocks/table/table.js')
		const table = getTables().find(item => item.element.matches('table.objects'))
		const scroll = table.plugins.TableColumnReorder.scrollContainer() ?? table.element
		const inner = table.plugins.TableFreeze.visibleInnerRect()
		const box = scroll.getBoundingClientRect()
		return { left: Math.max(box.left, inner.left), right: Math.min(box.right, inner.right),
			y: table.element.tHead.getBoundingClientRect().bottom + 36, scroll: scroll.scrollLeft,
			maximum: scroll.scrollWidth - scroll.clientWidth }
	})
}
async function move(p, mobile)
{
	if (mobile) await touch('touchMove', [p])
	else await page.mouse.move(p.x, p.y, { steps: 5 })
}
async function end(mobile)
{
	if (mobile) await touch('touchEnd')
	else await page.mouse.up()
}
async function cancel(mobile)
{
	if (mobile) await touch('touchCancel')
	else {
		await page.keyboard.press('Escape')
		await page.mouse.up()
	}
}
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
proof.browser = browser.version()
try {
	for (const [width, height] of [[390, 844], [844, 390], [1280, 720], [768, 900]]) {
		const mobile = width === 390 || width === 844
		mode = 'standalone-' + width
		const context = await setup(browser, width, height, mobile, demo)
		await page.locator('.ps-main').first().waitFor()
		check('Standalone no page overflow',
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
		await screenshot('before')
		if (mobile) {
			check('Relation plus visible without hover',
				await page.locator('.ps-add[data-path="customer"]').isVisible(), true)
			check('Terminal plus hidden', await page.locator('.ps-add[data-path="number"]').isVisible(), false)
			check('Touch policy declared before contact', await page.locator('.ps-main').first()
				.evaluate(node => getComputedStyle(node).touchAction), 'pan-y pinch-zoom')
		}
		await activate('.ps-main[data-path="number"]', mobile)
		await activate('.ps-add[data-path="customer"]', mobile)
		check('Terminal and object each emit one selection', await intention('select'), 2)
		check('Object plus preserves root context',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), '')
		if (mobile) {
			const p = await centre('.ps-main[data-path="number"]')
			await touch('touchStart', [p])
			await pause(700)
			check('Hold alone creates no drag', await intention('begin'), 0)
			await touch('touchMove', [{ x: p.x + 4, y: p.y + 2 }])
			check('Subthreshold jitter creates no drag', await intention('begin'), 0)
			await touch('touchEnd')
			const selected = await intention('select')
			await gesture('.ps-main[data-path="number"]', true, 21, 8)
			await until(async () => await intention('begin') === 1, 'horizontal dominant begin')
			await touch('touchMove', [{ x: p.x + 23, y: p.y + 74 }])
			await touch('touchEnd')
			check('Horizontal then vertical stays one transport', [await intention('begin'), await intention('end')], [1, 1])
			check('Transport emits no residual selection', await intention('select'), selected)
			await page.addStyleTag({ content: '.ps-properties { max-height: 64px }' })
			await page.locator('.ps-properties').evaluate(node => { node.scrollTop = 0 })
			const s = await centre('.ps-main[data-path="customer"]')
			await touch('touchStart', [s])
			for (let n = 1; n <= 6; n ++) await touch('touchMove', [{ x: s.x + n * 4, y: s.y - n * 10 }])
			await touch('touchMove', [{ x: s.x + 100, y: s.y - 62 }])
			await touch('touchEnd')
			check('Vertical diagonal scrolls native list',
				await page.locator('.ps-properties').evaluate(node => node.scrollTop > 0), true)
			check('Native decision never switches to drag', await intention('begin'), 1)
			const r = await centre('.ps-main[data-path="number"]', 160)
			await touch('touchStart', [r])
			await touch('touchMove', [{ x: r.x + 40, y: r.y }])
			await touch('touchEnd')
			check('Right source region does not transport', await intention('begin'), 1)
			await gesture('.ps-main[data-path="number"]', true)
			await touch('touchCancel')
			check('Trusted cancellation has one terminal event', await intention('cancel'), 1)
			await gesture('.ps-main[data-path="number"]', true)
			const m = await centre('.ps-main[data-path="number"]')
			await touch('touchStart', [{ x: m.x + 32, y: m.y }, { x: m.x + 110, y: m.y }])
			await touch('touchEnd')
			check('Second contact cancels existing drag', await intention('cancel'), 2)
		}
		else {
			await gesture('.ps-main[data-path="number"]', false)
			await page.mouse.move(300, 350)
			await page.mouse.up()
			check('Desktop drag retains full terminal path',
				await page.locator('#intentions [data-type="begin"]').last().textContent(), 'number')
			check('Desktop drag has no residual click', await intention('select'), 2)
		}
		await page.reload()
		for (const path of ['customer', 'customer.address', 'customer.address.city', 'customer.address.city.country'])
			await activate(`.ps-main[data-path="${path}"]`, mobile)
		check('All remembered breadcrumb levels remain', await page.locator('.ps-level').count(), 5)
		if (mobile) {
			await page.locator('.ps-breadcrumb').evaluate(node => { node.scrollLeft = 0 })
			const p = await centre('.ps-level[data-path="customer"]')
			await touch('touchStart', [p])
			for (let n = 1; n <= 8; n ++) await touch('touchMove', [{ x: p.x - n * 9, y: p.y }])
			await touch('touchEnd')
			check('Long breadcrumb swipe never starts drag', await intention('begin'), 0)
			if (width === 390) check('Long breadcrumb scrolls', await page.locator('.ps-breadcrumb')
				.evaluate(node => node.scrollLeft > 0), true)
		}
		await screenshot('breadcrumb')
		await page.reload()
		await page.locator('.ps-main').first().waitFor()
		if (mobile) {
			const p = await centre('.ps-main[data-path="number"]')
			const initial = await page.evaluate(() => visualViewport.scale)
			await touch('touchStart', [{ x: p.x + 55, y: p.y }, { x: p.x + 115, y: p.y }])
			for (let n = 1; n <= 10; n ++) await touch('touchMove', [
				{ x: p.x + 55 - n * 4, y: p.y - n }, { x: p.x + 115 + n * 7, y: p.y + n }])
			await touch('touchEnd')
			check('Real pinch increases viewport scale',
				await page.evaluate(scale => visualViewport.scale > scale, initial), true)
			check('Pinch does not start transport', await intention('begin'), 0)
		}
		await context.close()
	}
	for (const [width, height] of [[390, 844], [844, 390], [1280, 720], [768, 900]]) {
		const mobile = width === 390 || width === 844
		mode = 'integration-' + width
		console.log('Running', mode)
		const context = await setup(browser, width, height, mobile, app + '/property-select-invoice')
		await page.locator('table.objects').waitFor()
		const original = await order()
		const sqlStart = (await sql(context)).length
		await activate('.add-column:not([hidden])', mobile)
		await page.locator('.ps-main').first().waitFor()
		await pause(350)
		check('Responsive page fits', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
		check('Mobile main is inert only in mobile layout', await page.locator('main').evaluate(node => node.inert), mobile)
		await screenshot('before')
		if (mobile) {
			const style = await page.addStyleTag({ content: '.ps-properties { max-height: 100px }' })
			await page.locator('.ps-properties').evaluate(node => { node.scrollTop = 0 })
			const box = await page.locator('.ps-properties').boundingBox()
			const point = { x: box.x + 18, y: box.y + box.height - 18 }
			await touch('touchStart', [point])
			for (let n = 1; n <= 7; n ++)
				await touch('touchMove', [{ x: point.x + n * 2, y: point.y - n * 10 }])
			await touch('touchEnd')
			check('Integrated native vertical scroll moves list', await page.locator('.ps-properties')
				.evaluate(node => node.scrollTop > 0), true)
			check('Integrated scroll cannot add a column', await order(), original)
			check('Integrated scroll does not save columns', saves(), 0)
			check('Integrated scroll keeps pane open', await hidden(), false)
			await style.evaluate(node => node.remove())
		}
		await activate('.ps-main[data-path="note"]', mobile)
		await until(async () => (await order()).includes('note'), 'terminal activation adds column')
		check('Terminal tap or click adds exactly once', (await order()).filter(path => path === 'note').length, 1)
		await pause(300)
		const navigationSQL = (await sql(context)).length
		await activate('.ps-main[data-path="customer"]', mobile)
		await activate('.ps-main[data-path="customer.address"]', mobile)
		await pause(300)
		const beforeSQL = (await sql(context)).length
		check('Metadata navigation executes no record SQL', beforeSQL, navigationSQL)
		let saveArrived = false, releaseSave, completeSave
		const saveGate = new Promise(resolve => { releaseSave = resolve })
		const saveComplete = new Promise(resolve => { completeSave = resolve })
		const saveMatcher = url => url.searchParams.get('columns')?.split(',').includes('customer.address.city')
		const saveHandler = async route => {
			const response = await route.fetch()
			saveArrived = true
			await saveGate
			try { await route.fulfill({ response }) }
			catch (error) { proof.failed.push({ mode, url: route.request().url(), error: error.message }) }
			finally { completeSave() }
		}
		await page.route(saveMatcher, saveHandler)
		const delayed = await hold('customer.address.city')
		const p = await gesture('.ps-main[data-path="customer.address.city"]', mobile)
		await until(() => delayed.received() === 2, 'admission and values responses held')
		const projected = (await sql(context)).slice(beforeSQL)
		check('City preview uses one executed projection', projected.length, 1)
		check('Projection joins City and keeps mandatory scope', projected[0].sql.includes('LEFT JOIN `ps_city`')
			&& projected[0].sql.includes('`active` = ?') && projected[0].values[0] === 1, true)
		const ids = await page.locator('table.objects tbody input[name=id]')
			.evaluateAll(nodes => nodes.map(node => node.value))
		check('Projection binds exactly the displayed row identities', projected[0].values.slice(1), ids)
		check('Recognition folds mobile only', await hidden(), mobile)
		check('One provisional header', await page.locator('thead .column-add-provisional').count(), 1)
		check('One placeholder cell per row', await page.locator('tbody .column-add-provisional').count(),
			await page.locator('table.objects tbody tr').count())
		await screenshot('folded-preview')
		let g = await geometry()
		await move({ x: Math.min(g.right - 30, g.left + 100), y: g.y }, mobile)
		await end(mobile)
		check('Pane stays folded until held admission settles', await hidden(), mobile)
		await delayed.release()
		await until(() => saveArrived, 'column save response held')
		check('Pane remains suspended until save acknowledgement', await hidden(), mobile)
		releaseSave()
		await saveComplete
		await page.unroute(saveMatcher, saveHandler)
		await until(async () => !(await page.locator('.column-add-provisional').count()), 'commit settles')
		await until(async () => !(await hidden()), 'pane restored')
		const saved = await order()
		check('One committed City object', saved.filter(path => path === 'customer.address.city').length, 1)
		check('City object values rendered',
			await page.locator('table.objects tbody').innerText().then(value => value.includes('Paris')), true)
		check('Pane restore does not focus search', (await active()).search, false)
		check('Pane restore focus is not hidden', (await active()).inHidden, false)
		check('Navigation retained after restoration',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'),
			'customer.address')
		await pause(300)
		const recents = (await snapshot(context)).recent
		const savedCount = saves()
		for (const ending of ['outside', 'cancel', 'Escape']) {
			await gesture('.ps-main[data-path="customer.address.city"]', mobile)
			await pause(120)
			if (ending === 'outside') {
				await move({ x: 2, y: 2 }, mobile)
				await end(mobile)
			}
			else if (ending === 'cancel') await cancel(mobile)
			else {
				await page.keyboard.press('Escape')
				await end(mobile)
			}
			await until(async () => !(await hidden()), ending + ' restored')
			check(ending + ' restores original existing order', await order(), saved)
			check(ending + ' saves no column change', saves(), savedCount)
			check(ending + ' never focuses search', (await active()).search, false)
		}
		check('Cancelled moves preserve recents', (await snapshot(context)).recent, recents)
		await screenshot('restored')
		await page.locator('.right-pane-toggle').click()
		check('Explicit close focuses visible toggle', (await active()).className.includes('right-pane-toggle'), true)
		check('Explicit close leaves no hidden focus', (await active()).inHidden, false)
		await page.reload()
		await page.locator('.add-column:not([hidden])').waitFor()
		check('Fresh reload persists exact accepted order', await order(), saved)
		await activate('.add-column', mobile)
		await page.locator('.ps-main[data-path="customer.address.city"]').waitFor()
		await page.locator('.ps-level[data-path=""]').click()
		await search('active')
		await page.addStyleTag({ content: 'table.objects th[data-property] { min-width: 360px }' })
		const pending = await hold('active')
		await gesture('.ps-main[data-path="active"]', mobile)
		await until(() => pending.received() === 2, 'late active responses held')
		const q0 = (await sql(context)).length
		g = await geometry()
		await move({ x: g.right - 3, y: g.y }, mobile)
		await pause(550)
		const right = await geometry()
		check('Table autoscrolls at right edge', right.scroll > g.scroll + 30, true)
		await move({ x: right.left + 3, y: right.y }, mobile)
		await pause(550)
		const left = await geometry()
		check('Table autoscrolls at frozen left edge', left.scroll < right.scroll - 30, true)
		check('Moving and autoscroll issue no repeated projection', (await sql(context)).length, q0)
		if (mobile) {
			await page.setViewportSize({ width: height, height: width })
			check('Rotation retains one active preview', await page.locator('thead .column-add-provisional').count(), 1)
			check('Portrait to landscape remains folded', await hidden(), true)
			await page.setViewportSize({ width: 1280, height: 720 })
			await until(async () => !(await hidden()), 'desktop restores active pane')
			await page.setViewportSize({ width, height })
			await until(hidden, 'mobile refolds active pane')
			check('Resizing does not duplicate HTTP work', pending.received(), 2)
		}
		await cancel(mobile)
		await until(async () => !(await hidden()), 'early cancellation restores')
		check('Cancellation restores before responses', await order(), saved)
		await pending.release()
		check('Late responses cannot resurrect column', await order(), saved)
		check('Cancelled query remains available', await page.locator('.ps-query').inputValue(), 'active')
		check('Cancelled query is not refocused', (await active()).search, false)
		await page.emulateMedia({ reducedMotion: 'reduce' })
		await page.locator('.right-pane-toggle').click()
		for (const direction of [1, -1]) {
			g = await geometry()
			await page.mouse.move((g.left + g.right) / 2, g.y)
			await page.mouse.wheel(3000 * direction, 0)
			await pause(300)
			const after = await geometry()
			check('Table reaches horizontal end ' + direction,
				Math.abs(after.scroll - (direction === 1 ? after.maximum : 0)) < 2, true)
			const box = await page.locator('.add-column').boundingBox()
			check('Header add stays reachable ' + direction, box.x >= 0 && box.x + box.width <= width + 1, true)
		}
		await activate('.add-column', mobile)
		check('Reduced motion disables opening animation', await page.locator('.right-pane')
			.evaluate(node => getComputedStyle(node).animationName), 'none')
		check('Reopened pane has same query', await page.locator('.ps-query').inputValue(), 'active')
		const dimensions = await page.locator('.ps-main[data-path="active"]').boundingBox()
		const toggle = await page.locator('.right-pane-toggle').boundingBox()
		check('Property and toggle meet 44px target height', dimensions.height >= 44 && toggle.height >= 44, true)
		await page.emulateMedia({ colorScheme: 'dark' })
		check('Dark theme retains distinct foreground and background', await page.locator('.property-select')
			.evaluate(node => getComputedStyle(node).color !== getComputedStyle(node).backgroundColor), true)
		await screenshot('dark-reduced-motion')
		await page.emulateMedia({ colorScheme: 'light' })
		await page.setViewportSize({ width: 1280, height: 720 })
		await gesture('.ps-main[data-path="active"]', false)
		await until(async () => await page.locator('thead .column-add-provisional').count() === 1, 'hybrid mouse begins')
		check('Mouse after touch keeps desktop pane open', await hidden(), false)
		await cancel(false)
		check('Hybrid cancellation preserves saved columns', await order(), saved)
		await page.locator('.ps-query').fill('')
		await page.locator('.ps-main[data-path="customer"]').focus()
		await page.keyboard.press('Tab')
		await page.keyboard.press('Shift+Tab')
		check('Keyboard focus has visible outline', await page.locator('.ps-main[data-path="customer"]')
			.evaluate(node => node.matches(':focus-visible') && parseFloat(getComputedStyle(node).outlineWidth) >= 2), true)
		await page.keyboard.press('Enter')
		await page.locator('.ps-main[data-path="customer.address"]').waitFor()
		check('Keyboard navigation after resize works',
			await page.locator('.ps-level[aria-current]').getAttribute('data-path'), 'customer')
		await page.locator('.ps-add[data-path="customer.address"]').focus()
		await page.keyboard.press('Space')
		await until(async () => (await order()).includes('customer.address'), 'keyboard object addition')
		check('Keyboard object adds exactly once', (await order()).filter(path => path === 'customer.address').length, 1)
		check('Only one selector model survives resize', await page.locator('.property-select').count(), 1)
		await screenshot('hybrid-keyboard')
		await page.locator('.ps-level[data-path=""]').click()
		await search('active')
		if (mobile) await page.setViewportSize({ width, height })
		const departing = await hold('active')
		await gesture('.ps-main[data-path="active"]', mobile)
		await until(() => departing.received() === 2, 'departure responses held')
		await page.getByRole('link', { name: 'Accueil', exact: true }).focus()
		await page.keyboard.press('Enter')
		await until(async () => !(await page.locator('.property-select').count()), 'departed view removed')
		await end(mobile)
		await departing.release()
		check('Departure removes all provisional DOM', await page.locator('.column-add-provisional').count(), 0)
		check('Late departure cannot reopen pane', await page.locator('.right-pane-toggle:visible').count(), 0)
		queries.push({ mode, statements: (await sql(context)).slice(sqlStart) })
		await screenshot('departed')
		await context.close()
	}
	check('Trusted inputs only', proof.input.every(event => event.trusted), true)
	check('Actual touch cancellation observed', proof.input.some(event => event.type === 'pointercancel'
		&& event.pointerType === 'touch'), true)
	check('No page exceptions', proof.errors, [])
	check('No console errors or warnings', proof.console, [])
	check('Only intentional request aborts', proof.failed.filter(request => request.error !== 'net::ERR_ABORTED'), [])
	proof.status = proof.assertions.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
}
catch (error) {
	proof.status = 'ERROR'
	proof.failure = error.stack
	console.error(error)
	if (page && !page.isClosed()) {
		await screenshot('failure')
		proof.failureDOM = await page.locator('body').innerText()
	}
}
finally {
	await browser.close()
	writeFileSync(output + '/sql.json', JSON.stringify(queries, null, 2) + '\n')
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'assertions', output)
	if (proof.status !== 'PASS') process.exitCode = 1
}
