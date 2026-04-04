import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { routeTree } from './routeTree.gen'
import { useAuthStore } from '@/stores/auth.store'
import { restoreSession } from '@/lib/session'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // will be set by InnerApp
  },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuthStore()
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    restoreSession().finally(() => setIsRestoring(false))
  }, [])

  if (isRestoring) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <RouterProvider router={router} context={{ auth, queryClient }} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
