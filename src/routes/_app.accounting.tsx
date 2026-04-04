import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/accounting')({
  component: AccountingLayout,
})

function AccountingLayout() {
  return <Outlet />
}
