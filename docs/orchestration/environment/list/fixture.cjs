const { Action } = require('@itrocks/action')
const { dataSource } = require('@itrocks/storage')
const { List } = require('@itrocks/list')
const { List: ListProperties } = require('@itrocks/list-properties')
const { Route, routes } = require('@itrocks/route')
const { initStoreHtmlTransformers } = require('@itrocks/core-transformers')
const { frontScripts } = require('@itrocks/template')

class InvoiceList extends List
{

	async html(request)
	{
		return super.html(request, { active: true })
	}

	async json(request)
	{
		return super.json(request, { active: true })
	}

}

const observations = []
class ListObservation extends Action
{
	async json() { return this.jsonResponse(observations) }
}
module.exports = { InvoiceList, ListObservation }
module.exports.ready = (async () => {
	const { models } = await import('../models/load.mjs')
	Object.assign(module.exports, models)
	for (const type of Object.values(models)) initStoreHtmlTransformers(type)
	ListProperties('number', 'amount')(models.Invoice)
	Route('/property-select-invoice')(models.Invoice)
	const destination = '/node_modules/@itrocks/property-select/docs/orchestration/environment/list/fixture.cjs'
	routes.add('/property-select-invoice', destination + ':Invoice')
	routes.add('/property-select-invoice/list', destination + ':InvoiceList')
	routes.add('/property-select-observation/probe', destination + ':ListObservation')
	const dao = dataSource()
	await dao.connect()
	const query = dao.connection.query.bind(dao.connection)
	dao.connection.query = async (...args) => {
		observations.push({ sql: args[0], values: args[1] })
		return query(...args)
	}
	frontScripts.push('/@itrocks/property-select/property-select.js')
})()
