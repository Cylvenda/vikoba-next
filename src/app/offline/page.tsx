"use client"

import { useEffect, useState } from "react"
import { RefreshCcw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OfflinePage() {
  const [online, setOnline] = useState(() => typeof navigator !== "undefined" && navigator.onLine)

  useEffect(() => {
    const reconnect = () => {
      setOnline(true)
      window.location.reload()
    }
    const disconnect = () => setOnline(false)
    window.addEventListener("online", reconnect)
    window.addEventListener("offline", disconnect)
    return () => {
      window.removeEventListener("online", reconnect)
      window.removeEventListener("offline", disconnect)
    }
  }, [])

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-lg overflow-hidden border-border/80 bg-card shadow-xl">
        <CardContent className="p-6 text-center sm:p-10">
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-chart-3/10 text-chart-3">
            {online ? <Wifi className="size-11" /> : <WifiOff className="size-11" />}
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-chart-3">VICOBA Community Hub</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">No Internet Connection</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            Previously visited pages and saved assets may still be available. Check your connection and try again; this page reconnects automatically.
          </p>
          <Button className="mt-7 w-full gap-2 sm:w-auto" onClick={() => window.location.reload()}>
            <RefreshCcw className="size-4" />
            {online ? "Continue" : "Retry connection"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
