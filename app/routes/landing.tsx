import { CTASection } from '~/components/landing/CTASection'
import { HeroSection } from '~/components/landing/HeroSection'
import { LandingFooter } from '~/components/landing/LandingFooter'
import { LandingHeader } from '~/components/landing/LandingHeader'
import { PricingSection } from '~/components/landing/PricingSection'
import { ServicesSection } from '~/components/landing/ServicesSection'
import { getOptionalAuth } from '~/server/auth/session.server'
import type { Route } from './+types/landing'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getOptionalAuth(request)
  return { isAuthenticated: !!session }
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated } = loaderData

  return (
    <div className='bg-background min-h-svh'>
      <LandingHeader isAuthenticated={isAuthenticated} />
      <HeroSection />
      <ServicesSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
