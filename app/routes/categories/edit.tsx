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
import {
  CATEGORY_COLORS,
  categoryColorMap,
  type CategoryColor,
} from '~/features/categories/schemas'
import { updateCategory } from '~/features/categories/server/actions/update.action'
import { categoriesRepository } from '~/features/categories/server/repository'
import { getLocaleFromRequest, translateServer } from '~/i18n/translate.server'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const { id } = params

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) {
    return redirectWithFlash('/categories', {
      type: 'error',
      message: 'No active organization',
    })
  }

  const locale = getLocaleFromRequest(request)
  const category = await categoriesRepository.getById(id)
  if (!category || category.organizationId !== organizationId) {
    return redirectWithFlash('/categories', {
      type: 'error',
      message: translateServer(locale, 'messages.categories.notFound'),
    })
  }

  return { category }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  const response = await updateCategory(request, id)

  if (response.success) {
    return redirect('/categories')
  }
  return response
}

export default function EditCategory({ loaderData }: Route.ComponentProps) {
  const { category } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Edit Category</CardTitle>
          <CardDescription>
            Update the details for this category
          </CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div>
              <label htmlFor='name' className='mb-2 block text-sm font-medium'>
                Category Name *
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
                defaultValue={category.name}
                placeholder='e.g. Electronics, Clothing, Food'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              />
              {actionData &&
                'errors' in actionData &&
                actionData.errors?.name && (
                  <p className='text-destructive mt-1 text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium'>Color</label>
              <div className='grid grid-cols-5 gap-2'>
                {CATEGORY_COLORS.map((color) => {
                  const styles = categoryColorMap[color as CategoryColor]
                  return (
                    <label
                      key={color}
                      className='has-[:checked]:ring-primary flex cursor-pointer items-center gap-2 rounded-md border p-2 has-[:checked]:ring-2'
                    >
                      <input
                        type='radio'
                        name='color'
                        value={color}
                        defaultChecked={color === category.color}
                        className='sr-only'
                      />
                      <div className={`size-4 rounded-full ${styles.dot}`} />
                      <span className='text-xs capitalize'>{color}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/categories'>Cancel</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
