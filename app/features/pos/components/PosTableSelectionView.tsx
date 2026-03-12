import { ShoppingBag } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { PosTable } from '~/server/db/schemas/pos'

interface PosTableSelectionViewProps {
  tables: PosTable[]
  onSelectTable: (table: PosTable) => void
  onTakeout: () => void
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Ocupada',
  reserved: 'Reservada',
}

export function PosTableSelectionView({
  tables,
  onSelectTable,
  onTakeout,
}: PosTableSelectionViewProps) {
  const available = tables.filter((t) => t.status === 'available')
  const occupied = tables.filter((t) => t.status === 'occupied')
  const reserved = tables.filter((t) => t.status === 'reserved')

  return (
    <div className='flex flex-1 flex-col gap-6 overflow-auto p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold'>Seleccionar mesa</h2>
          <p className='text-muted-foreground text-sm'>
            Elegí una mesa o continuá con para llevar
          </p>
        </div>
        <Button size='lg' variant='outline' onClick={onTakeout}>
          <ShoppingBag className='mr-2 size-4' />
          Para llevar
        </Button>
      </div>

      {tables.length === 0 && (
        <div className='text-muted-foreground flex flex-1 items-center justify-center text-sm'>
          No hay mesas configuradas. Podés vender para llevar o configurar mesas
          en Ajustes → Mesas.
        </div>
      )}

      {tables.length > 0 && (
        <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
          {[...available, ...reserved, ...occupied].map((table) => {
            const isAvailable = table.status === 'available'
            const isOccupied = table.status === 'occupied'
            return (
              <button
                key={table.id}
                onClick={() => isAvailable && onSelectTable(table)}
                disabled={!isAvailable}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
                  isAvailable &&
                    'hover:border-primary hover:bg-primary/5 cursor-pointer',
                  isOccupied && 'cursor-not-allowed opacity-60',
                  !isAvailable && !isOccupied && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className='text-2xl font-bold'>{table.number}</span>
                {table.capacity && (
                  <span className='text-muted-foreground text-xs'>
                    {table.capacity} pers.
                  </span>
                )}
                <Badge
                  variant={
                    isAvailable
                      ? 'default'
                      : isOccupied
                        ? 'secondary'
                        : 'outline'
                  }
                  className='text-xs'
                >
                  {STATUS_LABEL[table.status]}
                </Badge>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
