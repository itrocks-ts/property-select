import { City } from './city'
import { Customer } from './customer'

export class Invalid
{

	ambiguous: City | Customer = undefined!
	unknown: unknown

}
