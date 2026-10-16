// Independent retest geometry oracle: expected bounds derive only from rendered cells and scroll viewport.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const runtime = '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(runtime)
const output = resolve(process.env.PS_TABLE_OUTPUT
	|| 'node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V2-TABLE-1/independent')
const url = process.env.PS_TABLE_URL || 'http://127.0.0.1:13782/table-fixture'
const result = { assertions: [], inputs: [], health: [], url, seed: 'generic A1..D2 opaque ids',
	sandbox: true, node: process.version, playwright: require(`${runtime}/package.json`).version,
	checkpoints: Object.fromEntries(['table', 'property-select'].map(owner => [owner, {
		sha: execFileSync('git', ['-C', `node_modules/@itrocks/${owner}`, 'rev-parse', 'HEAD'],
			{ encoding: 'utf8' }).trim(),
		version: JSON.parse(readFileSync(`node_modules/@itrocks/${owner}/package.json`)).version
	}])) }
mkdirSync(output, { recursive: true })
let browser
let page
let label
function check(name, expected, actual)
{
	let verdict = 'PASS'
	try { assert.deepEqual(actual, expected) }
	catch { verdict = 'FAIL' }
	result.assertions.push({ label, name, expected, actual, verdict })
}
async function measure(id, side)
{
	return page.evaluate(({ id, side }) => {
		const table = document.querySelector('table')
		const scroll = document.querySelector('main')
		const viewport = scroll.getBoundingClientRect()
		const tableBox = table.getBoundingClientRect()
		const index = Array.from(table.tHead.rows[0].cells).findIndex(cell => cell.dataset.columnId === id)
		const rows = Array.from(table.rows).map(row => {
			const cells = row.cells
			const first = cells[0].getBoundingClientRect()
			const last = cells[cells.length - 1].getBoundingClientRect()
			const target = cells[index].getBoundingClientRect()
			const left = Math.max(viewport.left + scroll.clientLeft, side === 'right' ? tableBox.left : first.right)
			const right = Math.min(viewport.left + scroll.clientLeft + scroll.clientWidth,
				side === 'left' ? tableBox.right : last.left)
			return { available: right - left, width: target.width,
				visible: Math.max(0, Math.min(right, target.right) - Math.max(left, target.left)),
				left, right, target: [target.left, target.right], edges: [first.left, last.right] }
		})
		const publicBounds = window.tableRecipe.table().plugins.TableFreeze.visibleInnerRect()
		return { rows, scroll: scroll.scrollLeft, main: [Math.max(viewport.left, tableBox.left), Math.min(viewport.right, tableBox.right)],
			publicBounds: [publicBounds.left, publicBounds.right], focus: document.activeElement.id,
			selection: Array.from(table.querySelectorAll('input[type=checkbox]'), input => input.checked) }
	}, { id, side })
}
function geometry(name, observation, side)
{
	for (const [row, box] of observation.rows.entries()) {
		check(`${name} row ${row}: positive inner width`, true, box.available > 0)
		check(`${name} row ${row}: actual visible width`, true,
			Math.abs(box.visible - Math.min(box.width, box.available)) < 1)
		if (side !== 'right') check(`${name} row ${row}: sticky Select`, true,
			Math.abs(box.edges[0] - observation.main[0]) < 2)
		if (side !== 'left') check(`${name} row ${row}: sticky Actions`, true,
			Math.abs(box.edges[1] - observation.main[1]) < 2)
	}
	if (side !== 'right') check(`${name}: public left agrees with actual header`, true,
		Math.abs(observation.publicBounds[0] - observation.rows[0].left) < 1)
	if (side !== 'left') check(`${name}: public right agrees with actual header`, true,
		Math.abs(observation.publicBounds[1] - observation.rows[0].right) < 1)
	check(`${name}: selection preserved`, [true, false], observation.selection)
	result.assertions.push({ label, name: `${name}: measurements`, expected: 'maximal visible rendered width',
		actual: observation, verdict: 'PASS' })
}
try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	result.browser = browser.version()
	for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
		for (const shape of ['colgroup', 'header']) {
			for (const side of ['both', 'left', 'right']) {
				label = `${width}-${shape}-${side}`
				page = await browser.newPage({ viewport: { width, height },
					colorScheme: width === 844 ? 'dark' : 'light',
					reducedMotion: width === 390 ? 'reduce' : 'no-preference' })
				page.on('console', event => {
					if (['warning', 'error'].includes(event.type())) result.health.push({ label, text: event.text() })
				})
				page.on('pageerror', error => result.health.push({ label, error: String(error) }))
				page.on('requestfailed', request => result.health.push({ label, failed: request.url() }))
				page.on('response', response => {
					if (response.status() >= 400) result.health.push({ label, status: response.status(), url: response.url() })
				})
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
					window.retestInputs = []
					for (const type of ['click', 'keydown', 'pointerdown'])
						document.addEventListener(type, event => window.retestInputs.push({ type, trusted: event.isTrusted }), true)
				})
				await page.goto(url)
				await page.waitForFunction(() => !!window.tableRecipe)
				if (side === 'both') await page.screenshot({ path: `${output}/${label}-before.png` })
				await page.locator('#add').click()
				await page.waitForFunction(() => document.querySelector('th[data-column-id="opaque/metric:7"]')
					.textContent === 'Metric opaque/metric:7')
				await page.locator('#add').click()
				geometry('ordinary product duplicate click', await measure('opaque/metric:7', side), side)
				for (const phase of ['loaded', 'reset', 'wide']) {
					if (phase === 'wide') await page.locator('th[data-column-id="opaque/metric:7"]').evaluate(cell => {
						cell.style.minWidth = '1400px'
					})
					if (phase !== 'loaded') {
						await page.locator('#reset').click()
						await page.locator('#reset').click()
					}
					await page.locator('#focus').click()
					await page.keyboard.press('End')
					await page.keyboard.type('x')
					for (const [id, origin] of [['a', 'end'], ['opaque/metric:7', 'start']]) {
						// Explicit supplementary public-contract call; no claim of a product reveal gesture.
						await page.evaluate(({ id, origin }) => {
							const scroll = document.querySelector('main')
							scroll.scrollLeft = origin === 'end' ? scroll.scrollWidth : 0
							window.tableRecipe.addition().reveal(id)
						}, { id, origin })
						const observation = await measure(id, side)
						geometry(`${phase} ${origin} public reveal ${id}`, observation, side)
						check(`${phase} ${origin}: focus retained`, 'focus', observation.focus)
						await page.evaluate(id => window.tableRecipe.addition().reveal(id), id)
						check(`${phase} ${origin}: already-visible reveal does not move`, observation.scroll,
							(await measure(id, side)).scroll)
					}
				}
				if (side === 'both') await page.screenshot({ path: `${output}/${label}-after.png` })
				result.inputs.push({ label, events: await page.evaluate(() => window.retestInputs) })
				await page.close()
			}
		}
	}
	check('all inputs trusted', true, result.inputs.every(row => row.events.length && row.events.every(e => e.trusted)))
	check('browser health', [], result.health)
	assert.equal(result.assertions.filter(row => row.verdict === 'FAIL').length, 0)
	result.verdict = 'PASS'
	console.log(`PASS: ${result.assertions.length} independent assertions across 24 configurations`)
}
catch (error) {
	result.verdict = 'FAIL'
	result.error = String(error.stack)
	await page?.screenshot({ path: `${output}/failure.png` }).catch(() => {})
	throw error
}
finally {
	writeFileSync(`${output}/results.json`, JSON.stringify(result, null, 2) + '\n')
	await browser?.close()
}
