import { eq } from 'drizzle-orm'
import { Form, Link, redirect } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import {
  APP_MODULES,
  MODULE_META,
  type ModuleAccessLevel,
  type ModuleKey,
} from '~/features/modules/constants'
import { modulesRepository } from '~/features/modules/server/repository'
import { requirePermission } from '~/server/auth/permissions.server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { memberModel, userModel } from '~/server/db/schemas/auth'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/$memberId.module-permissions'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const url = new URL(request.url)
  const organizationId =
    url.searchParams.get('organizationId') ||
    session.session.activeOrganizationId

  if (!organizationId) {
    throw redirect('/users')
  }

  await requirePermission(session.user.id, organizationId, 'user:update')

  const memberId = params.memberId

  const [member] = await db
    .select({
      id: memberModel.id,
      userId: memberModel.userId,
      organizationId: memberModel.organizationId,
      userName: userModel.name,
      userEmail: userModel.email,
    })
    .from(memberModel)
    .innerJoin(userModel, eq(memberModel.userId, userModel.id))
    .where(eq(memberModel.id, memberId))
    .limit(1)

  if (!member) {
    throw redirect('/users')
  }

  const [memberAccess, activeOrgModules] = await Promise.all([
    modulesRepository.getMemberModuleAccess(memberId, organizationId),
    modulesRepository.getActiveModulesForOrg(organizationId),
  ])

  const accessMap: Record<string, ModuleAccessLevel> = {}
  for (const row of memberAccess) {
    accessMap[row.moduleKey] = row.accessLevel as ModuleAccessLevel
  }

  return { member, organizationId, activeOrgModules, accessMap }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const memberId = params.memberId
  const formData = await request.formData()
  const url = new URL(request.url)
  const organizationId =
    url.searchParams.get('organizationId') ||
    session.session.activeOrganizationId

  if (!organizationId) {
    return { error: 'No organization selected' }
  }

  await requirePermission(session.user.id, organizationId, 'user:update')

  const access: Partial<Record<ModuleKey, ModuleAccessLevel>> = {}
  for (const moduleKey of APP_MODULES) {
    const level = formData.get(
      `access_${moduleKey}`
    ) as ModuleAccessLevel | null
    access[moduleKey] = level ?? 'none'
  }

  await modulesRepository.setAllMemberModuleAccess(
    memberId,
    organizationId,
    access
  )

  return redirectWithFlash(`/users?organizationId=${organizationId}`, {
    type: 'success',
    message: 'Module permissions updated successfully',
  })
}

const ACCESS_LEVELS: { value: ModuleAccessLevel; label: string }[] = [
  { value: 'none', label: 'Sin acceso' },
  { value: 'user', label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
]

export default function MemberModulePermissionsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { member, organizationId, activeOrgModules, accessMap } = loaderData

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='flex items-center gap-4'>
        <Link
          to={`/users?organizationId=${organizationId}`}
          className='text-muted-foreground hover:text-foreground'
        >
          &larr; Volver
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permisos de módulos — {member.userName}</CardTitle>
          <CardDescription>
            Configurá el nivel de acceso de {member.userEmail} por módulo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionData?.error && (
            <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
              {actionData.error}
            </div>
          )}

          {activeOrgModules.length === 0 && (
            <div className='text-muted-foreground py-4 text-center text-sm'>
              Esta organización no tiene módulos activos. Activá módulos en{' '}
              <Link to='/settings/modules' className='text-primary underline'>
                Configuración → Módulos
              </Link>
              .
            </div>
          )}

          <Form method='post'>
            <div className='space-y-6'>
              {activeOrgModules.map((moduleKey) => {
                const meta = MODULE_META[moduleKey]
                const Icon = meta.icon
                const currentLevel = accessMap[moduleKey] ?? 'none'

                return (
                  <div key={moduleKey} className='rounded-lg border p-4'>
                    <div className='mb-3 flex items-center gap-3'>
                      <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md'>
                        <Icon className='text-primary h-4 w-4' />
                      </div>
                      <div>
                        <p className='font-medium'>{meta.label}</p>
                        <p className='text-muted-foreground text-xs'>
                          {meta.description}
                        </p>
                      </div>
                    </div>
                    <RadioGroup
                      name={`access_${moduleKey}`}
                      defaultValue={currentLevel}
                      className='flex gap-4'
                    >
                      {ACCESS_LEVELS.map((level) => (
                        <div
                          key={level.value}
                          className='flex items-center gap-2'
                        >
                          <RadioGroupItem
                            id={`${moduleKey}_${level.value}`}
                            value={level.value}
                          />
                          <Label htmlFor={`${moduleKey}_${level.value}`}>
                            {level.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )
              })}
            </div>

            {activeOrgModules.length > 0 && (
              <div className='mt-6 flex gap-3'>
                <Link to={`/users?organizationId=${organizationId}`}>
                  <Button type='button' variant='outline'>
                    Cancelar
                  </Button>
                </Link>
                <Button type='submit'>Guardar permisos</Button>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
