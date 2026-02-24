import { Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Input } from '~/components/ui/input'
import { useTranslation } from '~/i18n/context'

interface PosProductSearchProps {
  value: string
  onChange: (value: string) => void
  onBarcodeScanned?: (barcode: string) => void
}

export function PosProductSearch({
  value,
  onChange,
  onBarcodeScanned,
}: PosProductSearchProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement &&
        document.activeElement !== inputRef.current &&
        document.activeElement.tagName === 'INPUT'
      ) {
        return
      }

      if (e.key === 'Enter' && bufferRef.current.length >= 3) {
        e.preventDefault()
        onBarcodeScanned?.(bufferRef.current)
        bufferRef.current = ''
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          bufferRef.current = ''
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onBarcodeScanned])

  return (
    <div className='relative'>
      <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        type='text'
        placeholder={t('pos.searchProduct')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='pl-9'
      />
    </div>
  )
}
