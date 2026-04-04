import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
