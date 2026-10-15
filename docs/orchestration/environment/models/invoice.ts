import { Address } from './address'
import { Customer } from './customer'
import { Line } from './line'
import { Tag } from './tag'

export class Invoice
{

	active: boolean = false
	amount: number = 0
	customer?: Customer
	deliveryAddress?: Address
	issuedAt: Date | null = null
	lines: Line[] = []
	note: string | null = null
	number: string = ''
	p0: string = ''
	tags: Tag[] = []

}
