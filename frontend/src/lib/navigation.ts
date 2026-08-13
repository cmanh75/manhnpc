/** Lets code outside the router (axios interceptors, the session-expiry watcher) trigger an SPA navigation. */
let navigate: ((path: string) => void) | null = null

export function setNavigator(fn: (path: string) => void) {
  navigate = fn
}

export function goToLogin() {
  if (navigate) navigate('/login')
  else window.location.href = '/login'
}
