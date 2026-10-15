import assert                  from 'node:assert/strict'
import { mkdir, writeFile }     from 'node:fs/promises'
import { createRequire }       from 'node:module'
import { resolve }             from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath }       from 'node:url'

const require = createRequire(import.meta.url)
const modulePath = process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
const { chromium } = require(modulePath)
const output = resolve(process.env.PS_TOUCH_OUTPUT || '/tmp/showtime-property-select-touch')
const url = new URL('./demo/touch-probe.html', import.meta.url).href
const results = []
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })

try {
	await mkdir(output, { recursive: true })
	const context = await browser.newContext({
		hasTouch: true, isMobile: true, viewport: { height: 844, width: 390 }
	})
	const page = await context.newPage()
	const session = await context.newCDPSession(page)
	const errors = []
	page.on('pageerror', error => errors.push(error.message))
	page.on('console', message => {
		if (['error', 'warning'].includes(message.type())) errors.push(message.text())
	})
	await page.goto(url)
	const capabilities = await page.evaluate(() => ({
		coarse: matchMedia('(pointer: coarse)').matches,
		height: innerHeight,
		hover: matchMedia('(hover: hover)').matches,
		maxTouchPoints: navigator.maxTouchPoints,
		width: innerWidth
	}))
	assert.equal(capabilities.coarse, true)
	assert.equal(capabilities.hover, false)
	assert.ok(capabilities.maxTouchPoints > 0)
	assert.equal(capabilities.width, 390)
	assert.equal(capabilities.height, 844)

	async function touch(type, point)
	{
		await session.send('Input.dispatchTouchEvent', {
			type, touchPoints: point ? [{ id: 1, radiusX: 1, radiusY: 1, ...point }] : []
		})
	}

	async function start()
	{
		await page.goto(url)
		const box = await page.locator('#surface').boundingBox()
		assert.ok(box)
		return { x: Math.round(box.x + 40), y: Math.round(box.y + 60) }
	}

	async function observe(name, expected, duration = 0, distance = 0)
	{
		const events = await page.locator('#events').textContent().then(JSON.parse)
		assert.ok(events.length)
		assert.ok(events.every(event => event.trusted), 'Input must be trusted browser input')
		const pointers = events.filter(event => event.type.startsWith('pointer'))
		assert.ok(pointers.every(event => event.pointerType === 'touch'))
		for (const type of expected) assert.ok(events.some(event => event.type === type), `Missing ${type}`)
		const first = pointers.find(event => event.type === 'pointerdown')
		const last = pointers.at(-1)
		const elapsed = last.time - first.time
		const moved = Math.hypot(last.x - first.x, last.y - first.y)
		assert.ok(elapsed >= duration, `${name}: ${elapsed} ms is shorter than ${duration} ms`)
		assert.ok(moved >= distance, `${name}: ${moved} px is shorter than ${distance} px`)
		if (name === 'long-press') assert.ok(moved < 2, 'A hold must remain stationary')
		await page.screenshot({ path: `${output}/${name}.png` })
		results.push({ duration: elapsed, events, moved, name, verdict: 'PASS' })
	}

	let point = await start()
	await page.touchscreen.tap(point.x, point.y)
	await observe('tap', ['pointerdown', 'pointerup', 'touchstart', 'touchend'])

	point = await start()
	await touch('touchStart', point)
	await delay(750)
	await touch('touchEnd')
	await observe('long-press', ['pointerdown', 'pointerup', 'touchstart', 'touchend'], 700)

	point = await start()
	await touch('touchStart', point)
	await delay(750)
	for (let step = 1; step <= 10; step ++) {
		await touch('touchMove', { x: point.x + step * 20, y: point.y + step * 3 })
		await delay(25)
	}
	await touch('touchEnd')
	await observe('drag', ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend'], 700, 190)

	point = await start()
	await touch('touchStart', point)
	await touch('touchCancel')
	await observe('cancel', ['pointerdown', 'pointercancel', 'touchstart', 'touchcancel'])

	await page.setViewportSize({ height: 390, width: 844 })
	point = await start()
	await page.touchscreen.tap(point.x, point.y)
	await observe('landscape-tap', ['pointerdown', 'pointerup', 'touchstart', 'touchend'])
	assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [844, 390])
	assert.deepEqual(errors, [])
	const report = {
		browser: browser.version(), capabilities, errors,
		fixture: fileURLToPath(url), playwright: require(`${modulePath}/package.json`).version,
		results, timestamp: new Date().toISOString(), verdict: 'PASS'
	}
	await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2) + '\n')
	console.log(JSON.stringify({
		browser: report.browser, capabilities, output, playwright: report.playwright,
		results: results.map(({ duration, moved, name, verdict }) => ({ duration, moved, name, verdict })),
		verdict: report.verdict
	}, null, 2))
}
finally {
	await browser.close()
}
