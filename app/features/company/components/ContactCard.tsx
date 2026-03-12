import { Mail, Phone, User, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Card, CardContent } from '~/components/ui/card'

interface Contact {
  name: string
  title?: string
  email?: string
  phone?: string
  avatarUrl?: string
}

interface ContactCardProps {
  contact?: Contact
}

const ContactCard = ({
  contact = {
    name: 'Maria Rodriguez',
    title: 'Finance Director',
    email: 'maria.rodriguez@techcorp.com',
    phone: '+502 5555 1234',
  },
}: ContactCardProps) => {
  return (
    <section className='space-y-4'>
      <h4 className='text-foreground flex items-center gap-2 text-lg font-semibold'>
        <Users className='size-5 text-teal-500' />
        Primary Contact Details
      </h4>
      <Card className='gap-0 py-4'>
        <CardContent className='flex flex-col gap-4 sm:flex-row sm:items-start'>
          <div className='flex items-start gap-4'>
            <Avatar className='size-12'>
              {contact.avatarUrl ? (
                <AvatarImage src={contact.avatarUrl} alt={contact.name} />
              ) : null}
              <AvatarFallback className='bg-teal-100 text-teal-600'>
                <User className='size-6' />
              </AvatarFallback>
            </Avatar>
            <div className='space-y-0.5'>
              <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                Contact Person
              </p>
              <p className='text-foreground font-semibold'>{contact.name}</p>
              {contact.title && (
                <p className='text-sm text-teal-600 dark:text-teal-400'>
                  {contact.title}
                </p>
              )}
            </div>
          </div>
          <div className='flex flex-col gap-2 sm:ml-auto'>
            {contact.email && (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Mail className='size-4' />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Phone className='size-4' />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default ContactCard
