// Independent final replay: native session recovery with current network attribution and preserved state.
import assert            from 'node:assert/strict'
import { mkdirSync }     from 'node:fs'
import { readFileSync }  from 'node:fs'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve }       from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const app = 'http://127.0.0.1:14071'
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V7-1/session')
const endpoint = app + '/property-select/state/json?key=%2Fproperty-select-invoice%2Flist'
const message = 'The selector session has ended. Reload the page.'
const proof = { assertions: [], scenarios: [], fetches: [], requests: [], responses: [],
	inputs: [], errors: [], console: [], network: [],
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
			const requests = new Map()
			await context.exposeBinding('fixFetch', (_source, entry) => proof.fetches.push({ name, ...entry }))
			await context.addInitScript(() => {
				const original = window.fetch
				let sequence = 0
				window.fetch = function(input, options) {
					const id = ++ sequence
					const url = new URL(typeof input === 'string' ? input : input.url, location.href).href
					const method = options?.method || input.method || 'GET'
					const signal = options?.signal || input.signal
					const record = (event, details = {}) => void window.fixFetch({ id, url, method, event, ...details,
						document: performance.timeOrigin, time: performance.timeOrigin + performance.now() })
					record('start')
					if (signal?.aborted) record('abort')
					else signal?.addEventListener('abort', () => record('abort'), { once: true })
					const pending = original.apply(this, arguments)
					pending.then(response => record('response', { status: response.status }),
						error => record('rejected', { error: error.name }))
					return pending
				}
			})
			page.on('request', request => {
				const entry = { name, url: request.url(), method: request.method(), observed: Date.now() }
				requests.set(request, entry)
				proof.requests.push(entry)
			})
			page.on('response', response => {
				if (response.status() >= 400 || response.status() === 204) proof.responses.push({ name, url: response.url(),
					status: response.status(), method: response.request().method() })
			})
			await context.exposeBinding('v7Observe', (_source, event) => proof.inputs.push({ name, ...event }))
			await context.addInitScript(() => {
				for (const type of ['click', 'keydown', 'input']) document.addEventListener(type,
					event => void window.v7Observe({ type, trusted: event.isTrusted }), true)
			})
			page.on('pageerror', error => proof.errors.push({ name, text: error.message }))
			page.on('console', event => {
				if (['error', 'warning'].includes(event.type()))
					proof.console.push({ name, text: event.text(), location: event.location() })
			})
			page.on('requestfailed', async request => proof.network.push({ ...requests.get(request),
				start: request.timing().startTime, status: (await request.response())?.status(),
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
			const navigation = () => page.locator('.ps-breadcrumb, .ps-suggestions').evaluateAll(nodes =>
				nodes.map(node => [...node.querySelectorAll('button')].map(button => ({
					path: button.dataset.path, current: button.getAttribute('aria-current'), text: button.textContent
				}))))
			const initialNavigation = await navigation()
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
			check(name + ': branch and suggestions retained', await navigation(), initialNavigation)
			await page.screenshot({ path: `${output}/${name}-ended.png` })
			const retry = response()
			await page.locator('.ps-persistence [data-action="retry"]').click()
			check(name + ': offered Retry remains rejected', (await retry).status(), 410)
			check(name + ': ended state not resurrected', (await read()).state, undefined)
			check(name + ': Retry retains live query', await page.locator('.ps-query').inputValue(), 'obsolete-' + name)
			check(name + ': Retry retains columns', await columns(), initialColumns)
			check(name + ': Retry retains branch and suggestions', await navigation(), initialNavigation)
			check(name + ': recovery guidance remains visible', await page.locator('.ps-persistence').isVisible(), true)
			check(name + ': Retry retains reload guidance',
				(await page.locator('.ps-persistence').innerText()).includes(message), true)
			proof.scenarios.push({ name, url: page.url(), viewport: { width, height }, input: 'mouse/keyboard',
				before, columns: initialColumns, observed: { status, persistence, visible }, expected: message })
			await page.waitForLoadState('networkidle')
			await page.reload()
			await page.locator('.add-column:not([hidden])').click()
			await page.locator('.ps-main[data-path="customer"]').waitFor()
			check(name + ': full reload clears obsolete query', await page.locator('.ps-query').inputValue(), '')
			check(name + ': full reload clears persistence error', await page.locator('.ps-persistence').innerText(), '')
			const recovered = response()
			await page.locator('.ps-query').fill('name')
			check(name + ': full reload writes to fresh generation', (await recovered).status(), 200)
			await until(async () => (await read()).state?.query === 'name', 'new generation persisted query')
			const fresh = (await read()).state
			check(name + ': new generation persists new state', fresh.query, 'name')
			check(name + ': full reload forgets ended branch and recents',
				{ branch: fresh.branch, current: fresh.current, recent: fresh.recent },
				{ branch: [], current: 0, recent: [] })
			await page.waitForLoadState('networkidle')
			await page.screenshot({ path: `${output}/${name}-recovered.png` })
			await context.close()
		}
	}
	for (const failure of proof.network) {
		const starts = proof.fetches.filter(entry => entry.name === failure.name && entry.event === 'start'
			&& entry.url === failure.url && entry.method === failure.method
			&& Math.abs(entry.time - (failure.start || failure.observed)) < 100)
		// The fetch immediately preceding this browser request must be uniquely identifiable.
		const candidates = starts.sort((a, b) => Math.abs(a.time - (failure.start || failure.observed))
			- Math.abs(b.time - (failure.start || failure.observed)))
		const matched = candidates[0]
		if (matched && (!candidates[1] || Math.abs(matched.time - (failure.start || failure.observed))
			< Math.abs(candidates[1].time - (failure.start || failure.observed)))) {
			failure.fetch = matched
			failure.abort = proof.fetches.find(entry => entry.name === failure.name && entry.id === matched.id
				&& entry.document === matched.document && entry.url === matched.url
				&& entry.event === 'abort' && entry.time >= matched.time)
			failure.response = proof.fetches.find(entry => entry.name === failure.name && entry.id === matched.id
				&& entry.document === matched.document && entry.url === matched.url && entry.event === 'response')
		}
		failure.expected = failure.error === 'net::ERR_ABORTED'
			&& ((/\/property-select\/(context|resolve)\/json\?/.test(failure.url) && !!failure.abort)
				|| (failure.status === 204 && failure.response?.status === 204
					&& /\/property-select-invoice\/list\?columns=/.test(failure.url)))
	}
	check('Failed requests map to distinct observed fetches', new Set(proof.network.map(entry =>
		`${entry.name}:${entry.fetch?.document}:${entry.fetch?.id}`)).size, proof.network.length)
	check('Every failed request matches a product AbortSignal or completed bodyless HTTP 204 save',
		proof.network.filter(entry => !entry.expected), [])
	check('Console errors are actual deliberately ended-session HTTP responses', proof.console.filter(entry =>
		!entry.text.includes('410 (Gone)') || !proof.responses.some(response => response.name === entry.name
			&& response.status === 410 && response.url === entry.location.url)), [])
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
