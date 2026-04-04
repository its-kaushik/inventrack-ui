import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/pos')({
  component: PosLayout,
})

function PosLayout() {
  return (
    <div className="h-dvh flex flex-col bg-background">
      <Outlet />
    </div>
  )
}
