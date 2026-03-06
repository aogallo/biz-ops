import { Link } from 'react-router'
import { Card, CardContent } from '~/components/ui/card'
import { useAuth } from '~/contexts/AuthContext'
import { APP_MODULES, MODULE_META } from '~/features/modules/constants'

export default function Modules() {
  const { moduleAccess, permissions } = useAuth()

  // Super admin sees all modules; regular users see only accessible ones
  const visibleModules = permissions.isSuperAdmin
    ? APP_MODULES
    : APP_MODULES.filter((key) => moduleAccess.includes(key))

  if (visibleModules.length === 0) {
    return (
      <div>
        <h3 className='mb-4 text-lg font-semibold'>
          What would you like to do today?
        </h3>
        <p className='text-muted-foreground text-sm'>
          No tenés módulos habilitados. Contactá al administrador.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className='mb-4 text-lg font-semibold'>
        What would you like to do today?
      </h3>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {visibleModules.map((key) => {
          const meta = MODULE_META[key]
          const Icon = meta.icon
          return (
            <Link key={key} to={meta.route}>
              <Card className='hover:bg-accent/50 h-full transition-colors'>
                <CardContent className='p-6'>
                  <div className='bg-primary/10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-5 w-5' />
                  </div>
                  <h4 className='font-semibold'>{meta.label}</h4>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {meta.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
