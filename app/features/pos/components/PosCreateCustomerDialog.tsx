import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { useTranslation } from '~/i18n/context'

interface PosCreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string, nit: string) => void
  isSubmitting: boolean
}

export function PosCreateCustomerDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: PosCreateCustomerDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [nit, setNit] = useState('')

  function handleConfirm() {
    if (!name.trim()) return
    onConfirm(name.trim(), nit.trim())
    setName('')
    setNit('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('pos.createCustomerTitle')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>
              {t('pos.customerName')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('pos.customerName')}
              className='mt-1'
              autoFocus
            />
          </div>
          <div>
            <label className='text-sm font-medium'>
              {t('pos.customerNit')}
            </label>
            <Input
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder='CF'
              className='mt-1'
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? t('common.creating') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
