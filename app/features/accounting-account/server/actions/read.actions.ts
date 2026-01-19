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
    const accounts = await db
      .select()
      .from(accountingAccountModel)
      .where(eq(accountingAccountModel.organizationId, organizationId))
    return accounts
  } catch (error) {
    console.error(
      `Failed to get Accounting Accounts from organization: ${organizationId}, error:${error}`
    )
    return []
  }
}
