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
  return { theme: getTheme() }
}

function Document({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme()
  return (
    <html lang='en' className={cn(theme)}>
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
      <Document>{children}</Document>
    </ThemeProvider>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = '404'
      details = 'The requested page could not be found.'
    } else if (error.status === 403) {
      message = 'Access Denied'
      details = error.statusText || "You don't have permission for this action."
    } else {
      message = 'Error'
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
      <h1 className='text-2xl font-bold mb-2'>{message}</h1>
      <p className='text-muted-foreground mb-4'>{details}</p>
      {isSessionError ? (
        <Link to='/' className='text-primary hover:underline'>
          Back to Login
        </Link>
      ) : (
        <Link to='/dashboard' className='text-primary hover:underline'>
          Go to Dashboard
        </Link>
      )}
      {stack && import.meta.env.DEV && (
        <pre className='w-full overflow-x-auto p-4 mt-4 bg-muted rounded'>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
