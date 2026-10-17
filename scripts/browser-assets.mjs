import { copyFile } from 'node:fs/promises'

for (const file of ['filter-reset.svg', 'property-select.html', 'property-select.svg'])
	await copyFile(`src/front/${file}`, `front/${file}`)
