import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

const modulePath = process.env.PS_PLAYWRIGHT_MODULE
if (!modulePath)
	throw new Error('Set PS_PLAYWRIGHT_MODULE to the installed playwright module; no download is performed')
const { chromium } = await import(modulePath)
const assets = new Set(['controller.js', 'intentions.js', 'metadata.js', 'navigation.js', 'path.js', 'ports.js',
	'property-select.js', 'search.js'])
const server = createServer(async (request, response) => {
	const name = new URL(request.url, 'http://localhost').pathname.slice(1)
	if (!name) {
		response.setHeader('Content-Type', 'text/html')
		response.end('<!doctype html><title>Property selector public import smoke</title>')
		return
	}
	if (!assets.has(name)) {
		response.writeHead(404).end()
		return
	}
	response.setHeader('Content-Type', 'text/javascript')
	response.end(await readFile(new URL(`../${name}`, import.meta.url)))
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
	browser = await chromium.launch({ chromiumSandbox: true, headless: true })
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', error => errors.push(error.message))
	await page.goto(`http://127.0.0.1:${server.address().port}/`)
	const observed = await page.evaluate(async () => {
		const { PropertySelect, normalisePath } = await import('/property-select.js')
		const property = { kind: 'terminal', label: 'Name', name: 'name', order: 0, path: 'name' }
		const metadata = {
			async context() { return { label: 'Example', path: '', properties: [property], type: 'Example' } },
			async resolve() { return property }
		}
		const selector = new PropertySelect({ metadata, root: 'example', stateMode: 'instance' })
		const intentions = []
		selector.subscribe(event => { if (event.type === 'select') intentions.push(event.intent.path) })
		await selector.mount()
		await selector.select(['name'])
		const result = {
			context: selector.context.path,
			intentions,
			path: normalisePath(['customer', 'name']),
			recent: selector.snapshot().recent
		}
		selector.dispose()
		return result
	})
	assert.deepEqual(observed, { context: '', intentions: ['name'], path: 'customer.name', recent: [] })
	assert.deepEqual(errors, [])
	console.log(JSON.stringify({ browser: browser.version(), module: fileURLToPath(new URL('../property-select.js',
		import.meta.url)), observed, errors, status: 'PASS' }, null, 2))
}
finally {
	await browser?.close()
	await new Promise(resolve => server.close(resolve))
}
