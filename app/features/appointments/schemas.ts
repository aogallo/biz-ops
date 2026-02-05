import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { appointmentModel } from '~/server/db/schemas/appointment'

// Base schemas from Drizzle
export const insertAppointmentSchema = createInsertSchema(appointmentModel, {
  clientId: z.string().uuid('Invalid client ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  staffId: z.string().uuid('Invalid staff ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
})

export const selectAppointmentSchema = createSelectSchema(appointmentModel)

// Create schema (omit id, timestamps, endTime is calculated)
export const createAppointmentSchema = insertAppointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  endTime: true, // Will be calculated from startTime + service duration
}).extend({
  // Override to make these required
  clientId: z.string().uuid('Please select a client'),
  serviceId: z.string().uuid('Please select a service'),
  staffId: z.string().uuid('Please select a staff member'),
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a time slot'),
})

// Update schema (all fields optional except id)
export const updateAppointmentSchema = insertAppointmentSchema
  .partial()
  .required({ id: true })
  .omit({ createdAt: true, updatedAt: true })

// Type exports
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type Appointment = z.infer<typeof selectAppointmentSchema>

// Appointment status type
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

// Status display configuration
export const appointmentStatusConfig: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'secondary' },
}
