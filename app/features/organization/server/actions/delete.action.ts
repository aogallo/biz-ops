import { count, eq } from 'drizzle-orm'
import auth from '~/server/auth-server'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import { companyModel } from '~/server/db/schemas/company'
import { posTerminalModel } from '~/server/db/schemas/pos'
import { memberModel } from '~/server/db/schemas/auth'
import { modulesRepository } from '~/features/modules/server/repository'
import { organizationRepository } from '../repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'

export async function deleteOrganization(request: Request, slug: string) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)

  if (!session.user.isSuperAdmin) {
    return { success: false, message: 'Forbidden' }
  }

  const org = await organizationRepository.getBySlug(slug)
  if (!org) {
    return {
      success: false,
      message: translateServer(locale, 'common.noOrganization'),
    }
  }

  // Validation 1: active modules
  const activeModules = await modulesRepository.getActiveModulesForOrg(org.id)
  if (activeModules.length > 0) {
    return {
      success: false,
      message: `Cannot delete: organization has ${activeModules.length} active module(s): ${activeModules.join(', ')}. Deactivate them first.`,
    }
  }

  // Validation 2: members (more than just the owner)
  const [memberCount] = await db
    .select({ count: count() })
    .from(memberModel)
    .where(eq(memberModel.organizationId, org.id))

  if ((memberCount?.count ?? 0) > 1) {
    return {
      success: false,
      message: `Cannot delete: organization has ${memberCount.count} member(s). Remove all members first.`,
    }
  }

  // Validation 3: companies linked to this org
  const [companyCount] = await db
    .select({ count: count() })
    .from(companyModel)
    .where(eq(companyModel.organizationId, org.id))

  if ((companyCount?.count ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete: organization has ${companyCount.count} company(ies) linked. Remove them first.`,
    }
  }

  // Validation 4: POS terminals
  const [terminalCount] = await db
    .select({ count: count() })
    .from(posTerminalModel)
    .where(eq(posTerminalModel.organizationId, org.id))

  if ((terminalCount?.count ?? 0) > 0) {
    return {
      success: false,
      message: `Cannot delete: organization has ${terminalCount.count} POS terminal(s). Remove them first.`,
    }
  }

  // TODO(billing): Validation 5: billing balance check
  // Requires billing module implementation. Will check outstanding invoices,
  // subscriptions, and payment history before allowing org deletion.

  try {
    const data = await auth.api.deleteOrganization({
      body: { organizationId: org.id },
      headers: request.headers,
    })

    console.log('Organization deleted:', data?.id)

    return {
      success: true,
      message: translateServer(locale, 'organization.deleted'),
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : translateServer(locale, 'organization.deleted.failed'),
    }
  }
}
