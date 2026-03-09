export function loader() {
  return new Response('Method Not Allowed', { status: 405 })
}

export async function action({ request }: { request: Request }) {
  const privateKeyPem = process.env.QZ_PRIVATE_KEY ?? ''

  if (!privateKeyPem) {
    return Response.json({ error: 'QZ_PRIVATE_KEY not configured' }, { status: 500 })
  }

  const { toSign } = (await request.json()) as { toSign: string }

  if (!toSign) {
    return Response.json({ error: 'Missing toSign parameter' }, { status: 400 })
  }

  try {
    // Normalize PEM: handle both real newlines and literal \n from env vars
    const normalized = privateKeyPem.replace(/\\n/g, '\n')
    const pemBody = normalized
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s+/g, '')

    const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
      false,
      ['sign']
    )

    const dataBuffer = new TextEncoder().encode(toSign)
    const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataBuffer)
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

    return Response.json({ signature })
  } catch (err) {
    console.error('[QZ Sign] Signing failed:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Signing failed' },
      { status: 500 }
    )
  }
}
