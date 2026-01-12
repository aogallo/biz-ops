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
    return await db.query.organization.findFirst();
  }
}
