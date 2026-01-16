import type { ColumnDef } from '@tanstack/react-table'
import type { SatFile } from '~/server/db/schemas/sat-file'

export const SatFileColumns: ColumnDef<SatFile>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha Emision',
  },
  {
    accessorKey: 'serie',
    header: 'Serie/Document',
  },
  {
    header: 'NIT Emisor',
  },
  {
    header: 'Nombre Emisor',
  },
]
