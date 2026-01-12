import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { organizationModel } from "~/server/db/schemas/auth";
import type { OrganizationCreate } from "../schemas";

export class OrganizationRepository {
  async create(data: OrganizationCreate) {
    const response = await db
      .insert(organizationModel)
      .values(data)
      .returning();
    return response[0];
  }

  async getAll() {
    return await db.select().from(organizationModel);
  }

  async getById(id: string) {
    const data = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.id, id));

    if (data.length === 0) return null;

    return data[0];
  }

  async delete(id: string) {
    try {
      await db.delete(organizationModel).where(eq(organizationModel.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async getBySlug(slug: string) {
    const data = await db
      .select()
      .from(organizationModel)
      .where(eq(organizationModel.slug, slug));

    if (data.length === 0) return null;

    return data[0];
  }
}
