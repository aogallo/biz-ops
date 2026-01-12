/** * --- Column Helpers---
 *
 */

const timestamps = {
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
};
/** * --- BETTER AUTH CORE TABLES ---
 * Required for the base authentication system.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // Tracks the currentpdatedAt: timestamp("updated_at").notNull(),
  activeOrganizationId: text("active_organization_id"),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps,
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps,
});
/** * --- BETTER AUTH ORGANIZATION PLUGIN TABLES ---
 * These handle Multi-tenancy, Member roles, and Invitations.
 */
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  isAdmin: boolean("is_admin").default(false).notNull(), // Identifies admin organizations that can create other orgs
  ...timestamps,
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(), // Keep for better Auth compatibility: 'owner', 'admin', 'member'
  roleId: text("role_id").references(() => role.id),
  legacyRole: text("legacy_role"), // Deprecated: for migration only
  ...timestamps,
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  email: text("email").notNull(),
  role: text("role").notNull(), // Keep for better Auth compatibility
  roleId: text("role_id").references(() => role.id),
  customPermissions: text("custom_permissions"), // JSON array of permission IDs
  status: text("status").notNull(), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id),
  ...timestamps,
});

/** * --- RBAC TABLES ---
 * Role-based access control with custom permissions.
 */
export const role = pgTable("role", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  ...timestamps,
});

export const permission = pgTable("permission", {
  id: text("id").primaryKey(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  ...timestamps,
});

export const rolePermission = pgTable("role_permission", {
  id: text("id").primaryKey(),
  roleId: text("role_id")
    .notNull()
    .references(() => role.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permission.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  ...timestamps,
});

/** * --- BUSINESS LOGIC TABLES ---
 * Every table here MUST have an organization_id for multi-tenant isolation.
 */
// Companies (Legal entities under one Organization)
export const company = pgTable("company", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  ...timestamps,
});

// Business Partners (Vendors & Clients)
export const businessPartner = pgTable("business_partner", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'client', 'vendor', 'both'
  email: text("email"),
  ...timestamps,
});

// Products & Inventory
export const product = pgTable("product", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  ...timestamps,
});

// Invoices
export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id),
  partnerId: text("partner_id")
    .notNull()
    .references(() => businessPartner.id),
  number: text("number").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").default("unpaid"),
  date: timestamp("date").defaultNow(),
  ...timestamps,
});

/** * --- DRIZZLE RELATIONS ---
 * Type-safe relations for queries.
 */
export const roleRelations = relations(role, ({ one, many }) => ({
  organization: one(organization, {
    fields: [role.organizationId],
    references: [organization.id],
  }),
  permissions: many(rolePermission),
  members: many(member),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
  roles: many(rolePermission),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, {
    fields: [rolePermission.roleId],
    references: [role.id],
  }),
  permission: one(permission, {
    fields: [rolePermission.permissionId],
    references: [permission.id],
  }),
  organization: one(organization, {
    fields: [rolePermission.organizationId],
    references: [organization.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  role,
  permission,
  rolePermission,
  company,
  businessPartner,
  product,
  invoice,
};
