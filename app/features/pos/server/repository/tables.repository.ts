import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import { posTableModel, posSaleModel } from '~/server/db/schemas/pos'
import type {
  InsertPosTable,
  UpdatePosTable,
  PosTableStatus,
} from '~/server/db/schemas/pos'

export class PosTablesRepository {
  async getTables(organizationId: string, sucursalId?: string) {
    return db
      .select()
      .from(posTableModel)
      .where(
        and(
          eq(posTableModel.organizationId, organizationId),
          eq(posTableModel.isActive, true),
          ...(sucursalId ? [eq(posTableModel.sucursalId, sucursalId)] : [])
        )
      )
  }

  async getTableById(id: string) {
    const [table] = await db
      .select()
      .from(posTableModel)
      .where(eq(posTableModel.id, id))
    return table ?? null
  }

  async createTable(
    data: Omit<InsertPosTable, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const [table] = await db.insert(posTableModel).values(data).returning()
    return table
  }

  async updateTable(id: string, data: Partial<UpdatePosTable>) {
    const [table] = await db
      .update(posTableModel)
      .set(data)
      .where(eq(posTableModel.id, id))
      .returning()
    return table
  }

  async deleteTable(id: string) {
    await db
      .update(posTableModel)
      .set({ isActive: false })
      .where(eq(posTableModel.id, id))
  }

  async updateTableStatus(id: string, status: PosTableStatus) {
    const [table] = await db
      .update(posTableModel)
      .set({ status })
      .where(eq(posTableModel.id, id))
      .returning()
    return table
  }

  async getActiveOrderForTable(tableId: string) {
    const [sale] = await db
      .select()
      .from(posSaleModel)
      .where(
        and(eq(posSaleModel.tableId, tableId), eq(posSaleModel.status, 'open'))
      )
    return sale ?? null
  }
}

export const posTablesRepository = new PosTablesRepository()
