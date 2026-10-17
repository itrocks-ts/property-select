import { PropertySelect }             from '../property-select.js'
import type { PropertySelectOptions } from '../property-select.js'
import type { SearchResult }          from '../property-select.js'
import type { UsedProperty }          from '../property-select.js'
import { PointerTransport }           from './pointer-transport.js'

export type PropertySelectViewOptions = { template?: string; templateUrl?: string | URL }

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
	private operationError = ''
	private query?: HTMLInputElement
	private readonly related = new Map<string, UsedProperty>()
	private root?: HTMLElement
	private resize?: ResizeObserver
	private readonly restoredScroll = new WeakMap<HTMLElement, { left: number; top: number }>()
	private readonly rows = new Map<string, HTMLLIElement>()
	private scrollScope = ''
	private searchScope = ''
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
		this.related.clear()
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
		const button = (event.target as Element).closest<HTMLElement>('[data-action]')
		if (!button || !this.root?.contains(button))
			return
		event.stopPropagation()
		if (button instanceof HTMLInputElement)
			event.preventDefault()
		if (button.dataset.action === 'retry') {
			void this.selector.flushState().catch(() => {})
			return
		}
		this.operationError = ''
		this.status!.textContent = ''
		if (button.dataset.action === 'clear') {
			this.selector.setQuery('')
			this.query!.focus()
			return
		}
		const path = button.dataset.path!
		const action = button.dataset.action
		const operation = action === 'shortcut' ? this.selector.shortcut(path)
			: action === 'navigate' ? this.selector.navigate(path)
			: action === 'add' ? this.selector.select(path, 'add')
			: action === 'select' ? this.selector.select(path) : this.selector.activate(path)
		void operation.catch(() => {
			if (!this.disposed)
				this.status!.textContent = this.operationError
					= this.selector.translate('Unable to complete the operation. Try again.')
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
			let markup = this.viewOptions.template
			if (markup === undefined) {
				const url = this.viewOptions.templateUrl ?? new URL('./property-select.html', import.meta.url)
				const response = await fetch(url, { signal: this.abort.signal })
				if (!response.ok) throw new Error(`Unable to load selector template (${response.status})`)
				markup = await response.text()
			}
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
			this.query.addEventListener('input', () => {
				this.operationError = ''
				this.selector.setQuery(this.query!.value)
			}, { signal: this.abort.signal })
			for (const [element, key] of [[this.breadcrumb, 'breadcrumb'], [this.list, 'properties']] as const) {
				element.addEventListener('scroll', () => {
					const restored = this.restoredScroll.get(element)
					if (restored?.left === element.scrollLeft && restored.top === element.scrollTop) return
					this.restoredScroll.delete(element)
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
					// State saves have their own recoverable message and must not replace an operation error.
					if (this.selector.persistenceError === undefined || event.error !== this.selector.persistenceError)
						this.operationError = event.error instanceof Error ? event.error.message
							: this.selector.translate('Unable to complete the operation. Try again.')
					this.render()
				}
				if (event.type === 'begin' || event.type === 'select'
					|| (event.type === 'outcome' && ['added', 'existing', 'moved', 'removed'].includes(event.outcome.status))) {
					this.operationError = ''
					this.render()
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

	private positionScroll(element: HTMLElement, left: number, top: number): void
	{
		element.scrollLeft = left
		element.scrollTop = top
		// A restored offset may be clamped by the viewport; that is not a user state change.
		this.restoredScroll.set(element, { left: element.scrollLeft, top: element.scrollTop })
	}

	private restoreScroll(): void
	{
		if (!this.list?.clientHeight || this.selector.search.status === 'loading') return
		const state = this.selector.snapshot()
		const position = state.scroll[this.scrollKey()] ?? { left: 0, top: 0 }
		this.positionScroll(this.list, position.left, position.top)
		if (this.breadcrumb) this.positionScroll(this.breadcrumb, state.scroll.breadcrumb?.left ?? 0, 0)
	}

	private renderPersistence(): void
	{
		if (!this.persistence) return
		this.persistence.replaceChildren()
		const error = this.selector.persistenceError
		if (error) {
			const message = error instanceof Error && error.message.trim()
				? error.message : this.selector.translate('Unable to save selector state.')
			this.persistence.append(message + ' ',
				this.button(this.selector.translate('Retry'), 'retry', ''))
		}
	}

	private render(): void
	{
		this.renderPersistence()
		const context = this.selector.context
		const state = this.selector.snapshot()
		const search = this.selector.search
		if (context?.path || state.query || this.selector.status === 'loading')
			this.related.clear()
		if (this.query!.value !== state.query)
			this.operationError = ''
		this.query!.value = state.query
		this.root!.dataset.searchStatus = search.status
		this.root!.setAttribute('aria-busy', String(this.selector.status === 'loading' || search.status === 'loading'))
		if (this.selector.status === 'loading') {
			this.operationError = ''
			this.status!.textContent = this.selector.translate('Loading properties…')
		}
		else if (this.selector.status === 'ready')
			this.status!.textContent = ''
		if (search.status !== 'idle') {
			const messages = {
				complete: '', empty: 'No matching properties.', error: 'Search failed. Change the query to retry.',
				limited: 'Search limit reached. Refine your query.', loading: 'Searching properties…'
			}
			this.status!.textContent = this.selector.translate(messages[search.status])
		}
		if (this.operationError)
			this.status!.textContent = this.operationError
		if (!context)
			return
		for (const item of this.selector.branchContexts) {
			if (!this.labels.has(item.path))
				this.labels.set(item.path, item.label || item.type)
			for (const property of item.properties)
				if (property.kind === 'relation')
					this.labels.set(property.path, property.label || property.name)
		}
		const searchScope = (search.status !== 'idle') && (search.visited > 0) && (this.selector.status !== 'loading')
			? JSON.stringify([context.path, state.query]) : ''
		const retainFocus = !!searchScope && (searchScope === this.searchScope)
		this.searchScope = searchScope
		const usedPaths = this.selector.usedPaths
		if (!context.path && !state.query && this.selector.status === 'ready')
			for (const property of this.selector.usedProperties)
				this.related.set(property.path, property)
		const fingerprint = JSON.stringify([
			context, state.branch, state.current, state.query, search.results, search.status,
			this.selector.suggestions, usedPaths, this.selector.usedProperties, [...this.related.values()]
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
		this.positionScroll(this.breadcrumb!, state.scroll.breadcrumb?.left ?? left, 0)
		let results: readonly SearchResult[] = search.status === 'idle'
			? context.properties.map(property => ({ depth: 0, property, segments: [] })) : search.results
		if (search.status === 'idle')
			results = [...results].sort((a, b) =>
				(a.property.label || a.property.name).localeCompare(
					b.property.label || b.property.name,
					undefined, { sensitivity: 'base' }) || a.property.path.localeCompare(b.property.path))
		if (search.status === 'idle' && !context.path) {
			const related = [...this.related.values()]
			related.sort((a, b) => a.label.localeCompare(b.label,
				undefined, { sensitivity: 'base' }) || a.path.localeCompare(b.path))
			results = [...results, ...related.map(property => ({
				depth: 0,
				property: { ...property, label: property.segments.at(-1)!.label },
				segments: property.segments.slice(0, -1)
			}))]
		}
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
		const used = new Set(usedPaths)
		for (const [path, row] of this.rows)
		{
			row.classList.toggle('ps-used', used.has(path))
			row.querySelector<HTMLInputElement>('.ps-check')!.checked = used.has(path)
		}
		if (retained && (this.list!.lastElementChild !== retained))
			this.list!.append(retained)
		const scrollKey = this.scrollKey()
		if (this.scrollScope !== scrollKey || search.status !== 'loading') {
			this.scrollScope = scrollKey
			const position = state.scroll[scrollKey] ?? { left: 0, top: 0 }
			this.positionScroll(this.list!, position.left, position.top)
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
		const cell = this.host.ownerDocument.createElement('label')
		cell.className = 'ps-check-cell'
		const checkbox = this.host.ownerDocument.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.className = 'ps-check'
		checkbox.dataset.action = 'select'
		checkbox.dataset.path = property.path
		checkbox.dataset.focus = `check:${property.path}`
		checkbox.setAttribute('aria-label', `${this.selector.translate('Select')} ${label}`)
		cell.append(checkbox)
		row.append(cell)
		const segments = result.segments.filter(segment => segment.path)
		if (segments.length) {
			row.title = [...segments.map(segment => segment.label), label].join('.')
			for (const segment of segments) {
				const button = this.button(segment.label + '.', 'navigate', segment.path)
				button.className = 'ps-segment'
				button.dataset.focus = `segment:${property.path}:${segment.path}`
				row.append(button)
			}
		}
		row.append(main)
		return row
	}

}
