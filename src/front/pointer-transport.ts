import type { PointerSample } from '../property-select.js'
import type { PropertySelect } from '../property-select.js'

type Press = {
	abort: AbortController
	id?: string
	origin: PointerSample
	path: string
	recognised: boolean
	sample: PointerSample
}

const sampleOf = (event: PointerEvent): PointerSample => ({
	clientX: event.clientX, clientY: event.clientY, pointerId: event.pointerId, pointerType: event.pointerType
})

/** Source-only desktop recognition. The consumer owns every target decision. */
export class PointerTransport
{

	private readonly abort = new AbortController()
	private press?: Press
	private suppressClick = false

	constructor(private readonly root: HTMLElement, private readonly selector: PropertySelect)
	{
		const document = root.ownerDocument
		root.addEventListener('pointerdown', event => this.down(event), { signal: this.abort.signal })
		for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'] as const)
			document.addEventListener(type, event => this.pointer(event), { capture: true, signal: this.abort.signal })
		document.addEventListener('keydown', event => {
			if (event.key !== 'Escape' || !this.press?.recognised) return
			event.preventDefault()
			event.stopImmediatePropagation()
			this.cancel('Escape')
		}, { capture: true, signal: this.abort.signal })
		document.addEventListener('click', event => {
			if (!this.suppressClick || event.detail === 0) return
			this.suppressClick = false
			event.preventDefault()
			event.stopImmediatePropagation()
		}, { capture: true, signal: this.abort.signal })
		document.defaultView!.addEventListener('blur', () => this.cancel('window blur'), { signal: this.abort.signal })
	}

	private cancel(reason: string): void
	{
		const press = this.press
		if (!press) return
		this.release(press)
		press.abort.abort()
		if (press.id) this.selector.cancel(press.id, reason)
	}

	dispose(): void
	{
		this.cancel('disposed')
		this.abort.abort()
	}

	private down(event: PointerEvent): void
	{
		if (this.press || !event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return
		this.suppressClick = false
		const button = (event.target as Element).closest<HTMLElement>('button[data-path]')
		if (!button || !this.root.contains(button) || !button.dataset.path
			|| button.closest('.ps-suggestions') || button.classList.contains('ps-add')) return
		const sample = sampleOf(event)
		this.press = { abort: new AbortController(), origin: sample, path: button.dataset.path, recognised: false, sample }
	}

	private pointer(event: PointerEvent): void
	{
		const press = this.press
		if (!press || event.pointerId !== press.origin.pointerId) return
		if (event.type === 'pointercancel' || event.type === 'lostpointercapture') {
			this.cancel(event.type)
			return
		}
		press.sample = sampleOf(event)
		if (event.type === 'pointerup') {
			this.release(press)
			if (!press.recognised) return
			event.preventDefault()
			if (press.id) void this.selector.end(press.id, press.sample)
			else press.abort.abort()
			return
		}
		if (!press.recognised) {
			if (Math.hypot(event.clientX - press.origin.clientX, event.clientY - press.origin.clientY) < 10) return
			press.recognised = true
			this.suppressClick = true
			this.root.ownerDocument.documentElement.setPointerCapture(event.pointerId)
			void this.selector.begin(press.path, press.sample, press.abort.signal).then(intent => {
				if (!intent) return
				if (this.press !== press) {
					this.selector.cancel(intent.id, 'source ended')
					return
				}
				press.id = intent.id
				this.selector.move(intent.id, press.sample)
			})
		}
		event.preventDefault()
		if (press.id) this.selector.move(press.id, press.sample)
	}

	private release(press: Press): void
	{
		this.press = undefined
		const capture = this.root.ownerDocument.documentElement
		if (capture.hasPointerCapture(press.origin.pointerId)) capture.releasePointerCapture(press.origin.pointerId)
	}

}
