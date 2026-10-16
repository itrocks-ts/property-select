import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import net from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { models } from '../models/load.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const { File } = require('@itrocks/class-file')
const { Mysql } = require('@itrocks/mysql')
const { ReflectProperty } = require('@itrocks/reflect')
const { resolvePropertyPath } = require('@itrocks/reflect-path')
const { Identifiers } = require('@itrocks/storage')
const owner = resolve('node_modules/@itrocks/property-select')
const recipe = `${owner}/docs/orchestration/environment`
const output = `${owner}/docs/orchestration/evidence/RETEST-L3-1`
const directory = '/tmp/property-select-RETEST-L3-1'
const port = 13861
const origin = `http://127.0.0.1:${port}`
const env = { ...process.env, PS_APP_PORT: String(port), PS_ENV_DIRECTORY: directory,
	PS_FRAMEWORK_INITIALIZER: `${recipe}/checks/RETEST-L3-1-initialise.cjs` }
const results = { assertions: [], browserErrors: [], commands: [], failedRequests: [], httpErrors: [],
	input: [], metadata: [], requests: [], seed: 'environment/models and framework/test/fixtures', url: origin }
let browser, dao, started = false
const requestFailureDetails = []

function check(name, observed, expected)
{
	results.assertions.push({ name, observed, expected, status: JSON.stringify(observed) === JSON.stringify(expected)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}

function command(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	results.commands.push({ action, environment: { PS_APP_PORT: env.PS_APP_PORT,
		PS_ENV_DIRECTORY: directory, PS_FRAMEWORK_INITIALIZER: env.PS_FRAMEWORK_INITIALIZER }, stdout })
}

async function metadata(operation, root, path, expectedStatus = 200, expectedCode = 'invalid-path')
{
	const url = `${origin}/property-select/${operation}/json?${new URLSearchParams({ root, path })}`
	const response = await fetch(url)
	const body = await response.json()
	results.metadata.push({ url, status: response.status, body })
	check(`HTTP ${operation} ${root}:${path}`, response.status, expectedStatus)
	if (expectedStatus === 400) check(`Rejected path ${root}:${path}`, body, { error: expectedCode })
	return body
}

async function free()
{
	await new Promise((yes, no) => {
		const server = net.createServer().once('error', no)
		server.listen(port, '127.0.0.1', () => server.close(yes))
	})
}

async function ready()
{
	for (let attempt = 0; attempt < 100; attempt ++) {
		try { if ((await fetch(`${origin}/country`)).ok) return }
		catch (error) { results.readinessLastError = error.message }
		await delay(100)
	}
	throw new Error('Isolated application did not become ready')
}

mkdirSync(output, { recursive: true })
try {
	check('No inherited owned app reservation', existsSync(`${directory}/app.pid`), false)
	await free()
	command('app')
	started = true
	await ready()
	const root = await metadata('context', 'invoice', '')
	const date = root.properties.find(property => property.path === 'issuedAt')
	check('Invoice issuedAt is terminal', date.kind, 'terminal')
	check('Date descriptor has no target or relation', ['relation', 'target'].some(key => key in date), false)
	check('Date resolves without losing its descriptor', await metadata('resolve', 'invoice', 'issuedAt'), date)
	for (const method of ['getTime', 'toISOString']) {
		await metadata('resolve', 'invoice', `issuedAt.${method}`, 400)
		await metadata('context', 'invoice', `issuedAt.${method}`, 400)
	}
	await metadata('context', 'invoice', 'issuedAt', 400)
	const scalar = await metadata('context', 'scalar', '')
	const fixtureDirectory = resolve('node_modules/@itrocks/framework/test/fixtures')
	for (const name of ['address', 'city', 'invoice', 'line', 'metadata', 'tag']) {
		const file = `${fixtureDirectory}/${name}.js`
		for (const type of Object.values(require(file))) if (typeof type === 'function') File(file)(type)
	}
	const { MetadataInvoice, metadataProbe } = require(`${fixtureDirectory}/metadata.js`)
	for (const name of ['date', 'nullableDate', 'optionalDate', 'dateArray', 'dateMap', 'genericDates']) {
		const collection = ['dateArray', 'dateMap', 'genericDates'].includes(name)
		const description = scalar.properties.find(property => property.path === name)
		check(`${name} is a selectable HTTP terminal`, description.kind, 'terminal')
		check(`${name} has no domain target`, ['relation', 'target'].some(key => key in description), false)
		check(`${name} HTTP resolve matches enumeration`, await metadata('resolve', 'scalar', name), description)
		await metadata('context', 'scalar', name, 400)
		await metadata('resolve', 'scalar', `${name}.getTime`, 400, collection ? 'unknown-target' : 'invalid-path')
		const resolved = resolvePropertyPath(MetadataInvoice, name)
		check(`${name} path multiplicity`, resolved.targetMultiplicity, collection ? 'many' : 'one')
		check(`${name} has no reflection relation`, new ReflectProperty(MetadataInvoice, name).relation, undefined)
		assert.throws(() => resolvePropertyPath(MetadataInvoice, `${name}.getTime`),
			{ code: collection ? 'unknown-target' : 'terminal-traversal' })
		check(`${name} native traversal rejected by reflection`, true, true)
	}
	check('Metadata never constructs records or reads domain getters', metadataProbe, { constructions: 0, reads: 0 })
	check('Optional Date retains optional type', new ReflectProperty(MetadataInvoice, 'optionalDate').type.optional, true)
	for (const [path, cardinality, reverse] of [
		['lines', 'one-to-many', 'lines.invoice'], ['tags', 'many-to-many', 'tags.invoices']
	]) {
		const relation = await metadata('resolve', 'invoice', path)
		const back = await metadata('resolve', 'invoice', reverse)
		check(`${path} retains domain relation`, relation.kind, 'relation')
		check(`${path} cardinality`, relation.relation.cardinality, cardinality)
		check(`${path} explicit reciprocal inverse`, [relation.relation.inverse, back.relation.inverse],
			[back.relation.id, relation.relation.id])
		check(`${path} target context remains navigable`, (await metadata('context', 'invoice', path)).type,
			relation.target)
	}
	for (const path of ['customer.address.city.country.name', 'deliveryAddress.city.country.name']) {
		check(`Domain complete path ${path}`, (await metadata('resolve', 'invoice', path)).path, path)
	}
	check('Nullable issuedAt multiplicity', resolvePropertyPath(models.Invoice, 'issuedAt').targetMultiplicity, 'one')
	for (const [path, multiplicity] of [
		['active', 'one'], ['amount', 'one'], ['note', 'one'], ['customer', 'one'],
		['customer.address.city.country.name', 'one'], ['lines', 'many'], ['tags.invoices.number', 'many']
	]) {
		check(`Unchanged scalar and domain multiplicity ${path}`,
			resolvePropertyPath(models.Invoice, path).targetMultiplicity, multiplicity)
	}
	dao = new Mysql({ engine: '@itrocks/mysql', host: '127.0.0.1', port: 13316,
		user: 'root', password: '', database: 'property_select_recipe' })
	await dao.connect()
	const queries = []
	const query = dao.connection.query.bind(dao.connection)
	dao.connection.query = async (sql, values) => { queries.push({ sql, values }); return query(sql, values) }
	const projection = await dao.select(models.Invoice, ['issuedAt'], {}, new Identifiers([1, 2, 3, 4]))
	check('SQL date scalar descriptor', projection.columns, [{ kind: 'scalar', path: 'issuedAt' }])
	check('SQL date values retain Date/null and root identity', projection.rows.map(row => [row.rootId,
		row.cells[0].value === null ? null : row.cells[0].value instanceof Date]),
		[[1, true], [2, true], [3, null], [4, true]])
	check('SQL converted calendar dates', projection.rows.map(row => {
		const value = row.cells[0].value
		return value && [value.getFullYear(), value.getMonth() + 1, value.getDate(), value.getHours()]
	}), [[2026, 1, 1, 12], [2026, 1, 2, 12], null, [2026, 1, 4, 12]])
	const beforeInvalid = queries.length
	await assert.rejects(dao.select(models.Invoice, ['issuedAt.getTime']), { code: 'invalid-path' })
	check('Invalid Date traversal never executes SQL', queries.length, beforeInvalid)
	results.sql = queries
	await dao.connection.end()
	dao = undefined
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	results.browser = { version: browser.version(), sandbox: true, viewport: { width: 1280, height: 720 } }
	const context = await browser.newContext({ viewport: results.browser.viewport })
	const page = await context.newPage()
	page.on('console', message => {
		if (['error', 'warning'].includes(message.type())) results.browserErrors.push(message.text())
	})
	page.on('pageerror', error => results.browserErrors.push(error.message))
	page.on('requestfailed', request => requestFailureDetails.push((async () => {
		const response = await request.response()
		results.failedRequests.push({ url: request.url(), status: response?.status(), error: request.failure() })
	})()))
	page.on('response', response => {
		if (response.status() >= 400) results.httpErrors.push({ url: response.url(), status: response.status() })
	})
	page.on('request', request => results.requests.push(request.url()))
	await page.addInitScript(() => {
		window.retestInput = []
		document.addEventListener('input', event => {
			if (event.target.matches('.ps-query')) window.retestInput.push({ trusted: event.isTrusted,
				value: event.target.value })
		})
	})
	await page.goto(`${origin}/property-select-invoice`)
	await page.locator('.add-column:not([hidden])').click()
	await page.locator('.ps-query').fill('country name')
	await page.waitForFunction(() => ['complete', 'empty', 'error', 'limited'].includes(
		document.querySelector('.property-select')?.dataset.searchStatus))
	const status = await page.locator('.property-select').getAttribute('data-search-status')
	check('Integrated search finishes successfully within its budget', ['complete', 'limited'].includes(status), true)
	results.searchStatus = status
	await page.waitForLoadState('networkidle')
	results.input = await page.evaluate(() => window.retestInput)
	check('Search typed through trusted browser input', results.input.length > 0
		&& results.input.every(input => input.trusted) && results.input.at(-1).value === 'country name', true)
	const paths = await page.locator('.ps-main').evaluateAll(nodes => nodes.map(node => node.dataset.path))
	results.matchingPaths = paths
	for (const path of ['customer.address.city.country.name', 'deliveryAddress.city.country.name']) {
		check(`Search exposes matching complete path ${path}`, paths.includes(path), true)
	}
	check('Every search result matches both words as complete metadata paths', paths.every(path =>
		path.includes('country') && path.includes('name')), true)
	check('Automatic search never traverses Date', results.requests.some(url => {
		const parsed = new URL(url)
		return parsed.pathname === '/property-select/context/json'
			&& /^issuedAt(?:\.|$)/.test(parsed.searchParams.get('path') || '')
	}), false)
	await page.screenshot({ path: `${output}/integrated-search.png`, fullPage: true })
	const path = 'customer.address.city.country.name'
	const segment = page.locator(`.ps-main[data-path="${path}"]`).locator('..')
		.locator('.ps-result-path button[data-path="customer.address.city.country"]')
	await segment.click()
	await page.waitForFunction(() => document.querySelector('[aria-current="location"]')?.dataset.path
		=== 'customer.address.city.country')
	await page.waitForFunction(() => ['complete', 'empty', 'limited', 'error'].includes(
		document.querySelector('.property-select')?.dataset.searchStatus))
	await page.waitForLoadState('networkidle')
	check('Context remains usable through result segment', await page.locator('.ps-query').inputValue(), 'country name')
	await page.locator('.ps-clear').click()
	await page.locator('.ps-level[data-path=""]').click()
	const saved = page.waitForResponse(response => response.status() === 204
		&& new URL(response.url()).searchParams.get('columns') === 'number,amount,issuedAt')
	await page.locator('.ps-main[data-path="issuedAt"]').click()
	await page.waitForFunction(() => {
		const header = document.querySelector('th[data-property="issuedAt"]')
		return header && !header.classList.contains('column-add-loading')
	})
	check('Ordinary Date selection adds one column', await page.locator('thead [data-property="issuedAt"]').count(), 1)
	check('Date column uses existing conversion', await page.locator('tbody tr').first().locator('td').last()
		.innerText(), '01/01/2026')
	check('Nullable Date column renders empty',
		await page.locator('tbody tr').nth(1).locator('td').last().innerText(), '')
	check('List column save completes as a bodyless success', (await saved).status(), 204)
	await page.waitForLoadState('networkidle')
	await page.screenshot({ path: `${output}/date-selected.png`, fullPage: true })
	await page.goto(`${origin}/country`)
	check('Country control remains healthy', await page.locator('tbody tr').count(), 2)
	results.countryRows = await page.locator('tbody tr').allTextContents()
	await Promise.all(requestFailureDetails)
	check('No browser errors or warnings', results.browserErrors, [])
	check('No failed metadata request', results.failedRequests.filter(record =>
		new URL(record.url).pathname.startsWith('/property-select/')), [])
	// Chromium emits requestfailed for a successful bodyless navigation; retain and verify the raw event.
	check('No unexpected request failure', results.failedRequests.filter(record => !(record.status === 204
		&& record.error?.errorText === 'net::ERR_ABORTED'
		&& new URL(record.url).pathname === '/property-select-invoice/list'
		&& new URL(record.url).searchParams.get('columns') === 'number,amount,issuedAt')), [])
	check('No failing browser HTTP response', results.httpErrors, [])
	results.status = 'PASS'
}
catch (error) {
	results.status = 'FAIL'
	results.failure = error.stack
	throw error
}
finally {
	await dao?.connection.end()
	await browser?.close()
	if (started) command('stop-app')
	check('Owned app PID removed', existsSync(`${directory}/app.pid`), false)
	await free()
	check('Owned application listener closed', true, true)
	writeFileSync(`${output}/results.json`, JSON.stringify(results, null, '\t') + '\n')
}
console.log(JSON.stringify({ status: results.status, assertions: results.assertions.length }))
