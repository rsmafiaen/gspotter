const ADMIN_AUTH_STORAGE_KEY = 'g-spotter:admin-authenticated'
const ADMIN_PASSWORD = 'guinness'

export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function signInAdmin(password: string) {
  if (password !== ADMIN_PASSWORD) return false

  try {
    window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true')
  } catch {
    // Authentication still succeeds for this page view if storage is blocked.
  }

  return true
}

export function signOutAdmin() {
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
