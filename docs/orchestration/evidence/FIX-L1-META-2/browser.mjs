import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const { chromium } = await import(process.env.PS_PLAYWRIGHT_MODULE)
const origin = process.env.PS_METADATA_URL
const journal = '/tmp/showtime-property-select-env/queries.log'
const browser = await chromium.launch({ headless: true, chromiumSandbox: true })
const observations = { browser: browser.version(), sandbox: true, origin, viewport: { width: 1280, height: 720 } }
try {
    const page = await browser.newPage({ viewport: observations.viewport })
    const failures = [], errors = [], network = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }))
    page.on('response', response => network.push({ url: response.url(), status: response.status() }))
    observations.countries = []
    for (const suffix of ['/country', '/country?offset=0']) {
        const response = await page.goto(origin + suffix, { waitUntil: 'networkidle' })
        assert.equal(response.status(), 200)
        const text = await page.locator('body').innerText()
        for (const name of ['Recipe France', 'Recipe United Kingdom']) assert.ok(text.includes(name), suffix + name)
        observations.countries.push({ url: page.url(), status: response.status(), text })
    }
    // The harness supplies a normal anchor; Chromium's trusted click drives a real control-route navigation.
    await page.evaluate(() => {
        const link = document.createElement('a')
        link.href = '/country'
        link.textContent = 'Independent control navigation'
        link.id = 'retest-country-navigation'
        document.body.prepend(link)
    })
    await page.locator('#retest-country-navigation').click()
    await page.waitForURL(origin + '/country')
    await page.waitForLoadState('networkidle')
    assert.match(await page.locator('body').innerText(), /Recipe United Kingdom/)
    observations.clickedControlRoute = page.url()
    observations.pagination = []
    for (const [path, expected, absent] of [
        ['/country?offset=1', 'Recipe United Kingdom', 'Recipe France'],
        ['/country?offset=0', 'Recipe France', undefined],
        ['/country?offset=2', undefined, 'Recipe France']
    ]) {
        const response = await page.request.get(origin + path, { headers: { 'xhr-info': '{"visibleRows":1}' } })
        assert.equal(response.status(), 200)
        const text = await response.text()
        if (expected) assert.ok(text.includes(expected), path)
        if (absent) assert.ok(!text.includes(absent), path)
        observations.pagination.push({ path, status: response.status(), expected, absent, text })
    }
    const before = readFileSync(journal).length
    observations.metadata = await page.evaluate(async () => {
        const output = []
        const request = async (operation, root, path = '', extra = {}) => {
            const url = '/property-select/' + operation + '/json?' + new URLSearchParams({ root, path, ...extra })
            const response = await fetch(url)
            const result = { url, status: response.status, cache: response.headers.get('cache-control'),
                contentType: response.headers.get('content-type'), body: await response.json() }
            output.push(result)
            return result
        }
        await request('context', 'invoice')
        await request('resolve', 'invoice')
        for (const path of ['billing', 'billing.city.name', 'delivery.city.name', 'lines', 'lines.invoice',
            'tags', 'tags.invoices', 'tags.invoices.tags.invoices.number', 'unknown']) {
            await request('resolve', 'invoice', path)
        }
        await request('context', 'invoice', 'billing')
        await request('context', 'invoice', 'tags')
        for (const [operation, root, path, extra] of [
            ['context', 'not-registered', ''], ['context', '__proto__', ''],
            ['resolve', 'invoice', 'hidden'], ['context', 'invoice', 'hidden'],
            ['resolve', 'invoice', 'billing.city.name', { catalogue: 'restricted' }],
            ['context', 'invoice', 'billing.city', { catalogue: 'restricted' }],
            ['resolve', 'invoice', 'billing..city'], ['resolve', 'invoice', 'ambiguous.name'],
            ['context', 'invoice', 'unknown'], ['resolve', 'invoice', 'number.name']
        ]) await request(operation, root, path, extra)
        await request('configuration', 'invoice')
        await request('context', 'invoice', '', { catalogue: 'restricted' })
        await request('configuration', 'invoice', '', { catalogue: 'restricted' })
        await request('configuration', 'invoice')
        return output
    })
    const records = observations.metadata
    for (const record of records) {
        assert.equal(record.cache, 'no-store', record.url)
        assert.match(record.contentType, /application\/json/)
    }
    const get = (operation, path = '', extra = '') => records.find(record =>
        record.url === '/property-select/' + operation + '/json?' + new URLSearchParams({ root: 'invoice', path }) + extra)
    const context = get('context').body
    assert.deepEqual(get('resolve').body, context)
    assert.equal(context.label, 'invoice catalogue')
    assert.deepEqual(context.properties.slice(0, 5).map(p => p.name), ['number', 'billing', 'delivery', 'lines', 'tags'])
    assert.equal(context.properties[0].label, 'Invoice reference')
    assert.ok(context.properties.some(p => p.name === 'inherited'))
    assert.ok(context.properties.some(p => p.name === 'delivery'))
    assert.ok(!context.properties.some(p => p.name === 'hidden'))
    assert.deepEqual(get('resolve', 'billing').body.relation.cardinality, 'unknown')
    assert.equal(get('resolve', 'billing').body.relation.inverse, undefined)
    assert.equal(get('resolve', 'unknown').body.target, undefined)
    assert.equal(get('resolve', 'unknown').body.kind, 'terminal')
    assert.equal(get('resolve', 'lines').body.relation.cardinality, 'one-to-many')
    assert.equal(get('resolve', 'lines.invoice').body.relation.inverse, get('resolve', 'lines').body.relation.id)
    assert.equal(get('resolve', 'tags').body.relation.cardinality, 'many-to-many')
    assert.equal(get('resolve', 'tags.invoices').body.relation.inverse, get('resolve', 'tags').body.relation.id)
    for (const path of ['billing.city.name', 'delivery.city.name', 'tags.invoices.tags.invoices.number']) {
        assert.equal(get('resolve', path).body.path, path)
    }
    assert.ok(get('context', 'billing').body.properties.every(p => p.path.startsWith('billing.')))
    const forbidden = records.filter(r => /not-registered|__proto__|hidden|billing.city.*restricted/.test(r.url))
    assert.equal(forbidden.length, 6)
    for (const record of forbidden) {
        assert.equal(record.status, 403, record.url)
        assert.deepEqual(record.body, { error: 'forbidden' })
    }
    for (const [operation, path, error] of [['resolve', 'billing..city', 'invalid-path'],
        ['resolve', 'ambiguous.name', 'ambiguous-type'], ['context', 'unknown', 'unknown-target'],
        ['resolve', 'number.name', 'invalid-path']]) {
        assert.equal(get(operation, path).status, 400)
        assert.equal(get(operation, path).body.error, error)
    }
    assert.deepEqual(get('configuration').body, { advice: ['billing', 'tags'], version: 'fixture-1' })
    assert.deepEqual(get('configuration', '', '&catalogue=restricted').body,
        { advice: ['tags'], version: 'fixture-1' })
    assert.ok(!get('context', '', '&catalogue=restricted').body.properties.some(p => p.name === 'billing'))
    assert.deepEqual(records.at(-1).body, get('configuration').body)
    const abortStarted = page.waitForRequest(request => request.url().includes('delay=800'))
    await page.evaluate(async () => {
        const { HttpMetadataProvider } = await import('/@itrocks/framework/property-select-metadata.js')
        const { PropertySelect } = await import('/@itrocks/property-select/property-select.js')
        window.testProvider = HttpMetadataProvider
        window.testController = PropertySelect
        window.testAbort = new AbortController()
        const provider = new HttpMetadataProvider({ fetch: (input, options) => {
            const url = new URL(input, location.href)
            url.searchParams.set('delay', '800')
            return fetch(url, options)
        } })
        window.testPending = provider.context('invoice', 'billing', window.testAbort.signal)
            .then(() => 'fulfilled', error => error.name)
    })
    // Actual request emission is observed outside the page before cancellation.
    observations.abortStarted = (await abortStarted).url()
    await page.evaluate(() => { window.testAbort.abort() })
    observations.abort = await page.evaluate(() => window.testPending)
    assert.equal(observations.abort, 'AbortError')
    await page.evaluate(async () => {
        const provider = new window.testProvider({ fetch: (input, options) => {
            const url = new URL(input, location.href)
            if (url.searchParams.get('path') === 'billing') url.searchParams.set('delay', '600')
            return fetch(url, { ...options, signal: undefined })
        } })
        window.testSelector = new window.testController({ metadata: provider, root: 'invoice' })
        await window.testSelector.mount()
    })
    const waiting = page.waitForRequest(request => request.url().includes('delay=600'))
    await page.evaluate(() => { window.testOld = window.testSelector.navigate('billing') })
    const request = await waiting
    observations.staleStarted = request.url()
    observations.stale = await page.evaluate(async () => {
        const newer = await window.testSelector.navigate('delivery')
        const old = await window.testOld
        const committed = window.testSelector.path
        const status = window.testSelector.status
        window.testSelector.dispose()
        return { newer, old, committed, status }
    })
    assert.deepEqual(observations.stale, { newer: true, old: false, committed: 'delivery', status: 'ready' })
    observations.probe = await page.request.get(origin + '/property-select-probe/probe/json').then(r => r.json())
    assert.deepEqual(observations.probe, { attempts: [], constructions: 0, reads: 0 })
    observations.metadataJournal = readFileSync(journal).subarray(before).toString()
    assert.ok(!/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(observations.metadataJournal))
    assert.ok(failures.some(r => r.url.includes('delay=800') && r.error === 'net::ERR_ABORTED'))
    assert.ok(network.some(r => r.url.includes('delay=600') && r.status === 200))
    assert.deepEqual(errors, [])
    observations.failures = failures
    observations.network = network
    observations.errors = errors
    observations.status = 'PASS'
    console.log(JSON.stringify(observations, null, 2))
} finally {
    await browser.close()
}
