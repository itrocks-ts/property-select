import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const { List }=require('@itrocks/list')
const { List: Listing }=require('@itrocks/list-properties')
const { Route,routeOf }=require('@itrocks/route')
class Record
{

	name=''
note=''

}
Route('/independent-record')(Record)
Listing('name','note')(Record)
const session={}, observations=[]
for(const [columns,expected] of [['note',['note']],['',[]],[[],[]],[[''],[]],['name',['name']],['missing',
	['name']],['',[]]]) {
	const list=new List(), counters={feed:0,filter:0,sort:0,template:0}
	for(const name of ['feed','filter','sort']) list[name].getParams=()=>{ counters[name]++
	throw Error(name+' unexpectedly reached') }
	list.htmlTemplateResponse=()=>{ counters.template++
	throw Error('template unexpectedly reached') }
	list.htmlResponse=(body,status)=>({body,status})
	assert.deepEqual(await list.html({type:Record,request:{data:{columns},session}}),{body:'',status:204})
	assert.deepEqual(session.list[routeOf(Record)].columns,expected)
	assert.deepEqual(counters,{feed:0,filter:0,sort:0,template:0})
	observations.push({columns,expected,counters})
}
for(const data of [{},{columns:undefined}]) {
	const list=new List(), sentinel=Error('render continuation')
	list.feed.getParams=()=>{assert.deepEqual(list.columns.serialize(),[])
	throw sentinel}
	await assert.rejects(list.html({type:Record,request:{data,session}}),e=>e===sentinel)
}
console.log(JSON.stringify({status:'PASS',observations,omittedAndUndefined:'render continuation, empty restored'},
	null,2))
