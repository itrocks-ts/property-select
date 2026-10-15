import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const modulePath = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(modulePath)
const owner = resolve('node_modules/@itrocks/property-select')
const output = `${owner}/docs/orchestration/evidence/V2-UI`
const directory = '/tmp/property-select-V2-UI'
const port = 13721
const url = `http://127.0.0.1:${port}/`
const control = `${owner}/docs/orchestration/environment/control.mjs`
const env = { ...process.env, PS_ENV_DIRECTORY: directory, PS_STANDALONE_PORT: String(port) }
const records = [], failures = [], requests = [], inputs = [], commands = []
let browser, browserVersion, started = false
mkdirSync(output, { recursive: true })
function run(args)
{
	const stdout = execFileSync(process.execPath, [control, ...args], { env, encoding: 'utf8' })
	commands.push({ argv: [process.execPath, control, ...args], stdout })
	return stdout
}
function check(name, expected, observed)
{
	assert.deepEqual(observed, expected, name)
	records.push({ name, expected, observed, verdict: 'PASS' })
}
try {
	check('clean initial ownership reservation', false, existsSync(`${directory}/standalone.pid`))
	await new Promise((yes, no) => {
		const server = net.createServer()
		server.once('error', no)
		server.listen(port, '127.0.0.1', () => server.close(yes))
	})
	run(['standalone'])
	started = true
	for (let attempt = 0; ; attempt ++) {
		try { if ((await fetch(url)).ok) break }
		catch (error) { if (attempt > 40) throw error }
		await delay(100)
	}
	const identity = JSON.parse(readFileSync(`${directory}/standalone.owner.json`))
	writeFileSync(`${output}/ownership.json`, JSON.stringify(identity, null, 2) + '\n')
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	browserVersion = browser.version()
	for (const [name, width, height, touch] of [
		['desktop', 1280, 720, false], ['narrow', 768, 900, false],
		['portrait', 390, 844, true], ['landscape', 844, 390, true]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch })
		const page = await context.newPage()
		page.on('response', response => {
			if (response.status() >= 400) failures.push(`${name}: HTTP ${response.status()}: ${response.url()}`)
		})
		page.on('pageerror', error => failures.push(`${name}: ${error.message}`))
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type())) failures.push(`${name}: ${message.text()}`)
		})
		page.on('requestfailed', request => failures.push(`${name}: ${request.url()}: ${request.failure()?.errorText}`))
		page.on('request', request => requests.push({ name, url: request.url(), type: request.resourceType() }))
		await page.addInitScript(() => {
			window.trustedInputs = []
			for (const type of ['click', 'keydown', 'pointerdown', 'pointerup', 'touchmove', 'touchcancel'])
				document.addEventListener(type, event => window.trustedInputs.push({
					type, trusted: event.isTrusted, pointerType: event.pointerType, key: event.key
				}), true)
		})
		await page.goto(url)
		await page.locator('.ps-main').first().waitFor()
		const main = path => page.locator(`.ps-main[data-path="${path}"]`)
		const add = path => page.locator(`.ps-add[data-path="${path}"]`)
		const crumb = path => page.locator(`.ps-level[data-path="${path}"]`)
		const activate = async locator => touch ? locator.tap() : locator.click()
		const current = () => page.locator('.ps-level[aria-current]').getAttribute('data-path')
		const intentions = () => page.locator('#intentions li').allTextContents()
		const branch = () => page.locator('.ps-level').evaluateAll(nodes => nodes.map(node => node.dataset.path))
		const ready = async path => {
			await page.waitForFunction(path => document.querySelector('.ps-level[aria-current]')?.dataset.path === path, path)
		}
		check(`${name}: one list and business DOM order`, ['customer', 'number'],
			await page.locator('.ps-main').evaluateAll(nodes => nodes.map(node => node.dataset.path)))
		check(`${name}: exactly one property list`, 1, await page.locator('.ps-properties').count())
		check(`${name}: no table columns`, 0, await page.locator('table, th').count())
		check(`${name}: viewport`, [width, height], await page.evaluate(() => [innerWidth, innerHeight]))
		await page.screenshot({ path: `${output}/${name}-before.png` })
		if (!touch) {
			const boxes = () => page.locator('.ps-property').first().evaluate(node => {
				const rect = element => {
					const { x, y, width, height } = element.getBoundingClientRect()
					return { x, y, width, height }
				}
				return [rect(node), rect(node.firstElementChild), getComputedStyle(node).gridTemplateColumns]
			})
			const before = await boxes()
			await main('customer').hover()
			check(`${name}: hover preserves row/main geometry`, before, await boxes())
			check(`${name}: hovered plus visible`, '1', await add('customer').evaluate(n => getComputedStyle(n).opacity))
			await page.keyboard.press('Tab')
			check(`${name}: keyboard focus preserves geometry`, before, await boxes())
		}
		else {
			check(`${name}: touch without hover`, [true, false],
				await page.evaluate(() => [matchMedia('(pointer: coarse)').matches, matchMedia('(hover: hover)').matches]))
			check(`${name}: relation plus visible`, true, await add('customer').isVisible())
			check(`${name}: terminal plus hidden`, false, await add('number').isVisible())
		}
		await activate(main('customer'))
		await ready('customer')
		await activate(main('customer.address'))
		await ready('customer.address')
		await activate(main('customer.address.city'))
		await ready('customer.address.city')
		await activate(main('customer.address.city.country'))
		await ready('customer.address.city.country')
		const complete = ['', 'customer', 'customer.address', 'customer.address.city', 'customer.address.city.country']
		check(`${name}: full remembered branch`, complete, await branch())
		await activate(crumb('customer.address'))
		await ready('customer.address')
		check(`${name}: remembered descendant retained`, complete, await branch())
		await activate(crumb('customer.address.city'))
		await ready('customer.address.city')
		check(`${name}: descendant restores object`, 'customer.address.city', await current())
		await activate(crumb('customer.address'))
		await ready('customer.address')
		await activate(main('customer.address.country'))
		await ready('customer.address.country')
		check(`${name}: divergent suffix only`,
			['', 'customer', 'customer.address', 'customer.address.country'], await branch())
		check(`${name}: navigation emits no selection`, [], await intentions())
		await activate(main('customer.address.country.name'))
		await activate(crumb('customer.address'))
		await ready('customer.address')
		if (!touch) await main('customer.address.city').hover()
		await activate(add('customer.address.city'))
		check(`${name}: terminal and relation plus each emit once`,
			['customer.address.country.name', 'customer.address.city'], await intentions())
		check(`${name}: object plus retains current context`, 'customer.address', await current())
		if (!touch) {
			await main('customer.address.street').click()
			await page.keyboard.press('Tab')
			check(`${name}: Tab reaches sibling plus`, 'select:customer.address.street',
				await page.evaluate(() => document.activeElement.dataset.focus))
			check(`${name}: visible keyboard outline`, 'solid',
				await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle))
			await page.keyboard.press('Enter')
			await page.keyboard.press('Space')
			check(`${name}: Enter and Space each emit once`, 5, await page.locator('#intentions li').count())
			for (let step = 0; step < 4; step ++) await page.keyboard.press('Shift+Tab')
			check(`${name}: keyboard reaches relation plus`, 'select:customer.address.city',
				await page.evaluate(() => document.activeElement.dataset.focus))
			await page.keyboard.press('Enter')
			check(`${name}: keyboard selects exact object once`, ['customer.address.city', 'customer.address'],
				[(await intentions()).at(-1), await current()])
			check(`${name}: object keyboard emits once`, 6, (await intentions()).length)
		}
		const ids = await page.locator('#intentions li').evaluateAll(nodes => nodes.map(n => n.dataset.id))
		check(`${name}: intention ids unique`, ids.length, new Set(ids).size)
		await activate(crumb(''))
		await ready('')
		await activate(main('customer'))
		await ready('customer')
		let path = 'customer'
		for (let depth = 0; depth < 7; depth ++) {
			path += '.parent'
			await activate(main(path))
			await ready(path)
		}
		const beforeScroll = await intentions()
		const breadcrumb = page.locator('.ps-breadcrumb')
		const beforeLeft = await breadcrumb.evaluate(node => node.scrollLeft)
		const bounds = await breadcrumb.boundingBox()
		if (touch) {
			const cdp = await context.newCDPSession(page)
			const point = { x: Math.round(bounds.x + bounds.width - 40), y: Math.round(bounds.y + bounds.height / 2) }
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 1 }] })
			for (let step = 1; step <= 6; step ++) {
				await cdp.send('Input.dispatchTouchEvent', {
					type: 'touchMove', touchPoints: [{ x: point.x - step * 35, y: point.y, id: 1 }]
				})
				await delay(30)
			}
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, id: 2 }] })
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
		}
		else {
			await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
			await page.mouse.wheel(250, 0)
		}
		await delay(250)
		check(`${name}: real input scrolls breadcrumb`, true, await breadcrumb.evaluate(
			(node, before) => node.scrollLeft > before, beforeLeft))
		check(`${name}: scroll/cancel emits no selection`, beforeScroll, await intentions())
		await activate(crumb(''))
		await ready('')
		await activate(crumb(path))
		await ready(path)
		check(`${name}: long branch levels reachable without selection`, beforeScroll, await intentions())
		check(`${name}: no document horizontal overflow`, true,
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		await page.screenshot({ path: `${output}/${name}-after.png` })
		await activate(page.locator('#dispose'))
		check(`${name}: disposal removes surface`, 0, await page.locator('.property-select').count())
		await activate(page.locator('#mount'))
		await ready('')
		check(`${name}: remount one surface`, 1, await page.locator('.property-select').count())
		const count = (await intentions()).length
		await activate(main('number'))
		check(`${name}: remount has one listener`, count + 1, (await intentions()).length)
		inputs.push({ name, width, height, touch, events: await page.evaluate(() => window.trustedInputs) })
		await page.reload()
		await ready('')
		check(`${name}: fresh reload instance state`, ['', []], [await current(), await intentions()])
		await context.close()
	}
	const page = await browser.newPage()
	await page.goto(url)
	await page.locator('.ps-main').first().waitFor()
	const contracts = await page.evaluate(async () => {
		const { PropertySelectView } = await import('/assets/front/property-select.js')
		const { normalisePath } = await import('/assets/property-select.js')
		const { staticProvider } = await import('/catalogue.js')
		let missing = ''
		try { new PropertySelectView(document.createElement('div'), { root: 'invoice' }) }
		catch (error) { missing = error.message }
		const host = document.createElement('div')
		document.body.append(host)
		const view = new PropertySelectView(host, { metadata: staticProvider(), root: 'invoice' })
		const events = []
		view.selector.subscribe(event => { if (['select', 'outcome'].includes(event.type)) events.push(event) })
		const mount = view.mount()
		const samePromise = mount === view.mount()
		await mount
		window.independentFixture = { events, host, view }
		return { missing, samePromise, normalised: normalisePath(['customer', 'address', 'city']),
			defaults: [view.selector.usedPaths, view.selector.advice, view.selector.translate('Identity')],
			count: host.querySelectorAll('.property-select').length }
	})
	check('missing provider configuration error', true, /metadata|provider/i.test(contracts.missing))
	check('idempotent mount and dynamic insertion', [true, 1], [contracts.samePromise, contracts.count])
	check('optional defaults', [[], [], 'Identity'], contracts.defaults)
	check('array canonical path', 'customer.address.city', contracts.normalised)
	await page.locator('body > div .ps-main[data-path="number"]').click()
	const acknowledgements = await page.evaluate(() => {
		const { view, events } = window.independentFixture
		const intent = events.find(event => event.type === 'select').intent
		const before = events.filter(event => event.type === 'outcome').length
		const outcome = { id: intent.id, path: intent.path, status: 'added' }
		const first = view.selector.acknowledge(outcome)
		const duplicate = view.selector.acknowledge(outcome)
		const after = events.filter(event => event.type === 'outcome').length
		view.dispose()
		view.dispose()
		return { before, first, duplicate, after, count: window.independentFixture.host.children.length,
			late: view.selector.acknowledge(outcome) }
	})
	check('optional consumer observes only; one confirmation; disposal',
		{ before: 0, first: true, duplicate: false, after: 1, count: 0, late: false }, acknowledgements)
	const late = await page.evaluate(async () => {
		const { PropertySelectView } = await import('/assets/front/property-select.js')
		const host = document.createElement('div')
		document.body.append(host)
		let release
		const waiting = new Promise(resolve => { release = resolve })
		const metadata = {
			async context() { await waiting; return { label: 'Late', path: '', type: 'Late', properties: [] } },
			async resolve() { throw new Error('unused') } }
		const view = new PropertySelectView(host, { metadata, root: 'late' })
		const pending = view.mount()
		await new Promise(resolve => setTimeout(resolve, 100))
		view.dispose()
		release()
		await pending
		return [host.children.length, view.selector.status]
	})
	check('late provider cannot revive disposed view', [0, 'disposed'], late)
	check('all observed product input trusted', true, inputs.every(run => run.events.every(event => event.trusted)))
	check('each phone receives touch input', true,
		inputs.filter(run => run.touch).every(run => run.events.some(event => event.pointerType === 'touch')))
	check('each phone receives trusted movement and cancellation', true,
		inputs.filter(run => run.touch).every(run => ['touchmove', 'touchcancel'].every(
			type => run.events.some(event => event.type === type && event.trusted))))
	check('console errors and failed browser requests', [], failures)
	check('browser graph contains only standalone assets', [], requests.filter(request =>
		!new URL(request.url).pathname.match(/^\/(?:$|demo\.js$|catalogue\.js$|assets\/(?:front\/)?[\w.-]+$)/)))
	await browser.close()
	browser = undefined
	writeFileSync(`${output}/results.json`, JSON.stringify({ verdict: 'PASS', browser: browserVersion,
		playwright: require(`${modulePath}/package.json`).version, chromiumSandbox: true, url,
		fixture: 'static catalogue invoice/customer/address/city/country and cyclic parent; no records',
		checkpoint: 'b274d101e2d250a9318b312f0324a24a00519eb4', version: '0.2.1',
		records, failures, requests, inputs, commands }, null, 2) + '\n')
	console.log(`PASS: ${records.length} independent assertions; ${output}/results.json`)
}
catch (error) {
	writeFileSync(`${output}/failure.json`,
		JSON.stringify({ error: error.stack, records, failures, requests, inputs }, null, 2))
	throw error
}
finally {
	await browser?.close()
	if (started) {
		const stdout = run(['stop-standalone'])
		writeFileSync(`${output}/cleanup.txt`, stdout)
	}
	const hashes = {}
	for (const file of readdirSync(output).filter(file => file !== 'SHA256SUMS.json'))
		if (existsSync(`${output}/${file}`))
			hashes[file] = createHash('sha256').update(readFileSync(`${output}/${file}`)).digest('hex')
	writeFileSync(`${output}/SHA256SUMS.json`, JSON.stringify(hashes, null, 2) + '\n')
}
