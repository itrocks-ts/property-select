import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { isDeepStrictEqual } from 'node:util'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/V3`
const directory = '/tmp/property-select/V3'
const app = 'http://127.0.0.1:13871'
const standalone = 'http://127.0.0.1:13872'
const env = { ...process.env, PS_APP_PORT: '13871', PS_STANDALONE_PORT: '13872', PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/checks/V3-initialise.cjs` }
const result = { checks: [], commands: [], contexts: [], metadata: [], requests: [], health: [], input: [],
	seed: 'search-graph.mjs and environment/models; synthetic property_select_recipe',
	checkpoint: execFileSync('git', ['-C', owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync(`${owner}/package.json`)).version, urls: [standalone, app] }
let browser, page
const started = []
function check(name, observed, expected)
{
	result.checks.push({ name, observed, expected, status: isDeepStrictEqual(observed, expected) ? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
function control(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	result.commands.push({ action, environment: env, stdout })
	// Retain only explicit recipe overrides, never the inherited shell environment.
	result.commands.at(-1).environment = Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith('PS_')))
}
async function free(port)
{
	await new Promise((yes, no) => {
		const server = net.createServer().once('error', no)
		server.listen(port, '127.0.0.1', () => server.close(yes))
	})
}
async function ready(url)
{
	for (let i = 0; i < 150; i ++) {
		try { if ((await fetch(url)).ok) return }
		catch {}
		await pause(100)
	}
	throw new Error(`Unavailable ${url}`)
}
async function context(path)
{
	await page.waitForFunction(path => document.querySelector('[aria-current="location"]')?.dataset.path === path, path)
}
async function complete()
{
	await page.waitForFunction(() => !['idle', 'loading', undefined].includes(
		document.querySelector('.property-select')?.dataset.searchStatus), { timeout: 30000 })
}
const main = path => page.locator(`.ps-main[data-path="${path}"]`)
const crumb = path => page.locator(`.ps-level[data-path="${path}"]`)
const paths = () => page.locator('.ps-main').evaluateAll(nodes => nodes.map(node => node.dataset.path))
const state = () => page.locator('.property-select').getAttribute('data-search-status')
async function query(text)
{
	await page.locator('.ps-query').fill(text)
	result.input.push({ url: page.url(), action: 'trusted fill', text })
}
async function click(locator)
{
	await locator.click()
	result.input.push({ url: page.url(), action: 'trusted click', selector: String(locator) })
}
async function snap(name)
{
	await page.screenshot({ path: `${output}/${name}.png`, fullPage: true })
}
async function open(url, integrated = false)
{
	await page.goto(url)
	if (integrated) await click(page.locator('.add-column:not([hidden])'))
	await page.locator('.ps-main').first().waitFor()
}
async function snapshot(name)
{
	result.contexts.push({ name, url: page.url(), viewport: page.viewportSize(), status: await state(),
		paths: await paths(), current: await page.locator('[aria-current="location"]').getAttribute('data-path') })
}
mkdirSync(output, { recursive: true })
mkdirSync(directory, { recursive: true })
try {
	for (const [action, port] of [['app', 13871], ['standalone', 13872]]) {
		check(`No inherited ${action} reservation`, existsSync(`${directory}/${action}.pid`), false)
		await free(port)
		control(action)
		started.push(action)
	}
	await ready(`${app}/country`)
	await ready(standalone)
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	result.browser = browser.version()
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		const bc = await browser.newContext({ viewport: { width, height } })
		page = await bc.newPage()
		await page.addInitScript(() => {
			window.v3Inputs = []
			for (const event of ['click', 'input', 'keydown']) document.addEventListener(event, value =>
				window.v3Inputs.push({ type: value.type, trusted: value.isTrusted }), true)
		})
		page.on('pageerror', error => result.health.push({ type: 'pageerror', message: error.message }))
		page.on('console', value => {
			if (['error', 'warning'].includes(value.type())) result.health.push({ type: value.type(), text: value.text() })
		})
		page.on('response', response => {
			if (response.status() >= 400) result.health.push({ status: response.status(), url: response.url() })
		})
		page.on('requestfailed', request => result.health.push({ type: 'requestfailed', url: request.url(),
			error: request.failure()?.errorText }))
		page.on('request', request => result.requests.push({ url: request.url(), method: request.method() }))
		for (const integrated of [false, true]) {
			const prefix = `${integrated ? 'integrated' : 'standalone'}-${width}`
			const url = integrated ? `${app}/property-select-invoice` : `${standalone}/search-fixture?reverse`
			await open(url, integrated)
			await snap(`${prefix}-before`)
			await query(integrated ? ' NaMe   CoUnTrY CUSTOMER ' : ' CÔDE   pAyS CLIENT ')
			await complete()
			const a = integrated ? 'customer.address.city.country.name' : 'customer.address.country.code'
			const b = integrated ? 'deliveryAddress.city.country.name' : 'customer.billingAddress.country.code'
			check(`${prefix} T09 all-word normalisation`, (await paths()).includes(a), true)
			if (integrated) {
				await query('country name')
				await complete()
			}
			check(`${prefix} SEA-03 separate same-type paths`, (await paths()).includes(b), true)
			const row = main(a).locator('..')
			check(`${prefix} SEA-04 root-to-parent path`,
				await row.locator('.ps-result-path button').evaluateAll(nodes => nodes.map(n => n.dataset.path)),
				['', 'customer', 'customer.address', ...(integrated ? ['customer.address.city'] : []),
					integrated ? 'customer.address.city.country' : 'customer.address.country'])
			check(`${prefix} no duplicate rows`, new Set(await paths()).size, (await paths()).length)
			await snap(`${prefix}-search`)
			await click(row.locator('.ps-result-path button[data-path="customer.address"]'))
			await context('customer.address')
			await complete()
			check(`${prefix} T10 only local descendants`, (await paths()).every(p => p.startsWith('customer.address.')), true)
			const retainedQuery = await page.locator('.ps-query').inputValue()
			await click(crumb(''))
			await context('')
			await complete()
			check(`${prefix} T10 root return preserves query`, await page.locator('.ps-query').inputValue(), retainedQuery)
			await query('country')
			await complete()
			const relation = integrated ? 'deliveryAddress.city.country' : 'customer.billingAddress.country'
			await click(main(relation))
			await context(relation)
			await complete()
			await click(page.locator('.ps-clear'))
			check(`${prefix} clear query`, await page.locator('.ps-query').inputValue(), '')
			check(`${prefix} clear adjacent rows`, await paths(),
				integrated ? [`${relation}.name`] : [`${relation}.code`, `${relation}.name`])
			check(`${prefix} clear preserves input focus`, await page.locator('.ps-query').evaluate(
				node => node === document.activeElement), true)
			await query('NoSuchPropertyV3')
			await complete()
			check(`${prefix} definitive leaf empty`, await state(), 'empty')
			await snapshot(`${prefix}-empty`)
			await snap(`${prefix}-after`)
			check(`${prefix} responsive shell`, await page.evaluate(() =>
				document.documentElement.scrollWidth <= innerWidth), true)
			check(`${prefix} trusted input only`, await page.evaluate(() =>
				window.v3Inputs.length > 0 && window.v3Inputs.every(event => event.trusted)), true)
		}
		await bc.close()
	}
	// Separate timing checks use genuinely delayed provider calls and browser keyboard focus.
	const bc = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	page = await bc.newPage()
	await open(`${standalone}/search-fixture`)
	await query('name')
	await main('tags.name').waitFor()
	await main('tags.name').hover()
	await click(main('tags.name').locator('..').locator('.ps-add'))
	await page.evaluate(() => { window.v3Focus = document.activeElement })
	check('PORT-06 pending work visible', await state(), 'loading')
	await complete()
	check('PORT-06 exact plus focus survives enrichment', await page.evaluate(() =>
		window.v3Focus === document.activeElement && window.v3Focus.isConnected), true)
	const order = await paths()
	await open(`${standalone}/search-fixture?reverse`)
	await query('name')
	await complete()
	check('PORT-06 reversed arrival deterministic ranking', await paths(), order)
	await open(`${standalone}/search-fixture?focusLimit`)
	await main('slow').waitFor()
	await query('name')
	await main('slow.name').waitFor()
	await click(main('slow.name'))
	await page.evaluate(() => { window.v3Focus = document.activeElement })
	await complete()
	check('PORT-06 evicted focused result retains exact node', await page.evaluate(() =>
		window.v3Focus === document.activeElement && window.v3Focus.isConnected), true)
	check('PORT-06 focus retention stays within budget', await paths(), ['slow.name'])
	await page.keyboard.press('Tab')
	await page.keyboard.press('Shift+Tab')
	await click(page.locator('.ps-query'))
	await main('fast.name').waitFor()
	check('PORT-06 final rank after focus leaves', await paths(), ['fast.name'])
	await open(`${standalone}/search-fixture`)
	await query('code')
	await pause(30)
	await query('number')
	await complete()
	await pause(250)
	check('T12 late obsolete query ignored', await paths(), ['number', 'tags.invoices.number'])
	check('T12 actual ignored abort observed', await page.evaluate(() =>
		window.searchFixture.calls.some(call => call.aborted)), true)
	const calls = await page.evaluate(() => window.searchFixture.calls)
	result.standaloneTrace = calls
	check('T13 N-N inverse return followed', calls.some(call => call.path === 'tags.invoices'), true)
	check('T13 one-to-many inverse return excluded', calls.some(call => call.path === 'lines.invoice'), false)
	check('T13 unknown repeat excluded', calls.some(call => call.path.includes('parent.parent')), false)
	await open(`${standalone}/search-fixture`)
	await query('customer')
	await click(main('customer'))
	await context('customer')
	await query('country')
	await complete()
	await pause(250)
	check('T12 rapid context switch excludes obsolete root paths', (await paths()).every(p =>
		p.startsWith('customer.')), true)
	check('T10 scoped trace never expands root', await page.evaluate(() =>
		window.searchFixture.calls.filter(call => call.path === '').length), 1)
	await open(`${standalone}/search-fixture?large`)
	await main('branch0').waitFor()
	await query('impossible')
	await complete()
	check('T12 zero under budget never definitive empty', await state(), 'limited')
	check('PORT-03 browser visit ceiling', await page.evaluate(() => window.searchFixture.search.visited), 25)
	check('PORT-03 browser pending ceiling', await page.evaluate(() => window.searchFixture.peak <= 4), true)
	await open(`${standalone}/search-fixture?error`)
	await query('name')
	await complete()
	check('T12 recoverable provider error', await state(), 'error')
	check('T12 partial results survive error', (await paths()).includes('tags.name'), true)
	await click(page.locator('.ps-clear'))
	await click(main('tags'))
	await context('tags')
	check('T12 navigation after provider failure', await main('tags.name').count(), 1)
	await open(`${app}/property-select-invoice`, true)
	const metadataResponses = []
	page.on('response', async response => {
		if (response.url().includes('/property-select/context/')) {
			const body = await response.json().catch(() => null)
			metadataResponses.push({ url: response.url(), status: response.status(), body })
		}
	})
	const sqlBefore = await (await fetch(`${app}/property-select-observation/probe/json`)).json()
	await query('country name')
	await complete()
	await pause(100)
	result.metadata = metadataResponses
	const tracedPaths = metadataResponses.map(r => new URL(r.url).searchParams.get('path'))
	check('Integrated cycle N-N inverse followed', tracedPaths.includes('tags.invoices'), true)
	check('Integrated 1-N inverse excluded', tracedPaths.includes('lines.invoice'), false)
	check('Integrated Date remains terminal', tracedPaths.some(p => p === 'issuedAt' || p.startsWith('issuedAt.')), false)
	const sqlAfter = await (await fetch(`${app}/property-select-observation/probe/json`)).json()
	check('Metadata search executes zero business SQL', sqlAfter.length, sqlBefore.length)
	const rootMetadata = await (await fetch(`${app}/property-select/context/json?root=invoice&path=`)).json()
	check('META Date descriptor terminal', rootMetadata.properties.find(p => p.name === 'issuedAt').kind, 'terminal')
	for (const operation of ['context', 'resolve']) {
		const forbidden = await fetch(`${app}/property-select/${operation}/json?root=invoice`
			+ '&path=customer.address&catalogue=restricted')
		check(`META-02 ${operation} applies identical request permission`, forbidden.status, 403)
	}
	const restricted = await (await fetch(`${app}/property-select/context/json?root=invoice`
		+ '&path=customer&catalogue=restricted')).json()
	check('META-02 enumeration omits forbidden child', restricted.properties.some(p => p.name === 'address'), false)
	const invalidDate = await fetch(`${app}/property-select/resolve/json?root=invoice&path=issuedAt.getTime`)
	check('META scalar Date method traversal HTTP 400', invalidDate.status, 400)
	const ambiguous = await fetch(`${app}/property-select/context/json?root=scalar&path=ambiguous`)
	check('META-03 ambiguous domain target explicitly rejects', ambiguous.status, 400)
	const scalar = await (await fetch(`${app}/property-select/context/json?root=scalar&path=`)).json()
	check('META-01 optional scalar metadata present', scalar.properties.some(p => p.name === 'optionalDate'), true)
	let slowPath = 'customer'
	await page.route('**/property-select/context/json?*', async route => {
		const response = await route.fetch()
		if (new URL(route.request().url()).searchParams.get('path') === slowPath) await pause(500)
		await route.fulfill({ response })
	})
	await open(`${app}/property-select-invoice`, true)
	await query('name')
	await main('tags.name').waitFor()
	await page.keyboard.press('Tab')
	await page.keyboard.press('Tab')
	check('Integrated keyboard reaches pending result', await page.evaluate(() =>
		document.activeElement?.dataset.path), 'tags.name')
	await page.evaluate(() => { window.v3Focus = document.activeElement })
	check('Integrated progressive focus captured while loading', await state(), 'loading')
	await complete()
	check('Integrated focus exact node survives enrichment', await page.evaluate(() =>
		window.v3Focus === document.activeElement && window.v3Focus.isConnected), true)
	const rankForward = await paths()
	check('Integrated budget reached is visible', await state(), 'limited')
	slowPath = 'tags'
	await open(`${app}/property-select-invoice`, true)
	await query('name')
	await complete()
	check('Integrated reverse HTTP completion preserves final rank', await paths(), rankForward)
	await page.unrouteAll({ behavior: 'wait' })
	// Delay actual HTTP metadata, then release it after trusted navigation to another context.
	let release, held
	const gate = new Promise(resolve => { release = resolve })
	const pending = new Promise(resolve => { held = resolve })
	await page.route('**/property-select/context/json?*', async route => {
		const path = new URL(route.request().url()).searchParams.get('path')
		const response = await route.fetch()
		if (path === 'customer') {
			held()
			await gate
		}
		await route.fulfill({ response }).catch(error => result.input.push({ lateFulfilment: String(error) }))
	})
	await open(`${app}/property-select-invoice`, true)
	await query('address')
	await pending
	check('Integrated delayed generation remains loading', await state(), 'loading')
	await click(main('deliveryAddress'))
	await context('deliveryAddress')
	await query('country name')
	await complete()
	const beforeRelease = await paths()
	release()
	await pause(250)
	check('Integrated late HTTP response cannot replace current context results', await paths(), beforeRelease)
	check('Integrated local-only after rapid context switch', beforeRelease.every(p =>
		p.startsWith('deliveryAddress.')), true)
	await page.unrouteAll({ behavior: 'wait' })
	await snapshot('integrated-delayed-context')
	await page.goto(`${app}/country`)
	check('Country real framework control', (await page.locator('body').innerText()).includes('Recipe France'), true)
	check('First four viewport runs browser health', result.health, [])
	result.status = 'PASS'
}
catch (error) {
	result.status = 'FAIL'
	result.failure = String(error)
	if (page) {
		await snap('failure').catch(() => {})
		result.failureDOM = await page.locator('body').innerText().catch(() => '')
		result.failureState = await page.evaluate(() => ({
			fixture: window.searchFixture?.state, search: window.searchFixture?.search,
			rows: [...document.querySelectorAll('.ps-property')].map(node => ({
				path: node.dataset.path, retained: !!node.dataset.retained
			})), active: document.activeElement?.dataset.path
		})).catch(() => null)
	}
	process.exitCode = 1
}
finally {
	await browser?.close()
	for (const action of started.reverse()) control(`stop-${action}`)
	writeFileSync(`${output}/results.json`, JSON.stringify(result, null, 2) + '\n')
}
console.log(JSON.stringify({ status: result.status, checks: result.checks.length, failure: result.failure }))
