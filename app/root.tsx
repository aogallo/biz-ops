import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router'
import { Toaster } from 'sonner'

import { ThemeProvider, useTheme } from 'remix-themes'
import type { Route } from './+types/root'
import './app.css'
import { I18nProvider, useTranslation } from '~/i18n/context'
import { getLocaleFromRequest } from '~/i18n/translate.server'
import type { Locale } from '~/i18n/types'
import { cn } from './lib/utils'
import { themeSessionResolver } from './server/sessions.server'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request)
  const locale = getLocaleFromRequest(request)
  return { theme: getTheme(), locale }
}

function Document({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme()
  const data = useLoaderData<typeof loader>()
  const locale = data?.locale ?? 'es'
  return (
    <html lang={locale} className={cn(theme)}>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster position='top-right' richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>()
  return (
    <ThemeProvider
      specifiedTheme={data?.theme ?? null}
      themeAction='/action/set-theme'
    >
      <I18nProvider locale={(data?.locale as Locale) ?? 'es'}>
        <Document>{children}</Document>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation()

  let message = t('error.oops')
  let details = t('error.unexpected')
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = t('error.notFound')
      details = t('error.notFoundDetails')
    } else if (error.status === 403) {
      message = t('error.accessDenied')
      details = error.statusText || t('error.accessDeniedDetails')
    } else {
      message = t('error.generic')
      details = error.statusText || details
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  const isSessionError =
    details === 'Failed to get session' || details.includes('session')

  return (
    <main className='container mx-auto p-4 pt-16'>
      <h1 className='mb-2 text-2xl font-bold'>{message}</h1>
      <p className='text-muted-foreground mb-4'>{details}</p>
      {isSessionError ? (
        <Link to='/' className='text-primary hover:underline'>
          {t('error.backToLogin')}
        </Link>
      ) : (
        <Link to='/dashboard' className='text-primary hover:underline'>
          {t('error.goToDashboard')}
        </Link>
      )}
      {stack && import.meta.env.DEV && (
        <pre className='bg-muted mt-4 w-full overflow-x-auto rounded p-4'>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
