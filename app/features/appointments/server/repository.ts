import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '~/server/db'
import { appointmentModel } from '~/server/db/schemas/appointment'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { serviceModel } from '~/server/db/schemas/service'
import { memberModel, userModel } from '~/server/db/schemas/auth'

export interface CreateAppointmentData {
  organizationId: string
  clientId: string
  serviceId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
}

export class AppointmentsRepository {
  /**
   * Create a new appointment
   */
  async create(data: CreateAppointmentData) {
    const [appointment] = await db.insert(appointmentModel).values(data).returning()
    return appointment
  }

  /**
   * Get all appointments for an organization
   */
  async getAllByOrganization(organizationId: string) {
    return await db
      .select({
        id: appointmentModel.id,
        organizationId: appointmentModel.organizationId,
        clientId: appointmentModel.clientId,
        serviceId: appointmentModel.serviceId,
        staffId: appointmentModel.staffId,
        date: appointmentModel.date,
        startTime: appointmentModel.startTime,
        endTime: appointmentModel.endTime,
        status: appointmentModel.status,
        notes: appointmentModel.notes,
        createdAt: appointmentModel.createdAt,
        updatedAt: appointmentModel.updatedAt,
        // Joined fields
        clientName: businessPartnerModel.name,
        serviceName: serviceModel.name,
        serviceColor: serviceModel.color,
        staffName: userModel.name,
      })
      .from(appointmentModel)
      .innerJoin(businessPartnerModel, eq(appointmentModel.clientId, businessPartnerModel.id))
      .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
      .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
      .innerJoin(userModel, eq(memberModel.userId, userModel.id))
      .where(eq(appointmentModel.organizationId, organizationId))
      .orderBy(appointmentModel.date, appointmentModel.startTime)
  }

  /**
   * Get appointments for a date range
   */
  async getByDateRange(organizationId: string, startDate: string, endDate: string) {
    return await db
      .select({
        id: appointmentModel.id,
        organizationId: appointmentModel.organizationId,
        clientId: appointmentModel.clientId,
        serviceId: appointmentModel.serviceId,
        staffId: appointmentModel.staffId,
        date: appointmentModel.date,
        startTime: appointmentModel.startTime,
        endTime: appointmentModel.endTime,
        status: appointmentModel.status,
        notes: appointmentModel.notes,
        createdAt: appointmentModel.createdAt,
        updatedAt: appointmentModel.updatedAt,
        // Joined fields
        clientName: businessPartnerModel.name,
        serviceName: serviceModel.name,
        serviceColor: serviceModel.color,
        staffName: userModel.name,
      })
      .from(appointmentModel)
      .innerJoin(businessPartnerModel, eq(appointmentModel.clientId, businessPartnerModel.id))
      .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
      .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
      .innerJoin(userModel, eq(memberModel.userId, userModel.id))
      .where(
        and(
          eq(appointmentModel.organizationId, organizationId),
          gte(appointmentModel.date, startDate),
          lte(appointmentModel.date, endDate)
        )
      )
      .orderBy(appointmentModel.date, appointmentModel.startTime)
  }

  /**
   * Get appointment by ID
   */
  async getById(id: string) {
    const [appointment] = await db
      .select()
      .from(appointmentModel)
      .where(eq(appointmentModel.id, id))
      .limit(1)

    return appointment || null
  }

  /**
   * Get appointment by ID within an organization (with joined data)
   */
  async getByIdAndOrganization(id: string, organizationId: string) {
    const [appointment] = await db
      .select({
        id: appointmentModel.id,
        organizationId: appointmentModel.organizationId,
        clientId: appointmentModel.clientId,
        serviceId: appointmentModel.serviceId,
        staffId: appointmentModel.staffId,
        date: appointmentModel.date,
        startTime: appointmentModel.startTime,
        endTime: appointmentModel.endTime,
        status: appointmentModel.status,
        notes: appointmentModel.notes,
        createdAt: appointmentModel.createdAt,
        updatedAt: appointmentModel.updatedAt,
        // Joined fields
        clientName: businessPartnerModel.name,
        serviceName: serviceModel.name,
        serviceColor: serviceModel.color,
        staffName: userModel.name,
      })
      .from(appointmentModel)
      .innerJoin(businessPartnerModel, eq(appointmentModel.clientId, businessPartnerModel.id))
      .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
      .innerJoin(memberModel, eq(appointmentModel.staffId, memberModel.id))
      .innerJoin(userModel, eq(memberModel.userId, userModel.id))
      .where(
        and(
          eq(appointmentModel.id, id),
          eq(appointmentModel.organizationId, organizationId)
        )
      )
      .limit(1)

    return appointment || null
  }

  /**
   * Update appointment
   */
  async update(id: string, data: Partial<Omit<CreateAppointmentData, 'organizationId'>>) {
    const [appointment] = await db
      .update(appointmentModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointmentModel.id, id))
      .returning()

    return appointment || null
  }

  /**
   * Update appointment status
   */
  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    const [appointment] = await db
      .update(appointmentModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointmentModel.id, id))
      .returning()

    return appointment || null
  }

  /**
   * Delete appointment
   */
  async delete(id: string) {
    try {
      await db.delete(appointmentModel).where(eq(appointmentModel.id, id))
      return true
    } catch {
      return false
    }
  }

  /**
   * Get appointments for a specific staff member on a date
   */
  async getByStaffAndDate(organizationId: string, staffId: string, date: string) {
    return await db
      .select()
      .from(appointmentModel)
      .where(
        and(
          eq(appointmentModel.organizationId, organizationId),
          eq(appointmentModel.staffId, staffId),
          eq(appointmentModel.date, date)
        )
      )
      .orderBy(appointmentModel.startTime)
  }
}

export const appointmentsRepository = new AppointmentsRepository()
