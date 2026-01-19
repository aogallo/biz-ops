import { Lightbulb } from 'lucide-react'

export function ProTipCard() {
  return (
    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Pro Tip
          </h4>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Connect your SAT account to automatically sync your FEL invoices
            and keep your records up to date in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
