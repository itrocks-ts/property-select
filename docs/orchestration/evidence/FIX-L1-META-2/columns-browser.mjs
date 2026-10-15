import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const { chromium } = await import(process.env.PS_PLAYWRIGHT_MODULE)
const origin = process.env.PS_METADATA_URL
const journal = '/tmp/showtime-property-select-env/queries.log'
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
const observations = { browser: browser.version(), sandbox: true, origin, saves: [] }
try {
	const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
	const page = await context.newPage()
	await page.goto(origin + '/country', { waitUntil: 'networkidle' })
	const probe = async () => page.request.get(origin + '/column-save-probe/probe/json').then(r => r.json())
	for (const [value, expected] of [['name', ['name']], ['name,unknown', ['name']], ['', []]]) {
		const prior = await probe()
		const before = readFileSync(journal).length
		const url = origin + '/country?' + new URLSearchParams({ columns: value })
		const response = await page.request.get(url)
		assert.equal(response.status(), 204)
		assert.equal(await response.text(), '')
		const sql = readFileSync(journal).subarray(before).toString()
		assert.ok(!/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql), sql)
		const saved = await probe()
		assert.deepEqual(saved.attempts, prior.attempts)
		assert.deepEqual(saved.columns, expected)
		await page.reload({ waitUntil: 'networkidle' })
		const columns = await page.locator('thead th[data-property]').evaluateAll(elements =>
			elements.map(element => element.getAttribute('data-property')))
		assert.deepEqual(columns, expected)
		observations.saves.push({ url, status: response.status(), bodyBytes: 0, sql,
			businessReads: saved.attempts.length - prior.attempts.length,
			savedColumns: saved.columns, restoredColumns: columns })
	}
	const isolated = await browser.newPage()
	await isolated.goto(origin + '/country', { waitUntil: 'networkidle' })
	assert.deepEqual(await isolated.locator('thead th[data-property]').evaluateAll(elements =>
		elements.map(element => element.getAttribute('data-property'))), ['name'])
	observations.isolatedDefaultColumns = ['name']
	const invalid = await page.request.get(origin + '/country?offset=invalid')
	assert.equal(invalid.status(), 500)
	observations.invalidOffset = invalid.status()
	observations.status = 'PASS'
	console.log(JSON.stringify(observations, null, 2))
}
finally {
	await browser.close()
}
