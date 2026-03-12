import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  kitchenTicketModel,
  kitchenTicketItemModel,
} from '~/server/db/schemas/kitchen'
import { posSaleModel, posTableModel } from '~/server/db/schemas/pos'
import type { CreateKitchenTicketInput } from '../schemas'

export interface KitchenTicketWithItems {
  id: string
  organizationId: string
  sucursalId: string | null
  saleId: string | null
  status: string
  ticketNumber: number
  notes: string | null
  createdAt: Date | null
  tableNumber: string | null
  orderType: string | null
  items: Array<{
    id: string
    productId: string | null
    productName: string
    quantity: string
    stationId: string | null
    modificationsJson: unknown
    status: string
  }>
}

export class KitchenRepository {
  async getNextTicketNumber(
    sucursalId: string | null,
    organizationId: string
  ): Promise<number> {
    // Get max ticket number for this sucursal today and increment
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const condition = sucursalId
      ? and(
          eq(kitchenTicketModel.sucursalId, sucursalId),
          sql`${kitchenTicketModel.createdAt} >= ${today}`
        )
      : and(
          eq(kitchenTicketModel.organizationId, organizationId),
          sql`${kitchenTicketModel.createdAt} >= ${today}`
        )

    const [result] = await db
      .select({
        max: sql<number>`COALESCE(MAX(${kitchenTicketModel.ticketNumber}), 0)`,
      })
      .from(kitchenTicketModel)
      .where(condition)

    return (result?.max ?? 0) + 1
  }

  async createTicket(input: CreateKitchenTicketInput) {
    return await db.transaction(async (tx) => {
      const ticketNumber = await this.getNextTicketNumber(
        input.sucursalId ?? null,
        input.organizationId
      )

      const [ticket] = await tx
        .insert(kitchenTicketModel)
        .values({
          organizationId: input.organizationId,
          sucursalId: input.sucursalId ?? null,
          saleId: input.saleId ?? null,
          status: 'pending',
          ticketNumber,
          notes: input.notes ?? null,
        })
        .returning()

      await tx.insert(kitchenTicketItemModel).values(
        input.items.map((item) => ({
          ticketId: ticket.id,
          productId: item.productId ?? null,
          productName: item.productName,
          quantity: String(item.quantity),
          stationId: item.stationId ?? null,
          modificationsJson: item.modificationsJson ?? null,
          status: 'pending' as const,
        }))
      )

      return ticket
    })
  }

  async getOpenTickets(sucursalId: string): Promise<KitchenTicketWithItems[]> {
    // Join with sale + table to get table number and order type
    const rows = await db
      .select({
        id: kitchenTicketModel.id,
        organizationId: kitchenTicketModel.organizationId,
        sucursalId: kitchenTicketModel.sucursalId,
        saleId: kitchenTicketModel.saleId,
        status: kitchenTicketModel.status,
        ticketNumber: kitchenTicketModel.ticketNumber,
        notes: kitchenTicketModel.notes,
        createdAt: kitchenTicketModel.createdAt,
        tableNumber: posTableModel.number,
        orderType: posSaleModel.orderType,
      })
      .from(kitchenTicketModel)
      .leftJoin(posSaleModel, eq(kitchenTicketModel.saleId, posSaleModel.id))
      .leftJoin(posTableModel, eq(posSaleModel.tableId, posTableModel.id))
      .where(
        and(
          eq(kitchenTicketModel.sucursalId, sucursalId),
          inArray(kitchenTicketModel.status, [
            'pending',
            'in_progress',
            'ready',
          ])
        )
      )
      .orderBy(kitchenTicketModel.ticketNumber)

    if (rows.length === 0) return []

    const ticketIds = rows.map((t) => t.id)
    const items = await db
      .select()
      .from(kitchenTicketItemModel)
      .where(inArray(kitchenTicketItemModel.ticketId, ticketIds))

    return rows.map((ticket) => ({
      ...ticket,
      tableNumber: ticket.tableNumber ?? null,
      orderType: ticket.orderType ?? null,
      items: items
        .filter((i) => i.ticketId === ticket.id)
        .map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          stationId: i.stationId,
          modificationsJson: i.modificationsJson,
          status: i.status,
        })),
    }))
  }

  async updateTicketStatus(
    ticketId: string,
    status: 'pending' | 'in_progress' | 'ready' | 'served'
  ) {
    await db
      .update(kitchenTicketModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(kitchenTicketModel.id, ticketId))
  }

  async updateItemStatus(itemId: string, status: 'pending' | 'ready') {
    await db
      .update(kitchenTicketItemModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(kitchenTicketItemModel.id, itemId))
  }
}

export const kitchenRepository = new KitchenRepository()
