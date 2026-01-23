import { handleRequest } from '@vercel/react-router/entry.server'
import type { AppLoadContext, EntryContext } from 'react-router'

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

  response.headers.set('Content-Security-Policy', `script-src 'nonce-${nonce}'`)
  return response
}
