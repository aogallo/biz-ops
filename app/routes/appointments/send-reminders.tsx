import { redirect } from 'react-router'
import { sendUpcomingReminders } from '~/features/appointments/server/actions/send-reminders.action'
import { requireAuth } from '~/server/auth/session.server'
import { isSuperAdmin } from '~/server/permissions'
import type { Route } from './+types/send-reminders'

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request)
  const isAdmin = await isSuperAdmin(session.user.id)

  if (!isAdmin) {
    return { success: false, error: 'Permission denied. Super admin required.' }
  }

  try {
    const result = await sendUpcomingReminders()
    return {
      success: true,
      ...result,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send reminders',
    }
  }
}

export async function loader() {
  return redirect('/appointments')
}
