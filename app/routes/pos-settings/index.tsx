import { redirect } from 'react-router'

export async function loader() {
  throw redirect('/pos-settings/terminals')
}

export default function PosSettingsIndex() {
  return null
}
