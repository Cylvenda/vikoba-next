export const PWA_SYNC_TAG = "vicoba-pending-actions"

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: { register(tag: string): Promise<void> }
}

/**
 * Registers a future background-sync pass. Business mutations are deliberately
 * not persisted yet; an encrypted, user-scoped queue can be added behind this API.
 */
export async function requestPendingActionSync() {
  if (!("serviceWorker" in navigator)) return false
  const registration = await navigator.serviceWorker.ready as SyncCapableRegistration
  if (!registration.sync) return false
  await registration.sync.register(PWA_SYNC_TAG)
  return true
}
