import * as React from 'react'
import { CheckIcon, ChevronDownIcon, Loader2Icon } from 'lucide-react'

import { cn } from '~/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'default'
  className?: string
}

function Combobox({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  name,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  loading = false,
  size = 'default',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')

  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? controlledValue : internalValue

  const selectedOption = options.find((opt) => opt.value === currentValue)

  const handleSelect = (optionValue: string) => {
    const newValue = optionValue === currentValue ? '' : optionValue
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && <input type='hidden' name={name} value={currentValue} />}
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type='button'
          role='combobox'
          aria-expanded={open}
          data-slot='combobox-trigger'
          data-size={size}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            className
          )}
        >
          <span
            data-slot='combobox-value'
            data-placeholder={!selectedOption || undefined}
            className='line-clamp-1 text-left'
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {loading ? (
            <Loader2Icon className='size-4 shrink-0 animate-spin opacity-50' />
          ) : (
            <ChevronDownIcon className='size-4 shrink-0 opacity-50' />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                >
                  <span className='flex-1'>
                    {option.label}
                    {option.description && (
                      <span className='text-muted-foreground ml-2 text-xs'>
                        {option.description}
                      </span>
                    )}
                  </span>
                  <CheckIcon
                    className={cn(
                      'size-4',
                      currentValue === option.value
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
