import { PropertySelect }             from '../property-select.js'
import type { PropertySelectOptions } from '../property-select.js'
import type { SearchResult }          from '../property-select.js'
import { PointerTransport }           from './pointer-transport.js'

export type PropertySelectViewOptions = { templateUrl?: string | URL }

/** Owns one mounted controller and its DOM. Importing this module never activates a host. */
export class PropertySelectView
{

	private readonly abort = new AbortController()
	private breadcrumb?: HTMLElement
	private disposed = false
	private fingerprint = ''
	private readonly labels = new Map<string, string>()
	private list?: HTMLElement
	private mounting?: Promise<boolean>
	private query?: HTMLInputElement
	private root?: HTMLElement
	private resize?: ResizeObserver
	private readonly rows = new Map<string, HTMLLIElement>()
	private searchScope = ''
	private scrollScope = ''
	private shortcuts?: HTMLElement
	private transport?: PointerTransport
	private persistence?: HTMLElement
	private status?: HTMLElement
	private unsubscribe?: () => void

	readonly selector: PropertySelect

	constructor(
		private readonly host: HTMLElement, options: PropertySelectOptions,
		private readonly viewOptions: PropertySelectViewOptions = {}
	)
	{
		this.selector = new PropertySelect(options)
	}

	dispose(): void
	{
		if (this.disposed)
			return
		this.disposed = true
		this.transport?.dispose()
		this.abort.abort()
		this.resize?.disconnect()
		this.unsubscribe?.()
		this.selector.dispose()
		this.root?.remove()
		this.breadcrumb = this.list = this.root = this.status = undefined
		this.unsubscribe = undefined
		this.labels.clear()
		this.rows.clear()
		this.query = undefined
	}

	mount(): Promise<boolean>
	{
		if (this.disposed)
			throw new Error('The selector view is disposed')
		return this.mounting ||= this.initialise()
	}

