import { redirect } from 'react-router'

export async function loader() {
  return redirect('/pos')
}

export default function KitchenIndex() {
  return null
}
