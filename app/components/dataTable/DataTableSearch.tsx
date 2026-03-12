import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
}: DataTableSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className='relative w-full max-w-sm'>
      <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='pr-8 pl-8'
      />
      {value && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='absolute top-1/2 right-0 h-full -translate-y-1/2 px-2 hover:bg-transparent'
          onClick={handleClear}
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  )
}
