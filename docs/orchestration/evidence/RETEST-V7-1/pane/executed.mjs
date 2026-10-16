import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const playwrightPath = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(playwrightPath)
const output = resolve('node_modules/@itrocks/property-select/docs/orchestration/evidence/RETEST-V7-1/pane')
const url = process.env.PS_PANE_URL || 'http://127.0.0.1:13741/pane-fixture'
const results = { url, seed: 'generic fixture: 16 branches / 80 items', assertions: [], health: [], modes: [] }
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
results.browser = browser.version()
results.playwright = require(`${playwrightPath}/package.json`).version
results.checkpoints = {"property-select":{"sha":"2083bb37b8f7bdb0e390730135213e0e89be69a7","version":"0.7.6","status":""},"list":{"sha":"258f26c95f0b35df4176ba73225c35df6b56b449","version":"0.12.1","status":""},"table":{"sha":"5e32fd6d1fe53f4511007f19804ba1a6b42a7ca6","version":"0.4.0","status":""},"home":{"sha":"6c1797058fa2162bde1c88fa12fb1b3320e7e4cd","version":"0.7.0","status":""},"framework":{"sha":"7211a97419add5165a8ac0f24f96afd5efd1b3fc","version":"0.11.0","status":""},"reflect":{"sha":"41e6e672f935bf1dd88ec61e2fe0be35c405af9a","version":"0.3.1","status":""},"reflect-path":{"sha":"bc6e4bdd17b884d93ecc72451078896c9a119696","version":"0.3.2","status":""},"storage":{"sha":"a298863052d9db37fe28c72e175896bdeec9366d","version":"0.3.0","status":""},"sql-build":{"sha":"a267327e072df4f6ffa855c15eae6a4c5776ee6d","version":"0.2.0","status":""},"sql-join":{"sha":"55db310bdf3e92330ec216677c81577f6854e3f0","version":"0.2.0","status":""},"mysql":{"sha":"275d7f3b0ae3739e9c1a2b6361fc173d98612581","version":"0.3.2","status":""},"mysql-maintainer":{"sha":"89ff36a3b1a41a60b040c0ed553f867bec0f6086","version":"0.4.1","status":""},"fastify":{"sha":"aca7bf377b0fd543c15004df3ebfb71fd10ab65f","version":"0.4.1","status":""},"fastify-file-session-store":{"sha":"c62849840b82316d6e8b0594d2ba4eb962a1cefe","version":"0.4.0","status":""}}
const check = (name, expected, observed) => {
	results.assertions.push({ name, expected, observed, verdict: JSON.stringify(expected) === JSON.stringify(observed)
		? 'PASS' : 'FAIL' })
	assert.deepEqual(observed, expected, name)
}
try {
	for (const [mode, width, height, touch] of [
		['desktop', 1280, 720, false], ['narrow', 768, 900, false],
		['portrait', 390, 844, true], ['landscape', 844, 390, true]
	]) {
		const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch })
		const page = await context.newPage()
		const prefix = name => `${mode}: ${name}`
		const activate = async selector => touch ? page.locator(selector).tap() : page.locator(selector).click()
		const visible = () => page.locator('.right-pane').isVisible()
		const state = () => page.locator('#pane-state').textContent()
		const commandFocus = () => page.locator('.right-pane-toggle').evaluate(n => n === document.activeElement)
		const shot = name => page.screenshot({ path: `${output}/${mode}-${name}.png` })
		for (const event of ['pageerror', 'requestfailed'])
			page.on(event, value => results.health.push({ mode, event, detail: String(value) }))
		page.on('response', response => {
			if (response.status() >= 400) results.health.push({ mode, status: response.status(), url: response.url() })
		})
		page.on('console', message => {
			if (['warning', 'error'].includes(message.type()))
				results.health.push({ mode, console: message.type(), text: message.text() })
		})
		await page.addInitScript(() => {
			window.trustedInputs = []
			for (const type of ['click', 'keydown', 'pointerdown', 'pointercancel', 'touchmove', 'touchcancel'])
				document.addEventListener(type, e => window.trustedInputs.push({ type, trusted: e.isTrusted,
					pointerType: e.pointerType, key: e.key }), true)
		})
		await page.goto(url)
		await page.waitForFunction(() => !!window.paneRecipe)
		check(prefix('real home shell'), true, await page.locator('body > .right-pane').count() === 1)
		check(prefix('empty has no command'), false, await page.locator('.right-pane-toggle').isVisible())
		check(prefix('empty has no content'), 0, await page.locator('#right-pane-content > *').count())
		await shot('empty')
		const fullWidth = (await page.locator('main').boundingBox()).width
		await activate('#register')
		check(prefix('registration folded'), false, await visible())
		check(prefix('registration subscription immediate'), '{"present":true,"open":false,"suspended":false}',
			await state())
		check(prefix('exactly one dock command after notifications'), true, await page.evaluate(() => {
			const command = document.querySelector('.right-pane-toggle')
			const dock = document.querySelector('.right-pane-dock')
			return document.querySelectorAll('.right-pane-toggle').length === 1 && command.parentElement === dock
				&& !!(document.querySelector('#notifications').compareDocumentPosition(dock)
					& Node.DOCUMENT_POSITION_FOLLOWING)
		}))
		check(prefix('closed icon'), '‹', await page.locator('.right-pane-toggle [aria-hidden]').textContent())
		await shot('folded')
		await activate('#compete')
		check(prefix('competing registration refuses and preserves content'), 'PaneOccupiedError', await state())
		await activate('.right-pane-toggle')
		check(prefix('open title'), 'Generic recipe content', await page.locator('#right-pane-title').textContent())
		check(prefix('command before title and reversed'), true, await page.evaluate(() => {
			const command = document.querySelector('.right-pane-toggle')
			return command.nextElementSibling.id === 'right-pane-title'
				&& command.querySelector('[aria-hidden]').textContent === '›'
		}))
		check(prefix('expanded aria'), 'true', await page.locator('.right-pane-toggle').getAttribute('aria-expanded'))
		check(prefix('no document overflow'), true,
			await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		check(prefix('44px command'), true, await page.locator('.right-pane-toggle').evaluate(n => {
			const r = n.getBoundingClientRect()
			return r.width >= 44 && r.height >= 44 && r.bottom <= innerHeight && r.right <= innerWidth
		}))
		if (touch) {
			check(prefix('main inert modal'), [true, 'dialog', 'true'], await page.evaluate(() => [
				document.querySelector('main').inert, document.querySelector('.right-pane').getAttribute('role'),
				document.querySelector('.right-pane').getAttribute('aria-modal')
			]))
			check(prefix('pane fills viewport'), true, await page.locator('.right-pane').evaluate(n => {
				const r = n.getBoundingClientRect()
				return r.x === 0 && r.y === 0 && r.width === innerWidth && r.height === innerHeight
			}))
			await page.keyboard.press('Shift+Tab')
			check(prefix('reverse tab traps at last control'), 'pane-suspend',
				await page.evaluate(() => document.activeElement.id))
			await page.keyboard.press('Tab')
			check(prefix('forward tab traps at command'), true, await commandFocus())
		}
		else {
			check(prefix('main shrinks'), true, (await page.locator('main').boundingBox()).width < fullWidth)
			await activate('#main-action')
			check(prefix('desktop main interactive'), '1', await page.locator('#main-result').textContent())
			await page.locator('main').hover()
			await page.mouse.wheel(180, 220)
			await page.waitForTimeout(150)
			check(prefix('main scrolls both axes'), true,
				await page.locator('main').evaluate(n => n.scrollTop > 0 && n.scrollLeft > 0))
			await page.locator('.right-pane-toggle').click()
			await page.keyboard.press('Tab')
			await page.keyboard.press('Shift+Tab')
			check(prefix('visible keyboard outline'), true, await page.locator('.right-pane-toggle').evaluate(n =>
				n.matches(':focus-visible') && getComputedStyle(n).outlineStyle !== 'none'))
			await page.keyboard.press('Enter')
			check(prefix('keyboard Enter opens'), true, await visible())
		}
		await page.locator('#recipe-search').click()
		await page.keyboard.press('ControlOrMeta+A')
		await page.keyboard.type('independent retained value')
		const crumb = page.locator('nav[aria-label="Example breadcrumb"]')
		if (touch) {
			const cdp = await context.newCDPSession(page)
			const box = await crumb.boundingBox()
			const x = box.x + box.width - 12, y = box.y + box.height / 2
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
			for (let i = 1; i <= 10; i ++)
				await cdp.send('Input.dispatchTouchEvent', {
					type: 'touchMove', touchPoints: [{ x: x - i * 18, y }]
				})
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
			await page.waitForTimeout(200)
			check(prefix('touch long breadcrumb accessible'), true, await crumb.evaluate(n => n.scrollLeft > 0))
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
			check(prefix('cancellation keeps pane open'), true, await visible())
			await cdp.detach()
		}
		else {
			await crumb.hover()
			await page.mouse.wheel(210, 0)
			await page.waitForTimeout(150)
			check(prefix('mouse long breadcrumb accessible'), true, await crumb.evaluate(n => n.scrollLeft > 0))
		}
		if (touch) {
			const cdp = await context.newCDPSession(page)
			const box = await page.locator('#right-pane-content').boundingBox()
			const x = box.x + box.width / 2, y = Math.min(box.y + box.height - 20, height - 20)
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
			for (let i = 1; i <= 8; i ++)
				await cdp.send('Input.dispatchTouchEvent', {
					type: 'touchMove', touchPoints: [{ x, y: y - i * 20 }]
				})
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
			await cdp.detach()
		}
		else {
			await page.locator('#right-pane-content').hover()
			await page.mouse.wheel(0, 260)
		}
		await page.waitForTimeout(touch ? 1200 : 200)
		const scroll = await page.locator('#right-pane-content').evaluate(n => n.scrollTop)
		check(prefix('content scroll exists'), true, scroll > 0)
		await shot('open')
		await activate('.right-pane-toggle')
		check(prefix('explicit close folds and focuses command'), [false, true], [await visible(), await commandFocus()])
		await activate('.right-pane-toggle')
		check(prefix('reopen preserves value'), 'independent retained value',
			await page.locator('#recipe-search').inputValue())
		check(prefix('reopen preserves scroll'), scroll,
			await page.locator('#right-pane-content').evaluate(n => n.scrollTop))
		// Fixture contract controls use only the documented public API; UI gestures above use trusted browser input.
		await page.evaluate(() => {
			window.originalContent = document.querySelector('#recipe-search').closest('section')
			window.tokens = [window.paneRecipe.handle.suspend(), window.paneRecipe.handle.suspend()]
			window.tokens[0].restore()
		})
		check(prefix('nested token still folded'), false, await visible())
		await page.evaluate(() => window.tokens[1].restore())
		check(prefix('final restore opens same content'), true, await page.evaluate(() =>
			document.querySelector('#recipe-search').closest('section') === window.originalContent))
		check(prefix('restore avoids search focus'), false, await page.locator('#recipe-search').evaluate(n =>
			n === document.activeElement))
		check(prefix('restore scroll retained'), scroll,
			await page.locator('#right-pane-content').evaluate(n => n.scrollTop))
		await page.keyboard.press('Escape')
		check(prefix('Escape folds and focuses'), [false, true], [await visible(), await commandFocus()])
		check(prefix('inert cleared on close'), false, await page.locator('main').evaluate(n => n.inert))
		await page.evaluate(() => {
			window.retired = window.paneRecipe.handle
			window.stale = window.retired.suspend()
			window.retired.remove()
			window.stale.restore()
		})
		check(prefix('removal hides command clears title/content'), [false, '', 0], [
			await page.locator('.right-pane-toggle').isVisible(), await page.locator('#right-pane-title').textContent(),
			await page.locator('#right-pane-content > *').count()
		])
		await activate('#register')
		await page.evaluate(() => { window.retired.open(); window.retired.remove(); window.stale.restore() })
		check(prefix('stale handle cannot reopen/remove successor'), [true, false], [
			await page.locator('.right-pane-toggle').isVisible(), await visible()
		])
		await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
		await activate('.right-pane-toggle')
		check(prefix('reduced motion'), '0s', await page.locator('.right-pane').evaluate(n =>
			getComputedStyle(n).transitionDuration))
		check(prefix('theme contrast'), true, await page.locator('.right-pane').evaluate(n => {
			const luminance = colour => {
				const rgb = colour.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
					v /= 255
					return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
				})
				return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
			}
			const s = getComputedStyle(n), a = luminance(s.color), b = luminance(s.backgroundColor)
			return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5
		}))
		await shot('dark')
		check(prefix('all browser events trusted'), true, await page.evaluate(() =>
			window.trustedInputs.every(event => event.trusted)))
		if (touch) check(prefix('touch movement and cancellation transported'), true, await page.evaluate(() =>
			window.trustedInputs.some(e => e.type === 'touchmove')
				&& window.trustedInputs.some(e => e.type === 'touchcancel')
				&& window.trustedInputs.some(e => e.pointerType === 'touch')))
		results.modes.push({ mode, width, height, hasTouch: touch, isMobile: touch,
			inputs: await page.evaluate(() => window.trustedInputs) })
		await page.reload()
		await page.waitForFunction(() => !!window.paneRecipe)
		check(prefix('fresh reload empty'), false, await page.locator('.right-pane-toggle').isVisible())
		if (mode === 'desktop') {
			await activate('#register')
			await activate('.right-pane-toggle')
			await activate('#main-action')
			await page.setViewportSize({ width: 390, height: 844 })
			await page.waitForFunction(() => document.querySelector('main').inert)
			check('resize: modal and focus moved from hidden main', [true, true], await page.evaluate(() => [
				document.querySelector('main').inert, document.querySelector('.right-pane').contains(document.activeElement)
			]))
			await page.setViewportSize({ width: 768, height: 900 })
			await page.waitForFunction(() => !document.querySelector('main').inert)
			check('resize: main restored and pane retained', [false, true], [
				await page.locator('main').evaluate(n => n.inert), await visible()
			])
			const lifecycle = await page.evaluate(() => {
				const pane = window.paneRecipe.pane
				window.paneRecipe.handle.remove()
				const owner = {}, first = document.createElement('section'), second = document.createElement('section')
				first.textContent = 'Arbitrary verifier content'
				second.innerHTML = '<button>Independent content action</button>'
				const handle = pane.register(owner, first, 'Initial title')
				const states = [], unsubscribe = handle.subscribe(state => states.push(state))
				const sameHandle = pane.register(owner, second, 'Updated title') === handle
				const title = document.querySelector('#right-pane-title').textContent
				handle.open()
				let occupied
				try { pane.register(owner, first, 'Forbidden update') }
				catch (error) { occupied = error.name }
				const token = handle.suspend()
				handle.close()
				token.restore()
				token.restore()
				const explicitCloseRetained = document.querySelector('.right-pane').hidden
				handle.remove()
				const final = states.at(-1)
				unsubscribe()
				return { explicitCloseRetained, final, occupied, sameHandle, title }
			})
			check('public contract: inactive replacement / active refusal / explicit suspended close / final removal', {
				explicitCloseRetained: true, final: { present: false, open: false, suspended: false },
				occupied: 'PaneOccupiedError', sameHandle: true, title: 'Updated title'
			}, lifecycle)
			await page.evaluate(() => window.paneRecipe.pane.dispose())
			check('dispose: no orphan content/command', [false, 0], [
				await page.locator('.right-pane-toggle').isVisible(),
				await page.locator('#right-pane-content > *').count()
			])
		}
		await context.close()
	}
	check('network and browser health', [], results.health)
	results.verdict = 'PASS'
}
catch (error) {
	results.verdict = 'FAIL'
	results.error = String(error.stack)
	throw error
}
finally {
	writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n')
	await browser.close()
	console.log(`${results.verdict}: ${results.assertions.length} assertions; ${output}/results.json`)
}
