import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const app = 'http://127.0.0.1:14071'
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/V7/session-regression')
const endpoint = app + '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist'
const message = 'The selector session has ended. Reload the page.'
const proof = { assertions: [], scenarios: [], inputs: [], errors: [], console: [], network: [],
	checkpoints: JSON.parse(readFileSync(resolve(output, '../checkpoints.json'))),
	chromiumSandbox: true, playwright: require(runtime + '/package.json').version,
	seed: '120 synthetic roots; real file sessions; production state endpoint with fixture delay gate' }
mkdirSync(output, { recursive: true })
function check(name, observed, expected)
{
	let status = 'PASS'
	try { assert.deepEqual(observed, expected) }
	catch { status = 'FAIL' }
	proof.assertions.push({ name, observed, expected, status })
}
async function until(predicate, label)
{
	for (let i = 0; i < 150; i ++) {
		if (await predicate()) return
		await pause(50)
	}
	throw Error('Timeout: ' + label)
}
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
proof.browser = browser.version()
const helper = await browser.newContext()
const gate = data => helper.request.post(app + '/v4/gate/json', { data })
try {
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		for (const operation of ['revoke', 'expire']) {
			const name = `${width}x${height}-${operation}`
			const context = await browser.newContext({ viewport: { width, height } })
			const page = await context.newPage()
			await context.exposeBinding('v7Observe', (_source, event) => proof.inputs.push({ name, ...event }))
			await context.addInitScript(() => {
				for (const type of ['click', 'keydown', 'input']) document.addEventListener(type,
					event => void window.v7Observe({ type, trusted: event.isTrusted }), true)
			})
			page.on('pageerror', error => proof.errors.push({ name, text: error.message }))
			page.on('console', event => {
				if (['error', 'warning'].includes(event.type())) proof.console.push({ name, text: event.text() })
			})
			page.on('requestfailed', request => proof.network.push({ name, url: request.url(),
				error: request.failure()?.errorText }))
			const read = async () => (await context.request.get(endpoint)).json()
			const response = () => page.waitForResponse(item => item.url().includes('/property-select/state/json')
				&& item.request().method() === 'PUT')
			await page.goto(app + '/property-select-invoice')
			await page.locator('.add-column:not([hidden])').click()
			await page.locator('.ps-main[data-path="customer"]').click()
			await page.locator('.ps-main[data-path="customer.name"]').click()
			await page.locator('th[data-property="customer.name"]').waitFor()
			await page.locator('.ps-query').fill('name')
			await until(async () => (await read()).state?.query === 'name', 'initial durable query')
			await page.waitForLoadState('networkidle')
			const before = await read()
			const columns = () => page.locator('th[data-property]')
				.evaluateAll(nodes => nodes.map(n => n.dataset.property))
			const initialColumns = await columns()
			await page.screenshot({ path: `${output}/${name}-before.png` })
			await gate({ operation: 'arm', id: name })
			const pending = response()
			await page.locator('.ps-query').fill('obsolete-' + name)
			await until(async () => (await (await gate({ operation: 'status' })).json()).pending.includes(name),
				'production write acquired')
			const ended = await context.request.post(app + '/property-select-test/session/json',
				{ data: { operation } })
			check(name + ': session operation accepted', ended.status(), 200)
			await gate({ operation: 'release', id: name })
			check(name + ': acquired write returns 410', (await pending).status(), 410)
			await until(() => page.locator('.ps-persistence [data-action="retry"]').isVisible(), 'error presentation')
			await pause(250)
			const visible = await page.locator('.property-select').innerText()
			const status = await page.locator('.ps-status').innerText()
			const persistence = await page.locator('.ps-persistence').innerText()
			check(name + ': visible session-ended reload guidance', visible.includes(message), true)
			check(name + ': live query retained', await page.locator('.ps-query').inputValue(), 'obsolete-' + name)
			check(name + ': columns retained', await columns(), initialColumns)
			await page.screenshot({ path: `${output}/${name}-ended.png` })
			const retry = response()
			await page.locator('.ps-persistence [data-action="retry"]').click()
			check(name + ': offered Retry remains rejected', (await retry).status(), 410)
			check(name + ': ended state not resurrected', (await read()).state, undefined)
			proof.scenarios.push({ name, url: page.url(), viewport: { width, height }, input: 'mouse/keyboard',
				before, columns: initialColumns, observed: { status, persistence, visible }, expected: message })
			await context.close()
		}
	}
	check('Every captured product input trusted',
		proof.inputs.length > 0 && proof.inputs.every(event => event.trusted), true)
	check('No page exception', proof.errors, [])
	proof.status = proof.assertions.every(entry => entry.status === 'PASS') ? 'PASS' : 'FAIL'
}
catch (error) {
	proof.status = 'ERROR'
	proof.failure = error.stack
}
finally {
	await browser.close()
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.assertions.length, 'assertions;',
		proof.assertions.filter(entry => entry.status === 'FAIL').length, 'failures')
	if (proof.status !== 'PASS') process.exitCode = 1
}
