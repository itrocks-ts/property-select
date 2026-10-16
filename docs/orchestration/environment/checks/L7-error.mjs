import assert                  from 'node:assert/strict'
import { mkdirSync }           from 'node:fs'
import { writeFileSync }       from 'node:fs'
import { createRequire }       from 'node:module'
import { resolve }             from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = resolve(process.env.PS_L7_ERROR_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/L7/error')
const app = 'http://127.0.0.1:13981'
const proof = { cases: [], chromiumSandbox: true }
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
proof.browser = browser.version()
try {
	for (let attempt = 0; attempt < 3; attempt ++) {
		const context = await browser.newContext({ viewport: { width: 844, height: 390 } })
		const page = await context.newPage()
		await page.goto(app + '/property-select-invoice')
		await page.locator('.add-column:visible').click()
		await page.locator('.ps-main[data-path="deliveryAddress"]').click()
		await page.locator('.ps-main[data-path="deliveryAddress.city"]').waitFor()
		await page.locator('.ps-level[data-path=""]').click()
		await page.waitForLoadState('networkidle')
		await page.evaluate(() => {
			window.l7Statuses = []
			const status = document.querySelector('.ps-status')
			new MutationObserver(records => window.l7Statuses.push({ time: performance.now(), value: status.textContent,
				old: records.map(record => record.oldValue) }))
				.observe(status, { childList: true, characterData: true, characterDataOldValue: true, subtree: true })
		})
		let failed = false
		await page.route(url => url.searchParams.get('column') === 'note', route => {
			failed = true
			return route.abort('failed')
		})
		await page.locator('.ps-main[data-path="note"]').click()
		await pause(600)
		const observed = await page.evaluate(() => ({ status: document.querySelector('.ps-status').textContent,
			trace: window.l7Statuses, note: !!document.querySelector('th[data-property="note"]'),
			path: document.querySelector('.ps-level[aria-current]').dataset.path }))
		proof.cases.push({ attempt, expected: 'A visible recoverable error after a failed column click', failed, observed,
			status: observed.status ? 'PASS' : 'FAIL' })
		assert.equal(failed, true)
		assert.equal(observed.note, false)
		await page.screenshot({ path: `${output}/attempt-${attempt}.png` })
		await context.close()
	}
}
finally {
	await browser.close()
	proof.status = proof.cases.every(item => item.status === 'PASS') ? 'PASS' : 'FAIL'
	writeFileSync(output + '/results.json', JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status, proof.cases.length, 'failed-click landscape checks')
	if (proof.status !== 'PASS') process.exitCode = 1
}
