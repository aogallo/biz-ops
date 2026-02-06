import { Trash2 } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import { Combobox, type ComboboxOption } from '~/components/ui/combobox'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { TableCell, TableRow } from '~/components/ui/table'
import { toast } from 'sonner'
import type { ProductOption } from './ProductSearchCombobox'

export interface InvoiceLineData {
  id: string
  lineNumber: number
  description: string
  quantity: number
  unitPrice: number
  ivaType: 'taxed' | 'exempt' | 'non_subject'
  ivaRate: number
  subtotal: number
  ivaAmount: number
  total: number
  productId: string | null
  accountingAccountId: string
  product?: {
    id: string
    sku: string
    name: string
    price: string | null
  } | null
  accountingAccount?: {
    id: string
    name: string | null
    accountNumber: string | null
  } | null
}

export interface AccountOption {
  id: string
  accountNumber: string | null
  name: string | null
}

interface InvoiceLineRowProps {
  line: InvoiceLineData
  index: number
  invoiceId: string
  products: ProductOption[]
  accounts: AccountOption[]
  isDraft: boolean
  onLineUpdated?: () => void
  onLineRemoved?: () => void
}

export function InvoiceLineRow({
  line,
  index,
  invoiceId,
  products,
  accounts,
  isDraft,
  onLineUpdated,
  onLineRemoved,
}: InvoiceLineRowProps) {
  const updateFetcher = useFetcher()
  const removeFetcher = useFetcher()

  // Local state for editing
  const [description, setDescription] = useState(line.description)
  const [quantity, setQuantity] = useState(String(line.quantity))
  const [unitPrice, setUnitPrice] = useState(String(line.unitPrice))
  const [ivaType, setIvaType] = useState(line.ivaType)
  const [productId, setProductId] = useState(line.productId || '')
  const [accountId, setAccountId] = useState(line.accountingAccountId)

  // Track if there are pending changes
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Check if any field has changed
    const changed =
      description !== line.description ||
      quantity !== String(line.quantity) ||
      unitPrice !== String(line.unitPrice) ||
      ivaType !== line.ivaType ||
      productId !== (line.productId || '') ||
      accountId !== line.accountingAccountId

    setHasChanges(changed)
  }, [description, quantity, unitPrice, ivaType, productId, accountId, line])

  // Handle fetcher responses
  useEffect(() => {
    if (updateFetcher.data) {
      if ((updateFetcher.data as { success?: boolean }).success) {
        toast.success('Line updated')
        setHasChanges(false)
        onLineUpdated?.()
      } else {
        toast.error((updateFetcher.data as { error?: string }).error || 'Failed to update line')
      }
    }
  }, [updateFetcher.data, onLineUpdated])

  useEffect(() => {
    if (removeFetcher.data) {
      if ((removeFetcher.data as { success?: boolean }).success) {
        toast.success('Line removed')
        onLineRemoved?.()
      } else {
        toast.error((removeFetcher.data as { error?: string }).error || 'Failed to remove line')
      }
    }
  }, [removeFetcher.data, onLineRemoved])

  const accountOptions: ComboboxOption[] = accounts.map((account) => ({
    value: account.id,
    label: `${account.accountNumber ?? ''} ${account.name ?? ''}`.trim(),
  }))

  const productOptions: ComboboxOption[] = products.map((product) => ({
    value: product.id,
    label: `${product.sku} - ${product.name}`,
    description: product.price ? `Q ${Number(product.price).toFixed(2)}` : undefined,
  }))

  const handleProductChange = useCallback(
    (newProductId: string) => {
      setProductId(newProductId)
      const product = products.find((p) => p.id === newProductId)
      if (product) {
        setDescription(product.name)
        if (product.price) {
          setUnitPrice(product.price)
        }
      }
    },
    [products]
  )

  const saveChanges = useCallback(() => {
    if (!hasChanges || !isDraft) return

    updateFetcher.submit(
      {
        _action: 'updateLine',
        lineId: line.id,
        description,
        quantity,
        unitPrice,
        ivaType,
        productId: productId || '',
        accountingAccountId: accountId,
      },
      { method: 'post' }
    )
  }, [
    hasChanges,
    isDraft,
    updateFetcher,
    line.id,
    description,
    quantity,
    unitPrice,
    ivaType,
    productId,
    accountId,
  ])

  const handleRemove = useCallback(() => {
    if (!isDraft) return

    if (confirm('Are you sure you want to remove this line?')) {
      removeFetcher.submit(
        {
          _action: 'removeLine',
          lineId: line.id,
          invoiceId,
        },
        { method: 'post' }
      )
    }
  }, [isDraft, removeFetcher, line.id, invoiceId])

  const isUpdating = updateFetcher.state !== 'idle'
  const isRemoving = removeFetcher.state !== 'idle'

  return (
    <TableRow className={hasChanges ? 'bg-yellow-50 dark:bg-yellow-950/10' : ''}>
      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <Combobox
          options={productOptions}
          value={productId}
          onValueChange={handleProductChange}
          placeholder="(Optional) Select product..."
          searchPlaceholder="Search products..."
          emptyMessage="No products found."
          disabled={!isDraft}
          size="sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveChanges}
          placeholder="Description"
          className="h-8"
          disabled={!isDraft}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.0001"
          min="0.0001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={saveChanges}
          placeholder="1"
          className="h-8 w-20 text-right font-mono"
          disabled={!isDraft}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          onBlur={saveChanges}
          placeholder="0.00"
          className="h-8 w-28 text-right font-mono"
          disabled={!isDraft}
        />
      </TableCell>
      <TableCell>
        <Select
          value={ivaType}
          onValueChange={(value: 'taxed' | 'exempt' | 'non_subject') => {
            setIvaType(value)
            // Trigger save after state update
            setTimeout(saveChanges, 0)
          }}
          disabled={!isDraft}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="taxed">Taxed</SelectItem>
            <SelectItem value="exempt">Exempt</SelectItem>
            <SelectItem value="non_subject">Non-subject</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Combobox
          options={accountOptions}
          value={accountId}
          onValueChange={(value) => {
            setAccountId(value)
            // Trigger save after state update
            setTimeout(saveChanges, 0)
          }}
          placeholder="Select account..."
          searchPlaceholder="Search accounts..."
          emptyMessage="No accounts found."
          disabled={!isDraft}
          size="sm"
        />
      </TableCell>
      <TableCell className="text-right font-mono">
        Q {Number(line.subtotal).toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono">
        Q {Number(line.ivaAmount).toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        Q {Number(line.total).toFixed(2)}
      </TableCell>
      <TableCell>
        {isDraft && (
          <div className="flex items-center gap-1">
            {hasChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={saveChanges}
                disabled={isUpdating}
                className="h-8 px-2 text-xs"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isRemoving}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}
