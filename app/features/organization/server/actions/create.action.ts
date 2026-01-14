import auth from "~/server/auth-server";
import { organizationCreateSchema } from "../../schemas";
import { organizationRepository } from "../repository";

export async function createOrganization(request: Request, input: FormData) {
  const inputValues = Object.fromEntries(input);
  const { data, error, success } =
    organizationCreateSchema.safeParse(inputValues);

  if (!success) {
    return {
      success: false,
      message: "There are errors",
      errors: error.flatten().fieldErrors,
    };
  }

  const organizationBySlug = await organizationRepository.getBySlug(data.slug);

  if (organizationBySlug) {
    return {
      success: false,
      message: "The organization already exists.",
    };
  }

  const createdOrganization = await auth.api.createOrganization({
    body: {
      name: data.name, //required
      slug: data.slug, // required
      logo: data.logo || "",
      metadata: {},
      keepCurrentActiveOrganization: false,
    },
    headers: request.headers,
  });

  return {
    success: true,
    data: createdOrganization,
  };
}
