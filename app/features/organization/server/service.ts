import type { OrganizationCreate } from "../schemas";
import { OrganizationRepository } from "./repository";

export class OrganizationService {
  constructor(private repo = new OrganizationRepository()) {}

  async create(data: OrganizationCreate) {
    return this.repo.create(data);
  }
}
