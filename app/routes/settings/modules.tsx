import { ArrowLeft } from 'lucide-react'
import { Form, Link, useNavigation } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { APP_MODULES, MODULE_META } from '~/features/modules/constants'
import { toggleOrgModuleSchema } from '~/features/modules/schemas'
import { modulesRepository } from '~/features/modules/server/repository'
import { requireAuth } from '~/server/auth/session.server'
import { isSuperAdmin } from '~/server/permissions'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/modules'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { orgModules: [], organizationId: null }
  }

  const orgModules = await modulesRepository.getOrgModules(organizationId)

  return { orgModules, organizationId }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  const superAdmin = await isSuperAdmin(session.user.id)
  if (!superAdmin) {
    return { error: 'Insufficient permissions' }
  }

  const formData = await request.formData()

  const result = toggleOrgModuleSchema.safeParse({
    organizationId: formData.get('organizationId'),
    moduleKey: formData.get('moduleKey'),
    isActive: formData.get('isActive'),
  })

  if (!result.success) {
    return { error: 'Invalid data' }
  }

  const isActive = result.data.isActive as boolean

  await modulesRepository.setOrgModuleActive(
    result.data.organizationId,
    result.data.moduleKey,
    isActive
  )

  if (isActive) {
    await modulesRepository.autoGrantMemberAccess(
      result.data.organizationId,
      result.data.moduleKey
    )
  } else {
    await modulesRepository.revokeAllMembersAccess(
      result.data.organizationId,
      result.data.moduleKey
    )
  }

  return redirectWithFlash('/settings/modules', {
    type: 'success',
    message: 'Module updated successfully',
  })
}

export default function ModulesSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { orgModules, organizationId } = loaderData
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const activeModuleKeys = new Set(
    orgModules.filter((m) => m.isActive).map((m) => m.moduleKey)
  )

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          to='/settings/accounting'
          className='text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='h-4 w-4' />
        </Link>
        <div>
          <h1 className='text-2xl font-bold'>Módulos habilitados</h1>
          <p className='text-muted-foreground text-sm'>
            Activá o desactivá módulos para esta organización
          </p>
        </div>
      </div>

      {!organizationId && (
        <div className='text-muted-foreground rounded-md border p-6 text-center text-sm'>
          Seleccioná una organización para gestionar sus módulos.
        </div>
      )}

      {organizationId && (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {APP_MODULES.map((moduleKey) => {
            const meta = MODULE_META[moduleKey]
            const isActive = activeModuleKeys.has(moduleKey)
            const Icon = meta.icon

            return (
              <Card key={moduleKey}>
                <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                      <Icon className='text-primary h-5 w-5' />
                    </div>
                    <div>
                      <CardTitle className='text-base'>{meta.label}</CardTitle>
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className='mt-1 text-xs'
                      >
                        {isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <Form method='post'>
                    <input
                      type='hidden'
                      name='organizationId'
                      value={organizationId}
                    />
                    <input type='hidden' name='moduleKey' value={moduleKey} />
                    <input
                      type='hidden'
                      name='isActive'
                      value={String(!isActive)}
                    />
                    <Switch
                      checked={isActive}
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.currentTarget.closest('form')?.requestSubmit()
                      }}
                    />
                  </Form>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground text-sm'>
                    {meta.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
