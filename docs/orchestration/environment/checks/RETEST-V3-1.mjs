import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { PropertySelect } from '../../../../property-select.js'

const require = createRequire(import.meta.url)
const { chromium } = require(
	'/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
)
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/RETEST-V3-1/independent`
const app = 'http://127.0.0.1:13881'
const standalone = 'http://127.0.0.1:13882'
const env = { ...process.env, PS_APP_PORT: '13881', PS_STANDALONE_PORT: '13882',
	PS_ENV_DIRECTORY: '/tmp/property-select/RETEST-V3-1',
	PS_FRAMEWORK_INITIALIZER: `${recipe}/checks/V3-initialise.cjs` }
const proof = { checks: [], snapshots: [], commands: [], inputs: [], health: [], trace: [], metadata: [],
	checkpoint: execFileSync('git', ['-C', owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync(`${owner}/package.json`)).version,
	fixture: 'Public search-graph and real synthetic invoice, no reset; mouse/keyboard at all dimensions' }
let browser, page
const started = []
function verify(name, observed, expected)
{
	try {
		assert.deepEqual(observed, expected)
		proof.checks.push({ name, expected, observed, status: 'PASS' })
	}
	catch (error) {
		proof.checks.push({ name, expected, observed, status: 'FAIL' })
		throw new Error(name, { cause: error })
	}
}
function control(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	proof.commands.push({ action, stdout, overrides: Object.fromEntries(Object.entries(env)
		.filter(([key]) => key.startsWith('PS_'))) })
}
async function ready(url)
{
	for (let attempt = 0; attempt < 150; attempt ++) {
		try { if ((await fetch(url)).ok) return }
		catch {}
		await pause(100)
	}
	throw new Error(`Not ready: ${url}`)
}
const rows = () => page.locator('.ps-property').evaluateAll(nodes => nodes.map(node => node.dataset.path))
const main = path => page.locator(`.ps-main[data-path="${path}"]`)
const status = () => page.locator('.property-select').getAttribute('data-search-status')
const settled = () => page.waitForFunction(() =>
	['complete', 'limited', 'empty', 'error'].includes(document.querySelector('.property-select')?.dataset.searchStatus))
const context = path => page.waitForFunction(path =>
	document.querySelector('[aria-current="location"]')?.dataset.path === path, path)
async function open(integrated, suffix = '')
{
	if (page && !page.isClosed()) {
		const events = await page.evaluate(() => window.retestEvents || [])
		if (events.length) proof.inputs.push({ url: page.url(), viewport: page.viewportSize(), events })
	}
	await page.goto(integrated ? `${app}/property-select-invoice` : `${standalone}/search-fixture${suffix}`)
	if (integrated) await page.locator('.add-column:not([hidden])').click()
	await main(suffix.includes('focusLimit') ? 'slow' : suffix.includes('large') ? 'branch0' : 'tags').waitFor()
}
async function shot(name)
{
	await page.screenshot({ path: `${output}/${name}.png` })
	proof.snapshots.push({ name, url: page.url(), viewport: page.viewportSize(), rows: await rows(),
		query: await page.locator('.ps-query').inputValue(), status: await status(),
		retained: await page.locator('[data-retained]').count(),
		focus: await page.evaluate(() => document.activeElement?.dataset.focus) })
}
async function keyboardFocus(path, plus)
{
	// Begin at the actual search input, walk the public tab order and observe exact node identity.
	for (let index = 0; index < 450; index ++) {
		await page.keyboard.press('Tab')
		if (await page.evaluate(key => document.activeElement?.dataset.focus === key,
			`${plus ? 'select' : 'main'}:${path}`)) {
			await page.evaluate(() => { window.retestNode = document.activeElement })
			return
		}
	}
	throw new Error(`Keyboard never reached ${path}`)
}
async function json(path)
{
	const response = await fetch(`${app}${path}`)
	const body = await response.json()
	proof.metadata.push({ path, status: response.status, body })
	return { body, status: response.status }
}
mkdirSync(output, { recursive: true })
try {
	for (const action of ['app', 'standalone']) {
		control(action)
		started.push(action)
	}
	await ready(`${app}/country`)
	await ready(standalone)
	browser = await chromium.launch({ headless: true, chromiumSandbox: true })
	proof.browser = browser.version()
	for (const viewport of [{ width: 1280, height: 720 }, { width: 768, height: 900 },
		{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
		for (const integrated of [false, true]) {
			const label = `${integrated ? 'integrated' : 'standalone'}-${viewport.width}`
			const bc = await browser.newContext({ viewport })
			page = await bc.newPage()
			await page.addInitScript(() => {
				window.retestEvents = []
				for (const type of ['click', 'input', 'keydown']) document.addEventListener(type, event =>
					window.retestEvents.push({ type, trusted: event.isTrusted }), true)
			})
			page.on('pageerror', error => proof.health.push({ label, type: 'pageerror', text: String(error) }))
			page.on('console', event => {
				if (['warning', 'error'].includes(event.type()))
					proof.health.push({ label, type: event.type(), text: event.text() })
			})
			page.on('requestfailed', request => proof.health.push({ label, type: 'requestfailed', url: request.url(),
				error: request.failure()?.errorText }))
			page.on('response', response => {
				if (response.status() >= 400)
					proof.health.push({ label, type: 'http', status: response.status(), url: response.url() })
			})
			await open(integrated)
			await shot(`${label}-before`)
			await main('tags').click()
			await context('tags')
			verify(`${label}: ordinary rows`, await rows(), ['tags.invoices', 'tags.name'])
			verify(`${label}: ordinary retention absent`, await page.locator('[data-retained]').count(), 0)
			await shot(`${label}-ordinary-after`)
			// HTTP error is intentionally injected; standalone uses the public error fixture.
			if (integrated) await page.route('**/property-select/context/json?*', async route => {
				if (new URL(route.request().url()).searchParams.get('path') === 'customer')
					await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
				else await route.continue()
			})
			await open(integrated, '?error')
			await page.locator('.ps-query').fill('name')
			await settled()
			verify(`${label}: partial error`, await status(), 'error')
			verify(`${label}: partial tags result survives`, (await rows()).includes('tags.name'), true)
			await page.locator('.ps-clear').click()
			verify(`${label}: Clear restores idle`, await status(), 'idle')
			await main('tags').click()
			await context('tags')
			verify(`${label}: recovered exact rows`, await rows(), ['tags.invoices', 'tags.name'])
			verify(`${label}: recovered no retention`, await page.locator('[data-retained]').count(), 0)
			await shot(`${label}-recovery-after`)
			await page.unrouteAll({ behavior: 'wait' })
			await open(integrated)
			await page.locator('.ps-query').fill(integrated ? ' CUSTOMER   nAmE country ' : ' CÔDE  CLIENT pays ')
			await settled()
			const target = integrated ? 'customer.address.city.country.name' : 'customer.address.country.code'
			verify(`${label}: normalised all words`, (await rows()).includes(target), true)
			await main(target).locator('..').locator('.ps-result-path button[data-path="customer.address"]').click()
			await context('customer.address')
			await settled()
			verify(`${label}: segment scope`, (await rows()).every(path => path.startsWith('customer.address.')), true)
			const text = await page.locator('.ps-query').inputValue()
			await page.locator('.ps-level[data-path=""]').click()
			await context('')
			await settled()
			verify(`${label}: root query preserved`, await page.locator('.ps-query').inputValue(), text)
			await page.locator('.ps-query').fill('tags')
			await main('tags').click()
			await context('tags')
			await settled()
			verify(`${label}: root row never retained in new scope`, await main('tags').count(), 0)
			verify(`${label}: only destination results`, (await rows()).every(path => path.startsWith('tags.')), true)
			await page.locator('.ps-clear').click()
			verify(`${label}: second Clear complete`, await rows(), ['tags.invoices', 'tags.name'])
			// Increase only public fixture latency to make progressive focus observations deterministic.
			await page.route(`${standalone}/search.js`, route => route.fulfill({ contentType: 'text/javascript',
				body: readFileSync(`${recipe}/demo/search.js`, 'utf8').replaceAll('180', '1200') }))
			for (const plus of [false, true]) {
				for (const budget of [false, true]) {
					if (integrated) await page.route('**/property-select/context/json?*', async route => {
						const response = await route.fetch()
						if (new URL(route.request().url()).searchParams.get('path') !== 'customer') {
							await route.fulfill({ response })
							return
						}
						const body = await response.json()
						if (budget) body.properties.push(...Array.from({ length: 105 }, (_, index) => ({
							kind: 'terminal', label: `Name ${index}`, name: `retestName${index}`, order: -500 + index,
							path: `customer.retestName${index}`
						})))
						await pause(1200)
						await route.fulfill({ response, json: body })
					})
					await open(integrated, budget && !integrated ? '?focusLimit' : '')
					await page.locator('.ps-query').fill('name')
					const path = budget && !integrated ? 'slow.name' : 'tags.name'
					await main(path).waitFor()
					await keyboardFocus(path, plus)
					const key = `${label}-${plus ? 'plus' : 'main'}-${budget ? 'budget' : 'enrich'}`
					verify(`${key}: capture pending`, await status(), 'loading')
					await settled()
					verify(`${key}: same focused node`, await page.evaluate(() =>
						window.retestNode === document.activeElement && window.retestNode.isConnected), true)
					verify(`${key}: no duplicate paths`, new Set(await rows()).size, (await rows()).length)
					if (budget) {
						verify(`${key}: exact ceiling`, (await rows()).length, integrated ? 100 : 1)
						verify(`${key}: focused path retained`, (await rows()).includes(path), true)
						verify(`${key}: one retained marker`, await page.locator('[data-retained]').count(), 1)
						await shot(`${key}-focused`)
						await page.locator('.ps-query').click()
						await main(path).waitFor({ state: 'detached' })
						verify(`${key}: final rank on blur`, integrated ? (await rows()).every(path =>
							path.startsWith('customer.retestName')) : await rows(), integrated ? true : ['fast.name'])
						verify(`${key}: retention released`, await page.locator('[data-retained]').count(), 0)
					}
					// A changed query must clear any retained row from the prior search generation.
					await page.locator('.ps-query').fill('definitelyAbsentRetest')
					await settled()
					verify(`${key}: new query has no old row`, await rows(), [])
					verify(`${key}: new query has no retained marker`, await page.locator('[data-retained]').count(), 0)
					await page.unroute('**/property-select/context/json?*')
				}
			}
			proof.inputs.push({ label, events: await page.evaluate(() => window.retestEvents) })
			verify(`${label}: trusted final run`, proof.inputs.at(-1).events.every(event => event.trusted), true)
			await bc.close()
		}
	}
	const timingContext = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	page = await timingContext.newPage()
	const ranks = []
	for (const reverse of [false, true]) {
		await open(false, reverse ? '?reverse' : '')
		await page.locator('.ps-query').fill('name')
		await settled()
		ranks.push(await rows())
	}
	verify('Independent reversed provider completion rank', ranks[1], ranks[0])
	await open(false)
	await page.locator('.ps-query').fill('code')
	await pause(25)
	await page.locator('.ps-query').fill('number')
	await settled()
	await pause(300)
	verify('Independent rapid query drops obsolete rows', await rows(), ['number', 'tags.invoices.number'])
	verify('Independent abort-insensitive provider actually aborted', await page.evaluate(() =>
		window.searchFixture.calls.some(call => call.aborted)), true)
	await open(false)
	await page.locator('.ps-query').fill('customer')
	await main('customer').click()
	await context('customer')
	await page.locator('.ps-query').fill('country')
	await settled()
	await pause(300)
	verify('Independent rapid context stays local', (await rows()).every(path => path.startsWith('customer.')), true)
	verify('Independent scope never reloads root', await page.evaluate(() =>
		window.searchFixture.calls.filter(call => call.path === '').length), 1)
	await open(false, '?large')
	await page.locator('.ps-query').fill('definitelyAbsentRetest')
	await settled()
	verify('Independent no-match budget reports limited', await status(), 'limited')
	verify('Independent context ceiling', await page.evaluate(() => window.searchFixture.search.visited), 25)
	verify('Independent request ceiling', await page.evaluate(() => window.searchFixture.peak <= 4), true)
	await timingContext.close()
	// Separate real HTTP metadata boundary through the public controller, independent of DOM focus assertions.
	const sqlBefore = (await json('/property-select-observation/probe/json')).body
	const metadata = {
		async context(root, path, signal)
		{
			proof.trace.push(path)
			const response = await fetch(`${app}/property-select/context/json?root=${root}&path=${path}`, { signal })
			assert.equal(response.status, 200)
			return response.json()
		},
		async resolve(root, path, signal)
		{
			const response = await fetch(`${app}/property-select/resolve/json?root=${root}&path=${path}`, { signal })
			assert.equal(response.status, 200)
			return response.json()
		}
	}
	const selector = new PropertySelect({ root: 'invoice', metadata, search: { maxDepth: 5 } })
	await selector.mount()
	selector.setQuery('name')
	while (selector.search.status === 'loading') await pause(20)
	verify('Real N-N inverse is followed', proof.trace.includes('tags.invoices'), true)
	verify('Real 1-N inverse is excluded', proof.trace.includes('lines.invoice'), false)
	verify('Real unknown reverse repeat is excluded', proof.trace.some(path => path.includes('parent.parent')), false)
	verify('Real Date is never traversed', proof.trace.some(path => path.startsWith('issuedAt')), false)
	verify('Real distinct address paths survive', [
		'customer.address.city.country.name', 'deliveryAddress.city.country.name'
	].every(path => selector.search.results.some(r => r.property.path === path)), true)
	const root = (await json('/property-select/context/json?root=invoice&path=')).body
	verify('Real Date terminal descriptor', root.properties.find(p => p.name === 'issuedAt').kind, 'terminal')
	verify('Real N-N cardinality', root.properties.find(p => p.name === 'tags').relation.cardinality, 'many-to-many')
	verify('Real 1-N cardinality', root.properties.find(p => p.name === 'lines').relation.cardinality, 'one-to-many')
	const lines = (await json('/property-select/context/json?root=invoice&path=lines')).body
	verify('Real N-1 cardinality', lines.properties.find(p => p.name === 'invoice').relation.cardinality, 'many-to-one')
	await selector.navigate('lines')
	selector.setQuery('number')
	while (selector.search.status === 'loading') await pause(20)
	verify('Real incoming 1-N history excludes inverse',
		selector.search.results.some(r => r.property.path === 'lines.invoice.number'), false)
	const lineProvider = {
		async context(root, path, signal)
		{
			const response = await metadata.context('invoice', `lines${path ? `.${path}` : ''}`, signal)
			return { ...response, path, properties: response.properties.map(property => ({
				...property, path: property.path.slice(6)
			})) }
		},
		resolve: metadata.resolve
	}
	const lineSelector = new PropertySelect({ root: 'line', metadata: lineProvider, search: { maxDepth: 3 } })
	await lineSelector.mount()
	lineSelector.setQuery('label')
	while (lineSelector.search.status === 'loading') await pause(20)
	verify('Real N-1 permits one known inverse return from fresh Line root',
		lineSelector.search.results.some(r => r.property.path === 'invoice.lines.label'), true)
	lineSelector.dispose()
	for (const operation of ['context', 'resolve']) verify(`Restricted ${operation} denies full path`,
		(await json(`/property-select/${operation}/json?root=invoice&path=customer.address&catalogue=restricted`)).status,
		403)
	const restricted = (await json('/property-select/context/json?root=invoice&path=customer&catalogue=restricted')).body
	verify('Restricted enumeration hides forbidden child', restricted.properties.some(p => p.name === 'address'), false)
	verify('Date method explicitly invalid',
		(await json('/property-select/resolve/json?root=invoice&path=issuedAt.getTime')).status, 400)
	verify('Ambiguous target explicitly invalid',
		(await json('/property-select/context/json?root=scalar&path=ambiguous')).status, 400)
	const sqlAfter = (await json('/property-select-observation/probe/json')).body
	verify('Metadata and permission itinerary reads zero business records', sqlAfter, sqlBefore)
	selector.dispose()
	const unexpected = proof.health.filter(event => !(event.type === 'http' && event.status === 503)
		&& !(event.type === 'error' && event.text.includes('503')))
	verify('Every recorded user input is trusted', proof.inputs.every(record =>
		record.events.every(event => event.trusted)), true)
	verify('No unexpected browser/network health failures', unexpected, [])
	proof.status = 'PASS'
}
catch (error) {
	proof.status = 'FAIL'
	proof.error = `${error.stack}\n${error.cause?.stack || ''}`
	if (page && !page.isClosed()) await shot('failure').catch(() => {})
	process.exitCode = 1
}
finally {
	await browser?.close()
	for (const action of started.reverse()) control(`stop-${action}`)
	writeFileSync(`${output}/results.json`, JSON.stringify(proof, null, 2) + '\n')
}
console.log(JSON.stringify({ status: proof.status, checks: proof.checks.length, error: proof.error }))
