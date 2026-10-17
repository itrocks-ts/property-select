import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const { chromium } = await import(process.env.PS_PLAYWRIGHT_MODULE)
const url = process.env.PS_UI_URL || 'http://127.0.0.1:13720'
const output = process.env.PS_UI_OUTPUT || '/tmp/property-select/L2-UI'
await mkdir(output, { recursive: true })
const records = []
function check(name, observed, expected)
{
	assert.deepEqual(observed, expected, name)
	records.push({ expected, name, observed, status: 'PASS' })
}
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
try {
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	const page = await context.newPage()
	const errors = []
	const imports = new Set()
	page.on('pageerror', error => errors.push(error.message))
	page.on('request', request => imports.add(new URL(request.url()).pathname))
	await page.goto(url)
	const main = path => page.locator(`.ps-main[data-path="${path}"]`)
	const add = path => page.locator(`.ps-check[data-path="${path}"]`)
	const openRelation = path => page.locator(`.ps-open[data-path="${path}"]`)
	const crumb = path => page.locator(`.ps-level[data-path="${path}"]`)
	const selected = () => page.locator('#intentions li').allTextContents()
	const current = () => page.locator('[aria-current="location"]').getAttribute('data-path')
	const waitContext = path => page.waitForFunction(path =>
		document.querySelector('[aria-current="location"]')?.dataset.path === path, path)
	await main('customer').waitFor()
	check('T01: single static object list', await page.locator('.ps-properties').count(), 1)
	await main('number').click()
	await page.waitForFunction(() => document.querySelectorAll('#intentions li').length === 1)
	check('T05: terminal main emits once', await selected(), ['number'])
	await main('customer').hover()
	await openRelation('customer').click()
	await waitContext('customer')
	check('T05: relation chevron navigates only', await selected(), ['number'])
	for (const path of ['customer.address', 'customer.address.city', 'customer.address.city.country']) {
		await main(path).hover()
		await openRelation(path).click()
		await waitContext(path)
	}
	check('T02: full labelled branch', await page.locator('.ps-level').allTextContents(),
		['Invoice', 'Customer', 'Address', 'City', 'Country'])
	await crumb('customer.address').click()
	await waitContext('customer.address')
	check('T02: remembered descendant survives ancestor', await crumb('customer.address.city.country').count(), 1)
	await crumb('customer.address.city').click()
	await waitContext('customer.address.city')
	check('T02: remembered country survives return', await crumb('customer.address.city.country').count(), 1)
	await crumb('customer.address').click()
	await waitContext('customer.address')
	await main('customer.address.country').hover()
	await openRelation('customer.address.country').click()
	await waitContext('customer.address.country')
	check('T03: divergent suffix only', await page.locator('.ps-level').allTextContents(),
		['Invoice', 'Customer', 'Address', 'Country'])
	await crumb('customer.address').click()
	await waitContext('customer.address')
	await page.locator('h1').hover()
	const before = await main('customer.address.city').boundingBox()
	const rowBefore = await main('customer.address.city').locator('..').boundingBox()
	check('T06: desktop chevron initially contextual', await openRelation('customer.address.city').evaluate(
		element => getComputedStyle(element).opacity), '0')
	await main('customer.address.city').hover()
	check('T06: hover reveals chevron', await openRelation('customer.address.city').evaluate(
		element => getComputedStyle(element).opacity), '1')
	check('T06: label and chevron do not move', await main('customer.address.city').boundingBox(), before)
	check('T06: row height does not move', await main('customer.address.city').locator('..').boundingBox(), rowBefore)
	await page.locator('h1').hover()
	await main('customer.address.city').focus()
	check('T06: name focus does not reveal row controls', await openRelation('customer.address.city').evaluate(
		element => getComputedStyle(element).opacity), '0')
	await page.keyboard.press('Shift+Tab')
	check('ACT-08: checkbox before name', await add('customer.address.city').evaluate(
		element => element === document.activeElement), true)
	check('ACT-08: focus is visible', await add('customer.address.city').evaluate(
		element => getComputedStyle(element).outlineStyle), 'solid')
	await page.keyboard.press('Space')
	await page.waitForFunction(() => document.querySelectorAll('#intentions li').length === 2)
	check('T07/T25: object intention by keyboard, no navigation', await current(), 'customer.address')
	check('T05/T07: checkbox emits object once', await selected(), ['number', 'customer.address.city'])
	await main('customer.address.street').hover()
	await add('customer.address.street').click()
	await page.waitForFunction(() => document.querySelectorAll('#intentions li').length === 3)
	check('T05: terminal checkbox emits once', await selected(),
		['number', 'customer.address.city', 'customer.address.street'])
	await openRelation('customer.address.city').focus()
	await page.keyboard.press('Enter')
	await waitContext('customer.address.city')
	check('ACT-08: Enter navigates relation', await current(), 'customer.address.city')
	await page.screenshot({ path: `${output}/desktop.png`, fullPage: true })
	await page.setViewportSize({ width: 768, height: 900 })
	check('Narrow: no page overflow at 768 × 900', await page.evaluate(() =>
		document.documentElement.scrollWidth <= window.innerWidth), true)
	await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
	check('Theme/reduced motion: native focus remains visible', await page.locator(':focus').evaluate(
		element => getComputedStyle(element).outlineStyle), 'solid')
	await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
	await page.setViewportSize({ width: 390, height: 844 })
	await crumb('customer').click()
	await waitContext('customer')
	let parent = 'customer'
	for (let depth = 0; depth < 8; depth ++) {
		parent += '.parent'
		await main(parent).hover()
		await openRelation(parent).click()
		await waitContext(parent)
	}
	check('T08: narrow long breadcrumb scrolls', await page.locator('.ps-breadcrumb').evaluate(
		element => element.scrollWidth > element.clientWidth), true)
	await page.locator('.ps-breadcrumb').hover()
	await page.mouse.wheel(700, 0)
	await crumb(parent).scrollIntoViewIfNeeded()
	await crumb(parent).click()
	await crumb('').scrollIntoViewIfNeeded()
	await crumb('').click()
	await waitContext('')
	check('T08: all levels remain and navigation/scroll never selects', await page.locator('.ps-level').count(), 10)
	check('T08: selection count unchanged', (await selected()).length, 3)
	check('T08: page has no horizontal overflow', await page.evaluate(() =>
		document.documentElement.scrollWidth <= window.innerWidth), true)
	await page.screenshot({ path: `${output}/portrait.png`, fullPage: true })
	await page.getByRole('button', { exact: true, name: 'Dispose' }).click()
	check('PORT-02: dispose removes owned surface', await page.locator('.property-select').count(), 0)
	await page.getByRole('button', { exact: true, name: 'Mount' }).click()
	await main('number').waitFor()
	await page.getByRole('button', { exact: true, name: 'Mount' }).click()
	check('PORT-02: repeated mount is singular', await page.locator('.property-select').count(), 1)
	await main('number').click()
	await page.waitForFunction(() => document.querySelectorAll('#intentions li').length === 4)
	check('PORT-02: remount has no duplicate listeners', (await selected()).length, 4)
	for (const denied of ['/src/controller.ts', '/assets/framework.js', '/assets/../package.json', '/catalogue.js/extra'])
		check(`PORT-01: reject unlisted ${denied}`, (await page.request.get(url + denied)).status(), 404)
	check('PORT-01: no host imports in network', [...imports].filter(path =>
		/framework|reflect|home|table|list\./.test(path)), [])
	check('PORT-01: public template and stylesheet loaded',
		['/assets/front/property-select.html', '/assets/front/property-select.css'].every(path => imports.has(path)), true)
	const touch = await browser.newContext({
		hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }
	})
	const mobile = await touch.newPage()
	mobile.on('pageerror', error => errors.push(error.message))
	await mobile.goto(url)
	await mobile.locator('.ps-main[data-path="customer"]').waitFor()
	check('T06: no-hover relation chevron always visible', await mobile.locator('.ps-open[data-path="customer"]').evaluate(
		element => getComputedStyle(element).display !== 'none' && getComputedStyle(element).opacity === '1'), true)
	check('T06: no-hover terminal chevron absent', await mobile.locator('.ps-open[data-path="number"]').count(), 0)
	await mobile.locator('.ps-check[data-path="customer"]').tap()
	await mobile.waitForFunction(() => document.querySelectorAll('#intentions li').length === 1)
	check('T05: real touch checkbox selects once without navigation',
		await mobile.locator('[aria-current]').getAttribute('data-path'), '')
	await mobile.locator('.ps-open[data-path="customer"]').tap()
	await mobile.locator('.ps-main[data-path="customer.name"]').waitFor()
	await mobile.locator('.ps-main[data-path="customer.name"]').tap()
	await mobile.waitForFunction(() => document.querySelectorAll('#intentions li').length === 2)
	check('T05: real touch terminal selects once', await mobile.locator('#intentions li').allTextContents(),
		['customer', 'customer.name'])
	await mobile.setViewportSize({ width: 844, height: 390 })
	check('ACT-05: landscape keeps relation action accessible',
		await mobile.locator('.ps-check[data-path="customer.address"]').isVisible(), true)
	const lifecycle = await page.evaluate(async () => {
		const { PropertySelectView } = await import('/assets/front/property-select.js')
		const { staticProvider } = await import('/catalogue.js')
		const host = document.createElement('div')
		document.body.append(host)
		const provider = staticProvider()
		let release
		let started
		const pending = new Promise(resolve => { release = resolve })
		const entered = new Promise(resolve => { started = resolve })
		const metadata = {
			...provider,
			async context(root, path, signal)
			{
				started()
				await pending
				return provider.context(root, path) // Deliberately ignore advisory cancellation.
			}
		}
		const view = new PropertySelectView(host, { metadata, root: 'invoice' })
		const first = view.mount()
		const second = view.mount()
		await entered
		view.dispose()
		view.dispose()
		release()
		const mounted = await first
		const result = { children: host.childElementCount, mounted, samePromise: first === second,
			status: view.selector.status }
		host.remove()
		return result
	})
	check('PORT-02: dispose during late metadata prevents revival; mount/dispose are idempotent', lifecycle,
		{ children: 0, mounted: false, samePromise: true, status: 'disposed' })
	check('Browser exceptions', errors, [])
	await writeFile(`${output}/browser.json`, JSON.stringify({ browser: browser.version(), imports: [...imports],
		records, status: 'PASS', url }, null, 2) + '\n')
	console.log(JSON.stringify({ assertions: records.length, browser: browser.version(), status: 'PASS', url }))
}
finally {
	await browser.close()
}
