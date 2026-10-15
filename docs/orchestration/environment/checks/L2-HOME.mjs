import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/L2-HOME')
const url = 'http://127.0.0.1:13731/pane-fixture'
const records = [], failures = [], inputs = []
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
const check = (name, expected, observed) => {
	assert.deepEqual(observed, expected, name)
	records.push({ name, expected, observed, verdict: 'PASS' })
}
try {
	for (const [name, width, height, touch] of [
		['desktop', 1280, 720, false], ['narrow', 768, 900, false],
		['portrait', 390, 844, true], ['landscape', 844, 390, true]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch })
		const page = await context.newPage()
		page.on('pageerror', error => failures.push(`${name}: ${error.message}`))
		page.on('console', message => {
			if (['error', 'warning'].includes(message.type())) failures.push(`${name}: ${message.text()}`)
		})
		page.on('requestfailed', request => failures.push(`${name}: ${request.url()}`))
		page.on('response', response => {
			if (response.status() >= 400) failures.push(`${name}: ${response.status()} ${response.url()}`)
		})
		await page.addInitScript(() => {
			window.inputs = []
			for (const type of ['click', 'keydown', 'pointerdown', 'touchmove'])
				document.addEventListener(type, event => window.inputs.push({
					type, trusted: event.isTrusted, pointerType: event.pointerType, key: event.key
				}), true)
		})
		const activate = async selector => touch ? page.locator(selector).tap() : page.locator(selector).click()
		await page.goto(url)
		await page.waitForFunction(() => !!window.paneRecipe)
		check(`${name} empty`, false, await page.locator('.right-pane-toggle').isVisible())
		const before = await page.locator('main').boundingBox()
		await activate('#register')
		check(`${name} starts folded`, false, await page.locator('.right-pane').isVisible())
		check(`${name} one command`, 1, await page.locator('.right-pane-toggle').count())
		await page.screenshot({ path: `${output}/${name}-folded.png` })
		await activate('.right-pane-toggle')
		check(`${name} command moved`, true,
			await page.locator('.right-pane > header > .right-pane-toggle').isVisible())
		check(`${name} icon reversed`, '›', await page.locator('.right-pane-toggle > [aria-hidden]').textContent())
		check(`${name} no overflow`, true, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		check(`${name} comfortable command`, true, await page.locator('.right-pane-toggle').evaluate(node => {
			const box = node.getBoundingClientRect()
			return box.width >= 44 && box.height >= 44
		}))
		if (!touch || height > 480 && width > 600) {
			check(`${name} main shrinks`, true, (await page.locator('main').boundingBox()).width < before.width)
			await page.locator('main').hover()
			await page.mouse.wheel(140, 180)
			await page.waitForTimeout(200)
			check(`${name} main scrolls both axes`, true,
				await page.locator('main').evaluate(node => node.scrollLeft > 0 && node.scrollTop > 0))
			await activate('#main-action')
			check(`${name} main stays interactive`, '1', await page.locator('#main-result').textContent())
			await activate('#compete')
			check(`${name} competing owner refused`, 'PaneOccupiedError', await page.locator('#pane-state').textContent())
		}
		else {
			check(`${name} main inert`, true, await page.locator('main').evaluate(node => node.inert))
			check(`${name} modal semantics`, 'true', await page.locator('.right-pane').getAttribute('aria-modal'))
		}
		const breadcrumb = page.locator('nav[aria-label="Example breadcrumb"]')
		if (touch) {
			const session = await context.newCDPSession(page)
			const box = await breadcrumb.boundingBox()
			const x = box.x + box.width - 10, y = box.y + box.height / 2
			await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
			for (let step = 1; step <= 8; step ++)
				await session.send('Input.dispatchTouchEvent', {
					type: 'touchMove', touchPoints: [{ x: x - step * 20, y }]
				})
			await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
		}
		else {
			await breadcrumb.hover()
			await page.mouse.wheel(140, 0)
		}
		await page.waitForTimeout(200)
		check(`${name} long breadcrumb scrolls`, true, await breadcrumb.evaluate(node => node.scrollLeft > 0))
		if (!touch) {
			await page.locator('.right-pane-toggle').focus()
			await page.keyboard.press('Tab')
			await page.keyboard.press('Shift+Tab')
			check(`${name} visible keyboard outline`, true,
				await page.locator('.right-pane-toggle').evaluate(node =>
					node.matches(':focus-visible') && getComputedStyle(node).outlineStyle !== 'none'))
		}
		await page.locator('#recipe-search').fill('retained context')
		await activate('#recipe-choice')
		check(`${name} content click retains pane`, true, await page.locator('.right-pane').isVisible())
		if (touch) {
			const session = await context.newCDPSession(page)
			const box = await page.locator('#right-pane-content').boundingBox()
			const x = box.x + box.width / 2, y = Math.min(box.y + box.height - 30, height - 30)
			await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
			for (let step = 1; step <= 8; step ++)
				await session.send('Input.dispatchTouchEvent', {
					type: 'touchMove', touchPoints: [{ x, y: y - step * 15 }]
				})
			await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
			await page.waitForTimeout(350)
		}
		else {
			await page.locator('#right-pane-content').hover()
			await page.mouse.wheel(0, 170)
			await page.waitForTimeout(350)
		}
		const scroll = await page.locator('#right-pane-content').evaluate(node => node.scrollTop)
		check(`${name} actual scroll`, true, scroll > 0)
		await activate('.right-pane-toggle')
		check(`${name} close focus`, true,
			await page.locator('.right-pane-toggle').evaluate(node => node === document.activeElement))
		await activate('.right-pane-toggle')
		check(`${name} retained input`, 'retained context', await page.locator('#recipe-search').inputValue())
		check(`${name} retained scroll`, scroll, await page.locator('#right-pane-content').evaluate(node => node.scrollTop))
		await page.screenshot({ path: `${output}/${name}-open.png` })
		// Public lifecycle calls are fixture contract controls, never substitutions for product input.
		await page.evaluate(() => {
			window.outer = window.paneRecipe.handle.suspend()
			window.inner = window.paneRecipe.handle.suspend()
			window.outer.restore()
		})
		check(`${name} nested suspension`, false, await page.locator('.right-pane').isVisible())
		await page.evaluate(() => window.inner.restore())
		check(`${name} restored without search focus`, false,
			await page.locator('#recipe-search').evaluate(node => node === document.activeElement))
		await page.evaluate(() => {
			const token = window.paneRecipe.handle.suspend()
			window.paneRecipe.handle.remove()
			token.restore()
		})
		check(`${name} removed token invalid`, false, await page.locator('.right-pane-toggle').isVisible())
		await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
		await activate('#register')
		await activate('.right-pane-toggle')
		check(`${name} reduced motion`, '0s',
			await page.locator('.right-pane').evaluate(node => getComputedStyle(node).transitionDuration))
		check(`${name} theme foreground/background distinct`, true,
			await page.locator('.right-pane').evaluate(node => {
				const style = getComputedStyle(node)
				return style.color !== style.backgroundColor
			}))
		await page.screenshot({ path: `${output}/${name}-dark.png` })
		inputs.push({ name, events: await page.evaluate(() => window.inputs) })
		await context.close()
	}
	check('browser health', [], failures)
	writeFileSync(`${output}/results.json`, JSON.stringify({ url, browser: browser.version(),
		playwright: require(`${process.env.PS_PLAYWRIGHT_MODULE || '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'}/package.json`).version,
		seed: 'arbitrary content, 16 branch links, 80 example items', records, inputs, failures,
		ownership: JSON.parse(readFileSync('/tmp/property-select-L2-HOME-live/app.owner.json')) }, null, 2) + '\n')
	console.log(`${records.length} PASS assertions`)
}
finally { await browser.close() }
