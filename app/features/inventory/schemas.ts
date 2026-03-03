import { z } from 'zod'

export const transferToSucursalSchema = z.object({
  organizationId: z.string().uuid(),
  sucursalId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
})

export const adjustSucursalStockSchema = z.object({
  sucursalId: z.string().uuid(),
  productId: z.string().uuid(),
  newStock: z.number().int().nonnegative('Stock cannot be negative'),
  notes: z.string().optional(),
  organizationId: z.string().uuid(),
})

export const ingressSucursalStockSchema = z.object({
  organizationId: z.string().uuid(),
  sucursalId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
})

export type TransferToSucursalInput = z.infer<typeof transferToSucursalSchema>
export type AdjustSucursalStockInput = z.infer<typeof adjustSucursalStockSchema>
export type IngressSucursalStockInput = z.infer<typeof ingressSucursalStockSchema>
