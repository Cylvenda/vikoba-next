"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Download, RefreshCcw, Share2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { activateWaitingServiceWorker, PWA_UPDATE_AVAILABLE_EVENT, registerPwaServiceWorker } from "@/lib/pwa/register"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
}

export default function PwaManager() {
  const pathname = usePathname()
  const canShowInstallExperience = pathname === "/" || pathname === "/guide"
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(() => {
    if (typeof navigator === "undefined" || typeof window === "undefined") return false
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
      && !isStandalone()
      && localStorage.getItem("vicoba-ios-install-dismissed") !== "1"
  })
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  const updatingRef = useRef(false)

  useEffect(() => {
    void registerPwaServiceWorker().catch((error) => console.error("PWA registration failed:", error))

    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setShowInstall(!isStandalone())
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setShowInstall(false)
      setShowIosHelp(false)
    }
    const onUpdate = () => setUpdateAvailable(true)
    const onControllerChange = () => {
      if (updatingRef.current) window.location.reload()
    }

    window.addEventListener("beforeinstallprompt", onInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener(PWA_UPDATE_AVAILABLE_EVENT, onUpdate)
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange)
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener(PWA_UPDATE_AVAILABLE_EVENT, onUpdate)
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === "accepted") setShowInstall(false)
    setInstallEvent(null)
  }

  const update = async () => {
    updatingRef.current = true
    setUpdating(true)
    await activateWaitingServiceWorker()
  }

  const dismissIos = () => {
    localStorage.setItem("vicoba-ios-install-dismissed", "1")
    setShowIosHelp(false)
  }

  const displayInstallPrompt = canShowInstallExperience && showInstall
  const displayIosHelp = canShowInstallExperience && showIosHelp

  if (!displayInstallPrompt && !displayIosHelp && !updateAvailable) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[24rem]">
      {updateAvailable ? (
        <div role="status" className="pointer-events-auto w-full rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
          <p className="font-bold">A new version is available.</p>
          <p className="mt-1 text-sm text-muted-foreground">Update now to use the latest improvements.</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setUpdateAvailable(false)}>Later</Button>
            <Button size="sm" onClick={update} disabled={updating}>
              <RefreshCcw className={`size-4 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      ) : null}

      {displayInstallPrompt ? (
        <div className="pointer-events-auto w-full rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
          <button aria-label="Dismiss install prompt" className="float-right rounded-lg p-1 text-muted-foreground hover:bg-muted" onClick={() => setShowInstall(false)}>
            <X className="size-4" />
          </button>
          <p className="font-bold">Install VICOBA Hub</p>
          <p className="mt-1 text-sm text-muted-foreground">Open the system faster from your home screen or desktop.</p>
          <Button size="sm" className="mt-3 w-full" onClick={install}>
            <Download className="size-4" /> Install app
          </Button>
        </div>
      ) : null}

      {displayIosHelp ? (
        <div className="pointer-events-auto w-full rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
          <button aria-label="Dismiss installation help" className="float-right rounded-lg p-1 text-muted-foreground hover:bg-muted" onClick={dismissIos}>
            <X className="size-4" />
          </button>
          <p className="font-bold">Add VICOBA Hub to your Home Screen</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            Tap <Share2 className="inline size-4" /> Share, then choose “Add to Home Screen”.
          </p>
        </div>
      ) : null}
    </div>
  )
}
