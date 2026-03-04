import { invoiceRepository } from '../repository'
import type { UpdateInvoiceLineInput } from '../../schemas'
import type { InvoiceLine } from '~/server/db/schemas/invoice'

export interface UpdateInvoiceLineResult {
  success: boolean
  line?: InvoiceLine
  error?: string
}

export async function updateInvoiceLineAction(
  input: UpdateInvoiceLineInput
): Promise<UpdateInvoiceLineResult> {
  try {
    // Build update data
    const updateData: Parameters<typeof invoiceRepository.updateLine>[1] = {}

    if (input.description !== undefined) {
      updateData.description = input.description
    }
    if (input.quantity !== undefined) {
      updateData.quantity = String(input.quantity)
    }
    if (input.unitPrice !== undefined) {
      updateData.unitPrice = String(input.unitPrice)
    }
    if (input.ivaType !== undefined) {
      updateData.ivaType = input.ivaType
    }
    if (input.ivaRate !== undefined) {
      updateData.ivaRate = String(input.ivaRate)
    }
    if (input.productId !== undefined) {
      updateData.productId = input.productId
    }
    if (input.lineType !== undefined) {
      updateData.lineType = input.lineType
    }

    // Recalculate amounts if quantity, unitPrice, ivaType, or ivaRate changed
    if (
      input.quantity !== undefined ||
      input.unitPrice !== undefined ||
      input.ivaType !== undefined ||
      input.ivaRate !== undefined
    ) {
      // Get the line to get current values for any missing fields
      const existingLines = await invoiceRepository.getLinesWithProducts(
        input.lineId
      )
      const existingLine = existingLines.find((l) => l.id === input.lineId)

      if (!existingLine) {
        return {
          success: false,
          error: 'Invoice line not found',
        }
      }

      const quantity = input.quantity ?? Number(existingLine.quantity)
      const unitPrice = input.unitPrice ?? Number(existingLine.unitPrice)
      const ivaType = input.ivaType ?? existingLine.ivaType
      const ivaRate = input.ivaRate ?? Number(existingLine.ivaRate)

      const subtotal = quantity * unitPrice
      const ivaAmount = ivaType === 'taxed' ? subtotal * (ivaRate / 100) : 0
      const total = subtotal + ivaAmount

      updateData.subtotal = subtotal.toFixed(2)
      updateData.ivaAmount = ivaAmount.toFixed(2)
      updateData.total = total.toFixed(2)
    }

    const line = await invoiceRepository.updateLine(input.lineId, updateData)

    if (!line) {
      return {
        success: false,
        error: 'Failed to update invoice line',
      }
    }

    return {
      success: true,
      line,
    }
  } catch (error) {
    console.error('Error updating invoice line:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update invoice line',
    }
  }
}
