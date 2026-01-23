import { ArrowUpLeft, LoaderIcon, UploadIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useFetcher } from 'react-router'
import { toast } from 'sonner'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import { processPermissionFile } from '~/features/permissions/actions.server'
import { redirectWithFlash } from '~/server/flash.server'
import type { Route } from '../roles/+types/create'

export async function action({ request }: Route.ActionArgs) {
  const result = await processPermissionFile(request)
  console.log('actionresult', result)
  if (result.success) {
    void redirectWithFlash('/permissions', {
      type: 'success',
      message: result.message,
    })
  }
  return result
}

const PermissionCreatePage = ({ actionData }: Route.ComponentProps) => {
  const fetcher = useFetcher()
  const busy = fetcher.state != 'idle'
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message)
    } else {
      toast.error(actionData?.message)
    }
  }, [actionData])

  return (
    <>
      <TitleAndActions
        title='Create Permissions'
        subtitle='Create or bulk the permissions'
      >
        <div className='flex gap-3'>
          <fetcher.Form method='post' encType='multipart/form-data'>
            <input
              type='file'
              id='permissionFile'
              name='permissionFile'
              ref={inputRef}
              className='sr-only'
              onChange={(e) => fetcher.submit(e.currentTarget.form)}
            />
            <Button type='button' onClick={() => inputRef.current?.click()}>
              {busy ? (
                <>
                  <LoaderIcon />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon />
                  Upload Permission File
                </>
              )}
            </Button>
          </fetcher.Form>

          <Link to='/permissions'>
            <Button variant='outline'>
              <ArrowUpLeft />
              Back to permissions
            </Button>
          </Link>
        </div>
      </TitleAndActions>
    </>
  )
}

export default PermissionCreatePage
