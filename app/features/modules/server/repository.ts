import { and, eq } from 'drizzle-orm'
import { db } from '~/server/db'
import {
  memberModuleAccessModel,
  organizationModuleModel,
} from '~/server/db/schemas/modules'
import { APP_MODULES, type ModuleAccessLevel, type ModuleKey } from '../constants'

class ModulesRepository {
  async getOrgModules(organizationId: string) {
    return db
      .select()
      .from(organizationModuleModel)
      .where(eq(organizationModuleModel.organizationId, organizationId))
  }

  async getActiveModulesForOrg(organizationId: string): Promise<ModuleKey[]> {
    const rows = await db
      .select({ moduleKey: organizationModuleModel.moduleKey })
      .from(organizationModuleModel)
      .where(
        and(
          eq(organizationModuleModel.organizationId, organizationId),
          eq(organizationModuleModel.isActive, true)
        )
      )
    return rows.map((r) => r.moduleKey as ModuleKey)
  }

  async setOrgModuleActive(
    organizationId: string,
    moduleKey: ModuleKey,
    isActive: boolean
  ) {
    const existing = await db
      .select({ id: organizationModuleModel.id })
      .from(organizationModuleModel)
      .where(
        and(
          eq(organizationModuleModel.organizationId, organizationId),
          eq(organizationModuleModel.moduleKey, moduleKey)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(organizationModuleModel)
        .set({ isActive, activatedAt: isActive ? new Date() : undefined })
        .where(
          and(
            eq(organizationModuleModel.organizationId, organizationId),
            eq(organizationModuleModel.moduleKey, moduleKey)
          )
        )
    } else {
      await db.insert(organizationModuleModel).values({
        organizationId,
        moduleKey,
        isActive,
      })
    }
  }

  async getMemberModuleAccess(memberId: string, organizationId: string) {
    return db
      .select()
      .from(memberModuleAccessModel)
      .where(
        and(
          eq(memberModuleAccessModel.memberId, memberId),
          eq(memberModuleAccessModel.organizationId, organizationId)
        )
      )
  }

  async getAccessibleModulesForMember(
    memberId: string,
    organizationId: string
  ): Promise<ModuleKey[]> {
    const rows = await db
      .select({
        moduleKey: memberModuleAccessModel.moduleKey,
        accessLevel: memberModuleAccessModel.accessLevel,
      })
      .from(memberModuleAccessModel)
      .where(
        and(
          eq(memberModuleAccessModel.memberId, memberId),
          eq(memberModuleAccessModel.organizationId, organizationId)
        )
      )

    return rows
      .filter((r) => r.accessLevel !== 'none')
      .map((r) => r.moduleKey as ModuleKey)
  }

  async setMemberModuleAccess(
    memberId: string,
    organizationId: string,
    moduleKey: ModuleKey,
    accessLevel: ModuleAccessLevel
  ) {
    const existing = await db
      .select({ id: memberModuleAccessModel.id })
      .from(memberModuleAccessModel)
      .where(
        and(
          eq(memberModuleAccessModel.memberId, memberId),
          eq(memberModuleAccessModel.moduleKey, moduleKey)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(memberModuleAccessModel)
        .set({ accessLevel })
        .where(
          and(
            eq(memberModuleAccessModel.memberId, memberId),
            eq(memberModuleAccessModel.moduleKey, moduleKey)
          )
        )
    } else {
      await db.insert(memberModuleAccessModel).values({
        memberId,
        organizationId,
        moduleKey,
        accessLevel,
      })
    }
  }

  async setAllMemberModuleAccess(
    memberId: string,
    organizationId: string,
    access: Partial<Record<ModuleKey, ModuleAccessLevel>>
  ) {
    for (const moduleKey of APP_MODULES) {
      const level = access[moduleKey] ?? 'none'
      await this.setMemberModuleAccess(memberId, organizationId, moduleKey, level)
    }
  }

  async getMemberAccessLevel(
    memberId: string,
    moduleKey: ModuleKey
  ): Promise<ModuleAccessLevel> {
    const [row] = await db
      .select({ accessLevel: memberModuleAccessModel.accessLevel })
      .from(memberModuleAccessModel)
      .where(
        and(
          eq(memberModuleAccessModel.memberId, memberId),
          eq(memberModuleAccessModel.moduleKey, moduleKey)
        )
      )
      .limit(1)
    return (row?.accessLevel ?? 'none') as ModuleAccessLevel
  }
}

export const modulesRepository = new ModulesRepository()
