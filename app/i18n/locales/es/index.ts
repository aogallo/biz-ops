import { common } from './common'
import { sidebar } from './sidebar'
import { auth } from './auth'
import { organization } from './organization'
import { users } from './users'
import { products } from './products'
import { invoices } from './invoices'
import { stock } from './stock'
import { misc } from './misc'

const es = {
  ...common,
  ...sidebar,
  ...auth,
  ...organization,
  ...users,
  ...products,
  ...invoices,
  ...stock,
  ...misc,
} as const

export default es
