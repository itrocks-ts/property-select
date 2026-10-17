import assert            from 'node:assert/strict'
import { readFile }      from 'node:fs/promises'
import { createServer }  from 'node:http'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const server = createServer(async (request, response) => {
	const path = new URL(request.url, 'http://localhost').pathname
	if (path === '/') {
		response.setHeader('Content-Type', 'text/html')
		response.end('<!doctype html><link rel="stylesheet" href="/front/property-select.css"><div id="host"></div>')
		return
	}
	if (!/^\/(?:front\/)?[\w-]+\.(?:css|html|js)$/.test(path)) {
		response.writeHead(404).end()
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
	const page = await browser.newPage()
	await page.goto(`http://127.0.0.1:${server.address().port}/`)
	const assertions = await page.evaluate(async () => {
		const { PropertySelectView } = await import('/front/property-select.js')
		const assertions = []
		const check = (name, actual, expected) => assertions.push({ name, actual, expected })
		const name = { kind: 'terminal', label: 'Name', name: 'name', order: 0, path: 'name' }
		const note = { ...name, label: 'Note', name: 'note', order: 1, path: 'note' }
		const child = { kind: 'relation', label: 'Child', name: 'child', order: 2, path: 'child', target: 'Child' }
		const metadata = {
			async context(_root, path) {
				return { label: 'Example', path, properties: path ? [{ ...name, path: 'child.name' }]
					: [child, name, note], type: 'Example' }
			},
			async resolve(_root, path) { return path === 'child' ? child : { ...name, path } }
		}
		const host = document.querySelector('#host')
		const view = new PropertySelectView(host, { metadata, root: 'example', usedPaths: ['name'] })
		const marked = () => [...host.querySelectorAll('.ps-used')].map(row => row.dataset.path)
		try {
			await view.mount()
			check('configured properties are marked on mount', marked(), ['name'])
			const row = host.querySelector('.ps-property[data-path="name"]')
			const unused = host.querySelector('.ps-property[data-path="note"]')
			check('configured properties have a distinct background',
				getComputedStyle(row).backgroundColor !== getComputedStyle(unused).backgroundColor, true)
			row.querySelector('.ps-main').focus()
			const focused = document.activeElement
			const suggestions = view.selector.suggestions
			view.selector.setConfiguration({ usedPaths: ['note'] })
			check('unchanged suggestions do not hide configuration updates', view.selector.suggestions, suggestions)
			check('configuration updates replace the previous highlight', marked(), ['note'])
			check('configuration updates preserve focus', document.activeElement === focused, true)
			view.selector.setConfiguration({ usedPaths: ['child', ['child', 'name']] })
			check('configured relation itself is marked', marked(), ['child'])
			await view.selector.navigate('child')
			check('nested configured properties are marked after navigation', marked(), ['child.name'])
			view.selector.setConfiguration({ usedPaths: ['name'] })
			check('matching a name in another context does not mark a nested property', marked(), [])
			await view.selector.navigate('')
			view.selector.setConfiguration({ usedPaths: ['child.name'] })
			view.selector.setQuery('name')
			while (view.selector.search.status === 'loading')
				await new Promise(resolve => setTimeout(resolve, 0))
			check('search highlights exact full paths', marked(), ['child.name'])
			view.selector.setConfiguration({ usedPaths: [] })
			check('removing all columns clears highlights in search results', marked(), [])
		}
		finally { view.dispose() }
		return assertions
	})
	for (const { name, actual, expected } of assertions)
		assert.deepEqual(actual, expected, name)
	console.log(`PASS ${assertions.length} used-path browser assertions`)
}
finally {
	await browser?.close()
	await new Promise(resolve => server.close(resolve))
}
