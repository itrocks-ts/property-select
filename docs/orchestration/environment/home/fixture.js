import { rightPaneOf } from '/@itrocks/home/right-pane.js'

const pane = rightPaneOf()
const owner = {}
let handle, token
const button = (id, action) => document.getElementById(id).addEventListener('click', action)
button('register', () => {
	const content = document.createElement('section')
	content.innerHTML = '<nav aria-label="Example breadcrumb" style="overflow:auto;white-space:nowrap">'
		+ Array.from({ length: 16 }, (_, index) => `<a href="#item-${index}">Branch ${index} / </a>`).join('')
		+ '</nav><label>Recipe search <input id="recipe-search" value="remember me"></label>'
		+ '<button id="recipe-choice" type="button">Example choice</button>'
		+ '<button id="pane-suspend" type="button">Suspend pane</button>'
		+ '<ol>' + Array.from({ length: 80 }, (_, index) => `<li>Example item ${index}</li>`).join('') + '</ol>'
	handle = pane.register(owner, content, 'Generic recipe content')
	handle.subscribe(state => { document.getElementById('pane-state').textContent = JSON.stringify(state) })
	content.querySelector('#pane-suspend').addEventListener('click', () => { token = handle.suspend() })
})
button('main-action', () => { document.getElementById('main-result').value ++ })
button('suspend', () => { token = handle?.suspend() })
button('restore', () => token?.restore())
button('remove', () => handle?.remove())
button('compete', () => {
	try { pane.register({}, document.createElement('div'), 'Other owner') }
	catch (error) { document.getElementById('pane-state').textContent = error.name }
})
window.paneRecipe = { pane, get handle() { return handle } }
