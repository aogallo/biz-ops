import { OrganizationRepository } from "../server/repository";
import type { Route } from "./+types/show";

export async function loader({ params }: Route.LoaderArgs) {
  const repo = new OrganizationRepository();
  const { slug } = params;

  const organization = await repo.getBySlug(slug);

  return { organization };
}

export default function Show({ params, loaderData }: Route.ComponentProps) {
  const { organization } = loaderData;
  return (
    <>
      hola {params.slug} {organization?.name}
    </>
  );
}
