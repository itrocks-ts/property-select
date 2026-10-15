import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { File } = require('@itrocks/class-file')
const { Representative } = require('@itrocks/class-view')
const { initCoreTransformers } = require('@itrocks/core-transformers')
const { bindSqlProjection } = require('@itrocks/framework/sql-projection')
const { Relation } = require('@itrocks/reflect')
const { Required } = require('@itrocks/required')
const { Store } = require('@itrocks/store')
const { IGNORE, SQL, READ, SAVE, setPropertyTransformer } = require('@itrocks/transformer')

export const models = {}
for (const name of ['address', 'city', 'country', 'customer', 'invalid', 'invoice', 'line', 'maintenance', 'tag']) {
	const filename = fileURLToPath(new URL(`./${name}.js`, import.meta.url))
	for (const [className, model] of Object.entries(require(filename))) {
		File(filename)(model)
		Store(`ps_${name}`)(model)
		models[className] = model
	}
}
const { City, Country, Invoice, Line, Tag } = models
Relation({ cardinality: 'one-to-many', inverse: 'invoice' })(Invoice.prototype, 'lines')
Relation({ cardinality: 'many-to-one', inverse: 'lines' })(Line.prototype, 'invoice')
Relation({ cardinality: 'many-to-many', inverse: 'invoices' })(Invoice.prototype, 'tags')
Relation({ cardinality: 'many-to-many', inverse: 'tags' })(Tag.prototype, 'invoices')
Required()(City.prototype, 'country')
Representative('name', 'country')(City)
Representative('name')(Country)
initCoreTransformers({ ignoreTransformedValue: IGNORE })
bindSqlProjection()
setPropertyTransformer(Invoice, 'amount', SQL, READ, value => value === null ? null : Number(value))
setPropertyTransformer(Country, 'name', SQL, READ, async (value, object, property, record) => {
	if (!(object instanceof Country) || property !== 'name' || record.name !== value) throw new Error('Wrong read owner')
	return value === null ? null : value.toUpperCase()
})
setPropertyTransformer(Country, 'name', SQL, SAVE, async (value, object, property) => {
	if (!(object instanceof Country) || property !== 'name') throw new Error('Wrong save owner')
	return typeof value === 'string' ? value.replace('RECIPE', 'Recipe').replace('FRANCE', 'France') : value
})
