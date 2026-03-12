import { and, count, desc, eq, ilike, sql, type SQL } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  quotationModel,
  quotationDetailModel,
  quotationRecipientModel,
} from '~/server/db/schemas/quotations'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'
import { productModel } from '~/server/db/schemas/products'
import type { CreateQuotationInput } from '../schemas'

export interface QuotationFilters {
  search?: string
  status?: string
}

export interface PaginationOptions {
  page: number
  pageSize: number
}

export class QuotationsRepository {
  async create(data: CreateQuotationInput) {
    return await db.transaction(async (tx) => {
      const quotationNumber = await this.generateQuotationNumber(
        tx,
        data.organizationId
      )

      const [quotation] = await tx
        .insert(quotationModel)
        .values({
          organizationId: data.organizationId,
          companyId: data.companyId,
          businessPartnerId: data.businessPartnerId,
          status: 'DRAFT',
          quotationDate: data.quotationDate,
          quotationNumber,
          currencyCode: data.currencyCode,
        })
        .returning()

      for (const detail of data.details) {
        const lineTotal = (Number(detail.unitPrice) * detail.quantity).toFixed(
          2
        )

        const [insertedDetail] = await tx
          .insert(quotationDetailModel)
          .values({
            quotationId: quotation.id,
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
          await tx.insert(quotationRecipientModel).values(
            detail.recipients.map((r) => ({
              quotationDetailId: insertedDetail.id,
              name: r.name,
              metadataJson: r.metadataJson ?? null,
            }))
          )
        }
      }

      return quotation
    })
  }

  private async generateQuotationNumber(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    organizationId: string
  ) {
    const [result] = await tx
      .select({ count: count() })
      .from(quotationModel)
      .where(eq(quotationModel.organizationId, organizationId))

    const seq = (result?.count ?? 0) + 1
    return `QUO-${seq.toString().padStart(6, '0')}`
  }

  async getFiltered(
    organizationId: string,
    filters: QuotationFilters,
    pagination: PaginationOptions
  ) {
    const conditions: SQL[] = [
      eq(quotationModel.organizationId, organizationId),
    ]

    if (filters.status) {
      conditions.push(
        eq(
          quotationModel.status,
          filters.status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
        )
      )
    }

    if (filters.search) {
      conditions.push(
        sql`(${ilike(quotationModel.quotationNumber, `%${filters.search}%`)})`
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db
      .select({ count: count() })
      .from(quotationModel)
      .where(whereClause)

    const total = totalResult?.count ?? 0
    const offset = (pagination.page - 1) * pagination.pageSize

    const quotations = await db
      .select({
        id: quotationModel.id,
        quotationNumber: quotationModel.quotationNumber,
        status: quotationModel.status,
        quotationDate: quotationModel.quotationDate,
        currencyCode: quotationModel.currencyCode,
        convertedOrderId: quotationModel.convertedOrderId,
        createdAt: quotationModel.createdAt,
        businessPartnerName: businessPartnerModel.name,
        companyName: companyModel.name,
        itemCount:
          sql<number>`(SELECT COUNT(*) FROM quotation_detail WHERE quotation_detail.quotation_id = ${quotationModel.id})`.as(
            'item_count'
          ),
      })
      .from(quotationModel)
      .leftJoin(
        businessPartnerModel,
        eq(quotationModel.businessPartnerId, businessPartnerModel.id)
      )
      .leftJoin(companyModel, eq(quotationModel.companyId, companyModel.id))
      .where(whereClause)
      .orderBy(desc(quotationModel.createdAt))
      .limit(pagination.pageSize)
      .offset(offset)

    return {
      quotations,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    }
  }

  async getById(id: string) {
    const [quotation] = await db
      .select({
        id: quotationModel.id,
        organizationId: quotationModel.organizationId,
        companyId: quotationModel.companyId,
        businessPartnerId: quotationModel.businessPartnerId,
        status: quotationModel.status,
        quotationDate: quotationModel.quotationDate,
        quotationNumber: quotationModel.quotationNumber,
        currencyCode: quotationModel.currencyCode,
        convertedOrderId: quotationModel.convertedOrderId,
        createdAt: quotationModel.createdAt,
        updatedAt: quotationModel.updatedAt,
        businessPartnerName: businessPartnerModel.name,
        companyName: companyModel.name,
      })
      .from(quotationModel)
      .leftJoin(
        businessPartnerModel,
        eq(quotationModel.businessPartnerId, businessPartnerModel.id)
      )
      .leftJoin(companyModel, eq(quotationModel.companyId, companyModel.id))
      .where(eq(quotationModel.id, id))
      .limit(1)

    if (!quotation) return null

    const details = await db
      .select({
        id: quotationDetailModel.id,
        productId: quotationDetailModel.productId,
        productName: quotationDetailModel.productName,
        productSku: quotationDetailModel.productSku,
        quantity: quotationDetailModel.quantity,
        unitPrice: quotationDetailModel.unitPrice,
        sourceType: quotationDetailModel.sourceType,
        lineTotal: quotationDetailModel.lineTotal,
        customAttributesJson: quotationDetailModel.customAttributesJson,
        productAttributesJson: productModel.attributesJson,
      })
      .from(quotationDetailModel)
      .leftJoin(
        productModel,
        eq(quotationDetailModel.productId, productModel.id)
      )
      .where(eq(quotationDetailModel.quotationId, id))

    const detailIds = details.map((d) => d.id)
    const recipientsByDetail: Record<
      string,
      (typeof quotationRecipientModel.$inferSelect)[]
    > = {}

    if (detailIds.length > 0) {
      const allRecipients = await db
        .select()
        .from(quotationRecipientModel)
        .where(
          sql`${quotationRecipientModel.quotationDetailId} IN ${detailIds}`
        )

      for (const r of allRecipients) {
        if (!recipientsByDetail[r.quotationDetailId]) {
          recipientsByDetail[r.quotationDetailId] = []
        }
        recipientsByDetail[r.quotationDetailId].push(r)
      }
    }

    const detailsWithRecipients = details.map((d) => ({
      ...d,
      recipients: recipientsByDetail[d.id] ?? [],
    }))

    return { ...quotation, details: detailsWithRecipients }
  }

  async updateStatus(
    id: string,
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
  ) {
    const [quotation] = await db
      .update(quotationModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(quotationModel.id, id))
      .returning()

    return quotation || null
  }

  async setConvertedOrderId(id: string, orderId: string) {
    const [quotation] = await db
      .update(quotationModel)
      .set({ convertedOrderId: orderId, updatedAt: new Date() })
      .where(eq(quotationModel.id, id))
      .returning()

    return quotation || null
  }

  async count(organizationId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(quotationModel)
      .where(eq(quotationModel.organizationId, organizationId))

    return result?.count ?? 0
  }
}

export const quotationsRepository = new QuotationsRepository()
