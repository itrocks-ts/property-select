import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const recipe = resolve('node_modules/@itrocks/property-select/docs/orchestration/environment')
const output = `${recipe}/../evidence/V3`
const env = { ...process.env, PS_ENV_DIRECTORY: '/tmp/property-select/V3-reproduce', PS_STANDALONE_PORT: '13874',
	PS_APP_PORT: '13875', PS_FRAMEWORK_INITIALIZER: `${recipe}/list/fixture.cjs` }
const proof = { scenarios: [], commands: [], health: [] }
let browser, started = false
function control(action)
{
	const stdout = execFileSync(process.execPath, [`${recipe}/control.mjs`, action], { env, encoding: 'utf8' })
	proof.commands.push({ action, stdout, directory: env.PS_ENV_DIRECTORY, port: env.PS_STANDALONE_PORT })
}
mkdirSync(output, { recursive: true })
try {
	control('standalone')
	started = true
	control('app')
	for (let i = 0; i < 100; i ++) {
		try { if ((await fetch('http://127.0.0.1:13874/')).ok
			&& (await fetch('http://127.0.0.1:13875/country')).ok) break }
		catch {}
		await pause(100)
	}
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	proof.browser = browser.version()
	const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
	page.on('pageerror', error => proof.health.push(error.message))
	await page.addInitScript(() => {
		window.reproducerInput = []
		document.addEventListener('click', event => window.reproducerInput.push(event.isTrusted), true)
	})
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		await page.setViewportSize({ width, height })
		for (const integrated of [false, true]) {
			const label = `${integrated ? 'integrated' : 'standalone'}-${width}`
			await page.goto(integrated ? 'http://127.0.0.1:13875/property-select-invoice'
				: 'http://127.0.0.1:13874/search-fixture')
			if (integrated) await page.locator('.add-column:not([hidden])').click()
			await page.locator('.ps-main[data-path="tags"]').waitFor()
			await page.screenshot({ path: `${output}/reproduce-${label}-before.png` })
			await page.locator('.ps-main[data-path="tags"]').click()
			await page.waitForFunction(() => document.querySelector('[aria-current="location"]')?.dataset.path === 'tags')
			await pause(300)
			const observed = await page.evaluate(() => ({
				active: document.activeElement?.dataset.path,
				current: document.querySelector('[aria-current="location"]')?.dataset.path,
				query: document.querySelector('.ps-query').value,
				rows: [...document.querySelectorAll('.ps-property')].map(row => ({
					path: row.dataset.path, retained: !!row.dataset.retained
				})),
				search: window.searchFixture?.search,
				state: window.searchFixture?.state,
				trusted: window.reproducerInput
			}))
			proof.scenarios.push({ name: label, url: page.url(), viewport: page.viewportSize(),
				expected: ['tags.invoices', 'tags.name'], observed,
				status: JSON.stringify(observed.rows.map(row => row.path)) === JSON.stringify(['tags.invoices', 'tags.name'])
					? 'PASS' : 'FAIL' })
			await page.screenshot({ path: `${output}/reproduce-${label}-after.png` })
		}
	}
}
finally {
	await browser?.close()
	if (started) {
		control('stop-app')
		control('stop-standalone')
	}
	writeFileSync(`${output}/reproducer.json`, JSON.stringify(proof, null, 2) + '\n')
}
console.log(JSON.stringify(proof.scenarios.map(value => ({ name: value.name, status: value.status,
	rows: value.observed.rows }))))
process.exitCode = proof.scenarios.some(value => value.status === 'FAIL') ? 1 : 0
