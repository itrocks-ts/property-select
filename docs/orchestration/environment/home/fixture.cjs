const { Action } = require('@itrocks/action')
const { routes } = require('@itrocks/route')

class PaneFixture extends Action
{

	async html(request)
	{
		return this.htmlTemplateResponse({}, request, __dirname + '/fixture.html')
	}

}

routes.add('/pane-fixture',
	'/node_modules/@itrocks/property-select/docs/orchestration/environment/home/fixture.cjs:PaneFixture')
module.exports = { PaneFixture }
