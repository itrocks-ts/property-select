import type { PropertyPath } from './ports.js'

export function normalisePath(path: PropertyPath): string
{
	if ((typeof path !== 'string') && !Array.isArray(path))
		throw new TypeError('A property path must be a string or an array of segments')
	const segments = typeof path === 'string' ? (path === '' ? [] : path.split('.')) : path
	if (Array.from(segments).some(segment => (typeof segment !== 'string') || !segment || /[.\s]/u.test(segment)))
		throw new TypeError('A property path must contain non-empty technical segments without dots or whitespace')
	return segments.join('.')
}
