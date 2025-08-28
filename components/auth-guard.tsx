"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase"

type Props = {
  children: React.ReactNode
}

export function AuthGuard({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => {
      if (!u) {
        // Redirect to login with return path
        const qp = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : ""
        router.replace(`/login${qp}`)
      } else {
        setReady(true)
        // Give layout a tick, then force a resize so charts recalc
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("resize"))
          }
        }, 50)
      }
    })
    return () => {
      if (typeof unsub === "function") unsub()
    }
  }, [router, pathname])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Yükleniyor...
      </div>
    )
  }

  return <>{children}</>
}
