import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { organization } from "~/server/db/schema";
import type { OrganizationCreate } from "../schemas";

export class OrganizationRepository {
  async create(data: OrganizationCreate) {
    return await db.insert(organization).values(data).returning();
  }

  async getAll() {
    return await db.select().from(organization);
  }

  async getById(id: string) {
    const data = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id));

    if (data.length === 0) return null;

    return data[0];
  }

  async delete(id: string) {
    try {
      await db.delete(organization).where(eq(organization.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async getBySlug(slug: string) {
    const data = await db
      .select()
      .from(organization)
      .where(eq(organization.slug, slug));

    if (data.length === 0) return null;

    return data[0];
  }
}
