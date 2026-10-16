import assert            from 'node:assert/strict'
import { readFileSync }  from 'node:fs'
import { writeFileSync } from 'node:fs'

const source = readFileSync('node_modules/@itrocks/property-select/front/pointer-transport.js', 'utf8')
const { PointerTransport } = await import('data:text/javascript,' + encodeURIComponent(source))
const results = []
for (const delayed of [false, true]) {
	const root = new EventTarget()
	const document = new EventTarget()
	const window = new EventTarget()
	const capture = new Set()
	const calls = []
	let unblock, signal
	const button = { dataset: { path: 'customer.address.city' }, classList: { contains: () => false },
		closest: query => query === 'button[data-path]' ? button : null }
	Object.assign(document, { defaultView: window, documentElement: {
		setPointerCapture: id => capture.add(id), hasPointerCapture: id => capture.has(id),
		releasePointerCapture: id => capture.delete(id)
	} })
	Object.assign(root, { ownerDocument: document, contains: () => true,
		getBoundingClientRect: () => ({ left: 0 }) })
	const transport = new PointerTransport(root, {
		begin: async (path, _point, abort) => {
			signal = abort
			calls.push('begin:' + path)
			if (delayed) await new Promise(resolve => { unblock = resolve })
			return { id: 'interruption', path }
		},
		cancel: () => calls.push('cancel'), end: async () => calls.push('end'), move: () => calls.push('move')
	})
	function emit(type, x)
	{
		const event = new Event(type, { cancelable: true })
		Object.assign(event, { button: 0, clientX: x, clientY: 50, pointerId: 9, pointerType: 'touch', isPrimary: true })
		Object.defineProperty(event, 'target', { value: button })
		const target = type === 'pointerdown' ? root : document
		target.dispatchEvent(event)
	}
	emit('pointerdown', 12)
	emit('pointermove', 42)
	await Promise.resolve()
	window.dispatchEvent(new Event('blur'))
	assert.equal(signal.aborted, true)
	assert.equal(capture.size, 0)
	unblock?.()
	await Promise.resolve()
	await Promise.resolve()
	emit('pointerup', 42)
	window.dispatchEvent(new Event('blur'))
	assert.equal(calls.filter(call => call === 'cancel').length, 1)
	assert.equal(calls.includes('end'), false)
	transport.dispose()
	const count = calls.length
	emit('pointerdown', 12)
	emit('pointermove', 42)
	assert.equal(calls.length, count)
	results.push({ scenario: delayed ? 'Pending begin interrupted' : 'Active transport interrupted', status: 'PASS',
		expected: 'Aborted, capture released, one cancellation, no end or surviving listeners', observed: calls })
}
writeFileSync('node_modules/@itrocks/property-select/docs/orchestration/evidence/V6/interruption.json',
	JSON.stringify({ method: 'Synthetic EventTarget blur contract; no physical interruption', results }, null, 2) + '\n')
console.log('PASS: 2 interruption contract scenarios, 10 assertions')
