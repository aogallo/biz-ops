import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/home'
import UserInformation from '~/features/home/components/UserInformation'
import { getUserOrganizations } from '~/server/permissions'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  const organizations = await getUserOrganizations(session.user.id)

  return {
    userName: session.user.name,
    companyName: organizations[0].name,
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { userName, companyName } = loaderData
  return (
    <div>
      <UserInformation userName={userName} companyName={companyName} />
    </div>
  )
}
