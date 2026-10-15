import { copyFile } from 'node:fs/promises'

for (const extension of ['css', 'html'])
	await copyFile(`src/front/property-select.${extension}`, `front/property-select.${extension}`)
