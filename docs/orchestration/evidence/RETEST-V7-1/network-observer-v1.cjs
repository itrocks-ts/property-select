// Independent browser transport observer. Requests, responses and original signals remain unchanged.
const { writeFileSync } = require('node:fs')
const { chromium } = require('/home/baptiste/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const launch = chromium.launch.bind(chromium)
chromium.launch = async function(options)
{
	const browser = await launch(options)
	const proof = { fetches: [], failures: [], injections: [], browser: browser.version(), sandbox: options.chromiumSandbox }
	const pending = []
	let contextId = 0, pageId = 0
	const newContext = browser.newContext.bind(browser)
	browser.newContext = async function(options)
	{
		const context = await newContext(options)
		const cid = ++ contextId
		const pages = new WeakMap()
		await context.exposeBinding('retestV7Network', (source, record) =>
			proof.fetches.push({ context: cid, page: pages.get(source.page), ...record }))
		await context.addInitScript(() => {
			const original = window.fetch
			let id = 0
			window.fetch = function(input, options)
			{
				const number = ++ id
				const url = new URL(typeof input === 'string' ? input : input.url, location.href).href
				const method = options?.method || input.method || 'GET'
				const signal = options?.signal || input.signal
				const record = (event, extra = {}) => void window.retestV7Network({
					id: number, document: performance.timeOrigin, time: performance.timeOrigin + performance.now(),
					url, method, event, ...extra
				})
				record('start')
				if (signal?.aborted) record('abort')
				else signal?.addEventListener('abort', () => record('abort'), { once: true })
				const promise = original.apply(this, arguments)
				promise.then(response => record('response', { status: response.status }),
					error => record('rejected', { error: error.name }))
				return promise
			}
		})
		context.on('page', page => {
			const pid = ++ pageId
			pages.set(page, pid)
			const requests = new WeakMap()
			page.on('request', request => requests.set(request, Date.now()))
			page.on('requestfailed', request => pending.push((async () => {
				proof.failures.push({ context: cid, page: pid, url: request.url(), method: request.method(),
					start: request.timing().startTime || requests.get(request),
					status: (await request.response())?.status(), error: request.failure()?.errorText })
			})()))
			const route = page.route.bind(page)
			page.route = (url, handler, options) => route(url, async (actual, request) => {
				const abort = actual.abort.bind(actual)
				actual.abort = async reason => {
					proof.injections.push({ context: cid, page: pid, url: request.url(),
						method: request.method(), start: requests.get(request), reason: reason || 'failed' })
					return abort(reason)
				}
				return handler(actual, request)
			}, options)
		})
		return context
	}
	const close = browser.close.bind(browser)
	browser.close = async function()
	{
		await close()
		await Promise.all(pending)
		const used = new Set()
		for (const failure of proof.failures) {
			const candidates = proof.fetches.filter(record => record.context === failure.context
				&& record.page === failure.page && record.url === failure.url && record.method === failure.method
				&& record.event === 'start' && Math.abs(record.time - failure.start) < 100)
				.sort((a, b) => Math.abs(a.time - failure.start) - Math.abs(b.time - failure.start))
			const match = candidates[0]
			if (match && (!candidates[1] || Math.abs(match.time - failure.start)
				< Math.abs(candidates[1].time - failure.start))) {
				const key = `${match.context}:${match.page}:${match.document}:${match.id}`
				if (!used.has(key)) {
					used.add(key)
					failure.fetch = match
					const events = proof.fetches.filter(record => record.context === match.context
						&& record.page === match.page && record.document === match.document && record.id === match.id)
					failure.abort = events.find(record => record.event === 'abort')
					failure.response = events.find(record => record.event === 'response')
				}
			}
			failure.injection = proof.injections.find(record => record.context === failure.context
				&& record.page === failure.page && record.url === failure.url
				&& Math.abs(record.start - failure.start) < 100)
			failure.attribution = failure.error === 'net::ERR_ABORTED' && failure.abort ? 'product AbortSignal'
				: failure.error === 'net::ERR_ABORTED' && failure.status === 204 && failure.response?.status === 204
					? 'completed bodyless HTTP 204'
					: failure.error === 'net::ERR_FAILED' && failure.injection ? 'explicit fixture abort' : 'UNCLASSIFIED'
		}
		proof.status = proof.failures.every(record => record.attribution !== 'UNCLASSIFIED') ? 'PASS' : 'FAIL'
		writeFileSync(process.env.PS_RETEST_NETWORK, JSON.stringify(proof, null, 2) + '\n')
		if (proof.status !== 'PASS') process.exitCode = 1
	}
	return browser
}
