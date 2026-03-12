import { Plus, Search, User } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import type { Client, Service, Staff } from '../types'
import { TimeSlotGrid } from './TimeSlotGrid'

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: Staff[]
  services: Service[]
  clients: Client[]
}

const MAX_NOTES_LENGTH = 500

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  staff,
  services,
  clients,
}: CreateAppointmentDialogProps) {
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

  const handleReset = () => {
    setClientSearch('')
    setSelectedClientId(null)
    setSelectedServiceId(null)
    setSelectedStaffId(null)
    setSelectedDate('')
    setSelectedTimeSlot(null)
    setNotes('')
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log({
      clientId: selectedClientId,
      serviceId: selectedServiceId,
      staffId: selectedStaffId,
      date: selectedDate,
      time: selectedTimeSlot,
      notes,
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Client Information Section */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Client Information</h3>

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
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedClientId(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className='space-y-2'>
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
                  <div className='max-h-40 overflow-y-auto rounded-lg border'>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type='button'
                          className='hover:bg-accent flex w-full items-center gap-3 p-2 text-left'
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

                <Button variant='outline' size='sm' className='w-full'>
                  <Plus className='mr-2 size-4' />
                  Create New Client
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Service & Staff Section */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Service & Staff</h3>
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
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className='flex items-center gap-2'>
                          <div
                            className='size-2 rounded-full'
                            style={{ backgroundColor: service.color }}
                          />
                          <span>{service.name}</span>
                          <span className='text-muted-foreground'>
                            ({service.duration}min)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
            </div>

            {selectedStaff && (
              <div className='bg-muted/50 flex items-center gap-2 rounded-lg p-2 text-sm'>
                <User className='text-muted-foreground size-4' />
                <span className='text-muted-foreground'>Staff Available</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Date & Time Section */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Date & Time</h3>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='date'>Date</Label>
                <Input
                  id='date'
                  type='date'
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {selectedDate && (
                <div className='space-y-2'>
                  <Label>Available Time Slots</Label>
                  <TimeSlotGrid
                    selectedSlot={selectedTimeSlot}
                    onSelectSlot={setSelectedTimeSlot}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Internal Notes</h3>
            <div className='space-y-2'>
              <Textarea
                placeholder='Add any notes about this appointment...'
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))
                }
                rows={3}
              />
              <div className='text-muted-foreground text-right text-xs'>
                {notes.length}/{MAX_NOTES_LENGTH}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button variant='secondary' onClick={handleSave}>
            Save as Draft
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !selectedClientId ||
              !selectedServiceId ||
              !selectedStaffId ||
              !selectedDate ||
              !selectedTimeSlot
            }
          >
            Save & Send Confirmation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
