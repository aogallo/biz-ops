import { Plus, Search, User } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { useTranslation } from '~/i18n/context'

interface Customer {
  id: string
  name: string
  nit: string | null
}

interface PosCustomerSearchProps {
  selectedCustomer: Customer | null
  customers: Customer[]
  onSearch: (query: string) => void
  onSelect: (customer: Customer) => void
  onCreateCustomer?: () => void
}

export function PosCustomerSearch({
  selectedCustomer,
  customers,
  onSearch,
  onSelect,
  onCreateCustomer,
}: PosCustomerSearchProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <div className='flex gap-2'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className='flex-1 justify-start'>
            <User className='size-4' />
            <span className='truncate'>
              {selectedCustomer?.name ?? t('pos.defaultCustomer')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-72 p-2' align='start'>
          <div className='relative mb-2'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 size-3.5 -translate-y-1/2' />
            <Input
              placeholder={t('pos.searchCustomer')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                onSearch(e.target.value)
              }}
              className='h-8 pl-7 text-sm'
            />
          </div>
          <div className='max-h-48 overflow-y-auto'>
            {customers.map((customer) => (
              <button
                key={customer.id}
                type='button'
                onClick={() => {
                  onSelect(customer)
                  setOpen(false)
                  setQuery('')
                }}
                className='hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm'
              >
                <div>
                  <p className='font-medium'>{customer.name}</p>
                  {customer.nit && (
                    <p className='text-muted-foreground text-xs'>
                      NIT: {customer.nit}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {customers.length === 0 && query.length > 0 && (
              <p className='text-muted-foreground py-4 text-center text-sm'>
                {t('pos.noResults')}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {onCreateCustomer && (
        <Button variant='outline' size='sm' onClick={onCreateCustomer}>
          <Plus className='size-4' />
        </Button>
      )}
    </div>
  )
}
