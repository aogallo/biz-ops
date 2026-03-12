import { and, count, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { db } from '~/server/db'
import { appointmentModel } from '~/server/db/schemas/appointment'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { serviceModel } from '~/server/db/schemas/service'
import { memberModel, userModel } from '~/server/db/schemas/auth'

interface AppointmentReportInput {
  dateFrom?: string
  dateTo?: string
  staffId?: string
  page?: number
  pageSize?: number
}

export interface AppointmentReportRow {
  id: string
  date: string
  startTime: string
  endTime: string
  staffName: string | null
  serviceName: string
  clientName: string
  duration: number
  price: string | null
  status: string
}

export interface AppointmentReportResult {
  success: true
  data: AppointmentReportRow[]
  summary: {
    totalRevenue: number
    totalAppointments: number
    completed: number
    cancelled: number
    pending: number
    confirmed: number
  }
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AppointmentExportResult {
  success: true
  export: {
    csvBase64: string
    filename: string
  }
}

function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0]
}

function buildConditions(
  organizationId: string,
  input: AppointmentReportInput
) {
  const conditions = [eq(appointmentModel.organizationId, organizationId)]

  const dateFrom = parseDate(input.dateFrom)
  const dateTo = parseDate(input.dateTo)

  if (dateFrom) conditions.push(gte(appointmentModel.date, dateFrom))
  if (dateTo) conditions.push(lte(appointmentModel.date, dateTo))
  if (input.staffId)
    conditions.push(eq(appointmentModel.staffId, input.staffId))

  return and(...conditions)
}

export async function generateAppointmentReportAction(
  organizationId: string,
  input: AppointmentReportInput
): Promise<AppointmentReportResult> {
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20
  const offset = (page - 1) * pageSize

  const whereClause = buildConditions(organizationId, input)

  // Fetch paginated data
  const data = await db
    .select({
      id: appointmentModel.id,
      date: appointmentModel.date,
      startTime: appointmentModel.startTime,
      endTime: appointmentModel.endTime,
      status: appointmentModel.status,
      staffName: userModel.name,
      serviceName: serviceModel.name,
      clientName: businessPartnerModel.name,
      price: serviceModel.price,
      duration: serviceModel.duration,
    })
    .from(appointmentModel)
    .innerJoin(
      businessPartnerModel,
      eq(appointmentModel.clientId, businessPartnerModel.id)
    )
    .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
    .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
    .innerJoin(userModel, eq(memberModel.userId, userModel.id))
    .where(whereClause)
    .orderBy(appointmentModel.date, appointmentModel.startTime)
    .limit(pageSize)
    .offset(offset)

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(appointmentModel)
    .where(whereClause)

  const total = countResult?.count ?? 0

  // Get summary stats
  const [summaryResult] = await db
    .select({
      totalAppointments: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'completed')`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'cancelled')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'pending')`,
      confirmed: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'confirmed')`,
    })
    .from(appointmentModel)
    .where(whereClause)

  // Revenue for completed appointments
  const [revenueResult] = await db
    .select({ totalRevenue: sum(serviceModel.price) })
    .from(appointmentModel)
    .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
    .where(and(whereClause, eq(appointmentModel.status, 'completed')))

  return {
    success: true,
    data,
    summary: {
      totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
      totalAppointments: summaryResult?.totalAppointments ?? 0,
      completed: summaryResult?.completed ?? 0,
      cancelled: summaryResult?.cancelled ?? 0,
      pending: summaryResult?.pending ?? 0,
      confirmed: summaryResult?.confirmed ?? 0,
    },
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function exportAppointmentReportAction(
  organizationId: string,
  input: AppointmentReportInput
): Promise<AppointmentExportResult> {
  const whereClause = buildConditions(organizationId, input)

  // Fetch ALL rows (no pagination)
  const data = await db
    .select({
      date: appointmentModel.date,
      startTime: appointmentModel.startTime,
      endTime: appointmentModel.endTime,
      status: appointmentModel.status,
      staffName: userModel.name,
      serviceName: serviceModel.name,
      clientName: businessPartnerModel.name,
      price: serviceModel.price,
      duration: serviceModel.duration,
    })
    .from(appointmentModel)
    .innerJoin(
      businessPartnerModel,
      eq(appointmentModel.clientId, businessPartnerModel.id)
    )
    .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
    .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
    .innerJoin(userModel, eq(memberModel.userId, userModel.id))
    .where(whereClause)
    .orderBy(appointmentModel.date, appointmentModel.startTime)

  // Generate CSV
  const headers = [
    'Date',
    'Start Time',
    'End Time',
    'Staff',
    'Service',
    'Client',
    'Duration (min)',
    'Price',
    'Status',
  ]
  const rows = data.map((row) => [
    row.date,
    row.startTime,
    row.endTime,
    row.staffName ?? '',
    row.serviceName,
    row.clientName,
    String(row.duration),
    row.price ?? '0',
    row.status,
  ])

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\n')
  const csvBase64 = btoa(unescape(encodeURIComponent(csv)))

  const dateFrom = parseDate(input.dateFrom) ?? 'all'
  const dateTo = parseDate(input.dateTo) ?? 'all'
  const filename = `appointment-report_${dateFrom}_${dateTo}.csv`

  return {
    success: true,
    export: { csvBase64, filename },
  }
}
