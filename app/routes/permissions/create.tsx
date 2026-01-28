import { ArrowLeft, LoaderIcon, UploadIcon } from 'lucide-react'
import { useRef } from 'react'
import { Form, Link, useFetcher, useNavigation } from 'react-router'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { processPermissionFile } from '~/features/permissions/actions.server'
import { PERMISSION_MESSAGES } from '~/features/permissions/messages'
import { createPermission } from '~/features/permissions/server/actions/create-permission.action'
import { requireAuth } from '~/server/auth/session.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from './+types/create'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  if (!session.user.isSuperAdmin) {
    return redirectWithFlash('/permissions', {
      type: 'error',
      message: PERMISSION_MESSAGES.notSuperAdmin,
    })
  }

  return { isSuperAdmin: session.user.isSuperAdmin }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.clone().formData()
  const intent = formData.get('intent')

  if (intent === 'bulk-upload') {
    const result = await processPermissionFile(request)
    if (result.success) {
      return redirectWithFlash('/permissions', {
        type: 'success',
        message: result.message,
      })
    }
    return result
  }

  // Default: single permission creation
  const result = await createPermission(request)
  if (result.success) {
    return redirectWithFlash('/permissions', {
      type: 'success',
      message: PERMISSION_MESSAGES.created,
    })
  }

  return result
}

export default function PermissionCreatePage({
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const bulkFetcher = useFetcher()
  const bulkBusy = bulkFetcher.state !== 'idle'
  const inputRef = useRef<HTMLInputElement>(null)

  // Extract field errors for display
  const fieldErrors = (actionData as { errors?: Record<string, string[]> })
    ?.errors

  return (
    <>
      <TitleAndActions
        title='Create Permission'
        subtitle='Add a single permission or bulk upload from CSV'
      >
        <Link to='/permissions'>
          <Button variant='outline'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to permissions
          </Button>
        </Link>
      </TitleAndActions>

      <div className='mx-auto flex flex-row justify-around gap-2 space-y-6 p-6'>
        {/* Single Permission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Single Permission</CardTitle>
            <CardDescription>
              Create a new permission by specifying a resource and action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method='post' className='space-y-4'>
              {actionData?.message && !actionData.success && (
                <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                  {actionData.message}
                </div>
              )}

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='resource'>Resource *</Label>
                  <Input
                    type='text'
                    id='resource'
                    name='resource'
                    placeholder='e.g., users, invoices, reports'
                    required
                  />
                  {fieldErrors?.resource && (
                    <p className='text-destructive text-xs'>
                      {fieldErrors.resource[0]}
                    </p>
                  )}
                  <p className='text-muted-foreground text-xs'>
                    Lowercase letters, numbers, hyphens, and underscores only
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='action'>Action *</Label>
                  <Input
                    type='text'
                    id='action'
                    name='action'
                    placeholder='e.g., create, read, update, delete'
                    required
                  />
                  {fieldErrors?.action && (
                    <p className='text-destructive text-xs'>
                      {fieldErrors.action[0]}
                    </p>
                  )}
                  <p className='text-muted-foreground text-xs'>
                    Lowercase letters, numbers, hyphens, and underscores only
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  name='description'
                  placeholder='Describe what this permission allows...'
                  rows={3}
                />
                {fieldErrors?.description && (
                  <p className='text-destructive text-xs'>
                    {fieldErrors.description[0]}
                  </p>
                )}
              </div>

              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Permission'}
              </Button>
            </Form>
          </CardContent>
        </Card>

        {/* Bulk Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload</CardTitle>
            <CardDescription>
              Upload a CSV file to create multiple permissions at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <bulkFetcher.Form method='post' encType='multipart/form-data'>
              <input type='hidden' name='intent' value='bulk-upload' />
              <input
                type='file'
                id='permissionFile'
                name='permissionFile'
                ref={inputRef}
                accept='.csv'
                className='sr-only'
                onChange={(e) => bulkFetcher.submit(e.currentTarget.form)}
              />
              <div className='space-y-4'>
                <div className='rounded-lg border border-dashed p-6 text-center'>
                  <UploadIcon className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
                  <p className='text-muted-foreground mb-4 text-sm'>
                    CSV format: resource, action, description, isSystem
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => inputRef.current?.click()}
                    disabled={bulkBusy}
                  >
                    {bulkBusy ? (
                      <>
                        <LoaderIcon className='mr-2 h-4 w-4 animate-spin' />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className='mr-2 h-4 w-4' />
                        Select CSV File
                      </>
                    )}
                  </Button>
                </div>
                {bulkFetcher.data?.message && !bulkFetcher.data.success && (
                  <div className='bg-destructive/10 text-destructive rounded-md p-4 text-sm'>
                    {bulkFetcher.data.message}
                  </div>
                )}
              </div>
            </bulkFetcher.Form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
