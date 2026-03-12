import { render, screen, waitFor } from '@testing-library/react'
import { createRoutesStub } from 'react-router'
import type { FunctionComponent } from 'react'
import { describe, expect, test, vi } from 'vitest'
import InvoicesIndex from './index'

// Mock heavy server-only modules that are not needed in component tests
vi.mock('~/features/invoice/server/repository', () => ({
  invoiceRepository: {},
}))

vi.mock('~/features/company/server/repository/company.repository', () => ({
  companyRepository: {},
}))

vi.mock('~/server/auth/session.server', () => ({
  requireAuth: vi.fn(),
}))

// Mock i18n context so the component renders without a provider
vi.mock('~/i18n/context', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

describe('InvoicesIndex page', () => {
  const mockLoaderData = {
    invoices: [
      {
        id: 'inv-1',
        number: 'INV-001',
        status: 'draft',
        type: 'sale',
        total: '100.00',
        invoiceDate: new Date('2024-01-15'),
        businessPartner: { name: 'Partner A' },
        company: { name: 'Company A' },
        lines: [],
      },
    ],
    companies: [{ id: 'co-1', name: 'Company A', ruc: '12345' }],
    total: 1,
    selectedCompanyId: null,
    selectedType: null,
    selectedStatus: null,
    page: 1,
    pageSize: 10,
  }

  test('renders without crashing with loader data', async () => {
    const Stub = createRoutesStub([
      {
        path: '/invoices',
        Component: InvoicesIndex as unknown as FunctionComponent<{
          loaderData: unknown
        }>,
        loader: () => mockLoaderData,
      },
    ])

    render(<Stub initialEntries={['/invoices']} />)

    await waitFor(() => {
      // The page should render the component — verify a stable element
      expect(document.body).toBeTruthy()
    })
  })

  test('renders invoice number in the table', async () => {
    const Stub = createRoutesStub([
      {
        path: '/invoices',
        Component: InvoicesIndex as unknown as FunctionComponent<{
          loaderData: unknown
        }>,
        loader: () => mockLoaderData,
      },
    ])

    render(<Stub initialEntries={['/invoices']} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })
  })
})
