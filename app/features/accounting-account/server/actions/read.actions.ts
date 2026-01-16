import { eq } from 'drizzle-orm'
import { db } from '../../../../server/db'
import {
  accountingAccountModel,
  type AccountingAccount,
} from '../../../../server/db/schemas/accounting'

export async function getAccountingAccountsByOrganization(
  organizationId: string
): Promise<AccountingAccount[]> {
  try {
    await db
      .select()
      .from(accountingAccountModel)
      .where(eq(accountingAccountModel.organizationId, organizationId))
  } catch (error) {
    console.error(
      `Failed to get Accounting Accounts from oganization: ${organizationId}, error:${error}`
    )
  }
  return []
}
