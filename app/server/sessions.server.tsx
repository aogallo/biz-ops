import { createCookieSessionStorage } from 'react-router'
import { createThemeSessionResolver } from 'remix-themes'

const isProduction = process.env.node_env === 'production'
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'theme',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secrets: ['sec3tt323'],
    ...(isProduction ? { domain: 'your-prod-domain.com', secure: true } : {}),
  },
})

export const themeSessionResolver = createThemeSessionResolver(sessionStorage)
