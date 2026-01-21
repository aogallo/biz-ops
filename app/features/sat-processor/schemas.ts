import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { satFileModel } from '~/server/db/schemas/sat-file'

export const baseSatFileSchema = createInsertSchema(satFileModel)

// Invoice type enum - determines if the company is emisor (sales) or receptor (purchase)
export const invoiceTypeSchema = z.enum(['purchase', 'sales'])
export type InvoiceType = z.infer<typeof invoiceTypeSchema>

export const satFileRowSchema = z.object({
  date: z.string(),
  authorizationNumber: z.string(),
  dteType: z.string(),
  serie: z.string(),
  dteNumber: z.string(),
  emitterNit: z.string().optional(),
  emitterName: z.string().optional(),
  receptorNit: z.string().optional(),
  receptorName: z.string().optional(),
  exportation: z.boolean().optional().default(false),
  certificatorNit: z.string().optional(),
  certificatorName: z.string().optional(),
  state: z.string(),
  money: z.string(),
  total: z.coerce.number(),
  iva: z.coerce.number(),
  isVoided: z.boolean().optional().default(false),
  voidedDate: z.string().optional().nullable(),
  petroleum: z.coerce.number().optional().default(0),
  hotel: z.coerce.number().optional().default(0),
  tickets: z.coerce.number().optional().default(0),
  pressStamp: z.coerce.number().optional().default(0),
  firefighters: z.coerce.number().optional().default(0),
  municipalTax: z.coerce.number().optional().default(0),
  alcoholicTax: z.coerce.number().optional().default(0),
  tobaccoTax: z.coerce.number().optional().default(0),
  cementTax: z.coerce.number().optional().default(0),
  noAlcoholicTax: z.coerce.number().optional().default(0),
  portTariffTax: z.coerce.number().optional().default(0),
})

export type SatFileRow = z.infer<typeof satFileRowSchema>

export const updateAccountSchema = z.object({
  satFileId: z.string().uuid('Invalid SAT file ID'),
  accountingAccountId: z
    .string()
    .uuid('Invalid accounting account ID')
    .nullable(),
})

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>

export const uploadFormSchema = z.object({
  companyId: z.string().uuid('Please select a company'),
  invoiceType: invoiceTypeSchema,
  file: z.instanceof(File).refine(
    (file) => {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/xml',
        'application/xml',
      ]
      return (
        validTypes.includes(file.type) ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xml')
      )
    },
    { message: 'File must be CSV, XLS, XLSX, or XML' }
  ),
})

export type UploadFormInput = z.infer<typeof uploadFormSchema>
