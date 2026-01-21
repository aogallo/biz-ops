import { Link } from 'react-router'
import { DataTable } from '~/components/dataTable/DataTable'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'
import { CompanyColumns } from '../components/Columns'

const CompanyIndex = () => {
  return (
    <div className='flex-1 p-6'>
      <TitleAndActions title='Companies'>
        <Link to='/company/new'>
          <Button>Add Company</Button>
        </Link>
      </TitleAndActions>
      <DataTable columns={CompanyColumns} data={[]} />
    </div>
  )
}

export default CompanyIndex
