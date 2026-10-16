const { Action } = require('@itrocks/action')
const { routes } = require('@itrocks/route')
const { propertySelectDependsOn } = require('@itrocks/framework/property-select')
const list = require('../list/fixture.cjs')
let invalid = false
class SessionFixture extends Action
{

	async json(request)
	{
		if (request.data.operation === 'invalidate') invalid = true
		if (request.data.operation === 'reset') invalid = false
		if (request.data.operation === 'revoke') await request.request.session.destroy()
		if (request.data.operation === 'expire') request.request.session.cookie.expires = new Date(Date.now() - 1000)
		return this.jsonResponse({ invalid })
	}

}
module.exports = { SessionFixture }
module.exports.ready = (async () => {
	await list.ready
	propertySelectDependsOn({ advice: () => ['customer.address', 'deliveryAddress', 'tags'],
		authorise: (_request, _root, path) =>
		!invalid || (path !== 'customer.address' && !path.startsWith('customer.address.')) })
	const fixture = '/node_modules/@itrocks/property-select/docs/orchestration/environment/session/fixture.cjs'
	const listFixture = '/node_modules/@itrocks/property-select/docs/orchestration/environment/list/fixture.cjs'
	routes.add('/property-select-test/session', fixture + ':SessionFixture')
	routes.add('/property-select-invoice-alt', listFixture + ':Invoice')
	routes.add('/property-select-invoice-alt/list', listFixture + ':InvoiceList')
})()
