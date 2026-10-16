import assert            from 'node:assert/strict'
import { mkdir }         from 'node:fs/promises'
import { writeFile }     from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PS_PLAYWRIGHT_MODULE
	|| '/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const output = process.env.PS_STATUS_OUTPUT || '/tmp/property-select/browser-status'
const url = process.env.PS_STATUS_URL || 'http://127.0.0.1:13982'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ chromiumSandbox: true, headless: true })
const proof = { assertions: [], browser: browser.version(), chromiumSandbox: true, url }
try {
	const page = await browser.newPage()
	await page.goto(url)
	proof.assertions = await page.evaluate(async () => {
		const { PropertySelectView } = await import('/assets/front/property-select.js')
		const assertions = []
		const check = (name, actual, expected) => assertions.push({ name, actual, expected })
		const host = document.createElement('div')
		document.body.prepend(host)
		let reject = true, failSave = false, holdSelection = false, revision = 0, completeSelection
		let rejection = Error('Column failed'), storageError = Error('Storage failed')
		const terminal = { kind: 'terminal', label: 'Note', name: 'note', order: 0, path: 'note' }
		const relation = { kind: 'relation', label: 'Child', name: 'child', order: 1, path: 'child', target: 'Child' }
		const metadata = {
			async context(_root, path) {
				return { label: 'Example', path, properties: path ? [{ ...terminal, path: 'child.note' }]
					: [terminal, relation], type: 'Example' }
			},
			async resolve(_root, path) { return path === 'child' ? relation : { ...terminal, path } }
		}
		const saved = { branch: ['child'], current: 1, query: 'Note', recent: ['child'], scroll: {}, version: 1 }
		const store = {
			async read() { return { revision, state: saved } },
			async write(_key, state) {
				if (failSave) throw storageError
				return { revision: ++ revision, state }
			},
			async remove() { return { revision: ++ revision } }
		}
		const view = new PropertySelectView(host, { metadata, root: 'example', stateKey: 'status',
			stateMode: 'session', stateStore: store,
			consumer: { async select(intent) {
				if (reject) throw rejection
				if (holdSelection) await new Promise(resolve => { completeSelection = resolve })
				return { ...intent, status: 'added' }
			} } })
		const status = () => host.querySelector('.ps-status').textContent
		try {
			await view.mount()
			await view.selector.flushState()
			const before = view.selector.snapshot()
			await view.selector.select('child.note')
			check('selection failure is visible', status(), 'Column failed')
			for (let index = 0; index < 3; index ++) {
				view.selector.setScroll('properties::', { left: 0, top: index + 1 })
				await view.selector.flushState()
				check('scroll and successful save retain selection error ' + index, status(), 'Column failed')
			}
			check('failure preserves branch/query/recents', { ...view.selector.snapshot(), scroll: {} },
				{ ...before, scroll: {} })
			failSave = true
			view.selector.setScroll('properties::', { left: 0, top: 4 })
			await view.selector.flushState().catch(() => {})
			check('storage failure retains consumer error', status(), 'Column failed')
			check('storage failure presents adapter message',
				host.querySelector('.ps-persistence').textContent, 'Storage failed Retry')
			check('storage failure has its retry', !!host.querySelector('[data-action="retry"]'), true)
			for (const [error, expected] of [
				[Error('The selector session has ended. Reload the page.'),
					'The selector session has ended. Reload the page.'],
				[Error('<img src=x onerror="window.psInjected=true">'), '<img src=x onerror="window.psInjected=true">'],
				[Error('   '), 'Unable to save selector state.'],
				[{ message: 'untrusted unknown shape' }, 'Unable to save selector state.']
			]) {
				storageError = error
				await view.selector.flushState().catch(() => {})
				check('adapter recovery or fallback is rendered: ' + expected,
					host.querySelector('.ps-persistence').textContent, expected + ' Retry')
				check('storage retry failure preserves operation message: ' + expected, status(), 'Column failed')
				check('adapter message cannot create markup: ' + expected,
					host.querySelector('.ps-persistence img') === null && !window.psInjected, true)
			}
			failSave = false
			host.querySelector('[data-action="retry"]').click()
			await view.selector.flushState()
			check('storage recovery retains consumer error', status(), 'Column failed')
			check('storage recovery clears storage message', host.querySelector('.ps-persistence').textContent, '')
			reject = false
			holdSelection = true
			const retry = view.selector.select('child.note')
			while (!completeSelection) await new Promise(resolve => setTimeout(resolve, 0))
			check('retry clears the stale error before completion', status(), '')
			completeSelection()
			await retry
			check('successful retry clears error', status(), '')
			reject = true
			await view.selector.select('child.note')
			host.querySelector('.ps-query').value = 'absent'
			host.querySelector('.ps-query').dispatchEvent(new Event('input', { bubbles: true }))
			await new Promise(resolve => setTimeout(resolve, 40))
			check('new query shows ordinary empty-search message', status(), 'No matching properties.')
			host.querySelector('[data-action="clear"]').click()
			check('clear restores ordinary ready status', status(), '')
			await view.selector.select('child.note')
			const navigating = view.selector.navigate('')
			check('navigation shows loading message', status(), 'Loading properties…')
			await navigating
			check('successful navigation clears error', status(), '')
			rejection = undefined
			await view.selector.select('note')
			check('unknown failures retain the translated fallback', status(), 'Unable to complete the operation. Try again.')
		}
		finally { view.dispose(); host.remove() }
		return assertions
	})
	for (const assertion of proof.assertions)
		assert.deepEqual(assertion.actual, assertion.expected, assertion.name)
	proof.status = 'PASS'
}
finally {
	await browser.close()
	await writeFile(`${output}/results.json`, JSON.stringify(proof, null, 2) + '\n')
	console.log(proof.status || 'FAIL', proof.assertions.length, 'browser status assertions')
}
