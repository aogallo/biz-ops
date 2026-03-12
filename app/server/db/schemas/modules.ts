import { relations } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from './common'
import { memberModel, organizationModel } from './auth'

export const organizationModuleModel = pgTable(
  'organization_module',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id, { onDelete: 'cascade' }),
    moduleKey: text('module_key').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    activatedAt: timestamp('activated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    ...timestamps,
  },
  (t) => [unique('org_module_unique').on(t.organizationId, t.moduleKey)]
)

export const memberModuleAccessModel = pgTable(
  'member_module_access',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberModel.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationModel.id, { onDelete: 'cascade' }),
    moduleKey: text('module_key').notNull(),
    accessLevel: text('access_level').notNull().default('none'), // 'none' | 'user' | 'admin'
    ...timestamps,
  },
  (t) => [unique('member_module_unique').on(t.memberId, t.moduleKey)]
)

export const organizationModuleRelations = relations(
  organizationModuleModel,
  ({ one }) => ({
    organization: one(organizationModel, {
      fields: [organizationModuleModel.organizationId],
      references: [organizationModel.id],
    }),
  })
)

export const memberModuleAccessRelations = relations(
  memberModuleAccessModel,
  ({ one }) => ({
    member: one(memberModel, {
      fields: [memberModuleAccessModel.memberId],
      references: [memberModel.id],
    }),
    organization: one(organizationModel, {
      fields: [memberModuleAccessModel.organizationId],
      references: [organizationModel.id],
    }),
  })
)
