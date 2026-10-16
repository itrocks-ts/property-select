import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = resolve(process.env.PS_TABLE_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-V2-TABLE-1/geometry')
const url = process.env.PS_TABLE_URL || 'http://127.0.0.1:13772/table-fixture'
const result = { assertions: [], health: [], inputs: [], url, chromiumSandbox: true,
	checkpoints: Object.fromEntries(['table', 'property-select'].map(owner => [owner, {
		sha: execFileSync('git', ['-C', `node_modules/@itrocks/${owner}`, 'rev-parse', 'HEAD'],
			{ encoding: 'utf8' }).trim(),
		version: JSON.parse(readFileSync(`node_modules/@itrocks/${owner}/package.json`)).version
	}])) }
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
result.browser = browser.version()
let page
try {
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		for (const shape of ['colgroup', 'header']) {
			for (const side of ['both', 'left', 'right']) {
				const label = `${width}-${shape}-${side}`
				page = await browser.newPage({ viewport: { width, height } })
				page.on('pageerror', error => result.health.push(String(error)))
				page.on('requestfailed', request => result.health.push(request.url()))
				await page.route(url, async route => {
					const response = await route.fetch()
					let html = await response.text()
					if (shape === 'header') html = html.replace(/<colgroup>.*?<\/colgroup>/s, '')
					if (side === 'left') html = html.replace('<col data-freeze></colgroup>', '<col></colgroup>')
						.replace('<th data-freeze>Actions', '<th>Actions')
					if (side === 'right') html = html.replace('<colgroup><col data-freeze>', '<colgroup><col>')
						.replace('<th data-freeze>Select', '<th>Select')
					await route.fulfill({ response, body: html })
				})
				await page.addInitScript(() => {
					window.geometryInputs = []
					document.addEventListener('click', event => window.geometryInputs.push(event.isTrusted), true)
				})
				await page.goto(url)
				await page.waitForFunction(() => !!window.tableRecipe)
				await page.locator('#add').click()
				await page.waitForFunction(() => document.querySelector('th[data-column-id="opaque/metric:7"]')
					.textContent === 'Metric opaque/metric:7')
				await page.locator('#add').click()
				// Fixture controls call the public contract; browser clicks remain trusted input.
				await page.evaluate(() => {
					for (const id of ['a', 'opaque/metric:7']) {
						const button = document.createElement('button')
						button.id = id === 'a' ? 'reveal-first' : 'reveal-last'
						button.textContent = `Reveal ${id}`
						button.onclick = () => window.tableRecipe.addition().reveal(id)
						document.querySelector('section').append(button)
					}
				})
				for (const phase of ['loaded', 'reset', 'wide']) {
					if (phase === 'reset') {
						await page.locator('#reset').click()
						await page.locator('#reset').click()
					}
					if (phase === 'wide') {
						await page.locator('th[data-column-id="opaque/metric:7"]').evaluate(header => {
							header.style.minWidth = '1400px'
						})
						await page.locator('#reset').click()
					}
					for (const [control, id] of [['reveal-first', 'a'], ['reveal-last', 'opaque/metric:7']]) {
						await page.locator(`#${control}`).click()
						const actual = await page.evaluate(id => {
							const table = document.querySelector('table')
							const main = document.querySelector('main').getBoundingClientRect()
							const tableBox = table.getBoundingClientRect()
							const header = table.querySelector(`th[data-column-id="${id}"]`)
							const box = header.getBoundingClientRect()
							const cells = table.tHead.rows[0].cells
							const freeze = window.tableRecipe.table().plugins.TableFreeze
							const inner = freeze.visibleInnerRect()
							const left = freeze.leftColumnCount ? cells[freeze.leftColumnCount - 1]
								.getBoundingClientRect().right : main.left
							const right = freeze.rightColumnCount ? cells[cells.length - freeze.rightColumnCount]
								.getBoundingClientRect().left : main.right
							return { left, right,
								main: { left: Math.max(main.left, tableBox.left), right: Math.min(main.right, tableBox.right) },
								frozenLeft: freeze.leftColumnCount ? cells[0].getBoundingClientRect().left : main.left,
								frozenRight: freeze.rightColumnCount ? cells[cells.length - 1]
									.getBoundingClientRect().right : main.right, inner: { left: inner.left, right: inner.right },
								box: { left: box.left, right: box.right, width: box.width },
								visible: Math.max(0, Math.min(box.right, right) - Math.max(box.left, left)) }
						}, id)
						assert.ok(actual.right > actual.left, `${label}: positive available area`)
						assert.ok(Math.abs(actual.frozenLeft - actual.main.left) < 2, `${label}: left stays sticky`)
						assert.ok(Math.abs(actual.frozenRight - actual.main.right) < 2, `${label}: right stays sticky`)
						if (side !== 'right') assert.equal(actual.inner.left, actual.left)
						if (side !== 'left') assert.equal(actual.inner.right, actual.right)
						const expected = Math.min(actual.box.width, actual.right - actual.left)
						const verdict = actual.visible + 2 >= expected ? 'PASS' : 'FAIL'
						result.assertions.push({ label, phase, id, expected, actual, verdict })
						assert.equal(verdict, 'PASS', `${label}/${phase}/${id}: ${JSON.stringify(actual)}`)
					}
				}
				await page.screenshot({ path: `${output}/${label}.png` })
				result.inputs.push({ label, trusted: await page.evaluate(() => window.geometryInputs) })
				await page.close()
			}
		}
	}
	assert.deepEqual(result.health, [])
	assert.ok(result.inputs.every(input => input.trusted.length && input.trusted.every(Boolean)))
	result.verdict = 'PASS'
	console.log(`PASS: ${result.assertions.length} geometry assertions, 24 shape/viewport configurations`)
}
catch (error) {
	result.verdict = 'FAIL'
	result.error = String(error.stack)
	await page?.screenshot({ path: `${output}/failure.png` }).catch(() => {})
	throw error
}
finally {
	writeFileSync(`${output}/results.json`, JSON.stringify(result, null, 2) + '\n')
	await browser.close()
}
