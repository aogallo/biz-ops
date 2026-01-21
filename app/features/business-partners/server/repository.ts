import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "~/server/db";
import { businessPartnerModel } from "~/server/db/schemas/businessPartner";
import type { CreateBusinessPartnerInput, PartnerType } from "../schemas";

export interface PartnerToCreate {
  nit: string;
  name: string;
  type: PartnerType;
}

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

  /**
   * Find business partner by NIT within organization
   */
  async findByNit(organizationId: string, nit: string) {
    if (!nit) return null;

    const [partner] = await db
      .select()
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          eq(businessPartnerModel.nit, nit),
        ),
      )
      .limit(1);

    return partner || null;
  }

  /**
   * Find all business partners by NITs within organization
   */
  async findByNits(organizationId: string, nits: string[]) {
    if (nits.length === 0) return [];

    return await db
      .select()
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          inArray(businessPartnerModel.nit, nits),
        ),
      );
  }

  /**
   * Bulk find or create business partners by NIT
   * Returns a map of NIT -> partner ID
   */
  async bulkFindOrCreateByNit(
    organizationId: string,
    partners: PartnerToCreate[],
  ): Promise<Map<string, string>> {
    const nitToIdMap = new Map<string, string>();

    if (partners.length === 0) return nitToIdMap;

    // Get unique NITs
    const uniquePartners = new Map<string, PartnerToCreate>();
    for (const partner of partners) {
      if (partner.nit && !uniquePartners.has(partner.nit)) {
        uniquePartners.set(partner.nit, partner);
      }
    }

    const uniqueNits = Array.from(uniquePartners.keys());

    // Find existing partners by NIT
    const existingPartners = await this.findByNits(organizationId, uniqueNits);

    // Build map of existing partners and check for type upgrades
    const partnersToUpgrade: { id: string; currentType: string }[] = [];
    for (const existing of existingPartners) {
      if (existing.nit) {
        nitToIdMap.set(existing.nit, existing.id);

        // Check if partner needs type upgrade to "both"
        const requestedPartner = uniquePartners.get(existing.nit);
        if (requestedPartner && existing.type !== "both") {
          if (
            (existing.type === "client" && requestedPartner.type === "vendor") ||
            (existing.type === "vendor" && requestedPartner.type === "client")
          ) {
            partnersToUpgrade.push({ id: existing.id, currentType: existing.type });
          }
        }
      }
    }

    // Upgrade partners that need to be "both"
    for (const toUpgrade of partnersToUpgrade) {
      await this.update(toUpgrade.id, { type: "both" });
    }

    // Find NITs that need to be created
    const existingNits = new Set(existingPartners.map((p) => p.nit));
    const nitsToCreate = uniqueNits.filter((nit) => !existingNits.has(nit));

    // Create missing partners
    if (nitsToCreate.length > 0) {
      const partnersData = nitsToCreate.map((nit) => {
        const partnerData = uniquePartners.get(nit)!;
        return {
          organizationId,
          nit: partnerData.nit,
          name: partnerData.name,
          type: partnerData.type,
        };
      });

      const createdPartners = await db
        .insert(businessPartnerModel)
        .values(partnersData)
        .returning();

      for (const created of createdPartners) {
        if (created.nit) {
          nitToIdMap.set(created.nit, created.id);
        }
      }
    }

    return nitToIdMap;
  }
}

export const businessPartnersRepository = new BusinessPartnersRepository();
