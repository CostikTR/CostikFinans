"use client"

import { useEffect, useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { auth } from "@/lib/firebase"
import { isFirestoreReady, listTransactions, watchTransactions, addTransaction, addNotification, getUserSettings, watchUserSettings } from "@/lib/db"
import { formatTRY, safeJsonParse } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Txn = { id: string; type: "gelir" | "gider"; amount: number; date: string }

export function GlobalBalance() {
  const [transactions, setTransactions] = useState<Txn[]>([])
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState("")
  const [resetDay, setResetDay] = useState<number>(1)

  useEffect(() => {
    let unsub: undefined | null | (() => void)
    const u = auth?.currentUser
    if (u?.uid && isFirestoreReady()) {
      unsub = watchTransactions(u.uid, (list: any[]) => {
        console.log('[GlobalBalance] Firestore update received:', list.length, 'transactions')
        setTransactions(list as Txn[])
      }) as unknown as (() => void) | null | undefined
      listTransactions(u.uid).then((list: any[]) => setTransactions(list as Txn[])).catch(() => {})
      // Load month reset day to align with dashboard period balance
      getUserSettings(u.uid).then((s) => {
        const d = Number((s as any)?.monthResetDay)
        if (Number.isFinite(d) && d >= 1 && d <= 31) setResetDay(d)
      }).catch(() => {})
      const unsubSettings = watchUserSettings(u.uid, (s) => {
        const d = Number((s as any)?.monthResetDay)
        if (Number.isFinite(d) && d >= 1 && d <= 31) setResetDay(d)
      })
      // chain unsubscribe
      const prevUnsub = unsub
      unsub = () => {
        if (typeof prevUnsub === "function") prevUnsub()
        if (typeof unsubSettings === "function") unsubSettings()
      }
    } else {
      // local fallback
      try {
        const raw = localStorage.getItem("transactions")
        const arr: Txn[] = safeJsonParse(raw, []) as any
        setTransactions(arr)
      } catch {
        setTransactions([])
      }
      // Reset day defaults to 1 when logged out
      setResetDay(1)
    }
    
    // Listen for transaction changes event (for immediate UI updates)
    const handleTransactionChange = () => {
      console.log('[GlobalBalance] transactions:changed event received')
      if (u?.uid && isFirestoreReady()) {
        listTransactions(u.uid).then((list: any[]) => {
          console.log('[GlobalBalance] Reloaded transactions:', list.length)
          setTransactions(list as Txn[])
        }).catch(() => {})
      } else {
        try {
          const raw = localStorage.getItem("transactions")
          const arr: Txn[] = safeJsonParse(raw, []) as any
          setTransactions(arr)
        } catch {
          setTransactions([])
        }
      }
    }
    
    window.addEventListener("transactions:changed", handleTransactionChange)
    
    return () => { 
      if (typeof unsub === "function") unsub()
      window.removeEventListener("transactions:changed", handleTransactionChange)
    }
  }, [])

  // Compute period-based balance (aligns with dashboard)
  // Kümülatif bakiye hesaplama - Bugüne kadar olan tüm işlemleri dahil et
  const displayTotal = useMemo(() => {
    if (!Array.isArray(transactions)) return 0
    
    // Ana sayfa ile aynı mantık: Sadece bugüne kadar olan işlemler
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const total = transactions
      .filter(t => {
        const txDate = new Date(t.date)
        return txDate <= todayEnd
      })
      .reduce((sum, t) => (t.type === "gelir" ? sum + t.amount : sum - t.amount), 0)
    
    console.log('[GlobalBalance] Total calculated:', { 
      totalTransactions: transactions.length,
      filteredTransactions: transactions.filter(t => new Date(t.date) <= todayEnd).length,
      total 
    })
    return total
  }, [transactions])

  if (Number.isNaN(displayTotal)) return null

  const handleReconcile = async () => {
    const parseAmount = (raw: string): number => {
      if (!raw) return NaN
      const s = raw.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
      return Number(s)
    }
    const val = parseAmount(target)
    if (!isFinite(val)) return
    
    console.log('[GlobalBalance] Reconcile:', { currentBalance: displayTotal, targetBalance: val })
    
    const delta = val - displayTotal
    if (delta === 0) { setOpen(false); return }
    
    console.log('[GlobalBalance] Creating reconcile transaction:', { delta, type: delta > 0 ? 'gelir' : 'gider', amount: Math.abs(delta) })
    
    const txn: Txn & { description: string; category: string } = {
      id: crypto.randomUUID(),
      type: delta > 0 ? "gelir" : "gider",
      amount: Math.abs(delta),
      date: new Date().toISOString().slice(0,10),
      description: delta > 0 ? "Bakiye Eşitleme (Gelir)" : "Bakiye Eşitleme (Gider)",
      category: "Eşitleme",
    } as any

    const u = auth?.currentUser
    if (u?.uid && isFirestoreReady()) {
      console.log('[GlobalBalance] Adding transaction to Firestore')
      await addTransaction(u.uid, txn as any)
      await addNotification(u.uid, { message: `${txn.description} • ${formatTRY(txn.amount)}`, type: "info", read: false, timestamp: Date.now() })
      // Optimistic local update until snapshot arrives
      setTransactions(prev => [txn as any, ...prev])
      console.log('[GlobalBalance] Transaction added successfully')
      try { window.dispatchEvent(new Event("transactions:changed")) } catch {}
    } else {
      try {
        const raw = localStorage.getItem("transactions")
        const arr: any[] = safeJsonParse(raw, []) as any
        const updated = [txn as any, ...arr]
        localStorage.setItem("transactions", JSON.stringify(updated))
        setTransactions(updated as Txn[])
  // Notify other parts of the app (same tab)
  try { window.dispatchEvent(new Event("transactions:changed")) } catch {}
      } catch {}
    }
    setOpen(false)
    setTarget("")
  }

  return (
    <div className="fixed top-3 right-4 z-[60] hidden md:flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border rounded-lg px-3 py-1.5 shadow-sm">
      <Wallet className="h-4 w-4 text-primary" />
      <span className="text-xs text-muted-foreground">Bakiye</span>
      <span className="text-sm font-semibold text-foreground">{formatTRY(displayTotal)}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">Eşitle</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-2">
            <Label>Cebimdeki Gerçek Para (₺)</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" type="text" />
            <p className="text-[11px] text-muted-foreground">Bu dönem bakiyesini bu tutara ayarlamak için kullanılır. Sistem fark kadar Gelir/Gider (Eşitleme) ekler.</p>
            <Button size="sm" variant="secondary" onClick={handleReconcile}>Eldeki Paraya Eşitle</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
