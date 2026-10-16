import { normalisePath }      from './path.js'
import type { SelectorState } from './ports.js'
import type { StateRecord }   from './ports.js'
import type { StateStore }    from './ports.js'

export class StateConflictError extends Error
{

	readonly code = 'STATE_CONFLICT'
	constructor() { super('Selector state changed in another request') }

}

/** Untrusted persisted values are bounded before any metadata traversal. Unknown versions reset cleanly. */
export function validateSelectorState(value: unknown): SelectorState | undefined
{
	if (!value || typeof value !== 'object') return undefined
	const state = value as SelectorState
	if (state.version !== 1 || !Array.isArray(state.branch) || state.branch.length > 64
		|| !Number.isSafeInteger(state.current) || typeof state.query !== 'string' || state.query.length > 4096
		|| !Array.isArray(state.recent) || state.recent.length > 100 || !state.scroll
		|| typeof state.scroll !== 'object' || Array.isArray(state.scroll)) return undefined
	const branch: string[] = []
	for (const segment of state.branch) {
		try {
			if (typeof segment !== 'string' || segment.length > 128 || !normalisePath(segment) || segment.includes('.'))
				break
		}
		catch { break }
		branch.push(segment)
	}
	const recent: string[] = []
	for (const path of state.recent) {
		try {
			if (typeof path !== 'string' || path.length > 4096) continue
			const canonical = normalisePath(path)
			if (canonical && !recent.includes(canonical)) recent.push(canonical)
		}
		catch { /* Obsolete or malformed paths are omitted. */ }
	}
	const scroll: Record<string, { left: number; top: number }> = {}
	for (const [key, position] of Object.entries(state.scroll).slice(0, 128)) {
		if (key.length > 512 || !position || !Number.isFinite(position.left) || !Number.isFinite(position.top)) continue
		Object.defineProperty(scroll, key, { enumerable: true, value: {
			left: Math.max(0, Math.min(1e7, position.left)), top: Math.max(0, Math.min(1e7, position.top))
		} })
	}
	return { branch, current: Math.max(0, Math.min(branch.length, state.current)), query: state.query,
		recent, scroll, version: 1 }
}

/** Per-instance queue: a conflict rebases the latest local snapshot, never the stale attempted snapshot. */
export class StatePersistence
{

	private pending?: SelectorState
	private revision = 0
	private running?: Promise<void>

	constructor(private readonly store: StateStore, private readonly key: string)
	{
	}

	async read(signal?: AbortSignal): Promise<SelectorState | undefined>
	{
		const record = await this.store.read(this.key, signal)
		this.accept(record)
		return validateSelectorState(record.state)
	}

	private accept(record: StateRecord): void
	{
		if (!Number.isSafeInteger(record.revision) || record.revision < this.revision)
			throw new Error('Invalid state revision')
		this.revision = record.revision
	}

	queue(state: SelectorState): void
	{
		this.pending = structuredClone(state)
	}

	flush(): Promise<void>
	{
		return this.running ||= this.drain().finally(() => { this.running = undefined })
	}

	private async drain(): Promise<void>
	{
		let conflicts = 0
		while (this.pending) {
			const state = this.pending
			this.pending = undefined
			try {
				const record = await this.store.write(this.key, state, this.revision)
				this.accept(record)
				conflicts = 0
			}
			catch (error) {
				this.pending ??= state
				if ((error as { code?: string }).code !== 'STATE_CONFLICT' || ++ conflicts > 3) throw error
				this.accept(await this.store.read(this.key))
			}
		}
	}

}
