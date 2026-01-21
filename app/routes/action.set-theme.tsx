import { createThemeAction } from 'remix-themes'
import { themeSessionResolver } from '~/server/sessions.server'

export const action = createThemeAction(themeSessionResolver)
