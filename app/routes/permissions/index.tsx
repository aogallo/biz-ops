import { UploadIcon } from 'lucide-react'
import { Link } from 'react-router'
import TitleAndActions from '~/components/TitleAndActions'
import { Button } from '~/components/ui/button'

const index = () => {
  return (
    <>
      <TitleAndActions
        title='Permissions Management'
        subtitle='Configure granular access control lists. Define resouces and actions'
      >
        <Link to='/permissions/new'>
          <Button className=''>
            <UploadIcon />
            Upload Permissions (CSV)
          </Button>
        </Link>
      </TitleAndActions>
    </>
  )
}

export default index
