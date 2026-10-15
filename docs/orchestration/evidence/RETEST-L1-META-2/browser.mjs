import assert from 'node:assert/strict'
import fs from 'node:fs'
const {chromium}=await import(process.env.PS_PLAYWRIGHT_MODULE)
const base=process.env.PS_METADATA_URL, journal='/tmp/showtime-property-select-env/queries.log'
const result={base,viewport:{width:1280,height:720},sandbox:true,checks:[]}
const browser=await chromium.launch({chromiumSandbox:true,headless:true})
result.browser=browser.version()
const sqlStart=()=>fs.statSync(journal).size
const sqlSince=position=>fs.readFileSync(journal).subarray(position).toString()
const noSql=sql=>assert.doesNotMatch(sql,/\b(SELECT|INSERT|UPDATE|DELETE)\b/i)
try {
	const context=await browser.newContext({viewport:result.viewport}), page=await context.newPage()
	const errors=[], failures=[], responses=[]
	page.on('pageerror',error=>errors.push(error.message))
	page.on('requestfailed',request=>failures.push({url:request.url(),failure:request.failure()?.errorText}))
	page.on('response',response=>responses.push({url:response.url(),status:response.status()}))
	for(const route of ['/country','/country?offset=0']) {
		const response=await page.goto(base+route,{waitUntil:'networkidle'})
		assert.equal(response.status(),200)
		const text=await page.locator('body').innerText()
		assert.match(text,/Recipe France/)
		assert.match(text,/Recipe United Kingdom/)
		result.checks.push({case:'real navigation',url:page.url(),status:response.status(),text})
	}
	await page.evaluate(()=>{
		const form=document.createElement('form')
		form.id='independent-navigation'
		form.action='/country'
		form.method='get'
		form.innerHTML='<input aria-label="Page offset" name="offset"><button>Navigate country</button>'
		document.body.prepend(form)
	})
	await page.getByRole('textbox',{name:'Page offset'}).fill('0')
	await Promise.all([page.waitForURL(base+'/country?offset=0'),page.getByRole('button',{name:'Navigate country',
		exact:true}).click()])
	await page.waitForLoadState('networkidle')
	assert.match(await page.locator('body').innerText(),/Recipe France/)
	await page.evaluate(()=>{const a=document.createElement('a')
	a.id='independent-bare'
	a.href='/country'
	a.textContent='Bare country'
	document.body.prepend(a)})
	await Promise.all([page.waitForURL(base+'/country'),page.locator('#independent-bare').click()])
	await page.waitForLoadState('networkidle')
	result.checks.push({case:'trusted keyboard/input and anchor navigation',url:page.url()})
	for(const [offset,present,absent] of [[0,'Recipe France',null],[1,'Recipe United Kingdom','Recipe France'],[2,
		null,'Recipe United Kingdom']]) {
		const response=await page.request.get(base+'/country?offset='+offset,
			{headers:{'xhr-info':'{"visibleRows":1}'}}),body=await response.text()
		assert.equal(response.status(),200)
		if(present) assert.ok(body.includes(present))
		if(absent) assert.ok(!body.includes(absent))
		if(offset===2) assert.ok(!body.includes('Recipe France'))
		result.checks.push({case:'feed',offset,status:response.status(),body})
	}
	const probe=async()=>{const response=await page.request.get(base+'/column-save-probe/probe/json')
	assert.equal(response.status(),200)
	return response.json()}
	for(const [columns,expected] of [['name',['name']],['unknown',['name']],['',[]]]) {
		const prior=await probe(), position=sqlStart()
		const response=await page.request.get(base+'/country?'+new URLSearchParams({columns})), body=await response.body()
		assert.equal(response.status(),204)
		assert.equal(body.byteLength,0)
		const after=await probe(), sql=sqlSince(position)
		assert.deepEqual(after.attempts,prior.attempts)
		assert.deepEqual(after.columns,expected)
		noSql(sql)
		await page.reload({waitUntil:'networkidle'})
		const actual=await page.locator('thead th[data-property]').evaluateAll(nodes=>nodes.map(n=>n.dataset.property))
		assert.deepEqual(actual,expected)
		result.checks.push({case:'column save and full reload',columns,status:204,bodyBytes:body.byteLength,
			reads:after.attempts.length-prior.attempts.length,session:after.columns,rendered:actual,sql})
	}
	const isolated=await browser.newContext({viewport:result.viewport}), isolatedPage=await isolated.newPage()
	await isolatedPage.goto(base+'/country',{waitUntil:'networkidle'})
	assert.deepEqual(await isolatedPage.locator('thead th[data-property]').evaluateAll(nodes=>nodes.map(n=>
		n.dataset.property)),['name'])
	result.checks.push({case:'independent session',defaultColumns:['name']})
	await isolated.close()
	const badOffset=await page.request.get(base+'/country?offset=invalid')
	assert.equal(badOffset.status(),500)
	result.checks.push({case:'invalid explicit offset',status:badOffset.status()})
	const position=sqlStart()
	const metadata=await page.evaluate(async()=>{
		const records=[]
		const get=async(op,path='',root='invoice',catalogue)=>{
			const q=new URLSearchParams({root,path})
			if(catalogue) q.set('catalogue',catalogue)
			const url='/property-select/'+op+'/json?'+q,response=await fetch(url)
			const r={op,path,root,catalogue,url,status:response.status,cache:response.headers.get('cache-control'),
				type:response.headers.get('content-type'),body:await response.json()}
			records.push(r)
		}
		for(const op of ['context','resolve'])await get(op)
		for(const path of ['billing','delivery','billing.city.name','delivery.city.name','lines','lines.invoice',
			'tags','tags.invoices','tags.invoices.tags.invoices.number','self','unknown'])await get('resolve',path)
		for(const path of ['billing','delivery','lines','tags','tags.invoices'])await get('context',path)
		await get('context','','unregistered')
		await get('context','','__proto__')
		for(const op of ['context','resolve'])await get(op,'hidden')
		await get('resolve','billing.city.name','invoice','restricted')
		await get('context','billing.city','invoice','restricted')
		for(const path of ['billing..city','ambiguous.name','number.name'])await get('resolve',path)
		await get('context','unknown')
		await get('configuration')
		await get('configuration','','invoice','restricted')
		await get('context','','invoice','restricted')
		await get('configuration')
		return records
	})
	result.metadata=metadata
	for(const record of metadata) {assert.equal(record.cache,'no-store',record.url)
	assert.match(record.type,/application\/json/)}
	const rec=(op,path='',catalogue)=>metadata.find(r=>r.op===op&&r.path===path&&r.root==='invoice'&&
		r.catalogue===catalogue)
	const root=rec('context').body
	assert.deepEqual(rec('resolve').body,root)
	assert.equal(root.path,'')
	assert.equal(root.label,'invoice catalogue')
	assert.deepEqual(root.properties.slice(0,5).map(p=>p.name),['number','billing','delivery','lines','tags'])
	assert.equal(root.properties[0].label,'Invoice reference')
	for(const name of ['inherited','delivery','tags'])assert.ok(root.properties.some(p=>p.name===name))
	assert.ok(!root.properties.some(p=>['hidden','secret'].includes(p.name)))
	assert.equal(rec('resolve','billing').body.relation.cardinality,'unknown')
	assert.equal(rec('resolve','billing').body.relation.inverse,undefined)
	assert.equal(rec('resolve','self').body.relation.cardinality,'unknown')
	assert.equal(rec('resolve','unknown').body.kind,'terminal')
	assert.equal(rec('resolve','unknown').body.target,undefined)
	assert.equal(rec('resolve','lines').body.relation.cardinality,'one-to-many')
	assert.equal(rec('resolve','lines.invoice').body.relation.cardinality,'many-to-one')
	assert.equal(rec('resolve','lines').body.relation.inverse,rec('resolve','lines.invoice').body.relation.id)
	assert.equal(rec('resolve','lines.invoice').body.relation.inverse,rec('resolve','lines').body.relation.id)
	for(const path of ['tags','tags.invoices'])assert.equal(rec('resolve',path).body.relation.cardinality,'many-to-many')
	assert.equal(rec('resolve','tags.invoices').body.relation.inverse,rec('resolve','tags').body.relation.id)
	for(const path of ['billing.city.name','delivery.city.name',
		'tags.invoices.tags.invoices.number'])assert.equal(rec('resolve',path).body.path,path)
	assert.equal(rec('resolve','billing').body.target,rec('resolve','delivery').body.target)
	for(const path of ['billing','delivery','lines','tags','tags.invoices']) {
		const r=rec('context',path)
		assert.equal(r.status,200)
		assert.equal(r.body.path,path)
		assert.ok(r.body.properties.every(p=>p.path.startsWith(path+'.')))
	}
	const denials=metadata.filter(r=>r.root!=='invoice'||r.path==='hidden'||r.path.startsWith('billing.city')&&
		r.catalogue==='restricted')
	assert.equal(denials.length,6)
	for(const r of denials){assert.equal(r.status,403,r.url)
	assert.deepEqual(r.body,{error:'forbidden'})}
	for(const [op,path,error] of [['resolve','billing..city','invalid-path'],['resolve','ambiguous.name',
		'ambiguous-type'],['resolve','number.name','invalid-path'],['context','unknown','unknown-target']]) {
		const r=rec(op,path)
		assert.equal(r.status,400)
		assert.equal(r.body.error,error)
	}
	assert.deepEqual(rec('configuration').body,{advice:['billing','tags'],version:'fixture-1'})
	assert.deepEqual(rec('configuration','','restricted').body,{advice:['tags'],version:'fixture-1'})
	assert.ok(!rec('context','','restricted').body.properties.some(p=>p.name==='billing'))
	assert.deepEqual(metadata.at(-1).body,rec('configuration').body)
	await page.evaluate(async()=>{
		const {HttpMetadataProvider}=await import('/@itrocks/framework/property-select-metadata.js')
		const {PropertySelect}=await import('/@itrocks/property-select/property-select.js')
		window.retest={HttpMetadataProvider,PropertySelect,cancel:new AbortController()}
	})
	const abortRequest=page.waitForRequest(r=>r.url().includes('delay=950'))
	const abortFailed=page.waitForEvent('requestfailed',{predicate:r=>r.url().includes('delay=950')})
	await page.evaluate(()=>{
		const metadata=new window.retest.HttpMetadataProvider({fetch:(url,options)=>{const u=new URL(url,location.href)
		u.searchParams.set('delay','950')
		return fetch(u,options)}})
		window.retest.aborted=metadata.context('invoice','billing',window.retest.cancel.signal).then(()=>
			'unexpected success',e=>e.name)
	})
	result.abortStarted=(await abortRequest).url()
	await page.evaluate(()=>window.retest.cancel.abort())
	assert.equal(await page.evaluate(()=>window.retest.aborted),'AbortError')
	assert.equal((await abortFailed).failure().errorText,'net::ERR_ABORTED')
	await page.evaluate(async()=>{
		const metadata=new window.retest.HttpMetadataProvider({fetch:(url,options)=>{
			const u=new URL(url,location.href)
			if(u.searchParams.get('path')==='billing')u.searchParams.set('delay','750')
			return fetch(u,{...options,signal:undefined})
		}})
		window.retest.controller=new window.retest.PropertySelect({metadata,root:'invoice'})
		await window.retest.controller.mount()
	})
	const staleRequest=page.waitForRequest(r=>r.url().includes('delay=750'))
	const staleResponse=page.waitForResponse(r=>r.url().includes('delay=750'))
	await page.evaluate(()=>{window.retest.old=window.retest.controller.navigate('billing')})
	result.staleStarted=(await staleRequest).url()
	result.stale=await page.evaluate(async()=>{
		const controller=window.retest.controller,newer=await controller.navigate('delivery'),older=await window.retest.old
		const state={newer,older,path:controller.path,status:controller.status}
		controller.dispose()
		return state
	})
	const late=await staleResponse
	await late.finished()
	assert.equal(late.status(),200)
	assert.deepEqual(result.stale,{newer:true,older:false,path:'delivery',status:'ready'})
	result.metadataGuard=await page.request.get(base+'/property-select-probe/probe/json').then(r=>r.json())
	assert.deepEqual(result.metadataGuard,{attempts:[],constructions:0,reads:0})
	result.metadataSql=sqlSince(position)
	noSql(result.metadataSql)
	assert.deepEqual(errors,[])
	result.errors=errors
	result.failures=failures
	result.responses=responses
	result.status='PASS'
	console.log(JSON.stringify(result,null,2))
} finally {await browser.close()}
