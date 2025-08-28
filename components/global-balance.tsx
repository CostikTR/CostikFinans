"use client"

import { useEffect, useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { auth } from "@/lib/firebase"
import { isFirestoreReady, listTransactions, watchTransactions } from "@/lib/db"
import { formatTRY } from "@/lib/utils"

type Txn = { id: string; type: "gelir" | "gider"; amount: number; date: string }

export function GlobalBalance() {
  const [transactions, setTransactions] = useState<Txn[]>([])

  useEffect(() => {
    let unsub: undefined | null | (() => void)
    const u = auth?.currentUser
    if (u?.uid && isFirestoreReady()) {
      unsub = watchTransactions(u.uid, (list: any[]) => {
        setTransactions(list as Txn[])
      }) as unknown as (() => void) | null | undefined
      listTransactions(u.uid).then((list: any[]) => setTransactions(list as Txn[])).catch(() => {})
    } else {
      // local fallback
      try {
        const raw = localStorage.getItem("transactions")
        const arr: Txn[] = raw ? JSON.parse(raw) : []
        setTransactions(arr)
      } catch {
        setTransactions([])
      }
    }
    return () => { if (typeof unsub === "function") unsub() }
  }, [])

  const total = useMemo(() => {
    return transactions.reduce((sum, t) => (t.type === "gelir" ? sum + t.amount : sum - t.amount), 0)
  }, [transactions])

  if (Number.isNaN(total)) return null

  return (
    <div className="fixed top-3 right-4 z-[60] hidden md:flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border rounded-lg px-3 py-1.5 shadow-sm">
      <Wallet className="h-4 w-4 text-primary" />
      <span className="text-xs text-muted-foreground">Bakiye</span>
      <span className="text-sm font-semibold text-foreground">{formatTRY(total)}</span>
    </div>
  )
}
