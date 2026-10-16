import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PropertySelect } from '../../../../property-select.js'

// Independent provider and numerical oracles; no author driver or search implementation is imported.
const records = []
function check(name, observed, expected)
{
	assert.deepEqual(observed, expected, name)
	records.push({ name, observed, expected, status: 'PASS' })
}
async function settled(selector)
{
	for (let i = 0; i < 500; i ++) {
		if (!['idle', 'loading'].includes(selector.search.status)) return
		await new Promise(resolve => setTimeout(resolve, 5))
	}
	throw new Error('Search did not settle')
}
function provider(width, latency = 1)
{
	const trace = []
	let pending = 0, peak = 0
	return {
		trace, get peak() { return peak },
		async context(root, path, signal) {
			const call = { path, aborted: false }
			trace.push(call)
			peak = Math.max(peak, ++ pending)
			await new Promise(resolve => setTimeout(resolve, latency))
			pending --
			call.aborted = !!signal?.aborted
			const relation = name => ({ name, label: name, path: path ? `${path}.${name}` : name,
				order: Number(name.replace('edge', '')) || 0, kind: 'relation', target: 'Node',
				relation: { id: `Node.${name}`, cardinality: 'unknown' } })
			return { path, type: path ? 'Node' : 'Root', label: path || 'Root', properties: [
				{ kind: 'terminal', label: 'Name', name: 'name', order: -1,
					path: path ? `${path}.name` : 'name' },
				...Array.from({ length: width }, (_, i) => relation(`edge${i}`))
			] }
		},
		async resolve() { throw new Error('Search must not resolve business values') }
	}
}
for (const [name, limits, contexts, results] of [
	['depth', { maxDepth: 1, maxContexts: 100, maxPending: 2, maxResults: 100 }, 5, 5],
	['contexts', { maxDepth: 9, maxContexts: 7, maxPending: 3, maxResults: 100 }, 7, 7],
	['results', { maxDepth: 9, maxContexts: 100, maxPending: 2, maxResults: 3 }, 5, 3]
]) {
	const metadata = provider(4)
	const selector = new PropertySelect({ metadata, root: 'r', search: limits })
	await selector.mount()
	selector.setQuery('name')
	await settled(selector)
	check(`${name}: visited hard ceiling`, selector.search.visited, contexts)
	check(`${name}: visible result ceiling`, selector.search.results.length, results)
	check(`${name}: pending ceiling`, metadata.peak <= limits.maxPending, true)
	check(`${name}: limited is explicit`, selector.search.status, 'limited')
	check(`${name}: depth ceiling`, metadata.trace.every(call =>
		call.path.split('.').filter(Boolean).length <= limits.maxDepth), true)
	check(`${name}: unique path identity`, new Set(selector.search.results.map(x => x.property.path)).size, results)
	selector.dispose()
}
const metadata = provider(3, 60)
const selector = new PropertySelect({ metadata, root: 'r', search: { maxDepth: 2 } })
await selector.mount()
selector.setQuery('name')
await new Promise(resolve => setTimeout(resolve, 10))
selector.setQuery('absent')
await settled(selector)
check('Ignored abort cannot publish old results', selector.search.results, [])
check('Old provider work actually completed after abort', metadata.trace.some(call => call.aborted), true)
selector.setQuery('name')
selector.dispose()
await new Promise(resolve => setTimeout(resolve, 100))
check('Disposal invalidates pending generation', selector.search.status, 'idle')
const output = process.env.PS_V3_OUTPUT || new URL('../../evidence/V3/', import.meta.url)
mkdirSync(output, { recursive: true })
writeFileSync(typeof output === 'string' ? resolve(output, 'bounds.json') : new URL('bounds.json', output),
	JSON.stringify({ status: 'PASS', records }, null, 2))
console.log(JSON.stringify({ status: 'PASS', checks: records.length }))
