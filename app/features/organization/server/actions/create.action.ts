import { organizationCreateSchema } from "../../schemas";
import { OrganizationRepository } from "../repository";

export async function createOrganization(input: FormData) {
  const inputValues = Object.fromEntries(input);
  const repo = new OrganizationRepository();
  const { data, error, success } =
    organizationCreateSchema.safeParse(inputValues);

  if (!success) {
    return {
      success: false,
      message: "There are errors",
      errors: error.flatten().fieldErrors,
    };
  }

  const organizationBySlug = await repo.getBySlug(data.slug);

  if (organizationBySlug) {
    return {
      success: false,
      message: "The organization already exists.",
    };
  }

  const createdOrganization = await repo.create(data);

  return {
    success: true,
    data: createdOrganization,
  };
}
