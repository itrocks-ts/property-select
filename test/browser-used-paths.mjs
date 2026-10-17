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
				return { label: 'Example', path, properties: path === 'child.child'
					? [{ ...name, path: 'child.child.name' }] : path ? [{ ...name, path: 'child.name' },
					{ ...note, path: 'child.note' }, { ...child, path: 'child.child' }]
					: [child, name, note], type: 'Example' }
			},
			async resolve(_root, path) { return path === 'child' ? child : { ...name, path } }
		}
		const host = document.querySelector('#host')
		const view = new PropertySelectView(host, {
			metadata, root: 'example', translate: text => ({ Name: 'Zulu', Note: 'Alpha' })[text] || text,
			usedPaths: ['name', 'child.name', 'child.note', ['child', 'name'], 'child.child', 'child.child.name', 'missing.name']
		})
		const marked = () => [...host.querySelectorAll('.ps-used')].map(row => row.dataset.path)
		try {
			await view.mount()
			check('configured nested columns are highlighted once after direct properties', marked(),
				['name', 'child.note', 'child.child', 'child.child.name', 'child.name'])
			check('nested columns follow direct properties and use translated alphabetical order',
				[...host.querySelectorAll('.ps-property')].map(row =>
					[...row.querySelectorAll('button:not(.ps-add)')].map(button => button.textContent).join('')),
				['Child›', 'Name', 'Note', 'Child › Alpha', 'Child › Child›', 'Child › Child › Zulu', 'Child › Zulu'])
			const selected = []
			view.selector.subscribe(event => { if (event.type === 'select') selected.push(event.intent.path) })
			host.querySelector('[data-path="child.note"] .ps-main').click()
			while (!selected.length) await new Promise(resolve => setTimeout(resolve, 0))
			check('extra terminal rows select their full path', [...selected], ['child.note'])
			view.selector.setQuery('unmatched')
			while (view.selector.search.status === 'loading') await new Promise(resolve => setTimeout(resolve, 0))
			check('configured columns are not injected into search results', marked(), [])
			view.selector.setQuery('')
			await view.selector.navigate('child')
			check('nested contexts only show their own properties',
				[...host.querySelectorAll('.ps-property')].map(row => row.dataset.path),
				['child.child', 'child.name', 'child.note'])
			await view.selector.navigate('')
			view.selector.setConfiguration({ usedPaths: ['name'] })
			check('removing nested configured paths clears their highlights', marked(), ['name'])
			check('removed nested columns remain available at the root',
				!!host.querySelector('.ps-property[data-path="child.name"]:not(.ps-used)'), true)
			const retained = host.querySelector('.ps-property[data-path="child.name"]')
			retained.querySelector('.ps-main').click()
			while (selected.length < 2) await new Promise(resolve => setTimeout(resolve, 0))
			check('retained nested rows remain selectable', selected[1], 'child.name')
			await view.selector.refresh()
			check('refresh removes unused temporary root rows',
				!!host.querySelector('.ps-property[data-path="child.name"]'), false)
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
			view.selector.setQuery('')
			while (!host.querySelector('.ps-property[data-path="child.name"]'))
				await new Promise(resolve => setTimeout(resolve, 0))
			check('configuration changes resolve new root rows', marked(), ['child.name'])
			host.querySelector('.ps-property[data-path="child.name"] .ps-check').click()
			while (selected.length < 3) await new Promise(resolve => setTimeout(resolve, 0))
			check('extra row checkbox selects the full configured path', selected[2], 'child.name')
			view.selector.setQuery('name')
			while (view.selector.search.status === 'loading') await new Promise(resolve => setTimeout(resolve, 0))
			view.selector.setConfiguration({ usedPaths: [] })
			check('removing all columns clears highlights in search results', marked(), [])
			view.selector.setQuery('')
			check('search discards temporary root rows',
				!!host.querySelector('.ps-property[data-path="child.name"]'), false)
			view.selector.setConfiguration({ usedPaths: ['child.name'] })
			while (!host.querySelector('.ps-property[data-path="child.name"]'))
				await new Promise(resolve => setTimeout(resolve, 0))
			view.selector.setConfiguration({ usedPaths: [] })
			check('removed root row remains until a transition',
				!!host.querySelector('.ps-property[data-path="child.name"]'), true)
			const count = selected.length
			host.querySelector('.ps-property[data-path="child.name"] [data-path="child"]').click()
			while (view.selector.status === 'loading') await new Promise(resolve => setTimeout(resolve, 0))
			check('retained row intermediate segment still navigates', view.selector.path, 'child')
			check('intermediate navigation does not select a property', selected.length, count)
			await view.selector.navigate('')
			check('navigation discards temporary root rows',
				!!host.querySelector('.ps-property[data-path="child.name"]'), false)
			check('temporary rows never enter exported state',
				Object.keys(view.selector.snapshot()).sort(),
				['branch', 'current', 'query', 'recent', 'scroll', 'version'])

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