	private activate(event: MouseEvent): void
	{
		const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]')
		if (!button || !this.root?.contains(button))
			return
		event.stopPropagation()
		this.status!.textContent = ''
		if (button.dataset.action === 'retry') {
			void this.selector.flushState().catch(() => {})
			return
		}
		if (button.dataset.action === 'clear') {
			this.selector.setQuery('')
			this.query!.focus()
			return
		}
		const path = button.dataset.path!
		const action = button.dataset.action
		const operation = action === 'shortcut' ? this.selector.shortcut(path)
			: action === 'navigate' ? this.selector.navigate(path)
			: action === 'select' ? this.selector.select(path) : this.selector.activate(path)
		void operation.catch(() => {
			if (!this.disposed)
				this.status!.textContent = this.selector.translate('Unable to complete the operation. Try again.')
		})
	}

	private button(label: string, action: string, path: string): HTMLButtonElement
	{
		const button = this.host.ownerDocument.createElement('button')
		button.type = 'button'
		button.textContent = label
		button.dataset.action = action
		button.dataset.path = path
		button.dataset.focus = `${action}:${path}`
		return button
	}

	private async initialise(): Promise<boolean>
	{
		try {
			const response = await fetch(this.viewOptions.templateUrl ?? new URL('./property-select.html', import.meta.url), {
				signal: this.abort.signal
			})
			if (!response.ok)
				throw new Error(`Unable to load selector template (${response.status})`)
			const markup = await response.text()
			if (this.disposed)
				return false
			const template = this.host.ownerDocument.createElement('template')
			template.innerHTML = markup
			this.root = template.content.firstElementChild as HTMLElement
			this.breadcrumb = this.root.querySelector('.ps-breadcrumb') as HTMLElement
			this.list = this.root.querySelector('.ps-properties') as HTMLElement
			this.status = this.root.querySelector('.ps-status') as HTMLElement
			this.shortcuts = this.root.querySelector('.ps-suggestions') as HTMLElement
			this.persistence = this.root.querySelector('.ps-persistence') as HTMLElement
			this.query = this.root.querySelector('.ps-query') as HTMLInputElement
			this.query.setAttribute('aria-label', this.selector.translate('Search properties'))
			this.root.querySelector('.ps-clear')!.textContent = this.selector.translate('Clear')
			this.query.addEventListener('input', () => this.selector.setQuery(this.query!.value), {
				signal: this.abort.signal
			})
			this.root.setAttribute('aria-label', this.selector.translate('Property selection'))
			this.breadcrumb.setAttribute('aria-label', this.selector.translate('Object path'))
			this.list.setAttribute('aria-label', this.selector.translate('Properties'))
			for (const [element, key] of [[this.breadcrumb, 'breadcrumb'], [this.list, 'properties']] as const) {
				element.addEventListener('scroll', () => {
					if (this.selector.status !== 'ready' || this.selector.search.status === 'loading') return
					this.selector.setScroll(key === 'breadcrumb' ? key : this.scrollKey(), {
						left: element.scrollLeft, top: element.scrollTop
					})
				}, { passive: true, signal: this.abort.signal })
			}
			this.root.addEventListener('click', event => this.activate(event), { signal: this.abort.signal })
			this.root.addEventListener('focusout', event => {
				if (!(event.target as Element).closest('.ps-property[data-retained]'))
					return
				setTimeout(() => {
					if (!this.disposed) {
						this.fingerprint = ''
						this.render()
					}
				}, 0)
			}, { signal: this.abort.signal })
			this.unsubscribe = this.selector.subscribe(event => {
				if (event.type === 'error') {
					this.renderPersistence()
					this.status!.textContent = event.error instanceof Error ? event.error.message
						: this.selector.translate('Unable to complete the operation. Try again.')
				}
				if (event.type === 'change')
					this.render()
			})
			this.host.append(this.root)
			this.transport = new PointerTransport(this.root, this.selector)
			this.resize = new ResizeObserver(() => this.restoreScroll())
			this.resize.observe(this.list)
			this.resize.observe(this.breadcrumb)
			return await this.selector.mount()
		}
		catch (error) {
			if (this.disposed)
				return false
			this.dispose()
			throw error
		}
	}

	private scrollKey(): string
	{
		return `properties:${this.selector.path}:${this.selector.snapshot().query}`
	}

	private restoreScroll(): void
	{
		if (!this.list?.clientHeight || this.selector.search.status === 'loading') return
		const state = this.selector.snapshot()
		const position = state.scroll[this.scrollKey()] ?? { left: 0, top: 0 }
		this.list.scrollLeft = position.left
		this.list.scrollTop = position.top
		if (this.breadcrumb) this.breadcrumb.scrollLeft = state.scroll.breadcrumb?.left ?? 0
	}

	private renderPersistence(): void
	{
		if (!this.persistence) return
		this.persistence.replaceChildren()
		if (this.selector.persistenceError) {
			this.persistence.append(this.selector.translate('Unable to save selector state. '),
				this.button(this.selector.translate('Retry'), 'retry', ''))
		}
	}

	private render(): void
	{
		this.renderPersistence()
		const context = this.selector.context
		const state = this.selector.snapshot()
		const search = this.selector.search
		this.query!.value = state.query
		this.root!.dataset.searchStatus = search.status
		this.root!.setAttribute('aria-busy', String(this.selector.status === 'loading' || search.status === 'loading'))
		if (this.selector.status === 'loading')
			this.status!.textContent = this.selector.translate('Loading properties…')
		else if (this.selector.status === 'ready')
			this.status!.textContent = ''
		if (search.status !== 'idle') {
			const messages = {
				complete: '', empty: 'No matching properties.', error: 'Search failed. Change the query to retry.',
				limited: 'Search limit reached. Refine your query.', loading: 'Searching properties…'
			}
			this.status!.textContent = this.selector.translate(messages[search.status])
		}
		if (!context)
			return
		if (!this.labels.has(context.path))
			this.labels.set(context.path, context.label || context.type)
		for (const property of context.properties)
			if (property.kind === 'relation')
				this.labels.set(property.path, property.label || property.name)
		const searchScope = (search.status !== 'idle') && (search.visited > 0) && (this.selector.status !== 'loading')
			? JSON.stringify([context.path, state.query]) : ''
		const retainFocus = !!searchScope && (searchScope === this.searchScope)
		this.searchScope = searchScope
		const fingerprint = JSON.stringify([
			context, state.branch, state.current, state.query, search.results, search.status, this.selector.suggestions
		])
		if (fingerprint === this.fingerprint)
			return
		this.fingerprint = fingerprint
		this.shortcuts!.replaceChildren(...this.selector.suggestions.map(item =>
			this.button(item.label, 'shortcut', item.path)))
		const active = this.host.ownerDocument.activeElement as HTMLElement | null
		const focus = this.root!.contains(active) ? active?.dataset.focus : undefined
		const left = this.breadcrumb!.scrollLeft
		this.breadcrumb!.replaceChildren()
		const paths = ['', ...state.branch.map((_, index) => state.branch.slice(0, index + 1).join('.'))]
		for (const [index, path] of paths.entries()) {
			const button = this.button(this.labels.get(path) || state.branch[index - 1], 'navigate', path)
			button.className = 'ps-level'
			button.dataset.position = index < state.current ? 'ancestor' : index > state.current ? 'descendant' : 'current'
			if (index === state.current)
				button.setAttribute('aria-current', 'location')
			this.breadcrumb!.append(button)
		}
		this.breadcrumb!.scrollLeft = state.scroll.breadcrumb?.left ?? left
		let results: readonly SearchResult[] = search.status === 'idle'
			? context.properties.map(property => ({ depth: 0, property, segments: [] })) : search.results
		const focusedRow = active?.closest<HTMLLIElement>('.ps-property')
		const retained = retainFocus && focusedRow && this.list!.contains(focusedRow)
			&& !results.some(result => result.property.path === focusedRow.dataset.path) ? focusedRow : undefined
		// Retain only within the same active search, never across navigation or clearing the query.
		// Keep an actively used result available when a better late match reaches the display budget.
		// Replace the last unfocused row, then release the retained row when focus leaves it.
		if (retained && results.length)
			results = results.slice(0, -1)
		const pathsPresent = new Set(results.map(result => result.property.path))
		if (retained) {
			retained.dataset.retained = 'true'
			pathsPresent.add(retained.dataset.path!)
		}
		for (const [path, row] of this.rows)
			if (!pathsPresent.has(path)) {
				row.remove()
				this.rows.delete(path)
			}
		for (const [index, result] of results.entries()) {
			const property = result.property
			const key = JSON.stringify([property, result.segments])
			let row = this.rows.get(property.path)
			if (!row || row.dataset.content !== key) {
				const replacement = this.row(result)
				replacement.dataset.content = key
				row?.replaceWith(replacement)
				row = replacement
				this.rows.set(property.path, row)
			}
			delete row.dataset.retained
			const before = this.list!.children[index]
			if (before !== row)
				this.list!.insertBefore(row, before || null)
		}
		if (retained && (this.list!.lastElementChild !== retained))
			this.list!.append(retained)
		const scrollKey = this.scrollKey()
		if (this.scrollScope !== scrollKey || search.status !== 'loading') {
			this.scrollScope = scrollKey
			const position = state.scroll[scrollKey] ?? { left: 0, top: 0 }
			this.list!.scrollLeft = position.left
			this.list!.scrollTop = position.top
		}
		if (focus) {
			const buttons = Array.from(this.root!.querySelectorAll<HTMLElement>('[data-focus]'))
			const target = buttons.find(button => button.dataset.focus === focus)
				|| this.list!.querySelector<HTMLButtonElement>('button')
			if (target && (target !== this.host.ownerDocument.activeElement))
				target.focus({ preventScroll: true })
		}
	}

	private row(result: SearchResult): HTMLLIElement
	{
		const property = result.property
		const row = this.host.ownerDocument.createElement('li')
		row.className = 'ps-property'
		row.dataset.kind = property.kind
		row.dataset.path = property.path
		const label = property.label || property.name
		const main = this.button(label, property.kind === 'relation' ? 'navigate' : 'select', property.path)
		main.className = 'ps-main'
		main.dataset.focus = `main:${property.path}`
		if (property.kind === 'relation') {
			const chevron = this.host.ownerDocument.createElement('span')
			chevron.className = 'ps-chevron'
			chevron.setAttribute('aria-hidden', 'true')
			chevron.textContent = '›'
			main.append(chevron)
		}
		const add = this.button('+', 'select', property.path)
		add.className = 'ps-add'
		add.setAttribute('aria-label', `${this.selector.translate('Select')} ${label}`)
		row.append(main, add)
		if (result.segments.length) {
			const path = this.host.ownerDocument.createElement('div')
			path.className = 'ps-result-path'
			for (const [index, segment] of result.segments.entries()) {
				if (index)
					path.append(' › ')
				const button = this.button(segment.label, 'navigate', segment.path)
				button.dataset.focus = `segment:${property.path}:${segment.path}`
				path.append(button)
			}
			row.append(path)
		}
		return row
	}

}
