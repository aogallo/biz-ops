import { Link, useSubmit } from 'react-router'
import { ProductQRCode } from '~/features/products/components/ProductQRCode'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  categoryColorMap,
  type CategoryColor,
} from '~/features/categories/schemas'
import { deleteProduct } from '~/features/products/server/actions/delete.action'
import { productsRepository } from '~/features/products/server/repository'
import { useTranslation } from '~/i18n/context'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/show'

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

  const product = await productsRepository.getBySkuWithCategory(
    organizationId,
    sku
  )

  if (!product) {
    return redirectWithFlash('/products', {
      type: 'error',
      message: translateServer(locale, 'messages.products.notFound'),
    })
  }

  return { product }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { sku } = params
  const session = await requireAuth(request)
  const locale = getLocaleFromRequest(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      success: false,
      message: translateServer(locale, 'messages.products.noOrganization'),
    }
  }

  const product = await productsRepository.getBySku(organizationId, sku)
  if (!product) {
    return {
      success: false,
      message: translateServer(locale, 'messages.products.notFound'),
    }
  }

  const result = await deleteProduct(request, product.id)
  if (result.success) {
    return redirectWithFlash('/products', {
      type: 'success',
      message: translateServer(locale, 'messages.products.deleted'),
    })
  }
  return result
}

export default function ShowProduct({ loaderData }: Route.ComponentProps) {
  const { product } = loaderData
  const submit = useSubmit()
  const { t } = useTranslation()

  const stock = product.stock ?? 0
  const minStock = product.minStock ?? 0
  const isLow = stock > 0 && stock <= minStock && minStock > 0
  const isOut = stock === 0

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      submit({}, { method: 'post' })
    }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{t('products.details')}</h1>
          <p className='text-muted-foreground'>
            {t('products.detailsDescription')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/products/${product.sku}/edit`}>
            <Button variant='outline'>{t('common.edit')}</Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <Link to='/products'>
            <Button variant='outline'>{t('products.backToProducts')}</Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>{t('products.basicInfo')}</CardTitle>
            <CardDescription>
              {t('products.basicInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.sku')}
              </label>
              <p className='font-mono text-lg'>{product.sku}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.name')}
              </label>
              <p className='text-lg font-semibold'>{product.name}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.price')}
              </label>
              <p className='text-primary text-2xl font-bold'>
                ${Number(product.price).toFixed(2)}
              </p>
            </div>
            {product.categoryName && product.categoryColor && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  {t('products.category')}
                </label>
                <div className='mt-1'>
                  <Badge
                    variant='outline'
                    className={`${categoryColorMap[product.categoryColor as CategoryColor].bg} ${categoryColorMap[product.categoryColor as CategoryColor].text}`}
                  >
                    {product.categoryName}
                  </Badge>
                </div>
              </div>
            )}
            {product.description && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  {t('products.description')}
                </label>
                <p className='text-sm'>{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('products.inventorySection')}</CardTitle>
            <CardDescription>
              {t('products.inventoryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.stock')}
              </label>
              <p className='text-2xl font-bold'>
                <span
                  className={
                    isOut
                      ? 'text-destructive'
                      : isLow
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }
                >
                  {stock}
                </span>
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {isOut
                  ? t('products.stockStatus.outOfStock')
                  : isLow
                    ? t('products.stockStatus.lowStock')
                    : t('products.stockStatus.inStock')}
              </p>
            </div>
            {minStock > 0 && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  {t('products.minStockThreshold')}
                </label>
                <p className='text-lg font-medium'>{minStock}</p>
                {stock > 0 && minStock > 0 && (
                  <div className='mt-2'>
                    <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                      <div
                        className={`h-full rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{
                          width: `${Math.min(100, (stock / minStock) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {Math.round((stock / minStock) * 100)}% of minimum
                    </p>
                  </div>
                )}
              </div>
            )}
            {product.imageUrl && (
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  {t('products.productImage')}
                </label>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className='mt-2 max-h-48 rounded-md object-cover'
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('products.qrCode')}</CardTitle>
            <CardDescription>{t('products.qrDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductQRCode productName={product.name} sku={product.sku} />
          </CardContent>
        </Card>

        {product.attributesJson &&
          typeof product.attributesJson === 'object' &&
          Object.keys(product.attributesJson as Record<string, unknown>)
            .length > 0 && (
            <Card className='md:col-span-3'>
              <CardHeader>
                <CardTitle>{t('products.customAttributes')}</CardTitle>
                <CardDescription>
                  {t('products.customAttributesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='overflow-hidden rounded-lg border'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-muted/40 border-b'>
                        <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                          Field
                        </th>
                        <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                          Type
                        </th>
                        <th className='text-muted-foreground px-4 py-2.5 text-center text-xs font-medium tracking-wide uppercase'>
                          Required
                        </th>
                        <th className='text-muted-foreground px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                          Options
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {Object.entries(
                        product.attributesJson as Record<
                          string,
                          {
                            type: string
                            required: boolean
                            options?: string[]
                          }
                        >
                      ).map(([name, def]) => (
                        <tr key={name}>
                          <td className='px-4 py-2.5 font-medium'>{name}</td>
                          <td className='px-4 py-2.5'>
                            <Badge variant='outline'>{def.type}</Badge>
                          </td>
                          <td className='px-4 py-2.5 text-center'>
                            {def.required ? (
                              <Badge variant='default'>Yes</Badge>
                            ) : (
                              <span className='text-muted-foreground'>No</span>
                            )}
                          </td>
                          <td className='px-4 py-2.5'>
                            {def.options?.length ? (
                              <div className='flex flex-wrap gap-1'>
                                {def.options.map((opt) => (
                                  <Badge key={opt} variant='secondary'>
                                    {opt}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className='text-muted-foreground'>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

        <Card className='md:col-span-3'>
          <CardHeader>
            <CardTitle>{t('products.metadata')}</CardTitle>
            <CardDescription>
              {t('products.metadataDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-3'>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.productId')}
              </label>
              <p className='font-mono text-sm'>{product.id}</p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.created')}
              </label>
              <p className='text-sm'>
                {new Date(product.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className='text-muted-foreground text-sm font-medium'>
                {t('products.lastUpdated')}
              </label>
              <p className='text-sm'>
                {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
