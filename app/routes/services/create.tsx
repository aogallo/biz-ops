import { Form, redirect, useActionData, useNavigation } from 'react-router'
import { useTranslation } from '~/i18n/context'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { createServiceAction } from '~/features/services/server/actions/create.action'
import { serviceColorMap, type ServiceColor } from '~/features/services/schemas'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import('~/server/auth/session.server')
  await requireAuth(request)
  return {}
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createServiceAction(request)

  if (response.success && response.data) {
    return redirect('/services')
  }

  return response
}

const colorOptions: ServiceColor[] = [
  'blue',
  'green',
  'orange',
  'teal',
  'purple',
  'red',
  'yellow',
]

export default function CreateService() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { t } = useTranslation()

  return (
    <div className='mx-auto max-w-4xl p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('services.createTitle')}</CardTitle>
          <CardDescription>{t('services.description')}</CardDescription>
        </CardHeader>
        <Form method='post'>
          <CardContent className='space-y-6'>
            {actionData?.message && !actionData.success && (
              <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                {actionData.message}
              </div>
            )}

            <div className='grid gap-6 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='name'>{t('services.name')} *</Label>
                <Input
                  type='text'
                  id='name'
                  name='name'
                  required
                  placeholder='e.g., Consultation'
                />
                {actionData?.errors?.name && (
                  <p className='text-destructive text-xs'>
                    {actionData.errors.name}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='duration'>{t('services.duration')} *</Label>
                <Input
                  type='number'
                  id='duration'
                  name='duration'
                  required
                  min='5'
                  max='480'
                  placeholder='30'
                />
                {actionData?.errors?.duration && (
                  <p className='text-destructive text-xs'>
                    {actionData.errors.duration}
                  </p>
                )}
                <p className='text-muted-foreground text-xs'>
                  Between 5 minutes and 8 hours
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='price'>{t('services.price')}</Label>
              <Input
                type='number'
                id='price'
                name='price'
                step='0.01'
                min='0'
                placeholder='0.00'
              />
              {actionData?.errors?.price && (
                <p className='text-destructive text-xs'>
                  {actionData.errors.price}
                </p>
              )}
              <p className='text-muted-foreground text-xs'>
                Optional - service price for billing and reports
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='color'>{t('services.color')} *</Label>
              <Select name='color' defaultValue='blue'>
                <SelectTrigger id='color'>
                  <SelectValue placeholder='Select a color' />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => {
                    const colorStyles = serviceColorMap[color]
                    return (
                      <SelectItem key={color} value={color}>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`size-3 rounded-full ${colorStyles.dot}`}
                          />
                          <span className='capitalize'>{color}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {actionData?.errors?.color && (
                <p className='text-destructive text-xs'>
                  {actionData.errors.color}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>{t('services.description')}</Label>
              <Textarea
                id='description'
                name='description'
                placeholder='Describe this service...'
                rows={3}
              />
              {actionData?.errors?.description && (
                <p className='text-destructive text-xs'>
                  {actionData.errors.description}
                </p>
              )}
              <p className='text-muted-foreground text-xs'>
                Optional description (max 500 characters)
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-3 border-t pt-6'>
            <Button type='button' variant='outline' asChild>
              <a href='/services'>{t('common.cancel')}</a>
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('common.create')}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
