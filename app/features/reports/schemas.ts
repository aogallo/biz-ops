import { z } from 'zod'

export const reportTypeSchema = z.enum([
  'journal-entry',
  'sales-ledger',
  'purchase-ledger',
  'general-ledger',
  'appointment-occupancy',
])

export const generateReportSchema = z.object({
  _action: z.literal('generate'),
  reportType: reportTypeSchema,
  companyId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
})

export const exportReportSchema = z.object({
  _action: z.literal('export'),
  reportType: reportTypeSchema,
  companyId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type GenerateReportInput = z.infer<typeof generateReportSchema>
export type ExportReportInput = z.infer<typeof exportReportSchema>
export type ReportType = z.infer<typeof reportTypeSchema>
