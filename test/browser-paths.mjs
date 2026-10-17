import assert           from 'node:assert/strict'
import { readFile }     from 'node:fs/promises'
import { createServer } from 'node:http'

const runtime = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const { chromium } = await import(runtime)
const server = createServer(async (request, response) => {
	const path = new URL(request.url, 'http://localhost').pathname
	if (path === '/') {
		response.setHeader('Content-Type', 'text/html')
		response.end(`<!doctype html><link rel="stylesheet" href="/front/property-select.css">
			<style>#selector { height: 500px; width: 320px; }</style><div id="selector"></div>`)
		return
	}
	try {
		response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css'
			: path.endsWith('.html') ? 'text/html' : 'text/javascript')
		response.end(await readFile(new URL(`..${path}`, import.meta.url)))
	}
	catch { response.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	for (const width of [1280, 375]) {
		const page = await browser.newPage({ viewport: { width, height: 720 } })
		const errors = []
		page.on('pageerror', error => errors.push(error.message))
		await page.goto(`http://127.0.0.1:${server.address().port}/`)
		await page.evaluate(async () => {
			const { PropertySelectView } = await import('/front/property-select.js')
			const { graphProvider } = await import('/test/fixtures/search-graph.mjs')
			window.view = new PropertySelectView(document.querySelector('#selector'), {
				metadata: graphProvider(), root: 'invoice'
			})
			window.selections = []
			view.selector.subscribe(event => {
				if (event.type === 'select') selections.push(event.intent.path)
			})
			await view.mount()
		})
		const ordinaryHeight = await page.locator('.ps-property').first()
			.evaluate(row => row.getBoundingClientRect().height)
		await page.locator('.ps-query').fill('code')
		await page.waitForFunction(() => ['complete', 'limited'].includes(
			document.querySelector('.property-select').dataset.searchStatus))
		const row = page.locator('.ps-property[data-path="customer.address.country.code"]')
		const observed = await row.evaluate(row => {
			const path = row.querySelector('.ps-result-path')
			return {
				buttons: [...path.querySelectorAll('button')].map(button => button.dataset.path),
				height: row.getBoundingClientRect().height,
				label: path.textContent,
				lines: new Set([...path.querySelectorAll('button')].map(button => {
					const range = document.createRange()
					range.selectNodeContents(button.firstChild)
					return range.getBoundingClientRect().top
				})).size,
				overflow: path.scrollWidth > path.clientWidth,
				title: path.title
			}
		})
		assert.deepEqual(observed.buttons, ['customer', 'customer.address', 'customer.address.country',
			'customer.address.country.code'])
		assert.equal(observed.height, ordinaryHeight)
		assert.equal(observed.label, 'Client.Adresse.Pays.Côde')
		assert.equal(observed.lines, 1)
		assert.equal(observed.title, observed.label)
		await page.screenshot({ path: `/tmp/property-select-paths-full-${width}.png` })
		await row.locator('.ps-add').click({ force: true })
		assert.deepEqual(await page.evaluate(() => selections), ['customer.address.country.code'])
		await page.evaluate(() => { selections.length = 0 })
		await row.locator('.ps-main').click()
		assert.deepEqual(await page.evaluate(() => selections), ['customer.address.country.code'])
		await row.locator('button[data-path="customer"]').click()
		await page.waitForFunction(() => view.selector.path === 'customer')
		assert.equal(await page.locator('.ps-query').inputValue(), 'code')
		await page.locator('.ps-clear').click()
		await page.waitForFunction(() => view.selector.search.status === 'idle')
		assert.equal(await page.locator('.ps-property').first()
			.evaluate(row => row.getBoundingClientRect().height),
			ordinaryHeight)
		await page.locator('.ps-query').fill('code')
		await page.waitForFunction(() => ['complete', 'limited'].includes(
			document.querySelector('.property-select').dataset.searchStatus))
		await page.evaluate(() => { document.querySelector('#selector').style.width = '150px' })
		assert.equal(await row.locator('.ps-result-path').evaluate(path => path.scrollWidth > path.clientWidth), true)
		assert.equal(await row.evaluate(row => row.getBoundingClientRect().height), ordinaryHeight)
		await page.screenshot({ path: `/tmp/property-select-paths-${width}.png` })
		assert.deepEqual(errors, [])
		console.log(JSON.stringify({ ordinaryHeight, status: 'PASS', width, ...observed }))
		await page.close()
	}
}
finally {
	await browser?.close()
	await new Promise(resolve => server.close(resolve))
}
