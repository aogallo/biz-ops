import { handleRequest } from '@vercel/react-router/entry.server'
import type { AppLoadContext, EntryContext } from 'react-router'

const isProduction = process.env.NODE_ENV === 'production'

export default async function handleRequestReactRouter(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext?: AppLoadContext
) {
  const nonce = crypto.randomUUID()

  const response = await handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
    loadContext,
    { nonce }
  )

  // Only apply strict CSP in production; in dev, Vite scripts don't have nonce
if (isProduction) {
  response.headers.set(
    'Content-Security-Policy',
    [
      // Defaults
      `default-src 'self'`,

      // Scripts
      `script-src 'self' 'nonce-${nonce}'`,
      `script-src-elem 'self' 'unsafe-inline'`,

      // Styles
      `style-src 'self' 'unsafe-inline'`,
      `style-src-elem 'self' https://fonts.googleapis.com`,

      // Fonts
      `font-src 'self' https://fonts.gstatic.com`,

      // Data / uploads / previews
      `img-src 'self' data: blob:`,
      `media-src 'self' blob:`,

      // React Router loaders/actions/fetcher
      `connect-src 'self' https:`,

      // Forms (file uploads)
      `form-action 'self'`,

      // Hardening
      `base-uri 'self'`,
      `frame-ancestors 'none'`,
    ].join('; ')
  )
}

  return response
}
