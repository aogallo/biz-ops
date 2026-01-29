import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  const organizations = await getUserOrganizations(session.user.id)

  const { flash } = getFlash(request)

  return { organizations, toast: flash }
}

export default function Organization({ loaderData }: Route.ComponentProps) {
  const { organizations, toast } = loaderData
  useToastFromLoader(toast)

  return (
    <div className=''>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Your Organizations</h1>
        <Link to='/organization/new'>
          <Button>Create Organization</Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            You are not a member of any organizations yet.
          </p>
          <Link
            to='/organization/new'
            className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium'
          >
            Create Your First Organization
          </Link>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {organizations.map(({ organization, membership }) => (
            <div
              key={organization.id}
              className='rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md'
            >
              <h2 className='mb-2 text-lg font-semibold'>
                {organization.name}
              </h2>
              <p className='text-muted-foreground mb-4 text-sm'>
                @{organization.slug}
              </p>
              <div className='flex items-center justify-between'>
                <span className='bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium'>
                  {membership.role}
                </span>
                <Link
                  to={`/organization/${organization.slug}`}
                  className='text-primary text-sm font-medium hover:underline'
                >
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
