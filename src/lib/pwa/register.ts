export const PWA_UPDATE_AVAILABLE_EVENT = "vicoba:pwa-update-available"

export async function registerPwaServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) {
    return null
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  })

  const announceUpdate = () => window.dispatchEvent(new CustomEvent(PWA_UPDATE_AVAILABLE_EVENT))
  if (registration.waiting && navigator.serviceWorker.controller) announceUpdate()

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing
    installing?.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) announceUpdate()
    })
  })

  const checkForUpdate = () => void registration.update()
  window.addEventListener("focus", checkForUpdate)
  window.setInterval(checkForUpdate, 60 * 60 * 1000)
  return registration
}

export async function activateWaitingServiceWorker() {
  const registration = await navigator.serviceWorker.getRegistration("/")
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" })
}

export async function clearPrivatePwaCaches() {
  const registration = await navigator.serviceWorker.getRegistration("/")
  registration?.active?.postMessage({ type: "CLEAR_PRIVATE_CACHES" })
}
