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
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}'`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob:`,
        `media-src 'self' blob:`,
        `connect-src 'self' https:`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
      ].join('; ')
    )
  }

  return response
}
