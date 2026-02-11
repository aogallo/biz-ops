import { and, count, eq, gte, lte, sql, sum } from 'drizzle-orm'
import { db } from '~/server/db'
import { appointmentModel } from '~/server/db/schemas/appointment'
import { businessPartnerModel } from '~/server/db/schemas/businessPartner'
import { serviceModel } from '~/server/db/schemas/service'
import { memberModel, userModel } from '~/server/db/schemas/auth'

export class DashboardStatsRepository {
  /**
   * Get today's appointments (up to limit)
   */
  async getTodayAppointments(organizationId: string, today: string, limit = 5) {
    return await db
      .select({
        id: appointmentModel.id,
        date: appointmentModel.date,
        startTime: appointmentModel.startTime,
        endTime: appointmentModel.endTime,
        status: appointmentModel.status,
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
          eq(appointmentModel.date, today)
        )
      )
      .orderBy(appointmentModel.startTime)
      .limit(limit)
  }

  /**
   * Get the next upcoming appointment (today, from current time onwards)
   */
  async getNextAppointment(organizationId: string, today: string, currentTime: string) {
    const [appointment] = await db
      .select({
        id: appointmentModel.id,
        date: appointmentModel.date,
        startTime: appointmentModel.startTime,
        endTime: appointmentModel.endTime,
        status: appointmentModel.status,
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
          eq(appointmentModel.date, today),
          gte(appointmentModel.startTime, currentTime),
          sql`${appointmentModel.status} IN ('pending', 'confirmed')`
        )
      )
      .orderBy(appointmentModel.startTime)
      .limit(1)

    return appointment || null
  }

  /**
   * Get monthly stats: revenue, total, completed, cancelled
   */
  async getMonthlyStats(organizationId: string, monthStart: string, monthEnd: string) {
    const [stats] = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'completed')`.as('completed'),
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${appointmentModel.status} = 'cancelled')`.as('cancelled'),
      })
      .from(appointmentModel)
      .where(
        and(
          eq(appointmentModel.organizationId, organizationId),
          gte(appointmentModel.date, monthStart),
          lte(appointmentModel.date, monthEnd)
        )
      )

    // Revenue: sum of service prices for completed appointments
    const [revenueResult] = await db
      .select({
        revenue: sum(serviceModel.price),
      })
      .from(appointmentModel)
      .innerJoin(serviceModel, eq(appointmentModel.serviceId, serviceModel.id))
      .where(
        and(
          eq(appointmentModel.organizationId, organizationId),
          eq(appointmentModel.status, 'completed'),
          gte(appointmentModel.date, monthStart),
          lte(appointmentModel.date, monthEnd)
        )
      )

    return {
      total: stats?.total ?? 0,
      completed: stats?.completed ?? 0,
      cancelled: stats?.cancelled ?? 0,
      revenue: Number(revenueResult?.revenue ?? 0),
    }
  }

  /**
   * Calculate occupancy rate for a date range
   * Occupancy = booked hours / (8h * weekdays * staff count)
   */
  async getOccupancyRate(
    organizationId: string,
    startDate: string,
    endDate: string,
    staffCount: number
  ) {
    if (staffCount === 0) return 0

    // Sum of appointment durations in minutes
    const [result] = await db
      .select({
        totalMinutes: sql<number>`
          COALESCE(SUM(
            EXTRACT(EPOCH FROM (${appointmentModel.endTime}::time - ${appointmentModel.startTime}::time)) / 60
          ), 0)
        `.as('total_minutes'),
      })
      .from(appointmentModel)
      .where(
        and(
          eq(appointmentModel.organizationId, organizationId),
          gte(appointmentModel.date, startDate),
          lte(appointmentModel.date, endDate),
          sql`${appointmentModel.status} IN ('pending', 'confirmed', 'completed')`
        )
      )

    const bookedMinutes = Number(result?.totalMinutes ?? 0)

    // Calculate weekdays in range
    const start = new Date(startDate)
    const end = new Date(endDate)
    let weekdays = 0
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) weekdays++
      current.setDate(current.getDate() + 1)
    }

    const availableMinutes = weekdays * 8 * 60 * staffCount // 8h per day
    if (availableMinutes === 0) return 0

    return Math.round((bookedMinutes / availableMinutes) * 100)
  }
}

export const dashboardStatsRepository = new DashboardStatsRepository()
