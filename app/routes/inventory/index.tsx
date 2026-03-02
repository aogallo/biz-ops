import { useEffect } from 'react'
import { useFetcher, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { requireAuth } from '~/server/auth/session.server'
import { sucursalRepository } from '~/features/sucursal/server/repository/sucursal.repository'
import { inventoryRepository } from '~/features/inventory/server/repository/inventory.repository'
import { transferToSucursalAction } from '~/features/inventory/server/actions/transfer-to-sucursal.action'
import { adjustSucursalStockAction } from '~/features/inventory/server/actions/adjust-inventory.action'
import { transferToSucursalSchema, adjustSucursalStockSchema } from '~/features/inventory/schemas'
import { productModel } from '~/server/db/schemas/products'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { Route } from './+types/index'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { sucursales: [], inventory: [], products: [], organizationId: '', selectedSucursalId: null }

  const url = new URL(request.url)
  const selectedSucursalId = url.searchParams.get('sucursalId')

  const [sucursales, products] = await Promise.all([
    sucursalRepository.getByOrganization(organizationId),
    db
      .select({ id: productModel.id, name: productModel.name, sku: productModel.sku, stock: productModel.stock, productType: productModel.productType })
      .from(productModel)
      .where(eq(productModel.organizationId, organizationId))
      .orderBy(productModel.name),
  ])

  const inventory = selectedSucursalId
    ? await inventoryRepository.getSucursalInventory(selectedSucursalId)
    : []

  return { sucursales, inventory, products, organizationId, selectedSucursalId }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return { error: 'No active organization' }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'transfer') {
    const result = transferToSucursalSchema.safeParse({
      organizationId,
      sucursalId: formData.get('sucursalId'),
      productId: formData.get('productId'),
      quantity: Number(formData.get('quantity')),
      notes: formData.get('notes') || undefined,
    })

    if (!result.success) {
      return { error: 'Datos inválidos: ' + JSON.stringify(result.error.flatten().fieldErrors) }
    }

    try {
      await transferToSucursalAction(result.data)
      return { success: 'Transferencia realizada exitosamente' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error en la transferencia' }
    }
  }

  if (intent === 'adjust') {
    const result = adjustSucursalStockSchema.safeParse({
      organizationId,
      sucursalId: formData.get('sucursalId'),
      productId: formData.get('productId'),
      newStock: Number(formData.get('newStock')),
      notes: formData.get('notes') || undefined,
    })

    if (!result.success) {
      return { error: 'Datos inválidos' }
    }

    try {
      await adjustSucursalStockAction(result.data)
      return { success: 'Stock ajustado exitosamente' }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error al ajustar' }
    }
  }

  return { error: 'Acción desconocida' }
}

export default function InventoryIndex({ loaderData }: Route.ComponentProps) {
  const { sucursales, inventory, products, selectedSucursalId } = loaderData
  const [, setSearchParams] = useSearchParams()
  const fetcher = useFetcher<typeof action>()

  useEffect(() => {
    if (fetcher.data && 'success' in fetcher.data) {
      toast.success(fetcher.data.success as string)
    }
    if (fetcher.data && 'error' in fetcher.data) {
      toast.error(fetcher.data.error as string)
    }
  }, [fetcher.data])

  const inputClass =
    'border-input bg-background w-full rounded-md border px-3 py-2 text-sm'

  const selectedSucursal = sucursales.find((s) => s.id === selectedSucursalId)

  return (
    <div className='flex-1 p-6 space-y-6'>
      <TitleAndActions title='Inventario por Sucursal' />

      {/* Selector de sucursal */}
      <div>
        <label className='mb-2 block text-sm font-medium'>Seleccioná una sucursal</label>
        <select
          className='border-input bg-background rounded-md border px-3 py-2 text-sm w-64'
          value={selectedSucursalId ?? ''}
          onChange={(e) =>
            setSearchParams(e.target.value ? { sucursalId: e.target.value } : {})
          }
        >
          <option value=''>— Elegir sucursal —</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {selectedSucursalId && selectedSucursal && (
        <>
          {/* Transfer form */}
          <div className='rounded-lg border p-4 space-y-4'>
            <h3 className='font-semibold'>Transferir stock de org → {selectedSucursal.name}</h3>
            <fetcher.Form method='post' className='grid gap-4 sm:grid-cols-4'>
              <input type='hidden' name='intent' value='transfer' />
              <input type='hidden' name='sucursalId' value={selectedSucursalId} />

              <div>
                <label className='mb-1 block text-xs font-medium'>Producto</label>
                <select name='productId' required className={inputClass}>
                  <option value=''>Seleccionar...</option>
                  {products.filter(p => p.productType === 'STOCK').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-1 block text-xs font-medium'>Cantidad</label>
                <input type='number' name='quantity' min='1' required className={inputClass} placeholder='1' />
              </div>

              <div>
                <label className='mb-1 block text-xs font-medium'>Notas</label>
                <input type='text' name='notes' className={inputClass} placeholder='Opcional' />
              </div>

              <div className='flex items-end'>
                <Button type='submit' disabled={fetcher.state !== 'idle'}>
                  {fetcher.state !== 'idle' ? 'Transfiriendo...' : 'Transferir'}
                </Button>
              </div>
            </fetcher.Form>
          </div>

          {/* Inventory table */}
          <div className='rounded-lg border'>
            <div className='p-4 border-b'>
              <h3 className='font-semibold'>Inventario en {selectedSucursal.name}</h3>
            </div>
            {inventory.length === 0 ? (
              <p className='text-muted-foreground p-4 text-sm'>Sin productos en esta sucursal. Transferí stock desde arriba.</p>
            ) : (
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-4 py-3 text-left font-medium'>Producto</th>
                    <th className='px-4 py-3 text-left font-medium'>SKU</th>
                    <th className='px-4 py-3 text-center font-medium'>Stock</th>
                    <th className='px-4 py-3 text-center font-medium'>Estado</th>
                    <th className='px-4 py-3 text-center font-medium'>Ajustar</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className='border-b last:border-0'>
                      <td className='px-4 py-3'>{item.productName}</td>
                      <td className='px-4 py-3 font-mono text-xs'>{item.productSku}</td>
                      <td className='px-4 py-3 text-center font-medium'>{item.stock}</td>
                      <td className='px-4 py-3 text-center'>
                        {item.stock === 0 ? (
                          <Badge variant='destructive'>Sin stock</Badge>
                        ) : item.stock <= item.minStock ? (
                          <Badge variant='outline' className='text-amber-600'>Stock bajo</Badge>
                        ) : (
                          <Badge variant='default'>OK</Badge>
                        )}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <fetcher.Form method='post' className='flex items-center gap-2 justify-center'>
                          <input type='hidden' name='intent' value='adjust' />
                          <input type='hidden' name='sucursalId' value={selectedSucursalId} />
                          <input type='hidden' name='productId' value={item.productId} />
                          <input
                            type='number'
                            name='newStock'
                            min='0'
                            defaultValue={item.stock}
                            className='border-input bg-background w-20 rounded border px-2 py-1 text-sm text-center'
                          />
                          <Button type='submit' variant='outline' size='sm' disabled={fetcher.state !== 'idle'}>
                            Ajustar
                          </Button>
                        </fetcher.Form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
