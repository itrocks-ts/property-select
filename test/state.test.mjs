import { PropertySelect }        from '@itrocks/property-select'
import { StateConflictError }    from '@itrocks/property-select'
import { validateSelectorState } from '@itrocks/property-select'
import assert                    from 'node:assert/strict'
import test                      from 'node:test'
import { recordingConsumer }     from './fixtures/static-graph.mjs'
import { staticProvider }        from './fixtures/static-graph.mjs'

const tick = () => new Promise(resolve => setTimeout(resolve, 15))
function memoryStore()
{
	const records = new Map()
	return {
		records,
		async read(key) { return structuredClone(records.get(key) ?? { revision: 0 }) },
		async write(key, state, revision) {
			if ((records.get(key)?.revision ?? 0) !== revision) throw new StateConflictError()
			const result = { revision: revision + 1, state: structuredClone(state) }
			records.set(key, result)
			return structuredClone(result)
		},
		async remove(key, revision) {
			if ((records.get(key)?.revision ?? 0) !== revision) throw new StateConflictError()
			const result = { revision: revision + 1 }
			records.set(key, result)
			return result
		}
	}
}
const options = extra => ({ metadata: staticProvider(), root: 'invoice', ...extra })

test('T04/T14/T15: maximal used branches, recent ancestors, exact shortcuts and confirmed additions', async () => {
	const selector = new PropertySelect(options({ consumer: recordingConsumer(),
		usedPaths: ['customer.name', 'customer.address.city.name', 'tags.name', 'lines.description'],
		advice: ['customer.address', 'tags', 'missing'], suggestionLimit: 6, translate: label => `Label:${label}` }))
	await selector.mount()
	assert.deepEqual(selector.suggestions.map(item => item.path),
		['customer.address.city', 'tags', 'lines', 'customer.address'])
	assert.equal(selector.suggestions[0].label, 'Label:customer.Label:address.Label:city')
	await selector.select('customer.name')
	await tick()
	assert.deepEqual(selector.suggestions.map(item => item.path),
		['customer', 'customer.address.city', 'tags', 'lines', 'customer.address'])
	await selector.navigate('customer.address.city.country')
	selector.setQuery('code')
	await selector.shortcut('customer')
	assert.deepEqual(selector.snapshot().branch, ['customer'])
	assert.equal(selector.snapshot().query, '')
	selector.setConfiguration({ usedPaths: ['lines.description'], advice: ['tags'] })
	await tick()
	assert.deepEqual(selector.suggestions.map(item => item.path), ['customer', 'lines', 'tags'])
	selector.dispose()
	const limited = new PropertySelect(options({ advice: ['customer', 'tags', 'lines'], suggestionLimit: 2 }))
	await limited.mount()
	assert.deepEqual(limited.suggestions.map(item => item.path), ['customer', 'tags'])
	limited.dispose()
	for (const status of ['existing', 'moved', 'cancelled', 'rejected']) {
		const other = new PropertySelect(options({ consumer: recordingConsumer(status) }))
		await other.mount()
		await other.select('customer.name')
		assert.deepEqual(other.snapshot().recent, [])
		other.dispose()
	}
})

test('T16/T17: restore deep remembered branch, current/query/scroll and discard obsolete metadata', async () => {
	const store = memoryStore()
	const settings = { stateMode: 'session', stateKey: '/invoices/list', stateStore: store }
	const first = new PropertySelect(options({ ...settings, consumer: recordingConsumer() }))
	await first.mount()
	await first.navigate('customer.address.city.country')
	await first.navigate('customer.address')
	first.setQuery('code')
	first.setScroll('properties:customer.address:code', { left: 0, top: 125 })
	await first.select('customer.name')
	await tick()
	await first.flushState()
	const saved = first.snapshot()
	first.dispose()
	const second = new PropertySelect(options(settings))
	await second.mount()
	assert.deepEqual(second.snapshot(), saved)
	assert.equal(second.path, 'customer.address')
	assert.deepEqual(second.branchContexts.map(context => [context.path, context.label]), [
		['', 'Invoice'], ['customer', 'Customer'], ['customer.address', 'Address'],
		['customer.address.city', 'City'], ['customer.address.city.country', 'Country']
	])
	const provider = staticProvider()
	const context = provider.context.bind(provider)
	provider.context = async (...args) => {
		const value = await context(...args)
		if (args[1] === 'customer') value.properties = value.properties.filter(property => property.name !== 'address')
		return value
	}
	const invalidated = new PropertySelect({ ...options(settings), metadata: provider })
	await invalidated.mount()
	assert.deepEqual(invalidated.snapshot().branch, ['customer'])
	assert.equal(invalidated.path, 'customer')
	assert.equal(invalidated.snapshot().query, 'code')
	second.dispose()
	invalidated.dispose()
	const isolated = new PropertySelect(options({ ...settings, stateKey: '/other/list' }))
	await isolated.mount()
	assert.equal(isolated.path, '')
	assert.deepEqual(isolated.snapshot().recent, [])
	isolated.dispose()
})

