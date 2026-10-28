/**
 * Central monetisation switch.
 *
 * Keep IS_PREMIUM_MODE_ENABLED = false while the app should be completely
 * free. Change it to true when you are ready to show the freemium paywall
 * after FREE_READING_LIMIT reading tests.
 *
 * Optionally set PRO_UPGRADE_URL to a checkout/payment page. If it is blank,
 * the paywall unlocks Pro on this device in demo mode so the flow can be
 * tested end to end.
 */
export const IS_PREMIUM_MODE_ENABLED = false

export const FREE_READING_LIMIT = 5

export const PRO_UPGRADE_URL = ''

export const PRO_STORAGE_KEY = 'skilltrack:pro:v1'

export const PREMIUM_MODE_STORAGE_KEY = 'skilltrack:premium-mode:v1'

export const isPremiumModeEnabled = () => {
  if (IS_PREMIUM_MODE_ENABLED) return true
  if (typeof window === 'undefined') return false
  try {
    // Optional live switch for preview/testing without editing source code.
    return window.localStorage.getItem(PREMIUM_MODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const getProAccess = () => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(PRO_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const setProAccess = (value = true) => {
  if (typeof window === 'undefined') return
  try {
    if (value) window.localStorage.setItem(PRO_STORAGE_KEY, 'true')
    else window.localStorage.removeItem(PRO_STORAGE_KEY)
  } catch {
    // A storage failure should never stop the app from working.
  }
}

export const countReadingSessions = (sessions = []) =>
  sessions.filter((session) => session && !session.demo).length

export const getReadingAllowance = (sessions = []) => {
  const used = countReadingSessions(sessions)
  const remaining = Math.max(0, FREE_READING_LIMIT - used)
  return {
    used,
    limit: FREE_READING_LIMIT,
    remaining,
    premiumEnabled: isPremiumModeEnabled(),
    locked: isPremiumModeEnabled() && !getProAccess() && used >= FREE_READING_LIMIT,
  }
}
