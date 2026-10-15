const assert=require('node:assert/strict')
const metadata=require('@itrocks/framework/property-select')
for(const name of ['ReflectionMetadataProvider','MetadataError','createMetadataProvider','metadataConfiguration',
	'propertySelectDependsOn','bindPropertySelect'])assert.equal(typeof metadata[name],'function',name)
const selector=require('@itrocks/property-select')
assert.equal(typeof selector.PropertySelect,'function')
assert.equal(selector.normalisePath(['billing','city']),'billing.city')
console.log('PASS: public CJS metadata and selector exports')
