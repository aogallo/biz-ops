import { and, count, eq, gte, lte, sql, inArray } from 'drizzle-orm'
import { db } from '~/server/db'
import { invoiceModel, invoiceLineModel } from '~/server/db/schemas/invoice'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { companyModel } from '~/server/db/schemas/company'

export interface LedgerReportLineItem {
  id: string
  fecha: string
  tipoDoc: string
  tipoTran: string
  serie: string
  noDocto: string
  nit: string
  nombre: string
  localGravadosBienes: number
  localGravadosServicios: number
  localExentosBienes: number
  localExentosServicios: number
  importGravadosBienes: number
  importGravadosServicios: number
  importExentosBienes: number
  importExentosServicios: number
  ivaAmount: number
  totalDocumento: number
}

export interface LedgerGrandTotals {
  localGravadosBienes: number
  localGravadosServicios: number
  localExentosBienes: number
  localExentosServicios: number
  importGravadosBienes: number
  importGravadosServicios: number
  importExentosBienes: number
  importExentosServicios: number
  ivaAmount: number
  totalDocumento: number
}

interface GetForReportParams {
  companyId?: string
  dateFrom?: Date
  dateTo?: Date
  type: 'sale' | 'purchase'
  limit: number
  offset: number
}

interface GetAllForPdfParams {
  companyId?: string
  dateFrom?: Date
  dateTo?: Date
  type: 'sale' | 'purchase'
}

// Breakdown column expressions using CASE WHEN aggregations
const localGravadosBienes = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'L'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'taxed'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'goods'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const localGravadosServicios = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'L'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'taxed'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'services'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const localExentosBienes = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'L'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'exempt'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'goods'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const localExentosServicios = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'L'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'exempt'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'services'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const importGravadosBienes = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'I'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'taxed'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'goods'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const importGravadosServicios = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'I'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'taxed'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'services'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const importExentosBienes = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'I'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'exempt'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'goods'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

const importExentosServicios = sql<number>`COALESCE(SUM(
  CASE WHEN COALESCE(${invoiceModel.transactionType}, 'L') = 'I'
    AND COALESCE(${invoiceLineModel.ivaType}, 'taxed') = 'exempt'
    AND COALESCE(${invoiceLineModel.lineType}, 'goods') = 'services'
  THEN ${invoiceLineModel.subtotal}::numeric ELSE 0 END
), 0)`

function buildConditions(
  organizationId: string,
  params: { companyId?: string; dateFrom?: Date; dateTo?: Date; type: 'sale' | 'purchase' }
) {
  const conditions = [
    eq(invoiceModel.organizationId, organizationId),
    eq(invoiceModel.type, params.type),
    inArray(invoiceModel.status, ['posted', 'pending']),
  ]

  if (params.companyId) {
    conditions.push(eq(invoiceModel.companyId, params.companyId))
  }
  if (params.dateFrom) {
    conditions.push(gte(invoiceModel.invoiceDate, params.dateFrom.toISOString().split('T')[0]))
  }
  if (params.dateTo) {
    conditions.push(lte(invoiceModel.invoiceDate, params.dateTo.toISOString().split('T')[0]))
  }

  return and(...conditions)
}

