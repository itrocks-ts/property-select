import { createReadStream } from 'node:fs'
import { createServer }     from 'node:http'
import { fileURLToPath }    from 'node:url'

const port = Number(process.argv[3]?.slice('--ps-port='.length))
if (!process.argv[2]?.startsWith('--ps-environment=') || !process.argv[3]?.startsWith('--ps-port='))
	throw new Error('Launch through control.mjs standalone')

// Explicit public runtime outputs only; source, test, server and host adapters cannot be requested.
const assets = new Map([
	['/', new URL('./demo/index.html', import.meta.url)],
	['/catalogue.js', new URL('./demo/catalogue.js', import.meta.url)],
	['/demo.js', new URL('./demo/demo.js', import.meta.url)],
	['/state-fixture', new URL('./demo/state.html', import.meta.url)],
	['/state-fixture.js', new URL('./demo/state.js', import.meta.url)],
	['/search-fixture', new URL('./demo/search.html', import.meta.url)],
	['/search-fixture.js', new URL('./demo/search.js', import.meta.url)],
	['/search-graph.js', new URL('../../../test/fixtures/search-graph.mjs', import.meta.url)]
])
for (const name of [
	'controller.js', 'front/property-select.css', 'front/property-select.html', 'front/property-select.js',
	'intentions.js', 'metadata.js', 'navigation.js', 'path.js', 'ports.js', 'property-select.js', 'search.js',
	'state.js', 'suggestions.js'
])
	assets.set(`/assets/${name}`, new URL(`../../../${name}`, import.meta.url))

// Generic table fixture is a separate consumer of public table/plugin browser entries.
assets.set('/table-fixture', new URL('../../../../table/demo/column-add.html', import.meta.url))
for (const name of ['column-add.css', 'column-add.js', 'column-reorder.js', 'column-reorder-freeze.js',
	'freeze.js', 'table.js', 'demo/column-add.css', 'demo/column-add.js'])
	assets.set(`/itrocks/table/${name}`, new URL(`../../../../table/${name}`, import.meta.url))
assets.set('/itrocks/plugin/plugin.js', new URL('../../../../plugin/plugin.js', import.meta.url))

createServer((request, response) => {
	let pathname
	try {
		pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
	}
	catch {
		response.writeHead(400).end()
		return
	}
	const asset = assets.get(pathname)
	if (!asset || request.method !== 'GET') {
		response.writeHead(404).end()
		return
	}
	const file = fileURLToPath(asset)
	response.setHeader('Cache-Control', 'no-store')
	response.setHeader('X-Content-Type-Options', 'nosniff')
	response.setHeader('Content-Type', (file.endsWith('.js') || file.endsWith('.mjs')) ? 'text/javascript'
		: file.endsWith('.css') ? 'text/css' : 'text/html')
	createReadStream(file).on('error', () => response.writeHead(404).end()).pipe(response)
}).listen(port, '127.0.0.1', () => console.log(`Standalone selector: http://127.0.0.1:${port}`))
