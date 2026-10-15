import { loadContext }           from './metadata.js'
import { normalisePath }         from './path.js'
import type { MetadataProvider } from './ports.js'
import type { ObjectContext }    from './ports.js'
import type { PropertyPath }     from './ports.js'
import type { RootId }           from './ports.js'

export type NavigationStatus = 'idle' | 'loading' | 'ready' | 'error' | 'disposed'

export class Navigation
{

	private abort?: AbortController
	private branchValue: string[] = []
	private contextValue?: ObjectContext
	private readonly contexts = new Map<string, ObjectContext>()
	private currentValue = 0
	private disposed = false
	private generation = 0
	private statusValue: NavigationStatus = 'idle'

	constructor(
		private readonly provider: MetadataProvider,
		private readonly root: RootId,
		private readonly changed: () => void,
		private readonly failed: (error: unknown) => void
	) {}

	get branch(): readonly string[]
	{
		return [...this.branchValue]
	}

	get context(): ObjectContext | undefined
	{
		return this.contextValue && structuredClone(this.contextValue)
	}

	get current(): number
	{
		return this.currentValue
	}

	get path(): string
	{
		return this.branchValue.slice(0, this.currentValue).join('.')
	}

	get status(): NavigationStatus
	{
		return this.statusValue
	}

	dispose(): void
	{
		if (this.disposed)
			return
		this.disposed = true
		this.generation ++
		this.abort?.abort()
		this.contexts.clear()
		this.statusValue = 'disposed'
	}

	async navigate(input: PropertyPath): Promise<boolean>
	{
		if (this.disposed)
			throw new Error('The selector is disposed')
		const path       = normalisePath(input)
		const segments   = path ? path.split('.') : []
		const generation = ++ this.generation
		this.abort?.abort()
		const abort = this.abort = new AbortController()
		this.statusValue = 'loading'
		this.changed()
		try {
			// Validate every edge. A provider cannot accidentally accept a terminal traversal via context alone.
			let context = await this.load('', abort.signal)
			for (let index = 0; index < segments.length; index ++) {
				if (this.disposed || (generation !== this.generation))
					return false
				const edge = context.properties.find(property => property.name === segments[index])
				if (!edge || (edge.kind !== 'relation'))
					throw new TypeError(`Not a navigable relation: ${segments.slice(0, index + 1).join('.')}`)
				context = await this.load(edge.path, abort.signal)
			}
			if (this.disposed || (generation !== this.generation))
				return false
			// A remembered descendant survives moving to its ancestors and back through the same relation.
			if (!segments.every((segment, index) => segment === this.branchValue[index]))
				this.branchValue = [...segments]
			this.contextValue = context
			this.currentValue = segments.length
			this.statusValue = 'ready'
			this.changed()
			return true
		}
		catch (error) {
			if (this.disposed || (generation !== this.generation))
				return false
			this.statusValue = 'error'
			this.failed(error)
			this.changed()
			return false
		}
	}

	private async load(path: string, signal: AbortSignal): Promise<ObjectContext>
	{
		const cached = this.contexts.get(path)
		if (cached)
			return structuredClone(cached)
		const context = await loadContext(this.provider, this.root, path, signal)
		if (!this.disposed && !signal.aborted)
			this.contexts.set(path, structuredClone(context))
		return context
	}

}
