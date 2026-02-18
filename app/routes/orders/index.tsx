import TitleAndActions from '~/components/TitleAndActions'
import TitleAndActionsBody from '~/components/TitleAndActionsBody'
import { useTranslation } from '~/i18n/context'
import { Button } from '~/components/ui/button'
import type { TranslationKey } from '~/i18n/types'
// import { useMemo } from 'react'

export default function OrderPage() {
  const { t } = useTranslation()

  // const columns = useMemo()

  return (
    <div>
      <TitleAndActions title={t('purchase.order.title' as TranslationKey)}>
        <TitleAndActionsBody>
          <Button>{t('purchase.order.create.button' as TranslationKey)}</Button>
        </TitleAndActionsBody>
      </TitleAndActions>
    </div>
  )
}
