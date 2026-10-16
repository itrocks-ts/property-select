import { PropertySelectView } from '/assets/front/property-select.js'
import { staticProvider } from './catalogue.js'

const host = document.querySelector('#selector')
const log = document.querySelector('#intentions')
const lifecycle = document.querySelector('#lifecycle')
let view

async function mount()
{
	if (view)
		return
	view = new PropertySelectView(host, { metadata: staticProvider(), root: 'invoice', stateMode: 'instance' })
	view.selector.subscribe(event => {
		if (['select', 'begin', 'move', 'end', 'cancel'].includes(event.type)) {
			const item = document.createElement('li')
			item.textContent = event.intent?.path ?? event.id
			item.dataset.id = event.intent?.id ?? event.id
			item.dataset.type = event.type
			log.append(item)
		}
	})
	lifecycle.textContent = 'Mounted'
	try {
		await view.mount()
	}
	catch (error) {
		lifecycle.textContent = error.message
		view = undefined
	}
}

document.querySelector('#mount').addEventListener('click', () => void mount())
document.querySelector('#dispose').addEventListener('click', () => {
	view?.dispose()
	view = undefined
	lifecycle.textContent = 'Disposed'
})
void mount()
