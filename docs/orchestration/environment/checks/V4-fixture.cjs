const { Action } = require('@itrocks/action')
const { routes } = require('@itrocks/route')
const { listStateDependsOn, SessionStateStore } = require('@itrocks/list/selector-state')
const { sessionTransaction } = require('@itrocks/fastify')
const parent = require('../session/fixture.cjs')
const gates = new Map()
let armed
let failing = false
class V4Fixture extends Action
{

	async json(request)
	{
		const input = request.data
		const session = request.request.session
		if (input.operation === 'failure') {
			failing = input.enabled === true
			return this.jsonResponse({ failing })
		}
		if (input.operation === 'arm') {
			armed = input.id
			return this.jsonResponse({ armed })
		}
		if (input.operation === 'status') return this.jsonResponse({ pending: [...gates.keys()] })
		if (input.operation === 'release') {
			gates.get(input.id)?.()
			gates.delete(input.id)
			return this.jsonResponse({ released: input.id })
		}
		if (input.operation === 'read')
			return this.jsonResponse({ list: session.list, propertySelect: session.propertySelect })
		await new Promise(resolve => gates.set(input.id, resolve))
		try {
			if (input.operation === 'write') {
				const store = new SessionStateStore(session, sessionTransaction)
				return this.jsonResponse(await store.write(input.key, input.state, input.revision))
			}
			if (input.operation === 'autosave') {
				session.list['/property-select-invoice'].v4 = input.id
				return this.jsonResponse({ saved: true })
			}
		}
		catch (error) { return this.jsonResponse({ code: error.code }, error.code === 'STATE_CONFLICT' ? 409 : 410) }
	}

}
module.exports = { V4Fixture }
module.exports.ready = parent.ready.then(() => {
	listStateDependsOn({ transaction: async (session, operation) => {
		if (failing) throw Object.assign(new Error('Synthetic transaction storage failure'), { code: 'EIO' })
		if (armed) {
			const id = armed
			armed = undefined
			await new Promise(resolve => gates.set(id, resolve))
		}
		return sessionTransaction(session, operation)
	} })
	routes.add('/v4/gate',
		'/node_modules/@itrocks/property-select/docs/orchestration/environment/checks/V4-fixture.cjs:V4Fixture')
})
