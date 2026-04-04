import { toast } from 'sonner'

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  // The VitePWA plugin auto-generates the SW, but we handle the prompt manually
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed but waiting — prompt user
            toast('New version available', {
              description: 'Tap to reload and get the latest updates.',
              action: {
                label: 'Reload',
                onClick: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                },
              },
              duration: Infinity,
            })
          }
        })
      })
    } catch (err) {
      console.warn('SW registration failed:', err)
    }
  })
}
