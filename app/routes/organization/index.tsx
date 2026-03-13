import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { useToastFromLoader } from '~/hooks/useToastFromLoader'
import { useTranslation } from '~/i18n/context'
import { organizationRepository } from '~/features/organization/server/repository'
import { getUserOrganizations } from '~/server/auth/organization.server'
import { isSuperAdmin } from '~/server/permissions'
import { requireAuth } from '~/server/auth/session.server'
import { getFlash } from '~/server/flash.server'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { flash } = getFlash(request)

  const isSA = await isSuperAdmin(session.user.id)

  if (isSA) {
    const allOrgs = await organizationRepository.getAllWithStats()
    return { organizations: null, allOrgs, isSuperAdmin: true, toast: flash }
  }

  const organizations = await getUserOrganizations(session.user.id)
  return { organizations, allOrgs: null, isSuperAdmin: false, toast: flash }
}

export default function Organization({ loaderData }: Route.ComponentProps) {
  const { organizations, allOrgs, isSuperAdmin, toast } = loaderData
  const { t } = useTranslation()
  useToastFromLoader(toast)

  if (isSuperAdmin && allOrgs) {
    return (
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>Todas las Organizaciones</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              Vista de super administrador — {allOrgs.length} organización
              {allOrgs.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <Link to='/organization/new'>
            <Button>{t('organization.createOrg')}</Button>
          </Link>
        </div>

        {allOrgs.length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground'>
              No hay organizaciones creadas.
            </p>
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {allOrgs.map((org) => (
              <div
                key={org.id}
                className='rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md'
              >
                <div className='mb-3 flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h2 className='truncate text-lg font-semibold'>
                      {org.name}
                    </h2>
                    <p className='text-muted-foreground font-mono text-sm'>
                      @{org.slug}
                    </p>
                  </div>
                </div>

                <div className='mb-4 flex gap-3'>
                  <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs'>
                    {org.memberCount} miembro{org.memberCount !== 1 ? 's' : ''}
                  </span>
                  <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs'>
                    {org.activeModuleCount} módulo
                    {org.activeModuleCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs'>
                    {org.createdAt
                      ? new Date(org.createdAt).toLocaleDateString('es-GT')
                      : '—'}
                  </span>
                  <Link
                    to={`/organization/${org.slug}`}
                    className='text-primary text-sm font-medium hover:underline'
                  >
                    Gestionar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className=''>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>{t('organization.title')}</h1>
        <Link to='/organization/new'>
          <Button>{t('organization.createOrg')}</Button>
        </Link>
      </div>

      {!organizations || organizations.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('organization.noMember')}
          </p>
          <Link
            to='/organization/new'
            className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium'
          >
            {t('organization.createFirst')}
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
                  {t('organization.open')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
