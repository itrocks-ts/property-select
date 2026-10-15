import { createReadStream } from 'node:fs'
import { createServer } from 'node:http'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const port = Number(process.argv[3]?.slice('--ps-port='.length))
if (!process.argv[2]?.startsWith('--ps-environment=') || !process.argv[3]?.startsWith('--ps-port=')) {
	throw new Error('Launch through control.mjs standalone')
}
const root = fileURLToPath(new URL('./demo/', import.meta.url))
createServer((request, response) => {
	const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
	const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
	if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
		response.writeHead(403).end()
		return
	}
	const contentType = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'
	response.setHeader('Content-Type', contentType)
	createReadStream(file).on('error', () => response.writeHead(404).end()).pipe(response)
}).listen(port, '127.0.0.1', () => console.log(`Standalone support: http://127.0.0.1:${port}`))
