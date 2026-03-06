/** * --- BETTER AUTH CORE TABLES ---
 * Required for the base authentication system.
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from './common'

export const userModel = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  ...timestamps,
})

export const sessionModel = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userModel.id),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  // Tracks the currentpdatedAt: timestamp("updated_at").notNull(),
  activeOrganizationId: text('active_organization_id'),
  expiresAt: timestamp('expires_at').notNull(),
  ...timestamps,
})

export const accountModel = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userModel.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
})

export const verificationModel = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ...timestamps,
})
/** * --- BETTER AUTH ORGANIZATION PLUGIN TABLES ---
 * These handle Multi-tenancy, Member roles, and Invitations.
 */
export const organizationModel = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  domain: text('domain').unique(),
  isAdmin: boolean('is_admin').default(false).notNull(), // Identifies admin organizations that can create other orgs
  ...timestamps,
})

export const memberModel = pgTable('member', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => userModel.id),
  role: text('role').notNull(), // Keep for better Auth compatibility: 'owner', 'admin', 'member'
  ...timestamps,
})

export const invitationModel = pgTable('invitation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  email: text('email').notNull(),
  role: text('role').notNull(), // Keep for better Auth compatibility
  customPermissions: text('custom_permissions'), // JSON array of permission IDs
  status: text('status').notNull(), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: uuid('inviter_id')
    .notNull()
    .references(() => userModel.id),
  ...timestamps,
})

/** * --- RBAC TABLES ---
 * Role-based access control with custom permissions.
 */
export const roleModel = pgTable('role', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  ...timestamps,
})

export const permissionModel = pgTable(
  'permission',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('uq_resource_action_idx').on(table.resource, table.action),
  ]
)

export const rolePermissionModel = pgTable('role_permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roleModel.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissionModel.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationModel.id),
  ...timestamps,
})

/**
 * --- MEMBER-ROLE JUNCTION TABLE ---
 * Enables many-to-many relationship between members and roles.
 * A member can have multiple roles (e.g., "member" + "accountant").
 */
export const memberRoleModel = pgTable(
  'member_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => memberModel.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roleModel.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [unique('member_role_unique').on(table.memberId, table.roleId)]
)

/**
 * --- INVITATION-ROLE JUNCTION TABLE ---
 * Enables many-to-many relationship between invitations and roles.
 * An invitation can assign multiple roles to the invitee.
 */
export const invitationRoleModel = pgTable(
  'invitation_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitationModel.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roleModel.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    unique('invitation_role_unique').on(table.invitationId, table.roleId),
  ]
)

/** * --- DRIZZLE RELATIONS ---
 * Type-safe relations for queries.
 */
export const roleRelations = relations(roleModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [roleModel.organizationId],
    references: [organizationModel.id],
  }),
  permissions: many(rolePermissionModel),
  memberRoles: many(memberRoleModel),
  invitationRoles: many(invitationRoleModel),
}))

export const permissionRelations = relations(permissionModel, ({ many }) => ({
  roles: many(rolePermissionModel),
}))

export const rolePermissionRelations = relations(
  rolePermissionModel,
  ({ one }) => ({
    role: one(roleModel, {
      fields: [rolePermissionModel.roleId],
      references: [roleModel.id],
    }),
    permission: one(permissionModel, {
      fields: [rolePermissionModel.permissionId],
      references: [permissionModel.id],
    }),
    organization: one(organizationModel, {
      fields: [rolePermissionModel.organizationId],
      references: [organizationModel.id],
    }),
  })
)

export const memberRoleRelations = relations(memberRoleModel, ({ one }) => ({
  member: one(memberModel, {
    fields: [memberRoleModel.memberId],
    references: [memberModel.id],
  }),
  role: one(roleModel, {
    fields: [memberRoleModel.roleId],
    references: [roleModel.id],
  }),
}))

export const invitationRoleRelations = relations(
  invitationRoleModel,
  ({ one }) => ({
    invitation: one(invitationModel, {
      fields: [invitationRoleModel.invitationId],
      references: [invitationModel.id],
    }),
    role: one(roleModel, {
      fields: [invitationRoleModel.roleId],
      references: [roleModel.id],
    }),
  })
)

export const memberRelations = relations(memberModel, ({ one, many }) => ({
  organization: one(organizationModel, {
    fields: [memberModel.organizationId],
    references: [organizationModel.id],
  }),
  user: one(userModel, {
    fields: [memberModel.userId],
    references: [userModel.id],
  }),
  memberRoles: many(memberRoleModel),
}))

export const invitationRelations = relations(
  invitationModel,
  ({ one, many }) => ({
    organization: one(organizationModel, {
      fields: [invitationModel.organizationId],
      references: [organizationModel.id],
    }),
    inviter: one(userModel, {
      fields: [invitationModel.inviterId],
      references: [userModel.id],
    }),
    invitationRoles: many(invitationRoleModel),
  })
)
