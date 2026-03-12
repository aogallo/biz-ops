import { db } from '~/server/db'
import { posSaleModel } from '~/server/db/schemas/pos'
import { posTablesRepository } from '~/features/pos/server/repository/tables.repository'

export interface OpenTableOrderInput {
  tableId: string
  organizationId: string
  sucursalId: string
  terminalId: string
  cashierId: string
  sessionId: string
  businessPartnerId: string
  coverCount?: number
}

export async function openTableOrderAction(input: OpenTableOrderInput) {
  const table = await posTablesRepository.getTableById(input.tableId)
  if (!table) throw new Error('Table not found')

  const existing = await posTablesRepository.getActiveOrderForTable(
    input.tableId
  )
  if (existing) throw new Error('Table already has an open order')

  const sale = await db.transaction(async (tx) => {
    const [newSale] = await tx
      .insert(posSaleModel)
      .values({
        organizationId: input.organizationId,
        sucursalId: input.sucursalId,
        terminalId: input.terminalId,
        cashierId: input.cashierId,
        sessionId: input.sessionId,
        tableId: input.tableId,
        businessPartnerId: input.businessPartnerId,
        orderType: 'dine_in',
        coverCount: input.coverCount,
        status: 'open',
        saleNumber: '', // will be assigned on checkout
        subtotal: '0',
        total: '0',
      })
      .returning()
    return newSale
  })

  await posTablesRepository.updateTableStatus(input.tableId, 'occupied')

  return sale
}
