import assert from 'node:assert/strict'
import { createConnection } from 'mariadb'

const connection = await createConnection({
	host: '127.0.0.1', port: 13316, user: 'root', password: '', database: 'property_select_recipe'
})
try {
	const rows = await connection.query(`SELECT /* property-select environment smoke */
	 i.id, i.number, c.name AS customer, cy.name AS city, p.name AS country, d.street AS delivery,
	 i.active, i.amount, i.issued_at, i.note
	 FROM ps_invoice i
	 LEFT JOIN ps_customer c ON c.id = i.customer_id
	 LEFT JOIN ps_address a ON a.id = c.address_id
	 LEFT JOIN ps_city cy ON cy.id = a.city_id
	 LEFT JOIN ps_country p ON p.id = cy.country_id
	 LEFT JOIN ps_address d ON d.id = i.delivery_address_id
	 WHERE i.id <= 4 ORDER BY i.id`)
	assert.equal(rows.length, 4)
	assert.equal(rows[0].city, 'Recipe Paris')
	assert.equal(rows[0].delivery, '2 Synthetic Street')
	assert.equal(rows[2].city, null)
	assert.equal(rows[3].customer, null)
	assert.equal(String(rows[0].amount), '12.34')
	assert.ok(rows[0].issued_at instanceof Date)
	assert.equal(rows[0].note, null)
	assert.equal(rows[2].note, '')
	const filtered = await connection.query(`SELECT i.number FROM ps_invoice i
	 JOIN ps_customer c ON c.id = i.customer_id WHERE c.name = ? ORDER BY i.id LIMIT 1`, ['Recipe Alice'])
	assert.equal(filtered[0].number, 'REC-001')
	console.log('PASS: real MySQL joins, absent relations, bound criteria and driver conversions; four synthetic roots')
}
finally {
	await connection.end()
}
