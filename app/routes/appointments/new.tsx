import { and, eq, inArray } from 'drizzle-orm'
import { ArrowLeft, Plus, Search, User } from 'lucide-react'
import { useState } from 'react'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
import { TimeSlotGrid } from '~/features/appointments/components'
import { createAppointmentAction } from '~/features/appointments/server/actions/create.action'
import type { Client, Staff } from '~/features/appointments/types'
import { servicesRepository } from '~/features/services/server/repository'
import { serviceColorMap, type ServiceColor } from '~/features/services/schemas'
import { requireAuth } from '~/server/auth/session.server'
import { db } from '~/server/db'
import {
  businessPartnerModel,
  memberModel,
  userModel,
} from '~/server/db/schemas'
import type { Route } from './+types/new'

const MAX_NOTES_LENGTH = 500

interface ServiceWithColor {
  id: string
  name: string
  duration: number
  color: ServiceColor
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request)
  const organizationId = session.session.activeOrganizationId

  if (!organizationId) {
    return {
      staff: [],
      clients: [],
      services: [] as ServiceWithColor[],
    }
  }

  // Fetch real data from DB in parallel
  const [membersWithUsers, businessPartners, servicesData] = await Promise.all([
    db
      .select({
        memberId: memberModel.id,
        userId: userModel.id,
        name: userModel.name,
        email: userModel.email,
        image: userModel.image,
      })
      .from(memberModel)
      .innerJoin(userModel, eq(memberModel.userId, userModel.id))
      .where(eq(memberModel.organizationId, organizationId)),
    db
      .select({
        id: businessPartnerModel.id,
        name: businessPartnerModel.name,
        email: businessPartnerModel.email,
      })
      .from(businessPartnerModel)
      .where(
        and(
          eq(businessPartnerModel.organizationId, organizationId),
          inArray(businessPartnerModel.type, ['client', 'both'])
        )
      ),
    servicesRepository.getActiveByOrganization(organizationId),
  ])

  const staff: Staff[] = membersWithUsers.map((m) => ({
    id: m.memberId,
    userId: m.userId,
    name: m.name,
    email: m.email,
    image: m.image,
  }))

  const clients: Client[] = businessPartners.map((bp) => ({
    id: bp.id,
    name: bp.name,
    email: bp.email,
  }))

  const services: ServiceWithColor[] = servicesData.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    color: s.color as ServiceColor,
  }))

  return { staff, clients, services }
}

export async function action({ request }: Route.ActionArgs) {
  const response = await createAppointmentAction(request)

  if (response.success && response.data) {
    return redirect('/appointments?view=month&success=appointment_created')
  }

  return response
}

