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
			: path.endsWith('.html') ? 'text/html' : path.endsWith('.svg') ? 'image/svg+xml' : 'text/javascript')
		response.end(await readFile(new URL(`..${path}`, import.meta.url)))
	}
	catch { response.writeHead(404).end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	for (const touch of [false, true]) {
		const page = await browser.newPage({ hasTouch: touch, isMobile: touch,
			viewport: { width: touch ? 375 : 1280, height: 720 } })
		await page.goto(`http://127.0.0.1:${server.address().port}/`)
		await page.evaluate(async () => {
			const { PropertySelectView } = await import('/front/property-select.js')
			const { graphProvider } = await import('/test/fixtures/search-graph.mjs')
			const used = new Set(['number', 'customer', 'customer.address.country.code'])
			window.events = []
			window.view = new PropertySelectView(document.querySelector('#selector'), {
				metadata: graphProvider(), root: 'invoice', usedPaths: [...used], consumer: {
					async select(intent) {
						if (window.rejectSelection) return { ...intent, status: 'rejected', message: 'Rejected' }
						const existing = used.has(intent.path)
						const status = existing ? intent.action === 'add' ? 'existing' : 'removed' : 'added'
						if (status === 'removed') used.delete(intent.path)
						else used.add(intent.path)
						view.selector.setConfiguration({ usedPaths: [...used] })
						return { ...intent, status }
					},
					begin() {}, cancel() {}, move() {},
					async end(id) {
						const intent = events.findLast(event => event.type === 'begin').intent
						return { ...intent, id, status: used.has(intent.path) ? 'moved' : 'added' }
					}
				}
			})
			view.selector.subscribe(event => {
				if (['begin', 'end', 'select', 'outcome'].includes(event.type)) events.push(event)
			})
			await view.mount()
		})
		const relation = page.locator('.ps-property[data-path="customer"]')
		const opacity = button => button.evaluate(node => getComputedStyle(node).opacity)
		await page.mouse.move(0, 0)
		await relation.locator('.ps-main').focus()
		assert.equal(await opacity(relation.locator('.ps-open')), touch ? '1' : '0')
		assert.equal(await opacity(relation.locator('.ps-locate')), touch ? '1' : '0')
		await relation.locator('.ps-check').focus()
		assert.equal(await opacity(relation.locator('.ps-open')), touch ? '1' : '0')
		assert.equal(await opacity(relation.locator('.ps-locate')), touch ? '1' : '0')
		if (!touch) {
			await relation.locator('.ps-locate').focus()
			assert.equal(await opacity(relation.locator('.ps-locate')), '1')
			assert.equal(await opacity(relation.locator('.ps-open')), '0')
			await page.locator('.ps-query').focus()
			await page.setViewportSize({ width: 375, height: 720 })
			assert.equal(await opacity(relation.locator('.ps-open')), '1')
			assert.equal(await opacity(relation.locator('.ps-locate')), '1')
			await page.setViewportSize({ width: 1280, height: 720 })
			assert.equal(await opacity(relation.locator('.ps-open')), '0')
			assert.equal(await opacity(relation.locator('.ps-locate')), '0')
		}
		else {
			await page.setViewportSize({ width: 844, height: 390 })
			assert.equal(await opacity(relation.locator('.ps-open')), '1')
			assert.equal(await opacity(relation.locator('.ps-locate')), '1')
			await page.setViewportSize({ width: 375, height: 720 })
		}
		assert.equal(await page.locator('.ps-locate[data-path="tags"]').isVisible(), false)
		assert.equal(await page.locator('.ps-locate[data-path="tags"]').isDisabled(), true)
		for (const path of ['number', 'customer', 'customer.address.country.code']) {
			const row = page.locator(`.ps-property[data-path="${path}"]`)
			const locate = row.locator('.ps-locate')
			await page.locator('.ps-query').focus()
			await page.mouse.move(0, 0)
			assert.equal(await locate.evaluate(node => getComputedStyle(node).opacity), touch ? '1' : '0')
			await row.locator('.ps-main').hover()
			assert.equal(await locate.evaluate(node => getComputedStyle(node).opacity), '1')
			assert.equal(await locate.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)')
			const clearBounds = await page.locator('.ps-clear').boundingBox()
			const buttons = await row.locator('.ps-locate, .ps-open').all()
			for (const button of buttons) {
				const bounds = await button.boundingBox()
				assert.equal(bounds.width, clearBounds.width)
				assert.equal(await button.evaluate(node => getComputedStyle(node).borderLeft),
					await page.locator('.ps-clear').evaluate(node => getComputedStyle(node).borderLeft))
				assert.equal(await button.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 255, 255)')
			}
			const rightmost = await buttons.at(-1).boundingBox()
			assert.equal(rightmost.x, clearBounds.x)
			assert.equal(rightmost.x + rightmost.width, clearBounds.x + clearBounds.width)
			await locate.hover()
			assert.equal(await locate.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(244, 244, 244)')
			assert.equal(await row.locator('.ps-main').evaluate(node => getComputedStyle(node).backgroundColor),
				'rgba(0, 0, 0, 0)')
			await page.evaluate(() => { events.length = 0 })
			if (!touch && path === 'customer')
				await page.screenshot({ path: '/tmp/property-select-locate.png' })
			await locate.click()
			await page.waitForFunction(() => events.at(-1)?.type === 'outcome')
			assert.equal(await page.evaluate(() => events.at(-1).outcome.status), 'existing')
			assert.equal(await page.evaluate(() => events.find(event => event.type === 'select').intent.action), 'add')
			assert.equal(await page.evaluate(() => events.filter(event => event.type === 'select').length), 1)
			assert.equal(await row.locator('.ps-check').isChecked(), true)
			assert.equal(await page.evaluate(() => view.selector.path), '')
		}
		for (const path of ['number', 'customer']) {
			const row = page.locator(`.ps-property[data-path="${path}"]`)
			for (const control of ['.ps-main', '.ps-check', '.ps-check-cell']) {
				for (const checked of [false, true]) {
					await page.evaluate(() => { events.length = 0 })
					await row.locator(control).click({ position: { x: 2, y: 2 } })
					await page.waitForFunction(() => events.at(-1)?.type === 'outcome')
					assert.equal(await row.locator('.ps-check').isChecked(), checked)
					assert.equal(await row.locator('.ps-locate').isDisabled(), !checked)
					assert.equal(await row.locator('.ps-locate').isVisible(), checked)
					assert.equal(await row.evaluate(node => node.classList.contains('ps-used')), checked)
					assert.equal(await page.evaluate(() => events.at(-1).outcome.status), checked ? 'added' : 'removed')
					assert.equal(await page.evaluate(() => events.filter(event => event.type === 'select').length), 1)
					assert.equal(await page.evaluate(() => view.selector.path), '')
				}
			}
			for (const checked of [false, true]) {
				await row.locator('.ps-check').focus()
				await page.keyboard.press('Space')
				await page.waitForFunction(() => events.at(-1)?.type === 'outcome')
				assert.equal(await row.locator('.ps-check').isChecked(), checked)
			}
		}
		await page.evaluate(() => { window.rejectSelection = true })
		await page.locator('.ps-check[data-path="customer"]').click()
		await page.waitForFunction(() => events.at(-1)?.outcome?.status === 'rejected')
		assert.equal(await page.locator('.ps-check[data-path="customer"]').isChecked(), true)
		await page.evaluate(() => { window.rejectSelection = false })
		if (touch) {
			const open = page.locator('.ps-property[data-path="customer"] .ps-open')
			assert.equal(await open.evaluate(node => getComputedStyle(node).opacity), '1')
			await open.tap()
			await page.waitForFunction(() => view.selector.path === 'customer')
		}
		else {
			for (const [source, path, status] of [
				['.ps-main[data-path="number"]', 'number', 'moved'],
				['.ps-main[data-path="customer"]', 'customer', 'moved'],
				['.ps-main[data-path="tags"]', 'tags', 'added'],
				['.ps-used .ps-segment[data-path="customer.address"]', 'customer.address', 'added']
			]) {
				await page.evaluate(() => { events.length = 0 })
				const bounds = await page.locator(source).boundingBox()
				await page.mouse.move(bounds.x + 8, bounds.y + bounds.height / 2)
				await page.mouse.down()
				await page.mouse.move(bounds.x + 35, bounds.y + bounds.height / 2, { steps: 4 })
				await page.waitForFunction(() => events.some(event => event.type === 'begin'))
				await page.mouse.move(600, 400, { steps: 5 })
				await page.mouse.up()
				await page.waitForFunction(() => events.at(-1)?.type === 'outcome')
				assert.equal(await page.evaluate(() => events.find(event => event.type === 'begin').intent.path), path)
				assert.equal(await page.evaluate(() => events.at(-1).outcome.status), status)
				assert.equal(await page.evaluate(() => events.filter(event => event.type === 'select').length), 0)
				assert.equal(await page.evaluate(() => view.selector.path), '')
			}
		}
		await page.close()
		console.log(`PASS checkbox, cell, name and transport interactions (${touch ? 'touch' : 'desktop'})`)
	}
}
finally {
	await browser?.close()
	await new Promise(resolve => server.close(resolve))
}
