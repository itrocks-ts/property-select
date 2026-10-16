import assert             from 'node:assert/strict'
import { setImmediate }   from 'node:timers/promises'
import test               from 'node:test'
import { PropertySelect } from '@itrocks/property-select'
import { graphProvider }  from './fixtures/search-graph.mjs'
import { largeGraph }     from './fixtures/search-graph.mjs'

async function settle(selector)
{
	for (let attempt = 0; selector.search.status === 'loading' && attempt < 1000; attempt ++)
		await setImmediate()
	assert.notEqual(selector.search.status, 'loading')
}

test('large catalogue stays lazy at mount and respects independent work/display budgets', async () => {
	const metadata = graphProvider(largeGraph(1200), () => setImmediate())
	const selector = new PropertySelect({ metadata, root: 'invoice',
		search: { maxContexts: 61, maxDepth: 4, maxPending: 3, maxResults: 23 } })
	await selector.mount()
	assert.equal(metadata.calls.length, 1)
	selector.setQuery('name')
	await settle(selector)
	assert.equal(selector.search.status, 'limited')
	assert.equal(selector.search.visited, 61)
	assert.ok(metadata.peak <= 3)
	assert.ok(selector.search.results.length <= 23)
	assert.equal(new Set(metadata.calls.map(call => call.path)).size, metadata.calls.length)
	const count = metadata.calls.length
	selector.setQuery('branch0 name')
	await settle(selector)
	assert.equal(metadata.calls.length, count)
	selector.dispose()
})

test('repeated disposal aborts pending navigation and selections without late changes or acknowledgements',
	async () => {
	for (let cycle = 0; cycle < 64; cycle ++) {
		const pending = []
		const metadata = graphProvider(undefined, (path, signal) => path ? new Promise(resolve =>
			pending.push({ release: resolve, signal })) : Promise.resolve())
		let complete, signal, begins = 0
		const selector = new PropertySelect({ metadata, root: 'invoice', consumer: {
			select(intent, abort) {
				signal = abort
				return new Promise(resolve => { complete = () => resolve({ ...intent, status: 'added' }) })
			},
			begin() { begins ++ }, cancel() {}, end() {}, move() {}
		} })
		await selector.mount()
		const selected = selector.select('number')
		for (let spin = 0; !complete && spin < 30; spin ++) await setImmediate()
		assert.ok(complete)
		const navigated = selector.navigate('customer')
		await setImmediate()
		let changes = 0
		selector.subscribe(() => { changes ++ })
		selector.dispose()
		const atDisposal = changes
		selector.dispose()
		assert.equal(signal.aborted, true)
		assert.ok(pending.length)
		assert.ok(pending.every(call => call.signal.aborted))
		pending.forEach(call => call.release())
		complete()
		assert.equal(await navigated, false)
		assert.equal(await selected, undefined)
		assert.equal(selector.status, 'disposed')
		assert.deepEqual(selector.snapshot().recent, [])
		assert.equal(changes, atDisposal)
		assert.equal(begins, 0)
	}
})
