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
import { categoriesRepository } from '~/features/categories/server/repository'
import { createProduct } from '~/features/products/server/actions/create.action'
import { useTranslation } from '~/i18n/context'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId
  const categories = organizationId
    ? await categoriesRepository.getAllByOrganization(organizationId)
    : []
  return { categories }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createProduct(request)
  if (response.success && response.data) {
    return redirect(`/products/${response.data.sku}`)
  }
  return response
}

export default function CreateProduct({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  const inputClass =
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('products.createNew')}</CardTitle>
          <CardDescription>
            {t('products.createDescription')}
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

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
                  placeholder={t('products.skuPlaceholder')}
                  className={inputClass}
                />
                {actionData?.errors?.sku && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.sku}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('products.skuHelper')}
                </p>
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
                  placeholder={t('products.namePlaceholder')}
                  className={inputClass}
                />
                {actionData?.errors?.name && (
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
                  placeholder={t('products.pricePlaceholder')}
                  className={inputClass}
                />
                {actionData?.errors?.price && (
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

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <label
                  htmlFor='stock'
                  className='mb-2 block text-sm font-medium'
                >
                  {t('products.initialStock')}
                </label>
                <input
                  type='number'
                  id='stock'
                  name='stock'
                  min='0'
                  defaultValue='0'
                  placeholder='0'
                  className={inputClass}
                />
                {actionData?.errors?.stock && (
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
                  defaultValue='0'
                  placeholder={t('products.minStockPlaceholder')}
                  className={inputClass}
                />
                {actionData?.errors?.minStock && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.minStock}
                  </p>
                )}
                <p className='text-muted-foreground mt-1 text-xs'>
                  {t('products.minStockHelper')}
                </p>
              </div>
            </div>

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
                placeholder={t('products.imageUrlPlaceholder')}
                className={inputClass}
              />
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/products'>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('products.createTitle')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
