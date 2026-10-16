import type { IntentionEvent }      from './intentions.js'
import { Intentions }               from './intentions.js'
import { Navigation }               from './navigation.js'
import type { NavigationStatus }    from './navigation.js'
import { normalisePath }            from './path.js'
import type { ConsumerPort }        from './ports.js'
import type { MetadataProvider }    from './ports.js'
import type { ObjectContext }       from './ports.js'
import type { Outcome }             from './ports.js'
import type { PointerSample }       from './ports.js'
import type { PropertyDescription } from './ports.js'
import type { PropertyPath }        from './ports.js'
import type { RootId }              from './ports.js'
import type { SelectionIntent }     from './ports.js'
import type { SelectorState }       from './ports.js'
import type { StateStore }          from './ports.js'
import { Search }                   from './search.js'
import type { SearchOptions }       from './search.js'
import type { SearchSnapshot }      from './search.js'
import { StatePersistence }         from './state.js'
import type { Suggestion }          from './suggestions.js'
import { suggestions }              from './suggestions.js'

export type SelectorEvent = IntentionEvent | { type: 'change' } | { type: 'error'; error: unknown }

export interface PropertySelectOptions
{
	advice?: readonly PropertyPath[]
	consumer?: ConsumerPort
	metadata: MetadataProvider
	root: RootId
	search?: SearchOptions
	stateKey?: string
	stateMode?: 'instance' | 'session'
	stateStore?: StateStore
	suggestionLimit?: number
	translate?: (text: string) => string
	usedPaths?: readonly PropertyPath[]
}

export class PropertySelect
{

	private adviceValue: string[]
	private disposed = false
	private mounted = false
	private readonly metadata: MetadataProvider
	private readonly persistence?: StatePersistence
	private persistenceErrorValue?: unknown
	private readonly suggestionLimit: number
	private suggestionsAbort?: AbortController
	private suggestionsValue: Suggestion[] = []
	private readonly intentions: Intentions
	private readonly listeners = new Set<(event: SelectorEvent) => void>()
	private readonly navigation: Navigation
	private navigationGeneration = 0
	private queryValue = ''
	private recentValue: string[] = []
	private scrollValue: Record<string, { left: number; top: number }> = {}
	private readonly searchEngine: Search
	private usedValue: string[]

	readonly root: RootId
	readonly stateMode: 'instance' | 'session'
	readonly translate: (text: string) => string

	constructor(options: PropertySelectOptions)
	{
		if (!options?.metadata || (typeof options.metadata.context !== 'function')
			|| (typeof options.metadata.resolve !== 'function'))
			throw new TypeError('PropertySelect requires a metadata provider')
		if ((typeof options.root !== 'string') || !options.root)
			throw new TypeError('PropertySelect requires an opaque root identifier')
		this.stateMode = options.stateMode || 'instance'
		if (!['instance', 'session'].includes(this.stateMode)) throw new TypeError('Invalid state mode')
		if (this.stateMode === 'session') {
			if (!options.stateStore || !options.stateKey)
				throw new TypeError('Session persistence requires a store and opaque key')
			this.persistence = new StatePersistence(options.stateStore, options.stateKey)
		}
		this.metadata = options.metadata
		this.suggestionLimit = options.suggestionLimit ?? 6
		if (!Number.isSafeInteger(this.suggestionLimit) || this.suggestionLimit < 1 || this.suggestionLimit > 100)
			throw new TypeError('Suggestion limit must be an integer from 1 to 100')
		this.root        = options.root
		this.translate   = options.translate || (text => text)
		this.adviceValue = (options.advice || []).map(normalisePath)
		this.usedValue   = (options.usedPaths || []).map(normalisePath)
		this.navigation  = new Navigation(options.metadata, options.root, () => this.emit({ type: 'change' }),
			error => this.emit({ type: 'error', error }))
		this.searchEngine = new Search((path, signal) => this.navigation.loadContext(path, signal),
			() => this.emit({ type: 'change' }), error => this.emit({ type: 'error', error }), options.search)
		this.intentions = new Intentions(options.metadata, options.root, options.consumer,
			event => this.emit(event), property => this.addRecent(property),
			error => this.emit({ type: 'error', error }))
	}

