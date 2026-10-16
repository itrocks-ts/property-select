import assert            from 'node:assert/strict'
import { readFileSync }  from 'node:fs'
import { test }          from 'node:test'

const source = readFileSync(new URL('../front/pointer-transport.js', import.meta.url), 'utf8')
const { PointerTransport } = await import(`data:text/javascript,${encodeURIComponent(source)}`)

function fixture({ deferred = false, breadcrumb = false } = {})
{
	const document = new EventTarget(), root = new EventTarget(), capture = new EventTarget()
	const events = [], contacts = new Set()
	let resolve
	Object.assign(capture, {
		hasPointerCapture: id => contacts.has(id),
		releasePointerCapture: id => contacts.delete(id),
		setPointerCapture: id => contacts.add(id)
	})
	Object.assign(document, { defaultView: new EventTarget(), documentElement: capture })
	const button = {
		classList: { contains: () => false }, dataset: { path: 'customer.address' },
		closest: selector => selector === 'button[data-path]' ? button
			: selector === '.ps-breadcrumb' && breadcrumb ? {} : null
	}
	Object.assign(root, { contains: () => true, getBoundingClientRect: () => ({ left: 100 }), ownerDocument: document })
	const selector = {
		begin: async (path, sample, signal) => {
			events.push(['begin', path, signal])
			if (deferred) await new Promise(done => { resolve = done })
			return { id: 'one', path }
		},
		cancel: (id, reason) => events.push(['cancel', id, reason]),
		end: async id => events.push(['end', id]),
		move: id => events.push(['move', id])
	}
	const transport = new PointerTransport(root, selector)
	const send = (type, x = 120, y = 50, extra = {}) => {
		const event = new Event(type, { cancelable: true })
		const { target: eventTarget, ...properties } = extra
		Object.assign(event, { button: 0, clientX: x, clientY: y, isPrimary: true,
			pointerId: 1, pointerType: 'touch', ...properties })
		Object.defineProperty(event, 'target', { value: eventTarget ?? button })
		const target = type === 'pointerdown' && event.isPrimary ? root : document
		target.dispatchEvent(event)
		return event
	}
	return { capture, document, events, release: () => resolve?.(), send, transport }
}

for (const kind of ['tap', 'hold', 'vertical', 'diagonal', 'right zone', 'breadcrumb']) {
	test(`native ${kind} never begins transport, including later horizontal movement`, async () => {
		const f = fixture({ breadcrumb: kind === 'breadcrumb' })
		try {
			f.send('pointerdown', kind === 'right zone' ? 220 : 120)
			if (kind === 'vertical') f.send('pointermove', 123, 75)
			if (kind === 'diagonal') f.send('pointermove', 128, 58)
			if (kind === 'right zone') f.send('pointermove', 240, 50)
			if (kind === 'hold') await new Promise(resolve => setTimeout(resolve, 60))
			if (!['tap', 'hold'].includes(kind))
				assert.equal(f.send('pointermove', 180, 50).defaultPrevented, false)
			f.send('pointerup')
			assert.deepEqual(f.events, [])
		}
		finally { f.transport.dispose() }
	})
}

test('horizontal recognition has no timer and locks through vertical diagonals; one end and suppressed click', async () => {
	const f = fixture()
	try {
		f.send('pointerdown')
		assert.equal(f.send('pointermove', 126).defaultPrevented, false)
		assert.equal(f.send('pointermove', 131).defaultPrevented, true)
		await Promise.resolve()
		assert.equal(f.events[0][0], 'begin')
		assert.equal(f.send('pointermove', 132, 150).defaultPrevented, true)
		f.send('pointerup', 132, 150)
		f.send('pointercancel')
		assert.equal(f.events.filter(event => event[0] === 'end').length, 1)
		assert.equal(f.events.filter(event => event[0] === 'cancel').length, 0)
		assert.equal(f.send('click', 132, 150, { detail: 1 }).defaultPrevented, true)
		assert.equal(f.send('click', 132, 150, { detail: 0 }).defaultPrevented, false)
	}
	finally { f.transport.dispose() }
})

for (const ending of ['pointerup', 'pointercancel', 'second contact', 'dispose']) {
	test(`delayed begin cannot survive ${ending}`, async () => {
		const f = fixture({ deferred: true })
		f.send('pointerdown')
		f.send('pointermove', 140)
		const signal = f.events[0][2]
		if (ending === 'dispose') f.transport.dispose()
		else if (ending === 'second contact') f.send('pointerdown', 160, 80, { isPrimary: false, pointerId: 2 })
		else f.send(ending)
		assert.equal(signal.aborted, true)
		f.release()
		await Promise.resolve()
		await Promise.resolve()
		assert.equal(f.events.filter(event => event[0] === 'cancel').length, 1)
		assert.equal(f.events.filter(event => event[0] === 'end' || event[0] === 'move').length, 0)
		f.transport.dispose()
	})
}

test('implicit capture transfer is ignored, loss on surviving capture cancels exactly once', async () => {
	const f = fixture()
	f.send('pointerdown')
	f.send('pointermove', 140)
	await Promise.resolve()
	f.send('lostpointercapture')
	assert.equal(f.events.filter(event => event[0] === 'cancel').length, 0)
	f.send('lostpointercapture', 140, 50, { target: f.capture })
	f.send('pointercancel')
	assert.equal(f.events.filter(event => event[0] === 'cancel').length, 1)
	f.transport.dispose()
})


test('a new contact outside the selector is not swallowed after a cancelled drag', async () => {
	const f = fixture()
	f.send('pointerdown')
	f.send('pointermove', 140)
	await Promise.resolve()
	f.send('keydown', 140, 50, { key: 'Escape' })
	const outside = new Event('pointerdown')
	Object.assign(outside, { isPrimary: true, pointerType: 'touch' })
	f.document.dispatchEvent(outside)
	assert.equal(f.send('click', 10, 10, { detail: 1 }).defaultPrevented, false)
	f.transport.dispose()
})
