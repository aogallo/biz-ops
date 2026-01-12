import {
  organizationCreateSchema,
  type OrganizationCreate,
} from "../../schemas";
import { OrganizationRepository } from "../repository";

export async function create(input: OrganizationCreate) {
  const repo = new OrganizationRepository();
  const data = organizationCreateSchema.parse(input);

  const db_org = await repo.getById(input.id);

  if (db_org) {
    throw new Response("The organization already exists.", { status: 400 });
  }

  return await repo.create(data);
}
