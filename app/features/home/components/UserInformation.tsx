import { Card, CardContent } from '~/components/ui/card'
import { useTranslation } from '~/i18n/context'

interface UserInformationProps {
  userName: string
  companyName: string
}
export default function UserInformation({
  userName,
  companyName,
}: UserInformationProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent>
        <h2>
          {t('home.welcome.message')}
          {userName}
        </h2>
        <h3>
          {t('home.company.message')}
          {companyName}
        </h3>
      </CardContent>
    </Card>
  )
}
