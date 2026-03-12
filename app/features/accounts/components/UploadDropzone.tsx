import { Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'

interface UploadDropzoneProps {
  actionUrl?: string
}

export function UploadDropzone({
  actionUrl = '/accounts',
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetcher = useFetcher()

  const isUploading = fetcher.state === 'submitting'
  const result = fetcher.data as
    | {
        success?: boolean
        message?: string
        data?: { inserted: number; updated: number; skipped: number }
        errors?: Array<{ row: number; field: string; message: string }>
        parseErrors?: Array<{ row: number; field: string; message: string }>
      }
    | undefined

  // Show result when fetcher completes
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      setShowResult(true)
    }
  }, [fetcher.state, fetcher.data])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = (file: File) => {
    setFileName(file.name)
    setShowResult(false) // Clear previous result when starting new upload

    const formData = new FormData()
    formData.append('file', file)
    formData.append('_action', 'bulk-upload')

    fetcher.submit(formData, {
      method: 'post',
      action: actionUrl,
      encType: 'multipart/form-data',
    })
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className='space-y-4'>
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'} ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary/50 cursor-pointer'} `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='.csv,.xls,.xlsx'
          className='hidden'
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <div className='space-y-2'>
          <div className='text-muted-foreground'>
            {isUploading ? (
              <div className='flex flex-col items-center gap-2'>
                <Loader2 className='text-primary h-8 w-8 animate-spin' />
                <span>Uploading {fileName}...</span>
              </div>
            ) : (
              <>
                <Upload className='mx-auto mb-2 h-8 w-8' />
                <p className='font-medium'>
                  Drop your file here or click to browse
                </p>
                <p className='text-sm'>
                  Supported formats: CSV, Excel (.xls, .xlsx)
                </p>
                <p className='mt-2 text-xs'>
                  Required columns: accountNumber, name
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {showResult && result && (
        <div
          className={`rounded-md p-4 text-sm ${
            result.success
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          <p className='font-medium'>{result.message}</p>
          {result.success && result.data && (
            <div className='mt-2 text-xs'>
              <p>Inserted: {result.data.inserted}</p>
              <p>Updated: {result.data.updated}</p>
              {result.data.skipped > 0 && <p>Skipped: {result.data.skipped}</p>}
            </div>
          )}
          {((result.errors && result.errors.length > 0) ||
            (result.parseErrors && result.parseErrors.length > 0)) && (
            <div className='mt-2'>
              <p className='font-medium'>Errors:</p>
              <ul className='mt-1 max-h-32 list-inside list-disc overflow-auto text-xs'>
                {(result.errors || result.parseErrors)
                  ?.slice(0, 10)
                  .map((error, i) => (
                    <li key={i}>
                      Row {error.row}: {error.field} - {error.message}
                    </li>
                  ))}
                {(result.errors?.length || 0) +
                  (result.parseErrors?.length || 0) >
                  10 && (
                  <li>
                    ...and{' '}
                    {(result.errors?.length || 0) +
                      (result.parseErrors?.length || 0) -
                      10}{' '}
                    more errors
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={(e) => {
            e.stopPropagation()
            // Download sample CSV template
            const csv =
              'accountNumber,name\n1000,Cash\n1100,Accounts Receivable\n2000,Accounts Payable'
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'accounts_template.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Download Template
        </Button>
      </div>
    </div>
  )
}
