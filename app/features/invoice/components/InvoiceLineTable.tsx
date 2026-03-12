import { Plus } from 'lucide-react'
import { useCallback, useState, useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Combobox, type ComboboxOption } from '~/components/ui/combobox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { toast } from 'sonner'
import { InvoiceLineRow, type InvoiceLineData } from './InvoiceLineRow'
import type { ProductOption } from './ProductSearchCombobox'

interface InvoiceLineTableProps {
  invoiceId: string
  lines: InvoiceLineData[]
  products: ProductOption[]
  isDraft: boolean
  onLinesChanged?: () => void
}

export function InvoiceLineTable({
  invoiceId,
  lines,
  products,
  isDraft,
  onLinesChanged,
}: InvoiceLineTableProps) {
  const addLineFetcher = useFetcher()

  // State for new line form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProductId, setNewProductId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newQuantity, setNewQuantity] = useState('1')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newIvaType, setNewIvaType] = useState<
    'taxed' | 'exempt' | 'non_subject'
  >('taxed')
  const [newLineType, setNewLineType] = useState<'goods' | 'services' | ''>('')

  // Ref to track processed fetcher data to prevent duplicate toasts
  const lastAddDataRef = useRef<unknown>(null)

  // Handle add line response
  useEffect(() => {
    if (addLineFetcher.data && addLineFetcher.data !== lastAddDataRef.current) {
      lastAddDataRef.current = addLineFetcher.data
      if ((addLineFetcher.data as { success?: boolean }).success) {
        toast.success('Line added')
        resetAddForm()
        onLinesChanged?.()
      } else {
        toast.error(
          (addLineFetcher.data as { error?: string }).error ||
            'Failed to add line'
        )
      }
    }
  }, [addLineFetcher.data, onLinesChanged])

  const resetAddForm = useCallback(() => {
    setNewProductId('')
    setNewDescription('')
    setNewQuantity('1')
    setNewUnitPrice('')
    setNewIvaType('taxed')
    setNewLineType('')
    setShowAddForm(false)
  }, [])

  const handleProductChange = useCallback(
    (productId: string) => {
      setNewProductId(productId)
      const product = products.find((p) => p.id === productId)
      if (product) {
        setNewDescription(product.name)
        if (product.price) {
          setNewUnitPrice(product.price)
        }
      }
    },
    [products]
  )

  const handleAddLine = useCallback(() => {
    if (!newDescription.trim()) {
      toast.error('Description is required')
      return
    }
    if (!newUnitPrice || parseFloat(newUnitPrice) < 0) {
      toast.error('Valid unit price is required')
      return
    }

    addLineFetcher.submit(
      {
        _action: 'addLine',
        invoiceId,
        description: newDescription,
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        ivaType: newIvaType,
        productId: newProductId || '',
        lineType: newLineType || '',
      },
      { method: 'post' }
    )
  }, [
    addLineFetcher,
    invoiceId,
    newDescription,
    newQuantity,
    newUnitPrice,
    newIvaType,
    newProductId,
    newLineType,
  ])

  const productOptions: ComboboxOption[] = products.map((product) => ({
    value: product.id,
    label: `${product.sku} - ${product.name}`,
    description: product.price
      ? `Q ${Number(product.price).toFixed(2)}`
      : undefined,
  }))

  // Calculate totals
  const totals = {
    subtotal: lines.reduce((sum, line) => sum + Number(line.subtotal), 0),
    ivaAmount: lines.reduce((sum, line) => sum + Number(line.ivaAmount), 0),
    total: lines.reduce((sum, line) => sum + Number(line.total), 0),
  }

  const isAddingLine = addLineFetcher.state !== 'idle'

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Invoice Lines</CardTitle>
            <CardDescription>
              {lines.length === 0
                ? 'No lines yet. Add items to this invoice.'
                : `${lines.length} line${lines.length === 1 ? '' : 's'}`}
            </CardDescription>
          </div>
          {isDraft && !showAddForm && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowAddForm(true)}
            >
              <Plus className='mr-2 h-4 w-4' />
              Add Line
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Line Form */}
        {showAddForm && isDraft && (
          <div className='bg-muted/50 mb-4 rounded-lg border p-4'>
            <h4 className='mb-4 font-medium'>Add New Line</h4>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Product (Optional)</Label>
                <Combobox
                  options={productOptions}
                  value={newProductId}
                  onValueChange={handleProductChange}
                  placeholder='Search products...'
                  searchPlaceholder='Search by SKU or name...'
                  emptyMessage='No products found.'
                />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Description *</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder='Enter description or select a product'
                />
              </div>
              <div className='space-y-2'>
                <Label>Quantity *</Label>
                <Input
                  type='number'
                  step='0.0001'
                  min='0.0001'
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder='1'
                />
              </div>
              <div className='space-y-2'>
                <Label>Unit Price *</Label>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  placeholder='0.00'
                />
              </div>
              <div className='space-y-2'>
                <Label>IVA Type</Label>
                <Select
                  value={newIvaType}
                  onValueChange={(value: 'taxed' | 'exempt' | 'non_subject') =>
                    setNewIvaType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='taxed'>Taxed (12%)</SelectItem>
                    <SelectItem value='exempt'>Exempt</SelectItem>
                    <SelectItem value='non_subject'>Non-subject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Tipo</Label>
                <Select
                  value={newLineType}
                  onValueChange={(value: 'goods' | 'services') =>
                    setNewLineType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccionar...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='goods'>Bien</SelectItem>
                    <SelectItem value='services'>Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='mt-4 flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={resetAddForm}
                disabled={isAddingLine}
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={handleAddLine}
                disabled={isAddingLine}
              >
                {isAddingLine ? 'Adding...' : 'Add Line'}
              </Button>
            </div>
          </div>
        )}

        {/* Lines Table */}
        {lines.length > 0 ? (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[40px]'>#</TableHead>
                  <TableHead className='w-[160px]'>Product</TableHead>
                  <TableHead className='min-w-[200px]'>Description</TableHead>
                  <TableHead className='w-[80px] text-right'>Qty</TableHead>
                  <TableHead className='w-[100px] text-right'>
                    Unit Price
                  </TableHead>
                  <TableHead className='w-[100px]'>IVA Type</TableHead>
                  <TableHead className='w-[100px]'>Tipo</TableHead>
                  <TableHead className='w-[100px] text-right'>
                    Subtotal
                  </TableHead>
                  <TableHead className='w-[80px] text-right'>IVA</TableHead>
                  <TableHead className='w-[100px] text-right'>Total</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <InvoiceLineRow
                    key={line.id}
                    line={line}
                    index={index}
                    invoiceId={invoiceId}
                    products={products}
                    isDraft={isDraft}
                    onLineUpdated={onLinesChanged}
                    onLineRemoved={onLinesChanged}
                  />
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className='text-right font-semibold'>
                    Totals
                  </TableCell>
                  <TableCell className='text-right font-mono font-semibold'>
                    Q {totals.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right font-mono font-semibold'>
                    Q {totals.ivaAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right font-mono font-semibold'>
                    Q {totals.total.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <div className='text-muted-foreground py-8 text-center'>
            No lines added yet. Click &quot;Add Line&quot; to add items to this
            invoice.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
