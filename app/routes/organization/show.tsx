import { useState } from 'react'
import { Link, useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { deleteOrganization } from '~/features/organization/server/actions/delete.action'
import { modulesRepository } from '~/features/modules/server/repository'
import { organizationRepository } from '~/features/organization/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { slug } = params

  const organization = await organizationRepository.getBySlug(slug)
  const appDomain = context?.cloudflare?.env?.APP_DOMAIN ?? 'bizops.app'

  const activeModules = organization
    ? await modulesRepository.getActiveModulesForOrg(organization.id)
    : []

  return {
    organization,
    appDomain,
    activeModules,
    canDelete: session.user.isSuperAdmin,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const locale = getLocaleFromRequest(request)
  const { slug } = params
  const result = await deleteOrganization(request, slug)
  if (result.success) {
    return redirectWithFlash('/organization', {
      type: 'success',
      message: translateServer(locale, 'messages.organization.deleted'),
    })
  }
  return result
}

function DeleteZone({
  orgName,
  activeModules,
  actionError,
}: {
  orgName: string
  activeModules: string[]
  actionError?: string
}) {
  const fetcher = useFetcher()
  const [confirmName, setConfirmName] = useState('')
  const [open, setOpen] = useState(false)

  const hasBlockers = activeModules.length > 0
  const isSubmitting = fetcher.state !== 'idle'
  const fetcherError = fetcher.data?.message

  return (
    <div className='border-destructive/30 bg-destructive/5 rounded-xl border p-6 shadow-sm'>
      <h2 className='text-destructive mb-1 text-base font-semibold'>
        Danger Zone
      </h2>
      <p className='text-muted-foreground mb-4 text-sm'>
        Deleting an organization is permanent and cannot be undone.
      </p>

      {(actionError || fetcherError) && (
        <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
          {actionError ?? fetcherError}
        </div>
      )}

      {hasBlockers && (
        <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30'>
          <p className='mb-2 text-sm font-medium text-amber-800 dark:text-amber-400'>
            Cannot delete — active modules must be deactivated first:
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {activeModules.map((mod) => (
              <span
                key={mod}
                className='rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
              >
                {mod}
              </span>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant='destructive' disabled={hasBlockers}>
            Delete organization
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{orgName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All data associated
              with this organization will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='my-2'>
            <label className='mb-1.5 block text-sm font-medium'>
              Type <span className='font-mono font-semibold'>{orgName}</span> to
              confirm
            </label>
            <input
              type='text'
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName}
              className='border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmName('')}>
              Cancel
            </AlertDialogCancel>
            <fetcher.Form method='post' onSubmit={() => setOpen(false)}>
              <Button
                type='submit'
                variant='destructive'
                disabled={confirmName !== orgName || isSubmitting}
              >
                {isSubmitting ? 'Deleting…' : 'Yes, delete permanently'}
              </Button>
            </fetcher.Form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function Show({ loaderData }: Route.ComponentProps) {
  const { organization, appDomain, activeModules, canDelete } = loaderData

  return (
    <div className='p-6'>
      <div className='mx-auto max-w-2xl space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div>
            <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
              <Link
                to='/organization'
                className='hover:text-foreground transition-colors'
              >
                Organizations
              </Link>
              <span>/</span>
              <span className='text-foreground'>{organization?.name}</span>
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {organization?.name ?? 'Organization'}
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' asChild>
              <Link to='edit'>Edit</Link>
            </Button>
            <Button variant='ghost' asChild>
              <Link to='/organization'>Back</Link>
            </Button>
          </div>
        </div>

        {/* Info card */}
        <div className='bg-card rounded-xl p-6 shadow-sm'>
          <div className='flex items-center gap-5'>
            {organization?.logo ? (
              <img
                src={organization.logo}
                alt={organization.name ?? 'Organization'}
                className='h-20 w-20 rounded-full border object-cover'
              />
            ) : (
              <div className='bg-muted text-muted-foreground flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-semibold'>
                {organization?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className='space-y-1'>
              <h2 className='text-lg font-semibold'>{organization?.name}</h2>
              <span className='bg-muted text-muted-foreground inline-block rounded-full px-2.5 py-0.5 font-mono text-xs'>
                {organization?.slug}
              </span>
              {organization?.domain && (
                <div>
                  <a
                    href={`https://${organization.domain}.${appDomain}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary text-sm hover:underline'
                  >
                    {organization.domain}.{appDomain}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active modules card */}
        {activeModules.length > 0 && (
          <div className='bg-card rounded-xl p-6 shadow-sm'>
            <h2 className='mb-3 text-base font-semibold'>Active Modules</h2>
            <div className='flex flex-wrap gap-2'>
              {activeModules.map((mod) => (
                <span
                  key={mod}
                  className='rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400'
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Danger zone — super admin only */}
        {canDelete && (
          <DeleteZone
            orgName={organization?.name ?? ''}
            activeModules={activeModules}
          />
        )}
      </div>
    </div>
  )
}