export class LedgerReportRepository {
  async getForReport(
    organizationId: string,
    params: GetForReportParams
  ): Promise<{
    data: LedgerReportLineItem[]
    total: number
    grandTotals: LedgerGrandTotals
  }> {
    const whereClause = buildConditions(organizationId, params)

    // Count total invoices
    const [countResult] = await db
      .select({ count: count() })
      .from(invoiceModel)
      .where(whereClause)

    const total = countResult?.count ?? 0

    // Paginated data with line breakdowns
    const data = await db
      .select({
        id: invoiceModel.id,
        fecha: invoiceModel.invoiceDate,
        tipoDoc: sql<string>`COALESCE(${invoiceModel.documentType}, 'FCE')`,
        tipoTran: sql<string>`COALESCE(${invoiceModel.transactionType}, 'L')`,
        serie: sql<string>`COALESCE(${invoiceModel.serie}, '')`,
        noDocto: invoiceModel.number,
        nit: sql<string>`COALESCE(${businessPartnerModel.nit}, 'CF')`,
        nombre: businessPartnerModel.name,
        localGravadosBienes,
        localGravadosServicios,
        localExentosBienes,
        localExentosServicios,
        importGravadosBienes,
        importGravadosServicios,
        importExentosBienes,
        importExentosServicios,
        ivaAmount: sql<number>`COALESCE(SUM(${invoiceLineModel.ivaAmount}::numeric), 0)`,
        totalDocumento: sql<number>`COALESCE(SUM(${invoiceLineModel.total}::numeric), 0)`,
      })
      .from(invoiceModel)
      .innerJoin(businessPartnerModel, eq(invoiceModel.businessPartnerId, businessPartnerModel.id))
      .innerJoin(invoiceLineModel, eq(invoiceLineModel.invoiceId, invoiceModel.id))
      .where(whereClause)
      .groupBy(
        invoiceModel.id,
        invoiceModel.invoiceDate,
        invoiceModel.documentType,
        invoiceModel.transactionType,
        invoiceModel.serie,
        invoiceModel.number,
        businessPartnerModel.nit,
        businessPartnerModel.name
      )
      .orderBy(invoiceModel.invoiceDate, invoiceModel.number)
      .limit(params.limit)
      .offset(params.offset)

    // Grand totals across ALL matching invoices (not just current page)
    const [totalsResult] = await db
      .select({
        localGravadosBienes,
        localGravadosServicios,
        localExentosBienes,
        localExentosServicios,
        importGravadosBienes,
        importGravadosServicios,
        importExentosBienes,
        importExentosServicios,
        ivaAmount: sql<number>`COALESCE(SUM(${invoiceLineModel.ivaAmount}::numeric), 0)`,
        totalDocumento: sql<number>`COALESCE(SUM(${invoiceLineModel.total}::numeric), 0)`,
      })
      .from(invoiceModel)
      .innerJoin(invoiceLineModel, eq(invoiceLineModel.invoiceId, invoiceModel.id))
      .where(whereClause)

    const grandTotals: LedgerGrandTotals = {
      localGravadosBienes: Number(totalsResult?.localGravadosBienes ?? 0),
      localGravadosServicios: Number(totalsResult?.localGravadosServicios ?? 0),
      localExentosBienes: Number(totalsResult?.localExentosBienes ?? 0),
      localExentosServicios: Number(totalsResult?.localExentosServicios ?? 0),
      importGravadosBienes: Number(totalsResult?.importGravadosBienes ?? 0),
      importGravadosServicios: Number(totalsResult?.importGravadosServicios ?? 0),
      importExentosBienes: Number(totalsResult?.importExentosBienes ?? 0),
      importExentosServicios: Number(totalsResult?.importExentosServicios ?? 0),
      ivaAmount: Number(totalsResult?.ivaAmount ?? 0),
      totalDocumento: Number(totalsResult?.totalDocumento ?? 0),
    }

    return {
      data: data.map((row) => ({
        ...row,
        localGravadosBienes: Number(row.localGravadosBienes),
        localGravadosServicios: Number(row.localGravadosServicios),
        localExentosBienes: Number(row.localExentosBienes),
        localExentosServicios: Number(row.localExentosServicios),
        importGravadosBienes: Number(row.importGravadosBienes),
        importGravadosServicios: Number(row.importGravadosServicios),
        importExentosBienes: Number(row.importExentosBienes),
        importExentosServicios: Number(row.importExentosServicios),
        ivaAmount: Number(row.ivaAmount),
        totalDocumento: Number(row.totalDocumento),
      })),
      total,
      grandTotals,
    }
  }

