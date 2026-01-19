import { CloudUpload } from 'lucide-react'
import { useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { cn } from '~/lib/utils'
import type { InvoiceType } from '../schemas'

interface Company {
  id: string
  name: string
}

interface UploadDropzoneProps {
  companies: Company[]
}

export function UploadDropzone({ companies }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<InvoiceType | ''>('')
  const navigation = useNavigation()
  const isUploading = navigation.state === 'submitting'

  const canUpload = selectedCompanyId && selectedInvoiceType && selectedFile

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

    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  return (
    <Form method='post' encType='multipart/form-data'>
      <input type='hidden' name='_action' value='upload' />
      <input type='hidden' name='companyId' value={selectedCompanyId} />
      <input type='hidden' name='invoiceType' value={selectedInvoiceType} />

      <div className='space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
        <h3 className='text-base font-semibold'>Upload SAT Export</h3>

        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='company-select'>Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger id='company-select' className='w-full'>
                <SelectValue placeholder='Select company...' />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Invoice Type</Label>
            <RadioGroup
              value={selectedInvoiceType}
              onValueChange={(value) => setSelectedInvoiceType(value as InvoiceType)}
              className='flex gap-4'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='purchase' id='purchase' />
                <Label htmlFor='purchase' className='cursor-pointer font-normal'>
                  Compras (Facturas Recibidas)
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='sales' id='sales' />
                <Label htmlFor='sales' className='cursor-pointer font-normal'>
                  Ventas (Facturas Emitidas)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <label
          htmlFor='sat-file-input'
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            !selectedCompanyId || !selectedInvoiceType
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900'
              : isDragging
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
          )}
          onDragOver={selectedCompanyId && selectedInvoiceType ? handleDragOver : undefined}
          onDragLeave={selectedCompanyId && selectedInvoiceType ? handleDragLeave : undefined}
          onDrop={selectedCompanyId && selectedInvoiceType ? handleDrop : undefined}
        >
          <CloudUpload
            className={cn(
              'h-12 w-12',
              isDragging ? 'text-blue-500' : 'text-slate-400'
            )}
          />
          <div>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              {!selectedCompanyId || !selectedInvoiceType
                ? 'Please select a company and invoice type first'
                : 'Drag and drop your FEL export files here or click to browse'}
            </p>
          </div>
          <span className='rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[12px] font-bold uppercase dark:border-slate-700 dark:bg-slate-800'>
            Supported: .csv, .xls, .xlsx
          </span>

          <input
            id='sat-file-input'
            type='file'
            name='file'
            accept='.csv,.xls,.xlsx'
            className='sr-only'
            onChange={handleFileChange}
            disabled={!selectedCompanyId || !selectedInvoiceType}
          />
        </label>

        {selectedFile && (
          <div className='flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800'>
            <span className='text-sm font-medium'>{selectedFile.name}</span>
            <button
              type='submit'
              disabled={isUploading || !canUpload}
              className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        )}
      </div>
    </Form>
  )
}