export default function NewAppointmentPage({
  loaderData,
}: Route.ComponentProps) {
  const { staff, services, clients } = loaderData
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  )
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  // Filter clients based on search
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(clientSearch.toLowerCase()))
  )

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedStaff = staff.find((s) => s.id === selectedStaffId)

  const selectedService = services.find((s) => s.id === selectedServiceId)

  // Check if form is complete
  const isFormComplete =
    selectedClientId &&
    selectedServiceId &&
    selectedStaffId &&
    selectedDate &&
    selectedTimeSlot

  // Get color styles for selected service
  const getColorDot = (color: ServiceColor) => {
    const styles = serviceColorMap[color]
    return styles?.dot || 'bg-gray-500'
  }

  return (
    <div className='mx-auto max-w-6xl p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center gap-4'>
        <Link to='/appointments'>
          <Button variant='ghost' size='icon'>
            <ArrowLeft className='size-5' />
          </Button>
        </Link>
        <div>
          <h1 className='text-2xl font-bold'>Create New Appointment</h1>
          <p className='text-muted-foreground'>
            Schedule a new appointment with a client
          </p>
        </div>
      </div>

      {/* Global error message */}
      {actionData?.message && !actionData.success && (
        <div className='bg-destructive/10 text-destructive mb-6 rounded-md p-4 text-sm'>
          {actionData.message}
        </div>
      )}

      <Form method='post'>
        {/* Hidden fields for form submission */}
        <input type='hidden' name='clientId' value={selectedClientId || ''} />
        <input type='hidden' name='serviceId' value={selectedServiceId || ''} />
        <input type='hidden' name='staffId' value={selectedStaffId || ''} />
        <input type='hidden' name='date' value={selectedDate} />
        <input type='hidden' name='time' value={selectedTimeSlot || ''} />
        <input type='hidden' name='notes' value={notes} />

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Content - 2 columns on large screens */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Client Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Client Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {actionData?.errors?.clientId && (
                  <p className='text-destructive text-xs'>
                    {actionData.errors.clientId}
                  </p>
                )}
                {selectedClient ? (
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-10'>
                        <AvatarFallback>
                          {selectedClient.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>{selectedClient.name}</div>
                        {selectedClient.email && (
                          <div className='text-muted-foreground text-sm'>
                            {selectedClient.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedClientId(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='relative'>
                      <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                      <Input
                        placeholder='Search clients by name or email...'
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className='pl-9'
                      />
                    </div>

                    {clientSearch && (
                      <div className='max-h-48 overflow-y-auto rounded-lg border'>
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type='button'
                              className='hover:bg-accent flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0'
                              onClick={() => {
                                setSelectedClientId(client.id)
                                setClientSearch('')
                              }}
                            >
                              <Avatar className='size-8'>
                                <AvatarFallback className='text-xs'>
                                  {client.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='text-sm font-medium'>
                                  {client.name}
                                </div>
                                {client.email && (
                                  <div className='text-muted-foreground text-xs'>
                                    {client.email}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className='text-muted-foreground p-4 text-center text-sm'>
                            No clients found
                          </div>
                        )}
                      </div>
                    )}

                    <Link to='/business-partners/new?type=client'>
                      <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                      >
                        <Plus className='mr-2 size-4' />
                        Create New Client
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service & Staff Section */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Service & Staff</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='service'>Service</Label>
                    <Select
                      value={selectedServiceId || ''}
                      onValueChange={setSelectedServiceId}
                    >
                      <SelectTrigger id='service'>
                        <SelectValue placeholder='Select a service' />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length === 0 ? (
                          <div className='text-muted-foreground p-2 text-sm'>
                            No services available.{' '}
                            <Link
                              to='/services/new'
                              className='text-primary underline'
                            >
                              Create one
                            </Link>
                          </div>
                        ) : (
                          services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`size-2 rounded-full ${getColorDot(service.color)}`}
                                />
                                <span>{service.name}</span>
                                <span className='text-muted-foreground'>
                                  ({service.duration}min)
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {actionData?.errors?.serviceId && (
                      <p className='text-destructive text-xs'>
                        {actionData.errors.serviceId}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='staff'>Staff Member</Label>
                    <Select
                      value={selectedStaffId || ''}
                      onValueChange={setSelectedStaffId}
                    >
                      <SelectTrigger id='staff'>
                        <SelectValue placeholder='Select staff' />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className='flex items-center gap-2'>
                              <Avatar className='size-6'>
                                <AvatarImage
                                  src={member.image || undefined}
                                  alt={member.name}
                                />
                                <AvatarFallback className='text-xs'>
                                  {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {actionData?.errors?.staffId && (
                      <p className='text-destructive text-xs'>
                        {actionData.errors.staffId}
                      </p>
                    )}
                  </div>
                </div>

                {selectedStaff && (
                  <div className='bg-muted/50 flex items-center gap-2 rounded-lg p-2 text-sm'>
                    <User className='text-muted-foreground size-4' />
                    <span className='text-muted-foreground'>
                      Staff Available
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date & Time Section */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='date'>Date</Label>
                  <Input
                    id='date'
                    type='date'
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {actionData?.errors?.date && (
                    <p className='text-destructive text-xs'>
                      {actionData.errors.date}
                    </p>
                  )}
                </div>

                {selectedDate && (
                  <div className='space-y-2'>
                    <Label>Available Time Slots</Label>
                    <TimeSlotGrid
                      selectedSlot={selectedTimeSlot}
                      onSelectSlot={setSelectedTimeSlot}
                      unavailableSlots={['12:00', '12:30', '13:00']} // Mock unavailable slots
                    />
                    {actionData?.errors?.startTime && (
                      <p className='text-destructive text-xs'>
                        {actionData.errors.startTime}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <Textarea
                    placeholder='Add any notes about this appointment...'
                    value={notes}
                    onChange={(e) =>
                      setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))
                    }
                    rows={4}
                  />
                  <div className='text-muted-foreground text-right text-xs'>
                    {notes.length}/{MAX_NOTES_LENGTH}
                  </div>
                  {actionData?.errors?.notes && (
                    <p className='text-destructive text-xs'>
                      {actionData.errors.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Appointment Summary */}
          <div className='lg:col-span-1'>
            <div className='sticky top-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Appointment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Client */}
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Client
                    </div>
                    <div className='text-sm'>
                      {selectedClient ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='size-6'>
                            <AvatarFallback className='text-xs'>
                              {selectedClient.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedClient.name}</span>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          Not selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service */}
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Service
                    </div>
                    <div className='text-sm'>
                      {selectedService ? (
                        <div className='flex items-center gap-2'>
                          <div
                            className={`size-2 rounded-full ${getColorDot(selectedService.color)}`}
                          />
                          <span>{selectedService.name}</span>
                          <span className='text-muted-foreground'>
                            ({selectedService.duration}min)
                          </span>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          Not selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Staff */}
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Staff
                    </div>
                    <div className='text-sm'>
                      {selectedStaff ? (
                        <div className='flex items-center gap-2'>
                          <Avatar className='size-6'>
                            <AvatarImage
                              src={selectedStaff.image || undefined}
                              alt={selectedStaff.name}
                            />
                            <AvatarFallback className='text-xs'>
                              {selectedStaff.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedStaff.name}</span>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          Not selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className='space-y-1'>
                    <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Date & Time
                    </div>
                    <div className='text-sm'>
                      {selectedDate && selectedTimeSlot ? (
                        <span>
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {selectedTimeSlot}
                        </span>
                      ) : selectedDate ? (
                        <span>
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          <span className='text-muted-foreground'>
                            {' '}
                            - Select time
                          </span>
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>
                          Not selected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes preview */}
                  {notes && (
                    <div className='space-y-1'>
                      <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                        Notes
                      </div>
                      <div className='text-muted-foreground line-clamp-2 text-sm'>
                        {notes}
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Action Buttons */}
                <div className='space-y-2 border-t p-4'>
                  <Button
                    type='submit'
                    name='action'
                    value='confirm'
                    className='w-full'
                    disabled={isSubmitting || !isFormComplete}
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Send Confirmation'}
                  </Button>
                  <Button
                    type='submit'
                    name='action'
                    value='draft'
                    variant='secondary'
                    className='w-full'
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </Button>
                  <Link to='/appointments' className='block'>
                    <Button type='button' variant='outline' className='w-full'>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}
