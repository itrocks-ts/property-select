import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE || runtime)
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = process.env.PS_SEARCH_OUTPUT || `${owner}/docs/orchestration/evidence/L3`
const directory = process.env.PS_SEARCH_DIRECTORY || '/tmp/property-select-L3'
const standalonePort = Number(process.env.PS_SEARCH_PORT || 13840)
const appPort = Number(process.env.PS_SEARCH_APP_PORT || 13839)
const origin = `http://127.0.0.1:${standalonePort}`
const app = `http://127.0.0.1:${appPort}`
const env = {
	...process.env, PS_APP_PORT: String(appPort), PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/list/fixture.cjs`, PS_STANDALONE_PORT: String(standalonePort)
}
const results = { checks: [], commands: [], errors: [], httpErrors: [], input: [], requests: [], urls: [origin, app],
	checkpoint: execFileSync('git', ['-C', owner, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	version: JSON.parse(readFileSync(`${owner}/package.json`)).version,
	seed: 'test/fixtures/search-graph.mjs; environment/models; synthetic existing database only' }
mkdirSync(output, { recursive: true })
function check(name, observed, expected)
{
	results.checks.push({ name, observed, expected, status: JSON.stringify(observed) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
function command(action)
{
	const commandEnv = action === 'status' ? { ...env, PS_ENV_DIRECTORY: '/tmp/showtime-property-select-env' } : env
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], {
		env: commandEnv, encoding: 'utf8'
	})
	results.commands.push({ action, stdout, environment: {
		PS_APP_PORT: commandEnv.PS_APP_PORT, PS_ENV_DIRECTORY: commandEnv.PS_ENV_DIRECTORY,
		PS_FRAMEWORK_INITIALIZER: env.PS_FRAMEWORK_INITIALIZER, PS_STANDALONE_PORT: env.PS_STANDALONE_PORT
	} })
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
	for (let i = 0; i < 100; i ++) {
		try { if ((await fetch(url)).ok) return }
		catch {}
		await delay(100)
	}
	throw new Error(`Server unavailable: ${url}`)
}
let browser, page, standaloneStarted = false, appStarted = false
try {
	for (const name of ['app', 'standalone'])
		assert.equal(existsSync(`${directory}/${name}.pid`), false, `No existing ${name} reservation`)
	await free(standalonePort)
	await free(appPort)
	command('standalone')
	standaloneStarted = true
	command('app')
	appStarted = true
	await ready(`${app}/country`)
	await ready(origin)
	command('status')
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	results.browser = browser.version()
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	page = await context.newPage()
	page.on('pageerror', error => results.errors.push(error.message))
	page.on('console', message => {
		if (['error', 'warning'].includes(message.type())) results.errors.push(message.text())
	})
	page.on('response', response => {
		if (response.status() >= 400)
			results.httpErrors.push({ status: response.status(), url: response.url() })
	})
	page.on('request', request => results.requests.push(new URL(request.url()).pathname))
	const query = page.locator('.ps-query')
	const main = path => page.locator(`.ps-main[data-path="${path}"]`)
	const crumb = path => page.locator(`.ps-level[data-path="${path}"]`)
	const waitContext = path => page.waitForFunction(path =>
		document.querySelector('[aria-current="location"]')?.dataset.path === path, path)
	const waitSearch = () => page.waitForFunction(() => {
		const status = document.querySelector('.property-select')?.dataset.searchStatus
		return status && !['loading', 'idle'].includes(status)
	})
	const paths = () => page.locator('.ps-main').evaluateAll(buttons => buttons.map(button => button.dataset.path))
	await page.goto(`${origin}/search-fixture`)
	await main('customer').waitFor()
	await query.fill('name')
	results.input.push('Trusted fill name; Tab focus during delayed/reordered enrichment')
	await page.locator('.ps-main[data-path="tags.name"]').waitFor()
	await page.keyboard.press('Tab')
	await main('tags.name').focus()
	await page.evaluate(() => { window.focusProbe = document.activeElement })
	check('PORT-06 pending customer', await page.locator('.property-select').getAttribute('data-search-status'),
		'loading')
	await waitSearch()
	check('PORT-06 exact focused element survives enrichment', await page.evaluate(() =>
		window.focusProbe === document.activeElement && window.focusProbe.isConnected), true)
	const forward = await paths()
	await page.goto(`${origin}/search-fixture?focusLimit`)
	await main('slow').waitFor()
	await query.fill('name')
	await main('slow.name').waitFor()
	await main('slow.name').focus()
	await page.evaluate(() => { window.focusProbe = document.activeElement })
	await waitSearch()
	check('PORT-06 focus survives top-result budget eviction', await page.evaluate(() =>
		window.focusProbe === document.activeElement && window.focusProbe.isConnected), true)
	check('PORT-06 focused row retained within display budget', await paths(), ['slow.name'])
	await page.keyboard.press('Enter')
	await page.locator('#intentions li').waitFor()
	check('PORT-06 retained action', await page.locator('#intentions li').allTextContents(), ['slow.name'])
	await query.focus()
	await main('fast.name').waitFor()
	check('PORT-06 final rank applies after focus leaves', await paths(), ['fast.name'])
	await page.goto(`${origin}/search-fixture?reverse`)
	await main('customer').waitFor()
	await query.fill('name')
	await waitSearch()
	check('PORT-06 reversed responses produce identical order', await paths(), forward)
	await query.fill(' CÔDE   pAyS CLIENT ')
	await waitSearch()
	check('T09 normalised all words match labelled path', (await paths()).includes('customer.address.country.code'), true)
	check('T09 distinct billing result', (await paths()).includes('customer.billingAddress.country.code'), true)
	const row = main('customer.address.country.code').locator('..')
	check('T09 root-to-parent segments', await row.locator('.ps-result-path button').allTextContents(),
		['Facture', 'Client', 'Adresse', 'Pays'])
	await main('customer.address.country.code').click()
	await page.locator('#intentions li').waitFor()
	check('T11 terminal emits exact path once', await page.locator('#intentions li').allTextContents(),
		['customer.address.country.code'])
	check('NAV-07 query retained after selection', await query.inputValue(), ' CÔDE   pAyS CLIENT ')
	await row.locator('.ps-result-path button[data-path="customer.address"]').click()
	await waitContext('customer.address')
	await waitSearch()
	check('T10 scope is current descendants', (await paths()).every(path => path.startsWith('customer.address.')), true)
	check('NAV-08 real segment path', await page.evaluate(() => window.searchFixture.state.branch),
		['customer', 'address'])
	await crumb('').click()
	await waitContext('')
	await waitSearch()
	check('T10 root return keeps query', await query.inputValue(), ' CÔDE   pAyS CLIENT ')
	await query.fill('country')
	await waitSearch()
	await main('customer.address.country').click()
	await waitContext('customer.address.country')
	await waitSearch()
	await crumb('customer').click()
	await waitContext('customer')
	await waitSearch()
	check('NAV-08 remembered suffix remains', await crumb('customer.address.country').count(), 1)
	await main('customer.billingAddress.country').click()
	await waitContext('customer.billingAddress.country')
	await waitSearch()
	check('NAV-08 divergent suffix replaced', await page.evaluate(() => window.searchFixture.state.branch),
		['customer', 'billingAddress', 'country'])
	await page.locator('.ps-clear').click()
	check('SEA-05 immediate clear', await query.inputValue(), '')
	check('SEA-05 clear shows neighbouring properties', await paths(),
		['customer.billingAddress.country.code', 'customer.billingAddress.country.name'])
	check('SEA-05 clear retains input focus', await query.evaluate(element => element === document.activeElement), true)
	await query.fill('impossible')
	await waitSearch()
	check('T12 leaf empty state', await page.locator('.property-select').getAttribute('data-search-status'),
		'empty')
	await page.goto(`${origin}/search-fixture`)
	await main('customer').waitFor()
	await query.fill('code')
	await query.fill('number')
	await waitSearch()
	check('T12 newer query excludes stale codes', await paths(), ['number', 'tags.invoices.number'])
	await delay(250)
	check('T12 late old response cannot replace results', await paths(), ['number', 'tags.invoices.number'])
	check('T13 one N-N inverse is followed', await page.evaluate(() =>
		window.searchFixture.calls.some(call => call.path === 'tags.invoices')), true)
	check('T13 1-N inverse is not explored', await page.evaluate(() =>
		window.searchFixture.calls.some(call => call.path === 'lines.invoice')), false)
	check('T13 unknown repeated edge is not explored', await page.evaluate(() =>
		window.searchFixture.calls.some(call => call.path.includes('parent.parent'))), false)
	await page.goto(`${origin}/search-fixture?large`)
	await main('branch0').waitFor()
	await query.fill('name')
	await waitSearch()
	check('T12 large graph limit', await page.locator('.property-select').getAttribute('data-search-status'),
		'limited')
	check('T26 contexts bounded', await page.evaluate(() => window.searchFixture.search.visited), 25)
	check('T26 results bounded', (await paths()).length, 8)
	check('T26 at most four current provider requests', await page.evaluate(() => window.searchFixture.peak <= 4), true)
	await query.fill('impossible')
	await waitSearch()
	check('T12 zero results after budget is limited, not empty', await page.locator('.property-select').getAttribute(
		'data-search-status'), 'limited')
	await page.goto(`${origin}/search-fixture?error`)
	await main('customer').waitFor()
	await query.fill('code')
	await waitSearch()
	check('T12 error state', await page.locator('.property-select').getAttribute('data-search-status'), 'error')
	await page.locator('.ps-clear').click()
	check('QUA-01 ordinary navigation survives search error', await main('customer').count(), 1)
	await page.goto(`${origin}/search-fixture?reverse`)
	await main('customer').waitFor()
	await query.fill('code pays client')
	await waitSearch()
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		await page.setViewportSize({ width, height })
		check(`Responsive ${width} no horizontal page overflow`, await page.evaluate(() =>
			document.documentElement.scrollWidth <= innerWidth), true)
		await page.screenshot({ path: `${output}/search-${width}.png`, fullPage: true })
	}
	check('Standalone imports contain no host/framework/reflection modules', results.requests.some(path =>
		/\/itrocks\/(framework|list|table|home|reflect)/.test(path)), false)
	await page.goto(`${app}/property-select-invoice`)
	await page.locator('.add-column:not([hidden])').click()
	await query.fill('country name')
	await waitSearch()
	check('Integrated search works', (await paths()).includes('customer.address.city.country.name'),
		true)
	const rootResponse = await context.request.get(`${app}/property-select/context/json?path=&root=invoice`)
	const rootMetadata = await rootResponse.json()
	results.integrated = {
		searchStatus: await page.locator('.property-select').getAttribute('data-search-status'),
		message: await page.locator('.ps-status').innerText(),
		issuedAt: rootMetadata.properties?.find(property => property.path === 'issuedAt'),
		paths: await paths()
	}
	await page.screenshot({ path: `${output}/integrated-search.png`, fullPage: true })
	await page.goto(`${app}/country`)
	check('Control route still displays synthetic country', await page.locator('body').innerText().then(text =>
		text.includes('Recipe France')), true)
	check('Browser exceptions/warnings/errors', results.errors, [])
	results.status = 'PASS'
}
catch (error) {
	results.failure = String(error)
	if (page) {
		results.failureState = await page.evaluate(() => ({
			fixture: window.searchFixture?.state, search: window.searchFixture?.search,
			markup: document.querySelector('.property-select')?.outerHTML
		})).catch(() => undefined)
		await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {})
	}
	throw error
}
finally {
	await browser?.close()
	if (appStarted) command('stop-app')
	if (standaloneStarted) command('stop-standalone')
	writeFileSync(`${output}/browser-results.json`, JSON.stringify(results, null, '\t') + '\n')
}
console.log(JSON.stringify({
	status: results.status, assertions: results.checks.length, output, browser: results.browser
}))
