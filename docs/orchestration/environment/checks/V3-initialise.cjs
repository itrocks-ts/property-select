const { propertySelectDependsOn } = require('@itrocks/framework/property-select')
const fixture = require('./RETEST-L3-1-initialise.cjs')

// Real composition and owner fixtures; only request-scoped synthetic permission injection is new.
module.exports.ready = fixture.ready.then(() => {
	propertySelectDependsOn({ authorise: (request, root, path) =>
		request.data.catalogue !== 'restricted' || !path.startsWith('customer.address') })
})
