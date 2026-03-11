import { useState } from 'react'
import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { CustomAttributesEditor } from '~/features/products/components/CustomAttributesEditor'
import type { AttributeDef } from '~/features/products/components/CustomAttributesEditor'
import { categoriesRepository } from '~/features/categories/server/repository'
import { updateProduct } from '~/features/products/server/actions/update.action'
import { productsRepository } from '~/features/products/server/repository'
import { cn } from '~/lib/utils'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

type ProductType =
  | 'STOCK'
  | 'MADE_TO_ORDER'
  | 'SERVICE'
  | 'ingredient'
  | 'recipe'
  | 'combo'
  | 'sale_item'

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  STOCK: 'Producto con stock',
  MADE_TO_ORDER: 'Hecho a pedido',
  SERVICE: 'Servicio',
  ingredient: 'Ingrediente',
  recipe: 'Receta',
  combo: 'Combo / Menú',
  sale_item: 'Item de venta',
}

const FORCED_NO_INVENTORY: ProductType[] = ['SERVICE', 'recipe', 'combo']

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const { sku } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: translateServer(locale, 'messages.products.noOrganization'),
    })
  }

  const [product, categories] = await Promise.all([
    productsRepository.getBySku(organizationId, sku),
    categoriesRepository.getAllByOrganization(organizationId),
  ])

  if (!product) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: translateServer(locale, 'messages.products.notFound'),
    })
  }

  return { product, categories }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { sku } = params
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return { success: false, message: translateServer(locale, 'messages.products.noOrganization') }
  }

  const product = await productsRepository.getBySku(organizationId, sku)
  if (!product) {
    return { success: false, message: translateServer(locale, 'messages.products.notFound') }
  }

  const response = await updateProduct(request, product.id)
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`)
  }
  return response
}

export default function EditProduct({ loaderData }: Route.ComponentProps) {
  const { product, categories } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  const inputClass =
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

  const [productType, setProductType] = useState<ProductType>(
    (product.productType as ProductType) ?? 'STOCK'
  )
  const [tracksInventory, setTracksInventory] = useState(
    product.trackInventory ?? true
  )

  const isInventoryForced = FORCED_NO_INVENTORY.includes(productType)

  function handleProductTypeChange(newType: ProductType) {
    setProductType(newType)
    if (newType === 'STOCK') {
      setTracksInventory(true)
    } else {
      setTracksInventory(false)
    }
  }

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('products.editTitle')}</CardTitle>
          <CardDescription>
            {t('products.editDescription')}
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            {/* Product Type */}
            <div>
              <label
                htmlFor='productType'
                className='mb-2 block text-sm font-medium'
              >
                Tipo de producto
              </label>
              <select
                id='productType'
                name='productType'
                value={productType}
                onChange={(e) =>
                  handleProductTypeChange(e.target.value as ProductType)
                }
                className={inputClass}
              >
                {(
                  Object.entries(PRODUCT_TYPE_LABELS) as [
                    ProductType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label htmlFor='sku' className='mb-2 block text-sm font-medium'>
                  {t('products.skuLabel')}
                </label>
                <input
                  type='text'
                  id='sku'
                  name='sku'
                  required
                  defaultValue={product.sku}
                  placeholder={t('products.skuPlaceholder')}
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.sku && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.sku}
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor='name'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('products.nameLabel')}
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  required
                  defaultValue={product.name}
                  placeholder={t('products.namePlaceholder')}
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.name && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.name}
                    </p>
                  )}
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='price'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('products.price')} *
                </label>
                <input
                  type='number'
                  id='price'
                  name='price'
                  required
                  step='0.01'
                  min='0'
                  defaultValue={product.price.toString()}
                  placeholder={t('products.pricePlaceholder')}
                  className={inputClass}
                />
                {actionData &&
                  'errors' in actionData &&
                  actionData.errors?.price && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.price}
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor='categoryId'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('products.category')}
                </label>
                <select
                  id='categoryId'
                  name='categoryId'
                  defaultValue={product.categoryId || ''}
                  className={inputClass}
                >
                  <option value=''>{t('products.noCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Track Inventory toggle */}
            <div>
              <input
                type='hidden'
                name='trackInventory'
                value={tracksInventory ? 'true' : 'false'}
              />
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  role='switch'
                  aria-checked={tracksInventory}
                  disabled={isInventoryForced}
                  onClick={() =>
                    !isInventoryForced && setTracksInventory(!tracksInventory)
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    tracksInventory ? 'bg-amber-500' : 'bg-muted',
                    isInventoryForced && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                      tracksInventory ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span className='text-sm font-medium'>
                  Controla inventario
                  {isInventoryForced && (
                    <span className='text-muted-foreground ml-1.5 text-xs font-normal'>
                      (no aplica para este tipo)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {tracksInventory && (
              <div className='grid gap-6 sm:grid-cols-2'>
                <div>
                  <label
                    htmlFor='stock'
                    className='mb-2 block text-sm font-medium'
                  >
                    {t('products.stock')}
                  </label>
                  <input
                    type='number'
                    id='stock'
                    name='stock'
                    min='0'
                    defaultValue={product.stock ?? 0}
                    placeholder='0'
                    className={inputClass}
                  />
                  {actionData &&
                    'errors' in actionData &&
                    actionData.errors?.stock && (
                      <p className='text-destructive mt-1 text-xs'>
                        {actionData.errors.stock}
                      </p>
                    )}
                </div>

                <div>
                  <label
                    htmlFor='minStock'
                    className='mb-2 block text-sm font-medium'
                  >
                    {t('products.minStock')}
                  </label>
                  <input
                    type='number'
                    id='minStock'
                    name='minStock'
                    min='0'
                    defaultValue={product.minStock ?? 0}
                    placeholder={t('products.minStockPlaceholder')}
                    className={inputClass}
                  />
                  {actionData &&
                    'errors' in actionData &&
                    actionData.errors?.minStock && (
                      <p className='text-destructive mt-1 text-xs'>
                        {actionData.errors.minStock}
                      </p>
                    )}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor='description'
                className='mb-2 block text-sm font-medium'
              >
                {t('products.description')}
              </label>
              <textarea
                id='description'
                name='description'
                rows={3}
                defaultValue={product.description || ''}
                placeholder={t('products.descriptionPlaceholder')}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor='imageUrl'
                className='mb-2 block text-sm font-medium'
              >
                {t('products.imageUrl')}
              </label>
              <input
                type='url'
                id='imageUrl'
                name='imageUrl'
                defaultValue={product.imageUrl || ''}
                placeholder={t('products.imageUrlPlaceholder')}
                className={inputClass}
              />
            </div>
            <CustomAttributesEditor
              initialAttributes={product.attributesJson as unknown as Record<string, AttributeDef> | null}
            />
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href={`/products/${product.sku}`}>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('products.saveChanges')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
