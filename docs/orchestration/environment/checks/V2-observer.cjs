const { Action } = require('@itrocks/action')
const { ListColumn } = require('@itrocks/list/projection')
const { routes } = require('@itrocks/route')
const fixture = require('../list/fixture.cjs')
const observations = []

class RenderObservation extends Action
{
	async json() { return this.jsonResponse(observations) }
}
module.exports = { RenderObservation }
module.exports.ready = (async () => {
	await fixture.ready
	const { models } = await import('../models/load.mjs')
	const output = ListColumn.prototype.output
	ListColumn.prototype.output = async function (cell) {
		const html = await output.call(this, cell)
		if (this.name === 'customer.address.city') observations.push({
			kind: cell.kind,
			cityPrototype: cell.kind === 'value' ? cell.value instanceof models.City : null,
			countryPrototype: cell.kind === 'value' ? cell.value.country instanceof models.Country : null,
			loadedFields: cell.loadedFields,
			declaredFields: this.fields,
			html
		})
		return html
	}
	const destination = '/node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V2-observer.cjs'
	routes.add('/v2-observation/probe', destination + ':RenderObservation')
})()
