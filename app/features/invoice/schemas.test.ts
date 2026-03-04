import { describe, expect, test } from 'vitest'
import {
  addInvoiceLineSchema,
  createDraftInvoiceSchema,
  voidInvoiceSchema,
} from './schemas'

describe('addInvoiceLineSchema', () => {
  const validLine = {
    invoiceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Service rendered',
    quantity: 2,
    unitPrice: 50,
    ivaType: 'taxed' as const,
    ivaRate: 12,
  }

  test('accepts valid line', () => {
    const result = addInvoiceLineSchema.safeParse(validLine)
    expect(result.success).toBe(true)
  })

  test('rejects non-positive quantity', () => {
    const result = addInvoiceLineSchema.safeParse({ ...validLine, quantity: 0 })
    expect(result.success).toBe(false)
  })

  test('rejects negative unit price', () => {
    const result = addInvoiceLineSchema.safeParse({
      ...validLine,
      unitPrice: -1,
    })
    expect(result.success).toBe(false)
  })

  test('rejects ivaRate above 100', () => {
    const result = addInvoiceLineSchema.safeParse({
      ...validLine,
      ivaRate: 101,
    })
    expect(result.success).toBe(false)
  })

  test('rejects empty description', () => {
    const result = addInvoiceLineSchema.safeParse({
      ...validLine,
      description: '',
    })
    expect(result.success).toBe(false)
  })

  test('rejects invalid ivaType', () => {
    const result = addInvoiceLineSchema.safeParse({
      ...validLine,
      ivaType: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})

describe('createDraftInvoiceSchema', () => {
  const validDraft = {
    organizationId: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
    companyId: 'b2c3d4e5-f6a7-4901-bcde-f12345678901',
    businessPartnerId: 'c3d4e5f6-a7b8-4012-8def-123456789012',
    accountingAccountId: 'd4e5f6a7-b8c9-4123-9efa-234567890123',
    type: 'sale' as const,
    invoiceDate: new Date(),
  }

  test('accepts valid draft', () => {
    const result = createDraftInvoiceSchema.safeParse(validDraft)
    expect(result.success).toBe(true)
  })

  test('rejects invalid type', () => {
    const result = createDraftInvoiceSchema.safeParse({
      ...validDraft,
      type: 'other',
    })
    expect(result.success).toBe(false)
  })

  test('rejects invalid uuid for organizationId', () => {
    const result = createDraftInvoiceSchema.safeParse({
      ...validDraft,
      organizationId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('voidInvoiceSchema', () => {
  test('accepts valid void request', () => {
    const result = voidInvoiceSchema.safeParse({
      invoiceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      reason: 'Duplicate invoice',
    })
    expect(result.success).toBe(true)
  })

  test('rejects empty reason', () => {
    const result = voidInvoiceSchema.safeParse({
      invoiceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      reason: '',
    })
    expect(result.success).toBe(false)
  })

  test('rejects reason exceeding 500 characters', () => {
    const result = voidInvoiceSchema.safeParse({
      invoiceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      reason: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})
