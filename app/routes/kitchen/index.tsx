import { redirect } from 'react-router'

export async function loader() {
  return redirect('/sucursal')
}

export default function KitchenIndex() {
  return null
}
