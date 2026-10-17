import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { PropertySelect, normalisePath } from '@itrocks/property-select'
import { recordingConsumer, staticProvider } from './fixtures/static-graph.mjs'

const options = (extra = {}) => ({ metadata: staticProvider(), root: 'invoice', stateMode: 'instance', ...extra })
const sample = { clientX: 12, clientY: 34, pointerId: 1, pointerType: 'mouse' }
const deferred = () => {
	let resolve
	const promise = new Promise(done => { resolve = done })
	return { promise, resolve }
}

test('T01: public CJS and browser facades agree; missing provider and invalid paths are explicit', async () => {
	const require = createRequire(import.meta.url)
	assert.equal(typeof require('@itrocks/property-select').PropertySelect, 'function')
	assert.equal(normalisePath('Customer.address'), normalisePath(['Customer', 'address']))
	assert.equal(normalisePath([]), '')
	for (const path of ['.customer', 'customer.', 'customer..name', ['customer.name'], [''], null, [' a'], Array(2)])
		assert.throws(() => normalisePath(path), TypeError)
	assert.throws(() => new PropertySelect({ root: 'invoice' }), /metadata provider/)
	assert.throws(() => new PropertySelect(options({ stateMode: 'session' })), /Session persistence/)
	const selector = new PropertySelect(options())
	assert.deepEqual(selector.usedPaths, [])
	assert.deepEqual(selector.advice, [])
	assert.equal(selector.translate('Add'), 'Add')
	assert.equal(await selector.mount(), true)
	assert.equal(selector.context.path, '')
	await assert.rejects(selector.select(''), /root/)
	await assert.rejects(selector.begin([], sample), /root/)
	const errors = []
	selector.subscribe(event => event.type === 'error' && errors.push(event.error))
	assert.equal(await selector.navigate('number.invalid'), false)
	assert.equal(await selector.navigate('unknown'), false)
	assert.equal(selector.path, '')
	assert.equal(await selector.select('customer.name.invalid'), undefined)
	assert.equal(errors.length, 3)
	selector.dispose()
})

test('T01: observer-only intentions receive unique canonical ids without implicit additions', async () => {
	const selector = new PropertySelect(options())
	const intents = []
	selector.subscribe(event => event.type === 'select' && intents.push(event.intent))
	await selector.select(['customer', 'name'])
	await selector.select('customer.name')
	assert.equal(intents.length, 2)
	assert.notEqual(intents[0].id, intents[1].id)
	assert.equal(intents[0].path, 'customer.name')
	assert.equal(intents[0].root, 'invoice')
	assert.deepEqual(selector.snapshot().recent, [])
	assert.equal(selector.acknowledge({ ...intents[0], status: 'added' }), true)
	assert.deepEqual(selector.snapshot().recent, ['customer'])
	selector.dispose()
})

test('T02: remembered branch survives ancestor, root, and descendant navigation with query and scroll', async () => {
	const metadata = staticProvider()
	const selector = new PropertySelect(options({ metadata }))
	await selector.mount()
	assert.deepEqual(metadata.calls.map(call => call.path), [''])
	selector.setQuery('country code')
	selector.setScroll('properties:customer.address', { left: 10, top: 75 })
	for (const path of ['customer', 'customer.address', 'customer.address.city', 'customer.address.city.country'])
		await selector.activate(path)
	const expected = ['customer', 'address', 'city', 'country']
	await selector.navigate('customer.address')
	assert.equal(selector.snapshot().current, 2)
	await selector.navigate('customer.address.city')
	assert.equal(selector.snapshot().current, 3)
	await selector.navigate('')
	assert.deepEqual(selector.snapshot().branch, expected)
	await selector.activate('customer')
	assert.deepEqual(selector.snapshot().branch, expected)
	assert.equal(selector.snapshot().current, 1)
	assert.equal(selector.snapshot().query, 'country code')
	assert.deepEqual(selector.snapshot().scroll['properties:customer.address'], { left: 10, top: 75 })
	assert.equal(metadata.calls.filter(call => call.path === '').length, 1)
	selector.dispose()
})

test('T03: divergent relation replaces only the suffix', async () => {
	const selector = new PropertySelect(options())
	await selector.navigate('customer.address.city.country')
	await selector.navigate('customer.address')
	await selector.activate('customer.address.country')
	assert.deepEqual(selector.snapshot().branch, ['customer', 'address', 'country'])
	assert.equal(selector.snapshot().current, 3)
	selector.dispose()
})

