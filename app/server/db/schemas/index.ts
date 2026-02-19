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
import { productModel, productRelations } from './products'
import {
  productCategoryModel,
  productCategoryRelations,
  productCategoryColorEnum,
} from './productCategory'
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
import { serviceModel, serviceRelations, serviceColorEnum } from './service'
import {
  appointmentModel,
  appointmentRelations,
  appointmentStatusEnum,
} from './appointment'
import {
  stockMovementModel,
  stockMovementRelations,
  stockMovementTypeEnum,
} from './stockMovement'
import {
  orderModel,
  orderDetailModel,
  orderRecipientModel,
  orderRelations,
  orderDetailRelations,
  orderRecipientRelations,
  orderSourceType,
  orderStatus,
} from './orders'
import {
  quotationModel,
  quotationDetailModel,
  quotationRecipientModel,
  quotationRelations,
  quotationDetailRelations,
  quotationRecipientRelations,
  quotationStatus,
} from './quotations'
import {
  posTerminalModel,
  posSaleModel,
  posSaleLineModel,
  posPaymentModel,
  posTerminalRelations,
  posSaleRelations,
  posSaleLineRelations,
  posPaymentRelations,
  posSaleStatusEnum,
  posPaymentMethodEnum,
} from './pos'

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
  productCategory: productCategoryModel,
  satFile: satFileModel,

  // Invoice tables
  invoice: invoiceModel,
  invoiceLine: invoiceLineModel,

  // Journal entry tables
  journalEntry: journalEntryModel,
  journalEntryLine: journalEntryLineModel,

  // Config tables
  organizationAccountingConfig: organizationAccountingConfigModel,

  // Service tables
  service: serviceModel,

  // Appointment tables
  appointment: appointmentModel,

  // Stock movement tables
  stockMovement: stockMovementModel,

  // Order tables
  order: orderModel,
  orderDetail: orderDetailModel,
  orderRecipient: orderRecipientModel,

  // Quotation tables
  quotation: quotationModel,
  quotationDetail: quotationDetailModel,
  quotationRecipient: quotationRecipientModel,

  // POS tables
  posTerminal: posTerminalModel,
  posSale: posSaleModel,
  posSaleLine: posSaleLineModel,
  posPayment: posPaymentModel,

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
  serviceRelations,
  appointmentRelations,
  productRelations,
  productCategoryRelations,
  stockMovementRelations,
  orderRelations,
  orderDetailRelations,
  orderRecipientRelations,
  quotationRelations,
  quotationDetailRelations,
  quotationRecipientRelations,
  posTerminalRelations,
  posSaleRelations,
  posSaleLineRelations,
  posPaymentRelations,
}

// Re-export all schemas for easy access
export * from './auth'
export * from './accounting'
export * from './businessPartner'
export * from './company'
export * from './products'
export * from './productCategory'
export * from './sat-file'
export * from './invoice'
export * from './journalEntry'
export * from './organizationConfig'
export * from './service'
export * from './appointment'
export * from './stockMovement'
export * from './orders'
export * from './quotations'
export * from './pos'
export * from './common'

// Re-export enums
export {
  invoiceTypeEnum,
  invoiceStatusEnum,
  ivaTypeEnum,
  journalEntrySourceEnum,
  journalEntryStatusEnum,
  serviceColorEnum,
  appointmentStatusEnum,
  productCategoryColorEnum,
  stockMovementTypeEnum,
  orderSourceType,
  orderStatus,
  quotationStatus,
  posSaleStatusEnum,
  posPaymentMethodEnum,
}