	get advice(): readonly string[]
	{
		return [...this.adviceValue]
	}

	get branchContexts(): readonly ObjectContext[]
	{
		return this.navigation.branchContexts
	}

	get context(): ObjectContext | undefined
	{
		return this.navigation.context
	}

	get path(): string
	{
		return this.navigation.path
	}

	get persistenceError(): unknown
	{
		return this.persistenceErrorValue
	}

	get suggestions(): readonly Suggestion[]
	{
		return structuredClone(this.suggestionsValue)
	}

	get search(): SearchSnapshot
	{
		return this.searchEngine.snapshot
	}

	get status(): NavigationStatus
	{
		return this.navigation.status
	}

	get usedPaths(): readonly string[]
	{
		return [...this.usedValue]
	}

	acknowledge(outcome: Outcome): boolean
	{
		return this.intentions.acknowledge(outcome)
	}

	async activate(input: PropertyPath): Promise<boolean | Outcome | undefined>
	{
		this.assertLive()
		const path = normalisePath(input)
		if (!path)
			return this.navigate(path)
		const property = this.search.results.find(result => result.property.path === path)?.property
			|| this.context?.properties.find(candidate => candidate.path === path)
		if (property)
			return property.kind === 'relation' ? this.navigate(path) : this.select(path)
		throw new TypeError('Activate a property in the displayed context; use navigate/select for complete paths')
	}

	begin(path: PropertyPath, sample: PointerSample, signal?: AbortSignal): Promise<SelectionIntent | undefined>
	{
		return this.intentions.begin(path, sample, signal)
	}

	cancel(id: string, reason?: string): void
	{
		this.intentions.cancel(id, reason)
	}

	dispose(): void
	{
		if (this.disposed)
			return
		this.disposed = true
		this.suggestionsAbort?.abort()
		this.searchEngine.cancel()
		this.navigation.dispose()
		this.intentions.dispose()
		this.listeners.clear()
	}

	end(id: string, sample: PointerSample): Promise<Outcome | undefined>
	{
		return this.intentions.end(id, sample)
	}

	async mount(): Promise<boolean>
	{
		if (this.mounted) return true
		let state: SelectorState | undefined
		try { state = await this.persistence?.read() }
		catch (error) { this.persistenceFailed(error) }
		if (this.disposed) return false
		if (state) {
			this.queryValue = state.query
			this.recentValue = [...state.recent]
			this.scrollValue = { ...state.scroll }
		}
		const mounted = state ? await this.navigation.restore(state.branch, state.current) : await this.navigate('')
		if (this.disposed) return false
		this.mounted = true
		this.searchEngine.start(this.queryValue, this.navigation.trail)
		await this.refreshSuggestions()
		this.saveState()
		return mounted
	}

	async flushState(): Promise<void>
	{
		try {
			await this.persistence?.flush()
			this.persistenceErrorValue = undefined
			if (!this.disposed) this.emit({ type: 'change' })
		}
		catch (error) { this.persistenceFailed(error); throw error }
	}

	async refresh(): Promise<boolean>
	{
		this.assertLive()
		const state = this.snapshot()
		this.searchEngine.cancel()
		const restored = await this.navigation.restore(state.branch, state.current)
		if (this.disposed) return false
		await this.refreshSuggestions()
		this.searchEngine.start(this.queryValue, this.navigation.trail)
		this.saveState()
		return restored
	}

	async shortcut(input: PropertyPath): Promise<boolean>
	{
		this.assertLive()
		const path = normalisePath(input)
		if (!this.suggestionsValue.some(item => item.path === path)) return false
		this.queryValue = ''
		this.searchEngine.cancel()
		const result = await this.navigation.restore(path.split('.'), path.split('.').length)
		this.saveState()
		return result
	}

