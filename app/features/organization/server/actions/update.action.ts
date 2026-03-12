import { organizationUpdateSchema } from '../../schemas'
import { organizationRepository } from '../repository'

export async function updateOrganization(slug: string, input: FormData) {
  const logoFile = input.get('logo') as File | null
  let logoBase64: string | undefined

  if (logoFile && logoFile.size > 0) {
    const buffer = await logoFile.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    logoBase64 = `data:${logoFile.type};base64,${base64}`
  }

  const rawValues = Object.fromEntries(input)
  const { data, error, success } = organizationUpdateSchema.safeParse({
    name: rawValues.name || undefined,
    slug: rawValues.slug || undefined,
    domain: rawValues.domain || undefined,
    logo: logoBase64 ?? (rawValues.currentLogo as string) ?? undefined,
  })

  if (!success) {
    return {
      success: false,
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    }
  }

  const org = await organizationRepository.getBySlug(slug)
  if (!org) {
    return { success: false, message: 'Organization not found' }
  }

  // If slug changed, verify it's not taken
  if (data.slug && data.slug !== slug) {
    const existing = await organizationRepository.getBySlug(data.slug)
    if (existing) {
      return {
        success: false,
        message: 'That slug is already taken by another organization.',
      }
    }
  }

  const updated = await organizationRepository.updateById(org.id, data)

  return { success: true, newSlug: updated?.slug ?? slug }
}