test('T05 navigation: relation main opens; relation selection and terminal activation keep context/query', async () => {
	const consumer = recordingConsumer()
	const selector = new PropertySelect(options({ consumer }))
	await selector.mount()
	selector.setQuery('name')
	await selector.activate('customer')
	assert.equal(consumer.selected.length, 0)
	const before = selector.snapshot()
	await selector.select('customer.address')
	await selector.activate('customer.name')
	assert.deepEqual(consumer.selected, ['customer.address', 'customer.name'])
	assert.equal(selector.path, 'customer')
	assert.deepEqual(selector.snapshot().branch, before.branch)
	assert.equal(selector.snapshot().current, before.current)
	assert.equal(selector.snapshot().query, before.query)
	selector.dispose()
})

test('PORT-01: provider business ordering, label fallback and snapshot isolation', async () => {
	const metadata = staticProvider()
	const context = metadata.context.bind(metadata)
	metadata.context = async (...args) => {
		const value = await context(...args)
		for (const property of value.properties)
			property.order = 1
		value.properties.reverse()
		return value
	}
	const selector = new PropertySelect(options({ metadata, translate: text => `t:${text}` }))
	await selector.mount()
	assert.deepEqual(selector.context.properties.map(property => property.path), ['customer', 'lines', 'number', 'tags'])
	assert.equal(selector.context.properties[0].label, 'customer')
	assert.equal(selector.translate('Add'), 't:Add')
	selector.context.properties.pop()
	selector.setConfiguration({ advice: [['customer', 'address']], usedPaths: ['number'] })
	assert.deepEqual(selector.advice, ['customer.address'])
	assert.deepEqual(selector.usedPaths, ['number'])
	const snapshot = selector.snapshot()
	snapshot.branch.push('forged')
	assert.deepEqual(selector.snapshot().branch, [])
	assert.deepEqual(JSON.parse(JSON.stringify(selector.snapshot())), selector.snapshot())
	assert.equal(selector.context.properties.length, 4)
	selector.dispose()
})

test('PORT-02: acknowledgements validate identity/path/status; only applied added changes recents', async () => {
	const selector = new PropertySelect(options())
	const intents = []
	const errors = []
	selector.subscribe(event => {
		if (event.type === 'select') intents.push(event.intent)
		if (event.type === 'error') errors.push(event.error)
	})
	for (const status of ['existing', 'removed', 'moved', 'cancelled', 'rejected']) {
		await selector.select('customer.address')
		assert.equal(selector.acknowledge({ ...intents.at(-1), status }), true)
		assert.deepEqual(selector.snapshot().recent, [])
	}
	await selector.select('customer.address')
	const intent = intents.at(-1)
	assert.equal(selector.acknowledge({ ...intent, id: 'forged', status: 'added' }), false)
	assert.equal(selector.acknowledge({ ...intent, path: 'customer', status: 'added' }), false)
	assert.equal(selector.acknowledge({ ...intent, status: 'unknown' }), false)
	assert.equal(selector.acknowledge({ ...intent, status: 'added' }), true)
	assert.equal(selector.acknowledge({ ...intent, status: 'added' }), false)
	assert.deepEqual(selector.snapshot().recent, ['customer.address'])
	assert.equal(errors.length, 5)
	selector.dispose()
	assert.equal(selector.acknowledge({ ...intent, status: 'added' }), false)
})

test('PORT-02: transport contract carries a stable intent with exactly one terminal call', async () => {
	const consumer = recordingConsumer('moved')
	const selector = new PropertySelect(options({ consumer }))
	selector.move('unknown', sample)
	const intent = await selector.begin('customer.address', sample)
	assert.ok(intent)
	await assert.rejects(selector.begin('number', sample), /already active/)
	await selector.navigate('customer.address.city')
	selector.move(intent.id, { ...sample, clientX: 55 })
	await selector.end(intent.id, sample)
	await selector.end(intent.id, sample)
	selector.cancel(intent.id)
	assert.deepEqual(consumer.calls.map(call => call.type), ['begin', 'move', 'end'])
	assert.equal(consumer.calls[0].intent.path, 'customer.address')
	assert.deepEqual(selector.snapshot().recent, [])
	const cancelled = await selector.begin('number', sample)
	selector.cancel(cancelled.id, 'Escape')
	selector.cancel(cancelled.id, 'Escape')
	selector.dispose()
	assert.deepEqual(consumer.calls.slice(3).map(call => call.type), ['begin', 'cancel'])
})

test('PORT-02: disposal cancels transport/selections once and ignores late outcomes', async () => {
	const late = deferred()
	const consumer = recordingConsumer()
	let signal
	consumer.select = (intent, received) => {
		signal = received
		return late.promise
	}
	const selector = new PropertySelect(options({ consumer }))
	let selected
	selector.subscribe(event => { if (event.type === 'select') selected = event.intent })
	const pending = selector.select('customer.name')
	await new Promise(resolve => setImmediate(resolve))
	await selector.begin('customer.address', sample)
	selector.dispose()
	selector.dispose()
	assert.equal(signal.aborted, true)
	assert.equal(consumer.calls.filter(call => call.type === 'cancel').length, 1)
	late.resolve({ ...selected, status: 'added' })
	assert.equal(await pending, undefined)
	assert.deepEqual(selector.snapshot().recent, [])
	assert.throws(() => selector.subscribe(() => {}), /disposed/)
	await assert.rejects(selector.navigate(''), /disposed/)
})