	move(id: string, sample: PointerSample): void
	{
		this.intentions.move(id, sample)
	}

	async navigate(path: PropertyPath): Promise<boolean>
	{
		this.assertLive()
		const generation = ++ this.navigationGeneration
		this.searchEngine.cancel()
		const committed = await this.navigation.navigate(path)
		if (!this.disposed && (generation === this.navigationGeneration))
			this.searchEngine.start(this.queryValue, this.navigation.trail)
		if (committed) this.saveState()
		return committed
	}

	select(path: PropertyPath): Promise<Outcome | undefined>
	{
		return this.intentions.select(path)
	}

	setConfiguration(configuration: { advice?: readonly PropertyPath[]; usedPaths?: readonly PropertyPath[] }): void
	{
		this.assertLive()
		if (configuration.advice !== undefined)
			this.adviceValue = configuration.advice.map(normalisePath)
		if (configuration.usedPaths !== undefined)
			this.usedValue = configuration.usedPaths.map(normalisePath)
		this.emit({ type: 'change' })
		void this.refreshSuggestions()
	}

	setQuery(query: string): void
	{
		this.assertLive()
		if (typeof query !== 'string')
			throw new TypeError('The query must be a string')
		this.queryValue = query
		this.searchEngine.start(query, this.navigation.status === 'loading' ? [] : this.navigation.trail)
		this.saveState()
	}

	setScroll(key: string, position: { left: number; top: number }): void
	{
		this.assertLive()
		if (!Number.isFinite(position.left) || !Number.isFinite(position.top))
			throw new TypeError('Scroll coordinates must be finite')
		Object.defineProperty(this.scrollValue, key, {
			configurable: true, enumerable: true, value: { left: position.left, top: position.top }
		})
		this.saveState()
		this.emit({ type: 'change' })
	}

	snapshot(): SelectorState
	{
		return structuredClone({
			branch: this.navigation.branch,
			current: this.navigation.current,
			query: this.queryValue,
			recent: this.recentValue,
			scroll: this.scrollValue,
			version: 1
		})
	}

	subscribe(listener: (event: SelectorEvent) => void): () => void
	{
		this.assertLive()
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	private addRecent(property: PropertyDescription): void
	{
		const destination = property.kind === 'relation' ? property.path : property.path.split('.').slice(0, -1).join('.')
		if (destination) {
			this.recentValue = [destination, ...this.recentValue.filter(path => path !== destination)].slice(0, 100)
			this.saveState()
			void this.refreshSuggestions()
			this.emit({ type: 'change' })
		}
	}

	private persistenceFailed(error: unknown): void
	{
		if (this.disposed) return
		this.persistenceErrorValue = error
		this.emit({ type: 'error', error })
	}

	private async refreshSuggestions(): Promise<void>
	{
		this.suggestionsAbort?.abort()
		const abort = this.suggestionsAbort = new AbortController()
		try {
			const validRecent: string[] = []
			for (const path of this.recentValue) {
				try { await this.metadata.context(this.root, path, abort.signal); validRecent.push(path) }
				catch { /* Removed metadata is not a suggestion. */ }
			}
			const items = await suggestions(this.metadata, this.root, validRecent, this.usedValue,
				this.adviceValue, this.suggestionLimit, abort.signal, this.translate)
			if (this.disposed || abort.signal.aborted) return
			this.recentValue = validRecent
			this.suggestionsValue = items
			this.emit({ type: 'change' })
		}
		catch (error) { if (!abort.signal.aborted && !this.disposed) this.emit({ type: 'error', error }) }
	}

	private saveState(): void
	{
		if (!this.mounted || this.disposed || !this.persistence) return
		this.persistence.queue(this.snapshot())
		queueMicrotask(() => { void this.flushState().catch(() => {}) })
	}

	private assertLive(): void
	{
		if (this.disposed)
			throw new Error('The selector is disposed')
	}

	private emit(event: SelectorEvent): void
	{
		for (const listener of this.listeners)
			listener(event)
	}

}
