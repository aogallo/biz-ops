import { Check, AlertCircle } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useFetcher } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'

interface PostInvoiceButtonProps {
  invoiceId: string
  hasLines: boolean
  disabled?: boolean
  onPosted?: (journalEntryId?: string) => void
}

export function PostInvoiceButton({
  invoiceId,
  hasLines,
  disabled = false,
  onPosted,
}: PostInvoiceButtonProps) {
  const fetcher = useFetcher()
  const [isOpen, setIsOpen] = useState(false)
  const lastDataRef = useRef<unknown>(null)

  useEffect(() => {
    if (fetcher.data && fetcher.data !== lastDataRef.current) {
      lastDataRef.current = fetcher.data
      const data = fetcher.data as {
        success?: boolean
        error?: string
        journalEntryId?: string
      }
      if (data.success) {
        toast.success('Invoice posted successfully')
        setIsOpen(false)
        onPosted?.(data.journalEntryId)
      } else {
        toast.error(data.error || 'Failed to post invoice')
      }
    }
  }, [fetcher.data, onPosted])

  const isPosting = fetcher.state !== 'idle'
  const canPost = hasLines && !disabled

  const handlePost = () => {
    fetcher.submit(
      {
        _action: 'postInvoice',
        invoiceId,
      },
      { method: 'post' }
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button disabled={!canPost || isPosting} className="gap-2">
          <Check className="h-4 w-4" />
          {isPosting ? 'Posting...' : 'Post Invoice'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Post Invoice
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to post this invoice? This action will:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Assign an invoice number</li>
              <li>Change status from Draft to Posted</li>
              <li>Create a draft journal entry</li>
              <li>Make the invoice non-editable</li>
            </ul>
            <p className="mt-4 font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPosting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handlePost} disabled={isPosting}>
            {isPosting ? 'Posting...' : 'Post Invoice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
