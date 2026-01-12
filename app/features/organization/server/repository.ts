import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { organization } from "~/server/db/schema";
import type { OrganizationCreate } from "../schemas";

export class OrganizationRepository {
  async create(data: OrganizationCreate) {
    return await db.insert(organization).values(data);
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
}
