import { useCallback, useEffect, useState } from 'react'

const INSTALLABLE_EVENT = 'skilltrack:installable'
const INSTALLED_EVENT = 'skilltrack:installed'
const UPDATE_CHECK_MS = 60 * 60 * 1000
let pwaInitialized = false

export const installState = {
  prompt: null,
  installed: false,
}

if (typeof window !== 'undefined') {
  installState.installed =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installState.prompt = event
    window.dispatchEvent(new Event(INSTALLABLE_EVENT))
  })

  window.addEventListener('appinstalled', () => {
    installState.prompt = null
    installState.installed = true
    window.dispatchEvent(new Event(INSTALLED_EVENT))
  })
}

export const isStandalone = () => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export const initPwa = () => {
  if (pwaInitialized) return
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  pwaInitialized = true

  let hadController = Boolean(navigator.serviceWorker.controller)
  let reloadWhenHidden = false
  let reloading = false

  const reloadForUpdate = () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  }

  // A new service worker calls skipWaiting() and clients.claim(). Once it takes
  // control, reload on the next hidden moment so an in-progress reading test is
  // not interrupted. The new version is already in the cache at this point.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true
      return
    }
    if (document.visibilityState === 'hidden') {
      reloadForUpdate()
    } else {
      reloadWhenHidden = true
    }
  })

  const register = async () => {
    const base = import.meta.env.BASE_URL || '/'
    try {
      const registration = await navigator.serviceWorker.register(`${base}sw.js`, {
        scope: base,
        updateViaCache: 'none',
      })

      const checkForUpdate = () => {
        registration.update().catch(() => {})
      }

      checkForUpdate()
      window.setInterval(checkForUpdate, UPDATE_CHECK_MS)
      window.addEventListener('online', checkForUpdate)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdate()
        } else if (reloadWhenHidden) {
          reloadForUpdate()
        }
      })
    } catch (error) {
      console.warn('SkillTrack service worker could not be registered.', error)
    }
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(() => Boolean(installState.prompt))
  const [installed, setInstalled] = useState(() => installState.installed || isStandalone())
  const [ios] = useState(() => isIosDevice())

  useEffect(() => {
    const handleInstallable = () => setCanPrompt(Boolean(installState.prompt))
    const handleInstalled = () => {
      setInstalled(true)
      setCanPrompt(false)
    }
    const media = window.matchMedia('(display-mode: standalone)')
    const handleDisplayMode = () => setInstalled(isStandalone())

    window.addEventListener(INSTALLABLE_EVENT, handleInstallable)
    window.addEventListener(INSTALLED_EVENT, handleInstalled)
    if (media.addEventListener) media.addEventListener('change', handleDisplayMode)

    return () => {
      window.removeEventListener(INSTALLABLE_EVENT, handleInstallable)
      window.removeEventListener(INSTALLED_EVENT, handleInstalled)
      if (media.removeEventListener) media.removeEventListener('change', handleDisplayMode)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    const promptEvent = installState.prompt
    if (!promptEvent) return 'unavailable'

    installState.prompt = null
    setCanPrompt(false)

    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      return choice.outcome
    } catch {
      return 'error'
    }
  }, [])

  return { canPrompt, installed, isIos: ios, promptInstall }
}
