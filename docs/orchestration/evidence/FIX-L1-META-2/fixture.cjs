const path = require('node:path')
const { Action } = require('@itrocks/action')
const { routes } = require('@itrocks/route')
const { dataSource } = require('@itrocks/storage')

require(path.resolve('node_modules/@itrocks/framework/test/metadata-fixture.cjs'))
const attempts = []
for (const operation of ['read', 'search', 'count', 'select']) {
	const original = dataSource()[operation]
	dataSource()[operation] = async function(type, ...args) {
		attempts.push({ operation, type: type.name })
		return original.call(this, type, ...args)
	}
}
class ColumnSaveProbe extends Action
{

	async json(request)
	{
		return this.jsonResponse({ attempts, columns: request.request.session.list?.['/country']?.columns })
	}

}
routes.add('/column-save-probe/probe',
	'/node_modules/@itrocks/property-select/docs/orchestration/evidence/FIX-L1-META-2/fixture.cjs:ColumnSaveProbe')
module.exports = { ColumnSaveProbe }
