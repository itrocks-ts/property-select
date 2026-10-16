const { chromium } = require(
	'/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
)
const { mkdirSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/V2-TABLE')
const url = process.env.PS_TABLE_URL || 'http://127.0.0.1:13762/table-fixture'

async function main()
{
	const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	const results = []
	mkdirSync(output, { recursive: true })
	try {
		for (const [width, height] of [[1280, 720], [768, 900], [390, 844], [844, 390]]) {
			const page = await browser.newPage({ viewport: { width, height } })
			await page.goto(url)
			await page.locator('#add').click()
			await page.waitForFunction(() => document.querySelector('th[data-column-id="opaque/metric:7"]')
				.textContent === 'Metric opaque/metric:7')
			await page.locator('#add').click()
			const actual = await page.evaluate(() => {
				const rect = element => {
					const box = element.getBoundingClientRect()
					return { left: box.left, right: box.right, width: box.width }
				}
				const plugin = window.tableRecipe.table().plugins.TableFreeze
				return {
					scrollLeft: document.querySelector('main').scrollLeft,
					metric: rect(document.querySelector('th[data-column-id="opaque/metric:7"]')),
					left: rect(document.querySelector('th[data-freeze]')),
					right: rect(document.querySelector('thead th:last-child')),
					main: rect(document.querySelector('main')),
					freezeInner: { left: plugin.visibleInnerRect().left, right: plugin.visibleInnerRect().right },
					cols: Array.from(document.querySelectorAll('col'), rect)
				}
			})
			const available = actual.right.left - actual.left.right
			const visible = Math.max(0, Math.min(actual.metric.right, actual.right.left)
				- Math.max(actual.metric.left, actual.left.right))
			results.push({ width, height, url, browser: browser.version(), chromiumSandbox: true, actual,
				expectedVisible: Math.min(actual.metric.width, available), observedVisible: visible,
				verdict: visible + 2 >= Math.min(actual.metric.width, available) ? 'PASS' : 'FAIL' })
			await page.screenshot({ path: `${output}/reveal-${width}.png` })
			await page.close()
		}
	}
	finally {
		await browser.close()
		writeFileSync(`${output}/reveal-reproducer.json`, JSON.stringify(results, null, 2) + '\n')
	}
	console.log(JSON.stringify(results.map(({ width, expectedVisible, observedVisible, verdict }) =>
		({ width, expectedVisible, observedVisible, verdict })), null, 2))
	if (results.some(result => result.verdict === 'FAIL')) process.exitCode = 1
}

main().catch(error => {
	console.error(error)
	process.exitCode = 1
})
