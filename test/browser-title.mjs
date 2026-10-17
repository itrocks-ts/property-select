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
		response.end(`<!doctype html><link rel="stylesheet" href="/pane.css">
			<link rel="stylesheet" href="/front/property-select.css">
			<style>* { box-sizing: border-box } .right-pane { width:320px; height:500px; font:12px sans-serif }</style>
			<aside class="right-pane"><header class="right-pane-tabs"></header>
			<div class="right-pane-title-bar"><h2>Add columns</h2></div>
			<div id="right-pane-content"><div id="selector"></div></div></aside>`)
		return
	}
	if (path === '/pane.css') {
		response.setHeader('Content-Type', 'text/css')
		response.end(await readFile(new URL('../../home/right-pane.css', import.meta.url)))
		return
	}
	try {
		response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css'
			: path.endsWith('.html') ? 'text/html' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript')
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
		await page.goto(`http://127.0.0.1:${server.address().port}/`)
		await page.evaluate(async () => {
			const { PropertySelectView } = await import('/front/property-select.js')
			const { graphProvider } = await import('/test/fixtures/search-graph.mjs')
			window.view = new PropertySelectView(document.querySelector('#selector'), {
				metadata: graphProvider(), root: 'invoice', advice: ['customer']
			})
			await view.mount()
		})
		const widths = []
		for (const title of ['Add columns', 'Ajouter des colonnes', 'Spalten hinzufügen', 'Ajouter des colonnes au tableau']) {
			await page.locator('.right-pane-title-bar h2').evaluate((node, title) => { node.textContent = title }, title)
			await page.waitForFunction(() => {
				const heading = document.querySelector('h2').getBoundingClientRect()
				const shortcuts = document.querySelector('.ps-suggestions').getBoundingClientRect()
				return Math.abs(heading.right - shortcuts.left) < 1
			})
			const heading = page.locator('h2')
			assert.equal(await heading.evaluate(node => node.scrollWidth <= node.clientWidth), true, title)
			const bounds = await heading.boundingBox()
			widths.push(bounds.width)
			const shortcuts = await page.locator('.ps-suggestions').boundingBox()
			assert.ok(shortcuts.width > 0, title)
		}
		assert.ok(widths[1] > widths[0], JSON.stringify(widths))
		assert.ok(widths[3] > widths[1], JSON.stringify(widths))
		await page.locator('.right-pane').evaluate(node => { node.hidden = true })
		await page.locator('h2').evaluate(node => { node.textContent = 'Ajouter des colonnes' })
		await page.locator('.right-pane').evaluate(node => { node.hidden = false; node.style.width = '280px' })
		await page.waitForFunction(() => Math.abs(document.querySelector('h2').getBoundingClientRect().right
			- document.querySelector('.ps-suggestions').getBoundingClientRect().left) < 1)
		await page.screenshot({ path: `/tmp/property-select-title-${width}.png` })
		console.log('PASS translated heading width and adjacent shortcuts', width, JSON.stringify(widths))
		await page.evaluate(() => view.dispose())
		await page.close()
	}
}
finally {
	await browser?.close()
	await new Promise(resolve => server.close(resolve))
}