test('state conflicts reapply the newest local snapshot; storage failure retains state and retries', async () => {
	const store = memoryStore()
	const selector = new PropertySelect(options({ stateMode: 'session', stateKey: 'key', stateStore: store }))
	await selector.mount()
	await selector.flushState()
	const external = await store.read('key')
	await store.write('key', { ...external.state, query: 'external' }, external.revision)
	selector.setQuery('local')
	await selector.flushState()
	assert.equal((await store.read('key')).state.query, 'local')
	const write = store.write
	store.write = async () => { throw new Error('Disk full') }
	selector.setQuery('retained')
	await assert.rejects(selector.flushState(), /Disk full/)
	assert.equal(selector.snapshot().query, 'retained')
	assert.match(selector.persistenceError.message, /Disk full/)
	store.write = write
	await selector.flushState()
	assert.equal((await store.read('key')).state.query, 'retained')
	assert.equal(selector.persistenceError, undefined)
	const beforeRemove = await store.read('key')
	const removed = await store.remove('key', beforeRemove.revision)
	assert.equal(removed.revision, beforeRemove.revision + 1)
	await assert.rejects(store.write('key', beforeRemove.state, beforeRemove.revision), StateConflictError)
	selector.dispose()
})

test('untrusted state versions, lengths and numeric coordinates are validated before restore', () => {
	assert.equal(validateSelectorState({ version: 2 }), undefined)
	assert.equal(validateSelectorState({ version: 1, branch: Array(100) }), undefined)
	const state = validateSelectorState({ version: 1, branch: ['customer', 'bad.name'], current: 20, query: '',
		recent: ['customer', 'bad..path', ''], scroll: { a: { left: -1, top: 10 }, b: { left: 0, top: NaN } } })
	assert.deepEqual(state.branch, ['customer'])
	assert.equal(state.current, 1)
	assert.deepEqual(state.recent, ['customer'])
	assert.deepEqual(state.scroll, { a: { left: 0, top: 10 } })
})


test('coalesced writes discard intermediate snapshots while an older durable acknowledgement is pending', async () => {
	const store = memoryStore()
	const selector = new PropertySelect(options({ stateMode: 'session', stateKey: 'key', stateStore: store }))
	await selector.mount()
	await selector.flushState()
	const write = store.write
	let release, entered
	const barrier = new Promise(resolve => { release = resolve })
	const started = new Promise(resolve => { entered = resolve })
	const queries = []
	store.write = async (...args) => {
		queries.push(args[1].query)
		if (queries.length === 1) { entered(); await barrier }
		return write(...args)
	}
	selector.setQuery('first')
	await started
	selector.setQuery('intermediate')
	selector.setQuery('latest')
	release()
	await selector.flushState()
	assert.deepEqual(queries, ['first', 'latest'])
	assert.equal(selector.snapshot().query, 'latest')
	assert.equal((await store.read('key')).state.query, 'latest')
	selector.dispose()
})

test('mount, unchanged configuration, reorder and removal reuse metadata without session writes', async () => {
	const metadata = staticProvider()
	let writes = 0
	const selector = new PropertySelect({
		metadata, root: 'invoice', stateMode: 'session', stateKey: 'list',
		stateStore: {
			read: async () => ({ revision: 0 }),
			write: async () => { writes ++; return { revision: writes } },
			remove: async () => ({ revision: 0 })
		},
		usedPaths: ['number', 'customer.name', 'customer.address.city.name']
	})
	await selector.mount()
	assert.equal(writes, 0)
	assert.equal(metadata.calls.filter(call => call.kind === 'resolve').length, 0)
	const before = metadata.calls.length
	selector.setConfiguration({ usedPaths: selector.usedPaths })
	selector.setConfiguration({ usedPaths: [...selector.usedPaths].reverse() })
	await tick()
	selector.setConfiguration({ usedPaths: ['number', 'customer.name'] })
	selector.setScroll('breadcrumb', { left: 0, top: 0 })
	await tick()
	assert.equal(metadata.calls.length, before)
	assert.equal(writes, 0)
	await selector.select('number')
	assert.equal(metadata.calls.length, before)
	selector.dispose()
})
