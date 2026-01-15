import { and, eq, ne, or } from "drizzle-orm";
import { db } from "~/server/db";
import { businessPartnerModel } from "~/server/db/schemas/businessPartner";
import type { CreateBusinessPartnerInput, PartnerType } from "../schemas";

export class BusinessPartnersRepository {
  /**
   * Create a new business partner
   */
  async create(data: CreateBusinessPartnerInput) {
    // Convert empty email to null
    const partnerData = {
      ...data,
      email: data.email || null,
    };

    const [partner] = await db
      .insert(businessPartnerModel)
      .values(partnerData)
      .returning();
    return partner;
  }

  /**
   * Get all business partners for an organization
   */
  async getAllByOrganization(organizationId: string, type?: PartnerType) {
    const conditions = type
      ? and(
          eq(businessPartnerModel.organizationId, organizationId),
          or(
            eq(businessPartnerModel.type, type),
            eq(businessPartnerModel.type, "both"),
          ),
        )
      : eq(businessPartnerModel.organizationId, organizationId);

    return await db
      .select()
      .from(businessPartnerModel)
      .where(conditions)
      .orderBy(businessPartnerModel.name);
  }

  /**
   * Get business partner by ID
   */
  async getById(id: string) {
    const [partner] = await db
      .select()
      .from(businessPartnerModel)
      .where(eq(businessPartnerModel.id, id))
      .limit(1);

    return partner || null;
  }

  /**
   * Get business partner by ID within organization (security check)
   */
  async getByIdForOrganization(organizationId: string, id: string) {
    const [partner] = await db
      .select()
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          eq(businessPartnerModel.id, id),
        ),
      )
      .limit(1);

    return partner || null;
  }

  /**
   * Get clients only
   */
  async getClients(organizationId: string) {
    return this.getAllByOrganization(organizationId, "client");
  }

  /**
   * Get vendors only
   */
  async getVendors(organizationId: string) {
    return this.getAllByOrganization(organizationId, "vendor");
  }

  /**
   * Update business partner
   */
  async update(id: string, data: Partial<CreateBusinessPartnerInput>) {
    const updateData = {
      ...data,
      email: data.email || null,
      updatedAt: new Date(),
    };

    const [partner] = await db
      .update(businessPartnerModel)
      .set(updateData)
      .where(eq(businessPartnerModel.id, id))
      .returning();

    return partner || null;
  }

  /**
   * Delete business partner
   */
  async delete(id: string) {
    try {
      await db
        .delete(businessPartnerModel)
        .where(eq(businessPartnerModel.id, id));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if email exists in organization
   */
  async existsByEmail(
    organizationId: string,
    email: string,
    excludeId?: string,
  ) {
    if (!email) return false;

    const conditions = excludeId
      ? and(
          eq(businessPartnerModel.organizationId, organizationId),
          eq(businessPartnerModel.email, email),
          ne(businessPartnerModel.id, excludeId),
        )
      : and(
          eq(businessPartnerModel.organizationId, organizationId),
          eq(businessPartnerModel.email, email),
        );

    const [partner] = await db
      .select({ id: businessPartnerModel.id })
      .from(businessPartnerModel)
      .where(conditions)
      .limit(1);

    return !!partner;
  }
}

export const businessPartnersRepository = new BusinessPartnersRepository();
