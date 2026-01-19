import { Progress } from '~/components/ui/progress'
import type { CategorizeStats } from '../server/repository/sat-file.repository'

interface ProgressStatsProps {
  stats: CategorizeStats
}

export function ProgressStats({ stats }: ProgressStatsProps) {
  const percentage = stats.total > 0
    ? Math.round((stats.matched / stats.total) * 100)
    : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Auto-Categorization Progress
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {percentage}%
        </span>
      </div>
      <Progress value={percentage} className="mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-slate-100 p-2 text-center dark:bg-slate-900">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Rows
          </div>
        </div>
        <div className="rounded-md bg-green-100 p-2 text-center dark:bg-green-900/30">
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {stats.matched}
          </div>
          <div className="text-xs text-green-600 dark:text-green-500">
            Matched
          </div>
        </div>
        <div className="rounded-md bg-amber-100 p-2 text-center dark:bg-amber-900/30">
          <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
            {stats.review}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500">
            Review
          </div>
        </div>
      </div>
    </div>
  )
}
