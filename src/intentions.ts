import { resolveProperty }          from './metadata.js'
import { normalisePath }            from './path.js'
import type { ConsumerPort }        from './ports.js'
import type { MetadataProvider }    from './ports.js'
import type { Outcome }             from './ports.js'
import type { PointerSample }       from './ports.js'
import type { PropertyDescription } from './ports.js'
import type { PropertyPath }        from './ports.js'
import type { RootId }              from './ports.js'
import type { SelectionIntent }     from './ports.js'

export type IntentionEvent =
	| { type: 'select'; intent: SelectionIntent }
	| { type: 'begin'; intent: SelectionIntent; sample: PointerSample }
	| { type: 'move' | 'end'; id: string; sample: PointerSample }
	| { type: 'cancel'; id: string; reason: string }
	| { type: 'outcome'; outcome: Outcome }

interface Pending
{
	abort: AbortController
	intent: SelectionIntent
	phase: 'resolving' | 'selected' | 'dragging' | 'ended'
	property?: PropertyDescription
}

let instanceSequence = 0

export class Intentions
{

	private disposed = false
	private drag?: string
	private readonly instance = ++ instanceSequence
	private readonly pending = new Map<string, Pending>()
	private sequence = 0

	constructor(
		private readonly provider: MetadataProvider,
		private readonly root: RootId,
		private readonly consumer: ConsumerPort | undefined,
		private readonly emit: (event: IntentionEvent) => void,
		private readonly added: (property: PropertyDescription) => void,
		private readonly failed: (error: unknown) => void
	) {}

	acknowledge(outcome: Outcome): boolean
	{
		const pending = this.pending.get(outcome.id)
		if (
			this.disposed || !pending || !['selected', 'ended'].includes(pending.phase)
			|| (outcome.path !== pending.intent.path)
			|| !['added', 'existing', 'removed', 'moved', 'cancelled', 'rejected'].includes(outcome.status)
		) {
			if (!this.disposed)
				this.failed(new Error('Ignored unknown, duplicate, premature or mismatched acknowledgement'))
			return false
		}
		this.pending.delete(outcome.id)
		if ((outcome.status === 'added') && pending.property)
			this.added(pending.property)
		if (outcome.status === 'rejected')
			this.failed(new Error(outcome.message || 'Selection rejected'))
		this.emit({ type: 'outcome', outcome: { ...outcome } })
		return true
	}

	// Called by the surface only after its gesture recogniser accepts the drag.
	async begin(path: PropertyPath, sample: PointerSample, signal?: AbortSignal): Promise<SelectionIntent | undefined>
	{
		if (this.drag)
			throw new Error('A transport is already active')
		const pending = this.create(path)
		this.drag = pending.intent.id
		const cancel = () => this.cancel(pending.intent.id, 'source cancelled')
		signal?.addEventListener('abort', cancel, { once: true })
		try {
			if (signal?.aborted) {
				cancel()
				return undefined
			}
			pending.property = await resolveProperty(this.provider, this.root, pending.intent.path, pending.abort.signal)
			if (!this.live(pending))
				return undefined
			pending.phase = 'dragging'
			this.consumer?.begin(pending.intent, { ...sample })
			if (!this.live(pending))
				return undefined
			this.emit({ type: 'begin', intent: pending.intent, sample: { ...sample } })
			return pending.intent
		}
		catch (error) {
			this.failure(pending, error)
			return undefined
		}
		finally { signal?.removeEventListener('abort', cancel) }
	}

	cancel(id: string, reason = 'cancelled'): void
	{
		const pending = this.pending.get(id)
		if (!pending)
			return
		this.pending.delete(id)
		pending.abort.abort()
		if (this.drag === id)
			this.drag = undefined
		// Once end has been sent, cancellation invalidates its acknowledgement without a second terminal call.
		if (pending.phase === 'dragging') {
			try { this.consumer?.cancel(id, reason) }
			catch (error) { this.failed(error) }
			this.emit({ type: 'cancel', id, reason })
		}
	}

	dispose(): void
	{
		if (this.disposed)
			return
		this.disposed = true
		for (const id of this.pending.keys())
			this.cancel(id, 'disposed')
	}

	async end(id: string, sample: PointerSample): Promise<Outcome | undefined>
	{
		const pending = this.pending.get(id)
		if (!pending || (pending.phase !== 'dragging') || (this.drag !== id))
			return undefined
		pending.phase = 'ended'
		this.drag = undefined
		try {
			const result = this.consumer?.end(id, { ...sample })
			this.emit({ type: 'end', id, sample: { ...sample } })
			if (!result)
				return undefined
			const outcome = await result
			return this.live(pending) && this.acknowledge(outcome) ? outcome : undefined
		}
		catch (error) {
			this.failure(pending, error)
			return undefined
		}
	}

	move(id: string, sample: PointerSample): void
	{
		const pending = this.pending.get(id)
		if (!pending || (pending.phase !== 'dragging') || (this.drag !== id))
			return
		try {
			this.consumer?.move(id, { ...sample })
			this.emit({ type: 'move', id, sample: { ...sample } })
		}
		catch (error) {
			this.failed(error)
			this.cancel(id, 'consumer failure')
		}
	}

	async select(path: PropertyPath): Promise<Outcome | undefined>
	{
		const pending = this.create(path)
		try {
			pending.property = await resolveProperty(this.provider, this.root, pending.intent.path, pending.abort.signal)
			if (!this.live(pending))
				return undefined
			pending.phase = 'selected'
			this.emit({ type: 'select', intent: pending.intent })
			if (!this.consumer || !this.live(pending))
				return undefined
			const outcome = await this.consumer.select(pending.intent, pending.abort.signal)
			return this.live(pending) && this.acknowledge(outcome) ? outcome : undefined
		}
		catch (error) {
			this.failure(pending, error)
			return undefined
		}
	}

	private create(input: PropertyPath): Pending
	{
		if (this.disposed)
			throw new Error('The selector is disposed')
		const path = normalisePath(input)
		if (!path)
			throw new TypeError('The root cannot be selected or transported')
		const intent = Object.freeze({ id: `selector-${this.instance}-${++ this.sequence}`, path, root: this.root })
		const pending: Pending = { abort: new AbortController(), intent, phase: 'resolving' }
		this.pending.set(intent.id, pending)
		return pending
	}

	private failure(pending: Pending, error: unknown): void
	{
		if (!this.live(pending))
			return
		this.cancel(pending.intent.id, 'consumer failure')
		this.failed(error)
	}

	private live(pending: Pending): boolean
	{
		return !this.disposed && (this.pending.get(pending.intent.id) === pending)
	}

}
