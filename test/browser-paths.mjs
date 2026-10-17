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
				metadata: graphProvider(), root: 'invoice',
				usedPaths: ['customer.address.country.code']
			})
			window.selections = []
			window.actions = []
			view.selector.subscribe(event => {
				if (event.type === 'select') {
					selections.push(event.intent.path)
					actions.push(event.intent.action)
				}
			})
			await view.mount()
		})
		const usedRow = page.locator('.ps-used').first()
		const unusedRow = page.locator('.ps-property:not(.ps-used)').first()
		const background = locator => locator.evaluate(node => getComputedStyle(node).backgroundColor)
		await page.mouse.move(0, 0)
		assert.equal(await usedRow.locator('.ps-check').isChecked(), true)
		assert.equal(await unusedRow.locator('.ps-check').isChecked(), false)
		assert.notEqual(await background(usedRow), await background(unusedRow))
		await unusedRow.locator('.ps-main').hover()
		assert.equal(await background(unusedRow.locator('.ps-main')), 'rgb(244, 244, 244)')
		await usedRow.locator('.ps-main').hover()
		assert.equal(await background(usedRow.locator('.ps-main')), 'rgb(244, 244, 244)')
		assert.equal(await page.locator('.ps-add').count(), 0)
		for (const relation of [unusedRow.locator('[data-action="navigate"]').first(),
			usedRow.locator('.ps-segment').first(), page.locator('.ps-level').first()]) {
			if (await relation.evaluate(node => node.classList.contains('ps-open')))
				await relation.locator('..').hover()
			await relation.hover()
			assert.equal(await background(relation), 'rgb(244, 244, 244)')
		}
		await page.mouse.move(0, 0)
		const open = page.locator('.ps-property[data-path="customer"] .ps-open')
		assert.equal(await open.evaluate(node => getComputedStyle(node).opacity), '0')
		await page.locator('.ps-property[data-path="customer"]').hover()
		assert.equal(await open.evaluate(node => getComputedStyle(node).opacity), '1')
		await page.locator('.ps-property[data-path="customer"] .ps-main').hover()
		assert.equal(await background(open), 'rgba(0, 0, 0, 0)')
		await open.hover()
		assert.equal(await background(open), 'rgb(244, 244, 244)')
		assert.equal(await background(open.locator('..').locator('.ps-main')), 'rgba(0, 0, 0, 0)')
		assert.equal(await background(open.locator('..').locator('.ps-check-cell')), 'rgba(0, 0, 0, 0)')
		await open.click()
		await page.waitForFunction(() => view.selector.path === 'customer')
		assert.deepEqual(await page.evaluate(() => selections), [])
		await page.evaluate(() => view.selector.navigate(''))
		await page.locator('.ps-main[data-path="customer"]').click()
		await page.waitForFunction(() => selections.length === 1)
		assert.deepEqual(await page.evaluate(() => selections), ['customer'])
		assert.equal(await page.evaluate(() => actions.at(-1)), 'add')
		assert.equal(await page.evaluate(() => view.selector.path), '')
		await page.evaluate(() => { selections.length = 0 })
		const ordinaryHeight = await page.locator('.ps-property').first()
			.evaluate(row => row.getBoundingClientRect().height)
		for (const path of ['customer', 'customer.address', 'customer.address.country']) {
			const used = page.locator('.ps-property.ps-used[data-path="customer.address.country.code"]')
			assert.equal(await used.locator('button:not(.ps-add)')
				.evaluateAll(buttons => buttons.map(button => button.textContent).join('')), 'Client › Adresse › Pays › Côde')
			const relation = used.locator(`button[data-path="${path}"]`)
			const bounds = await relation.boundingBox()
			assert.equal(bounds.height, ordinaryHeight - 1)
			await relation.click({ position: { x: bounds.width / 2, y: 1 } })
			await page.waitForFunction(path => view.selector.path === path, path)
			const current = page.locator('.ps-level[aria-current]')
			await current.hover()
			assert.equal(await background(current), 'rgb(244, 244, 244)')
			assert.deepEqual(await page.evaluate(() => selections), [])
			assert.equal(await page.locator('.ps-query').inputValue(), '')
			const displayed = await page.locator('.ps-property').evaluateAll(rows => rows.map(row => row.dataset.path))
			const expected = await page.evaluate(() => view.selector.context.properties.map(property => property.path))
			assert.deepEqual(displayed.sort(), expected.sort())
			await page.evaluate(() => view.selector.navigate(''))
		}
		const used = page.locator('.ps-property.ps-used[data-path="customer.address.country.code"]')
		const terminal = used.locator('.ps-main')
		const terminalBounds = await terminal.boundingBox()
		assert.equal(terminalBounds.height, ordinaryHeight - 1)
		await terminal.click({ position: { x: terminalBounds.width - 2, y: terminalBounds.height - 2 } })
		assert.deepEqual(await page.evaluate(() => selections), ['customer.address.country.code'])
		assert.equal(await page.evaluate(() => view.selector.path), '')
		await page.evaluate(() => { selections.length = 0 })
		await page.locator('.ps-query').fill('code')
		await page.waitForFunction(() => ['complete', 'limited'].includes(
			document.querySelector('.property-select').dataset.searchStatus))
		const row = page.locator('.ps-property[data-path="customer.address.country.code"]')
		const observed = await row.evaluate(row => {
			const buttons = [...row.querySelectorAll('button:not(.ps-add)')]
			return {
				buttons: buttons.map(button => button.dataset.path),
				height: row.getBoundingClientRect().height,
				label: buttons.map(button => button.textContent).join(''),
				lines: new Set(buttons.map(button => {
					const range = document.createRange()
					range.selectNodeContents(button.firstChild)
					return range.getBoundingClientRect().top
				})).size,
				overflow: row.scrollWidth > row.clientWidth,
				title: row.title
			}
		})
		assert.deepEqual(observed.buttons, ['customer', 'customer.address', 'customer.address.country',
			'customer.address.country.code'])
		assert.equal(await row.locator(':scope > button').count(), 4)
		assert.equal(observed.height, ordinaryHeight)
		assert.equal(observed.label, 'Client › Adresse › Pays › Côde')
		assert.equal(observed.lines, 1)
		assert.equal(observed.title, 'Client.Adresse.Pays.Côde')
		await page.screenshot({ path: `/tmp/property-select-paths-full-${width}.png` })
		await row.locator('.ps-check').click()
		assert.equal(await page.evaluate(() => actions.at(-1)), undefined)
		assert.deepEqual(await page.evaluate(() => selections), ['customer.address.country.code'])
		await page.evaluate(() => { selections.length = 0 })
		await row.locator('.ps-main').click()
		assert.equal(await page.evaluate(() => actions.at(-1)), 'add')
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
		assert.equal(await row.evaluate(row => row.scrollWidth > row.clientWidth), true)
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
