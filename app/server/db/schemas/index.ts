import {
  accountModel,
  invitationModel,
  invitationRelations,
  invitationRoleModel,
  invitationRoleRelations,
  memberModel,
  memberRelations,
  memberRoleModel,
  memberRoleRelations,
  organizationModel,
  permissionModel,
  permissionRelations,
  roleModel,
  rolePermissionModel,
  rolePermissionRelations,
  roleRelations,
  sessionModel,
  userModel,
  verificationModel,
} from './auth'
import { accountingAccountModel } from './accounting'
import { businessPartnerModel } from './businessPartner'
import { companyModel } from './company'
import { productModel } from './products'
import { satFileModel } from './sat-file'
import {
  invoiceModel,
  invoiceLineModel,
  invoiceRelations,
  invoiceLineRelations,
  invoiceTypeEnum,
  invoiceStatusEnum,
  ivaTypeEnum,
} from './invoice'
import {
  journalEntryModel,
  journalEntryLineModel,
  journalEntryRelations,
  journalEntryLineRelations,
  journalEntrySourceEnum,
  journalEntryStatusEnum,
} from './journalEntry'
import {
  organizationAccountingConfigModel,
  organizationAccountingConfigRelations,
} from './organizationConfig'

export const schema = {
  // Auth tables
  user: userModel,
  session: sessionModel,
  account: accountModel,
  verification: verificationModel,
  organization: organizationModel,
  member: memberModel,
  memberRole: memberRoleModel,
  invitation: invitationModel,
  invitationRole: invitationRoleModel,
  role: roleModel,
  permission: permissionModel,
  rolePermission: rolePermissionModel,

  // Business tables
  accountingAccount: accountingAccountModel,
  businessPartner: businessPartnerModel,
  company: companyModel,
  product: productModel,
  satFile: satFileModel,

  // Invoice tables
  invoice: invoiceModel,
  invoiceLine: invoiceLineModel,

  // Journal entry tables
  journalEntry: journalEntryModel,
  journalEntryLine: journalEntryLineModel,

  // Config tables
  organizationAccountingConfig: organizationAccountingConfigModel,

  // Relations
  memberRelations,
  memberRoleRelations,
  invitationRelations,
  invitationRoleRelations,
  roleRelations,
  permissionRelations,
  rolePermissionRelations,
  invoiceRelations,
  invoiceLineRelations,
  journalEntryRelations,
  journalEntryLineRelations,
  organizationAccountingConfigRelations,
}

// Re-export all schemas for easy access
export * from './auth'
export * from './accounting'
export * from './businessPartner'
export * from './company'
export * from './products'
export * from './sat-file'
export * from './invoice'
export * from './journalEntry'
export * from './organizationConfig'
export * from './common'

// Re-export enums
export {
  invoiceTypeEnum,
  invoiceStatusEnum,
  ivaTypeEnum,
  journalEntrySourceEnum,
  journalEntryStatusEnum,
}
