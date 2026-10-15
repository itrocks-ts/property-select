import { PropertySelect }             from '../property-select.js'
import type { PropertySelectOptions } from '../property-select.js'

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
	private root?: HTMLElement
	private status?: HTMLElement
	private unsubscribe?: () => void

	readonly selector: PropertySelect

	constructor(private readonly host: HTMLElement, options: PropertySelectOptions)
	{
		this.selector = new PropertySelect(options)
	}

	dispose(): void
	{
		if (this.disposed)
			return
		this.disposed = true
		this.abort.abort()
		this.unsubscribe?.()
		this.selector.dispose()
		this.root?.remove()
		this.breadcrumb = this.list = this.root = this.status = undefined
		this.unsubscribe = undefined
		this.labels.clear()
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
		const path = button.dataset.path!
		const action = button.dataset.action
		const operation = action === 'navigate' ? this.selector.navigate(path)
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
			const response = await fetch(new URL('./property-select.html', import.meta.url), {
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
			this.root.setAttribute('aria-label', this.selector.translate('Property selection'))
			this.breadcrumb.setAttribute('aria-label', this.selector.translate('Object path'))
			this.list.setAttribute('aria-label', this.selector.translate('Properties'))
			this.root.addEventListener('click', event => this.activate(event), { signal: this.abort.signal })
			this.unsubscribe = this.selector.subscribe(event => {
				if (event.type === 'error')
					this.status!.textContent = this.selector.translate('Unable to complete the operation. Try again.')
				if (event.type === 'change')
					this.render()
			})
			this.host.append(this.root)
			return await this.selector.mount()
		}
		catch (error) {
			if (this.disposed)
				return false
			this.dispose()
			throw error
		}
	}

	private render(): void
	{
		const context = this.selector.context
		const state = this.selector.snapshot()
		this.root!.setAttribute('aria-busy', String(this.selector.status === 'loading'))
		if (this.selector.status === 'loading')
			this.status!.textContent = this.selector.translate('Loading properties…')
		else if (this.selector.status === 'ready')
			this.status!.textContent = ''
		if (!context)
			return
		if (!this.labels.has(context.path))
			this.labels.set(context.path, context.label || context.type)
		for (const property of context.properties)
			if (property.kind === 'relation')
				this.labels.set(property.path, property.label || property.name)
		const fingerprint = JSON.stringify([context, state.branch, state.current])
		if (fingerprint === this.fingerprint)
			return
		this.fingerprint = fingerprint
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
		this.breadcrumb!.scrollLeft = left
		this.list!.replaceChildren()
		for (const property of context.properties) {
			const row = this.host.ownerDocument.createElement('li')
			row.className = 'ps-property'
			row.dataset.kind = property.kind
			const label = property.label || property.name
			const main = this.button(label, 'activate', property.path)
			main.className = 'ps-main'
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
			this.list!.append(row)
		}
		if (focus) {
			const buttons = Array.from(this.root!.querySelectorAll<HTMLButtonElement>('button'))
			const target = buttons.find(button => button.dataset.focus === focus)
				|| this.list!.querySelector<HTMLButtonElement>('button')
			target?.focus({ preventScroll: true })
		}
	}

}
