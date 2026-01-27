import AccountingSummary from '~/features/dashboard/components/AccountingSummary'
import AppointmentSummary from '~/features/dashboard/components/AppointmentSummary'
import Greetings from '~/features/dashboard/components/Greetings'
import InventorySummary from '~/features/dashboard/components/InventorySummary'

const index = () => {
  return (
    <div className='dark:bg-background-dark/50 flex-1 space-y-5 overflow-y-auto'>
      <Greetings />
      <div className='grid grid-cols-12 gap-6'>
        <AccountingSummary />
        <AppointmentSummary />
        <InventorySummary />
      </div>
    </div>
  )
}

export default index
