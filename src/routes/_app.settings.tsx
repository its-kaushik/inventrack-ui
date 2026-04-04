import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings')({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== 'owner') {
      throw redirect({ to: '/' })
    }
  },
  component: SettingsLayout,
})

function SettingsLayout() {
  return <Outlet />
}