test('PORT-02: out-of-order confirmations belong to their own attempt', async () => {
	const attempts = []
	const consumer = recordingConsumer()
	consumer.select = intent => {
		const result = deferred()
		attempts.push({ intent, result })
		return result.promise
	}
	const selector = new PropertySelect(options({ consumer }))
	const first = selector.select('customer.name')
	const second = selector.select('customer.address.street')
	await new Promise(resolve => setImmediate(resolve))
	attempts[1].result.resolve({ ...attempts[1].intent, status: 'added' })
	await second
	attempts[0].result.resolve({ ...attempts[0].intent, status: 'added' })
	await first
	assert.deepEqual(selector.snapshot().recent, ['customer', 'customer.address'])
	selector.dispose()
})

test('PORT-03 navigation: stale metadata cannot replace the context or revive disposal', async () => {
	const metadata = staticProvider()
	const context = metadata.context.bind(metadata)
	const slow = deferred()
	let signal
	metadata.context = async (root, path, received) => {
		if (path === 'customer') {
			signal = received
			await slow.promise
		}
		return context(root, path, received)
	}
	const selector = new PropertySelect(options({ metadata }))
	await selector.mount()
	const pending = selector.navigate('customer')
	await new Promise(resolve => setImmediate(resolve))
	await selector.navigate('tags')
	assert.equal(signal.aborted, true)
	slow.resolve()
	assert.equal(await pending, false)
	assert.equal(selector.path, 'tags')
	const delayed = deferred()
	metadata.context = async () => { await delayed.promise; throw new Error('late failure') }
	const newer = selector.navigate('lines')
	await new Promise(resolve => setImmediate(resolve))
	selector.dispose()
	delayed.resolve()
	assert.equal(await newer, false)
	assert.equal(selector.status, 'disposed')
})

test('PORT-09 core: consumer rejection is recoverable and preserves context', async () => {
	const consumer = recordingConsumer()
	consumer.select = async () => { throw new Error('Host unavailable') }
	const selector = new PropertySelect(options({ consumer }))
	const errors = []
	selector.subscribe(event => event.type === 'error' && errors.push(event.error.message))
	await selector.navigate('customer')
	assert.equal(await selector.select('customer.name'), undefined)
	assert.equal(selector.path, 'customer')
	assert.deepEqual(errors, ['Host unavailable'])
	consumer.select = async intent => ({ ...intent, status: 'added' })
	await selector.select('customer.name')
	assert.deepEqual(selector.snapshot().recent, ['customer'])
	selector.dispose()
})

test('PORT-02: reentrant disposal still sends exactly one terminal transport callback', async () => {
	const consumer = recordingConsumer()
	const selector = new PropertySelect(options({ consumer }))
	selector.subscribe(event => { if (event.type === 'end') selector.dispose() })
	const intent = await selector.begin('number', sample)
	assert.equal(await selector.end(intent.id, sample), undefined)
	assert.deepEqual(consumer.calls.map(call => call.type), ['begin', 'end'])
	assert.deepEqual(selector.snapshot().recent, [])
})

test('PORT-02: disposal during metadata resolution never emits a selection or begins transport', async () => {
	const metadata = staticProvider()
	const resolved = metadata.resolve.bind(metadata)
	const wait = deferred()
	metadata.resolve = async (...args) => { await wait.promise; return resolved(...args) }
	const consumer = recordingConsumer()
	const selector = new PropertySelect(options({ consumer, metadata }))
	const pending = selector.select('number')
	const dragging = selector.begin('customer', sample)
	selector.dispose()
	wait.resolve()
	assert.equal(await pending, undefined)
	assert.equal(await dragging, undefined)
	assert.deepEqual(consumer.calls, [])
})

test('PORT-02: source cancellation prevents late begin and permits the next drag', async () => {
	const metadata = staticProvider()
	const resolve = metadata.resolve.bind(metadata)
	const waiting = deferred()
	metadata.resolve = async (...args) => {
		await waiting.promise
		return resolve(...args)
	}
	const consumer = recordingConsumer()
	const selector = new PropertySelect(options({ consumer, metadata }))
	const abort = new AbortController()
	const pending = selector.begin('customer', sample, abort.signal)
	abort.abort()
	waiting.resolve()
	assert.equal(await pending, undefined)
	assert.deepEqual(consumer.calls, [])
	const next = await selector.begin('number', sample)
	selector.cancel(next.id)
	assert.deepEqual(consumer.calls.map(call => call.type), ['begin', 'cancel'])
	selector.dispose()
})
