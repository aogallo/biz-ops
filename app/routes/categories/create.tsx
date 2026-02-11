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
import { createCategory } from '~/features/categories/server/actions/create.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createCategory(request)
  if (response.success) {
    return redirect('/categories')
  }
  return response
}

export default function CreateCategory() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
          <CardDescription>
            Add a new category to organize your products
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
              <label
                htmlFor='name'
                className='mb-2 block text-sm font-medium'
              >
                Category Name *
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
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
                      className='flex cursor-pointer items-center gap-2 rounded-md border p-2 has-[:checked]:ring-2 has-[:checked]:ring-primary'
                    >
                      <input
                        type='radio'
                        name='color'
                        value={color}
                        defaultChecked={color === 'blue'}
                        className='sr-only'
                      />
                      <div
                        className={`size-4 rounded-full ${styles.dot}`}
                      />
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
