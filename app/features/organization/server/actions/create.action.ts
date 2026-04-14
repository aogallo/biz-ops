import auth from '~/server/auth-server'
import { organizationCreateSchema } from '../../schemas'
import { organizationRepository } from '../repository'
import z from 'zod'

export async function createOrganization(request: Request, input: FormData) {
  const logoFile = input.get('logo') as File | null
  let logoBase64: string | undefined

  if (logoFile && logoFile.size > 0) {
    const buffer = await logoFile.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    logoBase64 = `data:${logoFile.type};base64,${base64}`
  }

  const rawValues = Object.fromEntries(input)

  const { data, error, success } = organizationCreateSchema.safeParse({
    ...rawValues,
    logo: logoBase64,
  })

  if (!success) {
    return {
      success: false,
      message: 'There are errors',
      errors: z.prettifyError(error),
    }
  }

  const organizationBySlug = await organizationRepository.getBySlug(data.slug)

  if (organizationBySlug) {
    return {
      success: false,
      message: 'The organization already exists.',
    }
  }

  const createdOrganization = await auth.api.createOrganization({
    body: {
      name: data.name,
      slug: data.slug,
      logo: logoBase64 || '',
      metadata: {},
      keepCurrentActiveOrganization: false,
    },
    headers: request.headers,
  })

  if (data.domain && createdOrganization?.id) {
    await organizationRepository.updateById(createdOrganization.id, {
      domain: data.domain,
    })
  }

  return {
    success: true,
    data: createdOrganization,
  }
}
