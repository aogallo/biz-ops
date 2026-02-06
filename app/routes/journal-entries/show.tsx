import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, Pencil, XCircle } from 'lucide-react'
import { Form, Link, redirect, useNavigation } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { journalEntryRepository } from '~/features/journal-entry/server/repository'
import { postJournalEntryAction } from '~/features/journal-entry/server/actions/post.action'
import { voidJournalEntryAction } from '~/features/journal-entry/server/actions/void.action'
import { requireAuth } from '~/server/auth/session.server'
import type { Route } from './+types/show'

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return redirect('/journal-entries')
  }

  const entry = await journalEntryRepository.getById(params.id)

  if (!entry) {
    throw new Response('Journal entry not found', { status: 404 })
  }

  if (entry.organizationId !== session.session.activeOrganizationId) {
    throw new Response('Unauthorized', { status: 403 })
  }

  return { entry }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAuth(request)

  if (!session.session.activeOrganizationId) {
    return { error: 'No organization selected' }
  }

  const formData = await request.formData()
  const actionType = formData.get('_action')

  if (actionType === 'post') {
    const result = await postJournalEntryAction(
      params.id,
      session.user.id,
      session.session.activeOrganizationId
    )

    if (!result.success) {
      return { error: result.error }
    }

    return { success: true, message: 'Journal entry posted successfully' }
  }

  if (actionType === 'void') {
    const reason = formData.get('reason') as string

    if (!reason) {
      return { error: 'Reason is required for voiding' }
    }

    const result = await voidJournalEntryAction(
      params.id,
      reason,
      session.session.activeOrganizationId
    )

    if (!result.success) {
      return { error: result.error }
    }

    return { success: true, message: 'Journal entry voided successfully' }
  }

  return { error: 'Unknown action' }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant='secondary' className='text-base'>
          Draft
        </Badge>
      )
    case 'posted':
      return (
        <Badge variant='default' className='bg-green-600 text-base'>
          Posted
        </Badge>
      )
    case 'voided':
      return (
        <Badge variant='destructive' className='text-base'>
          Voided
        </Badge>
      )
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'manual':
      return <Badge variant='outline'>Manual</Badge>
    case 'invoice':
      return <Badge variant='secondary'>From Invoice</Badge>
    case 'adjustment':
      return <Badge variant='secondary'>Adjustment</Badge>
    default:
      return <Badge variant='outline'>{source}</Badge>
  }
}

export default function JournalEntryShow({ loaderData, actionData }: Route.ComponentProps) {
  const { entry } = loaderData
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const totalDebit = Number(entry.totalDebit)
  const totalCredit = Number(entry.totalCredit)

  return (
    <div className='container mx-auto py-6'>
      {/* Back Link */}
      <Link
        to='/journal-entries'
        className='mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='mr-1 h-4 w-4' />
        Back to Journal Entries
      </Link>

      {/* Error/Success Messages */}
      {actionData && 'error' in actionData && actionData.error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
          {actionData.error}
        </div>
      )}
      {actionData && 'success' in actionData && actionData.success && (
        <div className='mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400'>
          {'message' in actionData && actionData.message}
        </div>
      )}

      {/* Header Card */}
      <Card className='mb-6'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <div className='flex items-center gap-3'>
                <CardTitle className='text-2xl'>{entry.entryNumber}</CardTitle>
                {getStatusBadge(entry.status)}
                {getSourceBadge(entry.source)}
              </div>
              <CardDescription className='mt-2'>
                {entry.description}
              </CardDescription>
            </div>

            {/* Actions */}
            <div className='flex gap-2'>
              {entry.status === 'draft' && (
                <>
                  <Button variant='outline' asChild>
                    <Link to={`/journal-entries/${entry.id}/edit`}>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </Link>
                  </Button>
                  <Form method='post'>
                    <input type='hidden' name='_action' value='post' />
                    <Button
                      type='submit'
                      variant='default'
                      className='bg-green-600 hover:bg-green-700'
                      disabled={isSubmitting}
                    >
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Post Entry
                    </Button>
                  </Form>
                </>
              )}
              {entry.status === 'posted' && (
                <Form method='post'>
                  <input type='hidden' name='_action' value='void' />
                  <input
                    type='hidden'
                    name='reason'
                    value='Voided by user request'
                  />
                  <Button
                    type='submit'
                    variant='destructive'
                    disabled={isSubmitting}
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Void Entry
                  </Button>
                </Form>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Date</p>
              <p className='font-medium'>
                {format(new Date(entry.entryDate), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Company</p>
              <p className='font-medium'>{entry.company?.name || '-'}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Debit</p>
              <p className='font-medium font-mono'>Q {totalDebit.toFixed(2)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Total Credit</p>
              <p className='font-medium font-mono'>Q {totalCredit.toFixed(2)}</p>
            </div>
          </div>

          {entry.notes && (
            <div className='mt-4'>
              <p className='text-sm text-muted-foreground'>Notes</p>
              <p className='whitespace-pre-wrap text-sm'>{entry.notes}</p>
            </div>
          )}

          {entry.postedAt && (
            <div className='mt-4'>
              <p className='text-sm text-muted-foreground'>Posted At</p>
              <p className='text-sm'>
                {format(new Date(entry.postedAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}

          {/* Source Links */}
          {entry.sourceSatFileId && (
            <div className='mt-4'>
              <p className='text-sm text-muted-foreground'>Source</p>
              <Link
                to={`/sat-processor?highlight=${entry.sourceSatFileId}`}
                className='text-sm text-blue-600 hover:underline'
              >
                View SAT Record
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lines Card */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[60px]'>#</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className='w-[150px] text-right'>Debit</TableHead>
                  <TableHead className='w-[150px] text-right'>Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className='text-muted-foreground'>
                      {line.lineNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className='font-medium'>
                          {line.accountingAccount?.accountNumber || ''}{' '}
                          {line.accountingAccount?.name || 'Unknown Account'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {line.description || '-'}
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {Number(line.debitAmount) > 0
                        ? `Q ${Number(line.debitAmount).toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell className='text-right font-mono'>
                      {Number(line.creditAmount) > 0
                        ? `Q ${Number(line.creditAmount).toFixed(2)}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className='text-right font-semibold'>
                    Totals
                  </TableCell>
                  <TableCell className='text-right font-mono font-semibold'>
                    Q {totalDebit.toFixed(2)}
                  </TableCell>
                  <TableCell className='text-right font-mono font-semibold'>
                    Q {totalCredit.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Balance Check */}
          {Math.abs(totalDebit - totalCredit) > 0.01 && (
            <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
              Warning: Debits and credits are not balanced. Difference: Q{' '}
              {Math.abs(totalDebit - totalCredit).toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
