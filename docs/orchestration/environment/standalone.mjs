import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = process.env.PS_ENV_DIRECTORY || '/tmp/showtime-property-select-env'
const port = Number(process.env.PS_STANDALONE_PORT || 13318)
const root = fileURLToPath(new URL('./demo/', import.meta.url))
mkdirSync(directory, { recursive: true })
writeFileSync(`${directory}/standalone.pid`, String(process.pid))
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
