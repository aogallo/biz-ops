import { and, count, desc, eq, ilike, sql, type SQL } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  orderModel,
  orderDetailModel,
  orderRecipientModel,
} from '~/server/db/schemas/orders'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { productModel } from '~/server/db/schemas/products'
import type { CreateOrderInput } from '../schemas'

export interface OrderFilters {
  search?: string
  status?: string
}

export interface PaginationOptions {
  page: number
  pageSize: number
}

export class OrdersRepository {
  async create(data: CreateOrderInput) {
    return await db.transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber(
        tx,
        data.organizationId
      )

      const [order] = await tx
        .insert(orderModel)
        .values({
          organizationId: data.organizationId,
          companyId: data.companyId,
          businessPartnerId: data.businessPartnerId,
          status: 'DRAFT',
          orderDate: data.orderDate,
          orderNumber,
          currencyCode: data.currencyCode,
        })
        .returning()

      for (const detail of data.details) {
        const lineTotal = (Number(detail.unitPrice) * detail.quantity).toFixed(
          2
        )

        const [insertedDetail] = await tx
          .insert(orderDetailModel)
          .values({
            orderId: order.id,
            productId: detail.productId,
            productName: detail.productName,
            productSku: detail.productSku ?? null,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            sourceType: detail.sourceType as 'INVENTORY' | 'ON_DEMAND',
            lineTotal,
            customAttributesJson: detail.customAttributesJson ?? null,
          })
          .returning()

        if (detail.recipients?.length) {
          await tx.insert(orderRecipientModel).values(
            detail.recipients.map((r) => ({
              orderDetailId: insertedDetail.id,
              name: r.name,
              metadataJson: r.metadataJson ?? null,
            }))
          )
        }
      }

      return order
    })
  }

  private async generateOrderNumber(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    organizationId: string
  ) {
    const [result] = await tx
      .select({ count: count() })
      .from(orderModel)
      .where(eq(orderModel.organizationId, organizationId))

    const seq = (result?.count ?? 0) + 1
    return `ORD-${seq.toString().padStart(6, '0')}`
  }

  async getFiltered(
    organizationId: string,
    filters: OrderFilters,
    pagination: PaginationOptions
  ) {
    const conditions: SQL[] = [eq(orderModel.organizationId, organizationId)]

    if (filters.status) {
      conditions.push(
        eq(
          orderModel.status,
          filters.status as 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
        )
      )
    }

    if (filters.search) {
      conditions.push(
        sql`(${ilike(orderModel.orderNumber, `%${filters.search}%`)})`
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(orderModel)
      .where(whereClause)

    const total = totalResult?.count ?? 0
    const offset = (pagination.page - 1) * pagination.pageSize

    const orders = await db
      .select({
        id: orderModel.id,
        orderNumber: orderModel.orderNumber,
        status: orderModel.status,
        orderDate: orderModel.orderDate,
        currencyCode: orderModel.currencyCode,
        createdAt: orderModel.createdAt,
        businessPartnerName: businessPartnerModel.name,
        companyName: companyModel.name,
        itemCount:
          sql<number>`(SELECT COUNT(*) FROM order_detail WHERE order_detail.order_id = ${orderModel.id})`.as(
            'item_count'
          ),
      })
      .from(orderModel)
      .leftJoin(
        businessPartnerModel,
        eq(orderModel.businessPartnerId, businessPartnerModel.id)
      )
      .leftJoin(companyModel, eq(orderModel.companyId, companyModel.id))
      .where(whereClause)
      .orderBy(desc(orderModel.createdAt))
      .limit(pagination.pageSize)
      .offset(offset)

    return {
      orders,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  }

  async getById(id: string) {
    const [order] = await db
      .select({
        id: orderModel.id,
        organizationId: orderModel.organizationId,
        companyId: orderModel.companyId,
        businessPartnerId: orderModel.businessPartnerId,
        status: orderModel.status,
        orderDate: orderModel.orderDate,
        orderNumber: orderModel.orderNumber,
        currencyCode: orderModel.currencyCode,
        createdAt: orderModel.createdAt,
        updatedAt: orderModel.updatedAt,
        businessPartnerName: businessPartnerModel.name,
        companyName: companyModel.name,
      })
      .from(orderModel)
      .leftJoin(
        businessPartnerModel,
        eq(orderModel.businessPartnerId, businessPartnerModel.id)
      )
      .leftJoin(companyModel, eq(orderModel.companyId, companyModel.id))
      .where(eq(orderModel.id, id))
      .limit(1)

    if (!order) return null

    const details = await db
      .select({
        id: orderDetailModel.id,
        productId: orderDetailModel.productId,
        productName: orderDetailModel.productName,
        productSku: orderDetailModel.productSku,
        quantity: orderDetailModel.quantity,
        unitPrice: orderDetailModel.unitPrice,
        sourceType: orderDetailModel.sourceType,
        lineTotal: orderDetailModel.lineTotal,
        customAttributesJson: orderDetailModel.customAttributesJson,
        productAttributesJson: productModel.attributesJson,
      })
      .from(orderDetailModel)
      .leftJoin(productModel, eq(orderDetailModel.productId, productModel.id))
      .where(eq(orderDetailModel.orderId, id))

    const detailIds = details.map((d) => d.id)
    const recipientsByDetail: Record<
      string,
      (typeof orderRecipientModel.$inferSelect)[]
    > = {}

    if (detailIds.length > 0) {
      const allRecipients = await db
        .select()
        .from(orderRecipientModel)
        .where(sql`${orderRecipientModel.orderDetailId} IN ${detailIds}`)

      for (const r of allRecipients) {
        if (!recipientsByDetail[r.orderDetailId]) {
          recipientsByDetail[r.orderDetailId] = []
        }
        recipientsByDetail[r.orderDetailId].push(r)
      }
    }

    const detailsWithRecipients = details.map((d) => ({
      ...d,
      recipients: recipientsByDetail[d.id] ?? [],
    }))

    return { ...order, details: detailsWithRecipients }
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  ) {
    const [order] = await db
      .update(orderModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(orderModel.id, id))
      .returning()

    return order || null
  }

  async count(organizationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(orderModel)
      .where(eq(orderModel.organizationId, organizationId))

    return result?.count ?? 0
  }
}

export const ordersRepository = new OrdersRepository()
