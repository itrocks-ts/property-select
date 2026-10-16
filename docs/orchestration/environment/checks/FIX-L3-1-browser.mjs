import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/FIX-L3-1/direct`
const directory = '/tmp/property-select-FIX-L3-1-direct'
const port = 13851
const origin = `http://127.0.0.1:${port}`
const env = { ...process.env, PS_APP_PORT: String(port), PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/list/fixture.cjs` }
const results = { checks: [], commands: [], errors: [], httpErrors: [], requests: [], url: origin }
mkdirSync(output, { recursive: true })
function check(name, actual, expected)
{
	assert.deepEqual(actual, expected, name)
	results.checks.push({ name, expected, observed: actual, status: 'PASS' })
}
function command(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	results.commands.push({ action, stdout, directory, port, initializer: env.PS_FRAMEWORK_INITIALIZER })
}
let browser, started = false
try {
	assert.equal(existsSync(`${directory}/app.pid`), false)
	await new Promise((yes, no) => {
		const listener = net.createServer().once('error', no)
		listener.listen(port, '127.0.0.1', () => listener.close(yes))
	})
	command('app')
	started = true
	for (let attempt = 0; attempt < 100; attempt ++) {
		try { if ((await fetch(`${origin}/country`)).ok) break }
		catch {}
		await delay(100)
	}
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	results.browser = browser.version()
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	const page = await context.newPage()
	page.on('pageerror', error => results.errors.push(error.message))
	page.on('console', message => {
		if (['error', 'warning'].includes(message.type())) results.errors.push(message.text())
	})
	page.on('response', response => {
		if (response.status() >= 400) results.httpErrors.push({ status: response.status(), url: response.url() })
	})
	page.on('request', request => results.requests.push(request.url()))
	await page.goto(`${origin}/property-select-invoice`)
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-query').fill('country name')
	await page.waitForFunction(() => ['empty', 'complete', 'limited', 'error'].includes(
		document.querySelector('.property-select')?.dataset.searchStatus))
	const status = await page.locator('.property-select').getAttribute('data-search-status')
	check('Integrated search finishes without metadata error', ['complete', 'limited'].includes(status), true)
	results.searchStatus = status
	check('Country.Name match exists', await page.locator(
		'.ps-main[data-path="customer.address.city.country.name"]').count(), 1)
	check('Automatic search never requests native Date context', results.requests.some(url =>
		new URL(url).pathname === '/property-select/context/json' && new URL(url).searchParams.get('path') === 'issuedAt'),
		false)
	const root = await context.request.get(`${origin}/property-select/context/json?root=%2Fproperty-select-invoice&path=`)
	const metadata = await root.json()
	const date = metadata.properties.find(property => property.path === 'issuedAt')
	check('Root Date is terminal', date.kind, 'terminal')
	check('Root Date has no target or relation', [date.target, date.relation], [undefined, undefined])
	for (const [operation, path, expected] of [
		['context', 'issuedAt', 400], ['context', 'issuedAt.getTime', 400],
		['resolve', 'issuedAt.getTime', 400], ['resolve', 'issuedAt', 200]
	]) {
		const response = await context.request.get(
			`${origin}/property-select/${operation}/json?root=%2Fproperty-select-invoice&path=${path}`)
		check(`${operation} ${path} status`, response.status(), expected)
		check(`${operation} ${path} body`, await response.json(), expected === 200 ? date : { error: 'invalid-path' })
	}
	await page.locator('.ps-clear').click()
	await page.locator('.ps-main[data-path="issuedAt"]').click()
	await page.locator('thead [data-property="issuedAt"]').waitFor()
	await page.waitForFunction(() => !document.querySelector('th[data-property="issuedAt"]')?.classList
		.contains('column-add-loading'))
	check('Date column selected', await page.locator('thead [data-property="issuedAt"]').count(), 1)
	check('Date column renders converted value', await page.locator('tbody tr').first().locator('td').last()
		.innerText(), '01/01/2026')
	check('Null Date renders empty', await page.locator('tbody tr').nth(1).locator('td').last().innerText(), '')
	await page.screenshot({ path: `${output}/date-column.png`, fullPage: true })
	check('No browser exceptions or warnings', results.errors, [])
	check('No failing browser request', results.httpErrors, [])
	results.status = 'PASS'
}
catch (error) {
	results.failure = String(error)
	throw error
}
finally {
	await browser?.close()
	if (started) command('stop-app')
	writeFileSync(`${output}/results.json`, JSON.stringify(results, null, '\t') + '\n')
}
console.log(JSON.stringify({ status: results.status, checks: results.checks.length }))
