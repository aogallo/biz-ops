import AccountingSummary from '../components/AccountingSummary'
import AppointmentSummary from '../components/AppointmentSummary'
import Greetings from '../components/Greetings'
import InventorySummary from '../components/InventorySummary'

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
