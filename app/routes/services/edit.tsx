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
import { Checkbox } from '~/components/ui/checkbox'
import { updateServiceAction } from '~/features/services/server/actions/update.action'
import { servicesRepository } from '~/features/services/server/repository'
import { serviceColorMap, type ServiceColor } from '~/features/services/schemas'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/edit'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    throw new Response('No organization selected', { status: 400 })
  }

  const service = await servicesRepository.getByIdAndOrganization(
    params.id,
    organizationId
  )

  if (!service) {
    throw new Response('Service not found', { status: 404 })
  }

  return { service }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await updateServiceAction(request)

  if (response.success) {
    return redirect('/services')
  }

  return response
}

const colorOptions: ServiceColor[] = ['blue', 'green', 'orange', 'teal', 'purple', 'red', 'yellow']

export default function EditService({ loaderData }: Route.ComponentProps) {
  const { service } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Service</CardTitle>
          <CardDescription>
            Update the service details
          </CardDescription>
        </CardHeader>
        <Form method="post">
          <input type="hidden" name="id" value={service.id} />
          <CardContent className="space-y-6">
            {actionData?.message && !actionData.success && (
              <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm">
                {actionData.message}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={service.name}
                  placeholder="e.g., Consultation"
                />
                {actionData?.errors?.name && (
                  <p className="text-destructive text-xs">
                    {actionData.errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  type="number"
                  id="duration"
                  name="duration"
                  required
                  min="5"
                  max="480"
                  defaultValue={service.duration}
                  placeholder="30"
                />
                {actionData?.errors?.duration && (
                  <p className="text-destructive text-xs">
                    {actionData.errors.duration}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Between 5 minutes and 8 hours
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                defaultValue={service.price || ''}
                placeholder="0.00"
              />
              {actionData?.errors?.price && (
                <p className="text-destructive text-xs">
                  {actionData.errors.price}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Optional - service price for billing and reports
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Select name="color" defaultValue={service.color}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => {
                    const colorStyles = serviceColorMap[color]
                    return (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div className={`size-3 rounded-full ${colorStyles.dot}`} />
                          <span className="capitalize">{color}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {actionData?.errors?.color && (
                <p className="text-destructive text-xs">
                  {actionData.errors.color}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={service.description || ''}
                placeholder="Describe this service..."
                rows={3}
              />
              {actionData?.errors?.description && (
                <p className="text-destructive text-xs">
                  {actionData.errors.description}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Optional description (max 500 characters)
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="isActive"
                name="isActive"
                value="true"
                defaultChecked={service.isActive}
              />
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-muted-foreground text-sm">
                  Inactive services cannot be selected for new appointments
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" asChild>
              <a href="/services">Cancel</a>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )
}
