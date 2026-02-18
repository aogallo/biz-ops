import { useState } from 'react'
import { Form, Link, redirect, useActionData, useNavigation } from 'react-router'
import {
  FileText,
  Package,
  ImageIcon,
  Lightbulb,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { categoriesRepository } from '~/features/categories/server/repository'
import { createProduct } from '~/features/products/server/actions/create.action'
import { useTranslation } from '~/i18n/context'
import { requireAuth } from '~/server/auth/session.server'
import { CustomAttributesEditor } from '~/features/products/components/CustomAttributesEditor'
import { cn } from '~/lib/utils'
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

const inputClass =
  'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

export default function CreateProduct({ loaderData }: Route.ComponentProps) {
  const { categories } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  const [dragOver, setDragOver] = useState(false)

  return (
    <div className='space-y-6 p-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          {t('products.createNew')}
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          {t('products.createDescription')}
        </p>
      </div>

      <Form method='post'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* ── Main Column ─────────────────────────────── */}
          <div className='space-y-6 lg:col-span-2'>

            {/* Global error */}
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl p-4 text-sm'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                {actionData.message}
              </div>
            )}

            {/* General Information */}
            <section className='rounded-xl bg-card p-6 shadow-sm'>
              <div className='mb-5 flex items-center gap-2'>
                <FileText className='h-4 w-4 text-amber-500' />
                <h2 className='font-semibold'>
                  {t('products.generalInformation')}
                </h2>
              </div>

              <div className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {/* SKU */}
                  <div>
                    <label htmlFor='sku' className='mb-1.5 block text-sm font-medium'>
                      {t('products.skuLabel')}
                    </label>
                    <input
                      type='text'
                      id='sku'
                      name='sku'
                      required
                      placeholder={t('products.skuPlaceholder')}
                      className={cn(
                        inputClass,
                        actionData?.errors?.sku && 'border-destructive focus-visible:ring-destructive'
                      )}
                    />
                    {actionData?.errors?.sku ? (
                      <p className='text-destructive mt-1 text-xs'>
                        {actionData.errors.sku}
                      </p>
                    ) : (
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {t('products.skuHelper')}
                      </p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label htmlFor='name' className='mb-1.5 block text-sm font-medium'>
                      {t('products.nameLabel')}
                    </label>
                    <input
                      type='text'
                      id='name'
                      name='name'
                      required
                      placeholder={t('products.namePlaceholder')}
                      className={cn(
                        inputClass,
                        actionData?.errors?.name && 'border-destructive focus-visible:ring-destructive'
                      )}
                    />
                    {actionData?.errors?.name && (
                      <p className='text-destructive mt-1 text-xs'>
                        {actionData.errors.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className='grid gap-4 sm:grid-cols-2'>
                  {/* Category */}
                  <div>
                    <label htmlFor='categoryId' className='mb-1.5 block text-sm font-medium'>
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

                  {/* Base Price */}
                  <div>
                    <label htmlFor='price' className='mb-1.5 block text-sm font-medium'>
                      {t('products.basePrice')} *
                    </label>
                    <div className='relative'>
                      <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                        $
                      </span>
                      <input
                        type='number'
                        id='price'
                        name='price'
                        required
                        step='0.01'
                        min='0'
                        placeholder='0.00'
                        className={cn(
                          inputClass,
                          'pl-7',
                          actionData?.errors?.price && 'border-destructive focus-visible:ring-destructive'
                        )}
                      />
                    </div>
                    {actionData?.errors?.price && (
                      <p className='text-destructive mt-1 text-xs'>
                        {actionData.errors.price}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor='description' className='mb-1.5 block text-sm font-medium'>
                    {t('products.description')}
                  </label>
                  <textarea
                    id='description'
                    name='description'
                    rows={4}
                    placeholder={t('products.descriptionPlaceholder')}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Inventory Control */}
            <section className='rounded-xl bg-card p-6 shadow-sm'>
              <div className='mb-5 flex items-center gap-2'>
                <Package className='h-4 w-4 text-amber-500' />
                <h2 className='font-semibold'>{t('products.inventoryControl')}</h2>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                {/* Initial Stock */}
                <div>
                  <label htmlFor='stock' className='mb-1.5 block text-sm font-medium'>
                    {t('products.initialStock')}
                  </label>
                  <input
                    type='number'
                    id='stock'
                    name='stock'
                    min='0'
                    defaultValue='0'
                    className={cn(
                      inputClass,
                      actionData?.errors?.stock && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  {actionData?.errors?.stock && (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.stock}
                    </p>
                  )}
                </div>

                {/* Min Stock */}
                <div>
                  <label htmlFor='minStock' className='mb-1.5 block text-sm font-medium'>
                    {t('products.minStock')}
                  </label>
                  <input
                    type='number'
                    id='minStock'
                    name='minStock'
                    min='0'
                    defaultValue='5'
                    className={cn(
                      inputClass,
                      actionData?.errors?.minStock && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  {actionData?.errors?.minStock ? (
                    <p className='text-destructive mt-1 text-xs'>
                      {actionData.errors.minStock}
                    </p>
                  ) : (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {t('products.minStockHelper')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Custom Attributes */}
            <CustomAttributesEditor />
          </div>

          {/* ── Sidebar ─────────────────────────────────── */}
          <div className='space-y-6'>
            {/* Product Image */}
            <section className='rounded-xl bg-card p-6 shadow-sm'>
              <div className='mb-4 flex items-center gap-2'>
                <ImageIcon className='h-4 w-4 text-amber-500' />
                <h2 className='font-semibold'>
                  {t('products.productImageTitle')}
                </h2>
              </div>

              {/* Dropzone (visual only — image stored via URL) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 text-center transition-colors',
                  dragOver
                    ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
                    : 'border-border/50 hover:border-border'
                )}
              >
                <div className='bg-muted rounded-lg p-3'>
                  <Upload className='text-muted-foreground h-6 w-6' />
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    {t('products.imageDropzoneText')}
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {t('products.imageDropzoneHint')}
                  </p>
                </div>
              </div>

              {/* URL alternative */}
              <div className='mt-4'>
                <label
                  htmlFor='imageUrl'
                  className='mb-1.5 block text-sm font-medium'
                >
                  {t('products.imageUrlAlternative')}
                </label>
                <input
                  type='url'
                  id='imageUrl'
                  name='imageUrl'
                  placeholder={t('products.imageUrlPlaceholder')}
                  className={inputClass}
                />
              </div>
            </section>

            {/* Quick Tips */}
            <section className='rounded-xl bg-blue-50/50 p-5 shadow-sm dark:bg-blue-950/20'>
              <div className='mb-3 flex items-center gap-2'>
                <Lightbulb className='h-4 w-4 text-blue-500' />
                <h2 className='text-sm font-semibold text-blue-700 dark:text-blue-400'>
                  {t('products.quickTips')}
                </h2>
              </div>
              <ul className='text-muted-foreground space-y-2 text-xs'>
                <li className='flex items-start gap-2'>
                  <span className='mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400' />
                  {t('products.tip.sku')}
                </li>
                <li className='flex items-start gap-2'>
                  <span className='mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400' />
                  {t('products.tip.image')}
                </li>
                <li className='flex items-start gap-2'>
                  <span className='mt-1 h-1 w-1 shrink-0 rounded-full bg-blue-400' />
                  {t('products.tip.attributes')}
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* ── Sticky Footer ───────────────────────────── */}
        <div className='border-border/50 mt-6 flex items-center justify-between border-t pt-6'>
          <p className='text-muted-foreground text-xs'>
            * Some fields are marked as required.
          </p>
          <div className='flex items-center gap-3'>
            <Button type='button' variant='outline' asChild>
              <Link to='/products'>{t('common.cancel')}</Link>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('products.createTitle')}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
