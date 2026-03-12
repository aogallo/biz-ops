import { Layers } from 'lucide-react'

interface LabeledFieldProps {
  label: string
  value: string | null | undefined
}

const LabeledField = ({ label, value }: LabeledFieldProps) => {
  return (
    <div className='space-y-1'>
      <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        {label}
      </p>
      <p className='text-foreground text-base font-semibold'>{value || '—'}</p>
    </div>
  )
}

interface LegalInformationProps {
  company: {
    name?: string | null
    nit?: string | null
    companyType?: string | null
    incorporationDate?: Date | string | null
  }
}

const LegalInformation = ({ company }: LegalInformationProps) => {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <section>
      <h3 className='text-foreground flex items-center gap-2 text-lg font-semibold'>
        <Layers className='size-5 text-teal-500' />
        Legal Information
      </h3>
      <div className='mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <LabeledField label='Registered Entity Name' value={company.name} />
        <LabeledField label='Tax Identification Number' value={company.nit} />
        <LabeledField
          label='Company Type'
          value={company.companyType || 'Sociedad Anónima'}
        />
        <LabeledField
          label='Date of Incorporation'
          value={formatDate(company.incorporationDate) || 'January 15, 2018'}
        />
      </div>
    </section>
  )
}

export default LegalInformation