  async getAllForPdfExport(
    organizationId: string,
    params: GetAllForPdfParams
  ): Promise<{
    data: LedgerReportLineItem[]
    grandTotals: LedgerGrandTotals
    companyName: string | null
    totalDocuments: number
  }> {
    const whereClause = buildConditions(organizationId, params)

    // Get company name if filtered
    let companyName: string | null = null
    if (params.companyId) {
      const [company] = await db
        .select({ name: companyModel.name })
        .from(companyModel)
        .where(eq(companyModel.id, params.companyId))
        .limit(1)
      companyName = company?.name ?? null
    }

    // All data (no pagination)
    const data = await db
      .select({
        id: invoiceModel.id,
        fecha: invoiceModel.invoiceDate,
        tipoDoc: sql<string>`COALESCE(${invoiceModel.documentType}, 'FCE')`,
        tipoTran: sql<string>`COALESCE(${invoiceModel.transactionType}, 'L')`,
        serie: sql<string>`COALESCE(${invoiceModel.serie}, '')`,
        noDocto: invoiceModel.number,
        nit: sql<string>`COALESCE(${businessPartnerModel.nit}, 'CF')`,
        nombre: businessPartnerModel.name,
        localGravadosBienes,
        localGravadosServicios,
        localExentosBienes,
        localExentosServicios,
        importGravadosBienes,
        importGravadosServicios,
        importExentosBienes,
        importExentosServicios,
        ivaAmount: sql<number>`COALESCE(SUM(${invoiceLineModel.ivaAmount}::numeric), 0)`,
        totalDocumento: sql<number>`COALESCE(SUM(${invoiceLineModel.total}::numeric), 0)`,
      })
      .from(invoiceModel)
      .innerJoin(businessPartnerModel, eq(invoiceModel.businessPartnerId, businessPartnerModel.id))
      .innerJoin(invoiceLineModel, eq(invoiceLineModel.invoiceId, invoiceModel.id))
      .where(whereClause)
      .groupBy(
        invoiceModel.id,
        invoiceModel.invoiceDate,
        invoiceModel.documentType,
        invoiceModel.transactionType,
        invoiceModel.serie,
        invoiceModel.number,
        businessPartnerModel.nit,
        businessPartnerModel.name
      )
      .orderBy(invoiceModel.invoiceDate, invoiceModel.number)

    const mappedData = data.map((row) => ({
      ...row,
      localGravadosBienes: Number(row.localGravadosBienes),
      localGravadosServicios: Number(row.localGravadosServicios),
      localExentosBienes: Number(row.localExentosBienes),
      localExentosServicios: Number(row.localExentosServicios),
      importGravadosBienes: Number(row.importGravadosBienes),
      importGravadosServicios: Number(row.importGravadosServicios),
      importExentosBienes: Number(row.importExentosBienes),
      importExentosServicios: Number(row.importExentosServicios),
      ivaAmount: Number(row.ivaAmount),
      totalDocumento: Number(row.totalDocumento),
    }))

    // Calculate grand totals from the full dataset
    const grandTotals = mappedData.reduce<LedgerGrandTotals>(
      (acc, row) => ({
        localGravadosBienes: acc.localGravadosBienes + row.localGravadosBienes,
        localGravadosServicios: acc.localGravadosServicios + row.localGravadosServicios,
        localExentosBienes: acc.localExentosBienes + row.localExentosBienes,
        localExentosServicios: acc.localExentosServicios + row.localExentosServicios,
        importGravadosBienes: acc.importGravadosBienes + row.importGravadosBienes,
        importGravadosServicios: acc.importGravadosServicios + row.importGravadosServicios,
        importExentosBienes: acc.importExentosBienes + row.importExentosBienes,
        importExentosServicios: acc.importExentosServicios + row.importExentosServicios,
        ivaAmount: acc.ivaAmount + row.ivaAmount,
        totalDocumento: acc.totalDocumento + row.totalDocumento,
      }),
      {
        localGravadosBienes: 0,
        localGravadosServicios: 0,
        localExentosBienes: 0,
        localExentosServicios: 0,
        importGravadosBienes: 0,
        importGravadosServicios: 0,
        importExentosBienes: 0,
        importExentosServicios: 0,
        ivaAmount: 0,
        totalDocumento: 0,
      }
    )

    return {
      data: mappedData,
      grandTotals,
      companyName,
      totalDocuments: mappedData.length,
    }
  }
}

export const ledgerReportRepository = new LedgerReportRepository()
