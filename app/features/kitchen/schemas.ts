import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  kitchenStationModel,
  kitchenTicketModel,
  kitchenTicketItemModel,
} from '~/server/db/schemas/kitchen'

export const insertKitchenStationSchema =
  createInsertSchema(kitchenStationModel)
export const selectKitchenStationSchema =
  createSelectSchema(kitchenStationModel)
export const insertKitchenTicketSchema = createInsertSchema(kitchenTicketModel)
export const selectKitchenTicketSchema = createSelectSchema(kitchenTicketModel)
export const insertKitchenTicketItemSchema = createInsertSchema(
  kitchenTicketItemModel
)
export const selectKitchenTicketItemSchema = createSelectSchema(
  kitchenTicketItemModel
)

export const createKitchenTicketSchema = z.object({
  organizationId: z.string().uuid(),
  sucursalId: z.string().uuid().optional().nullable(),
  saleId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional().nullable(),
        productName: z.string().min(1),
        quantity: z.number().positive(),
        stationId: z.string().uuid().optional().nullable(),
        modificationsJson: z.any().optional().nullable(),
      })
    )
    .min(1),
})

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'ready', 'served']),
})

export const updateItemStatusSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['pending', 'ready']),
})

export type CreateKitchenTicketInput = z.infer<typeof createKitchenTicketSchema>
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>
export type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>
