"use client"

import { useEffect, useMemo, useState } from "react"
import { useElementSize } from "@/hooks/use-size"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BalanceChip } from "@/components/balance-chip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AddTransactionDialog, type Transaction, type TransactionType } from "@/components/add-transaction-dialog"
import { Input } from "@/components/ui/input"
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider as UiTooltipProvider, TooltipTrigger as UiTooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTRY, formatTRYCompact, formatDateTR } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { isFirestoreReady, listTransactions, watchTransactions, addTransaction as addTxnDb, upsertTransaction as upsertTxnDb, removeTransaction as removeTxnDb, addNotification, watchNotifications, listNotifications, clearNotifications as clearNotificationsDb, markNotificationRead as markNotificationReadDb, listSubscriptions, upsertSubscription, removeSubscription } from "@/lib/db"
import type { AppNotification } from "@/lib/types"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import { signOut, type User as FirebaseUser } from "firebase/auth"
import { AuthGuard } from "@/components/auth-guard"
import { NotesFloat } from "@/components/notes-float"
import { SubscriptionsDialog } from "@/components/subscriptions-dialog"
import { CalendarFloat } from "@/components/calendar-float"
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  LucidePieChart,
  Settings,
  Bell,
  User,
  Wallet,
  CreditCard,
  BarChart3,
  Home,
  Receipt,
  Target,
  FileText,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts"

type MonthlyDatum = { month: string; gelir: number; gider: number; tasarruf: number }
type ExpenseCategoryDatum = { name: string; value: number; percentage: number; color: string }

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/98 backdrop-blur-md border-2 border-border rounded-lg p-4 shadow-xl">
        <p className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium mb-1" style={{ color: entry.color }}>
            {`${entry.name}: ₺${entry.value.toLocaleString("tr-TR")}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [lastAddedDate, setLastAddedDate] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [unreadNotif, setUnreadNotif] = useState<number>(0)
  const [showNotif, setShowNotif] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [activeChart, setActiveChart] = useState<"area" | "line" | "bar">("area")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<TransactionType>("gelir")
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [desiredPeriodBalance, setDesiredPeriodBalance] = useState<string>("")
  const [desiredAllTimeBalance, setDesiredAllTimeBalance] = useState<string>("")
  const [reconcileOnly, setReconcileOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"hepsi" | TransactionType>("hepsi")
  const [categoryFilter, setCategoryFilter] = useState<string>("hepsi")
  const [mounted, setMounted] = useState(false)
  const [resetDay, setResetDay] = useState<number>(1)
  const [carryover, setCarryover] = useState<boolean>(true)
  useEffect(() => setMounted(true), [])
  const { toast } = useToast()
  // Notifications list + unread count (Firestore or localStorage)
  useEffect(() => {
    const u = auth?.currentUser
    if (u && isFirestoreReady()) {
      const unsub = watchNotifications(u.uid, (list) => {
        setNotifications(list)
        setUnreadNotif(list.filter((n) => !n.read).length)
        // Mirror to localStorage so reloads keep read state in sync
        try { localStorage.setItem("notifications", JSON.stringify(list)) } catch {}
      })
      listNotifications(u.uid).then((list) => {
        if (list.length) {
          setNotifications(list)
          setUnreadNotif(list.filter((n) => !n.read).length)
          try { localStorage.setItem("notifications", JSON.stringify(list)) } catch {}
        }
      })
      return () => { if (unsub) unsub() }
    }
    // Local fallback
    const refresh = () => {
      try {
        const raw = localStorage.getItem("notifications")
        const arr: AppNotification[] = raw ? JSON.parse(raw) : []
        setNotifications(arr)
        setUnreadNotif(arr.filter((n) => !n.read).length)
      } catch {
        setNotifications([])
        setUnreadNotif(0)
      }
    }
    refresh()
    const onStorage = (e: StorageEvent) => { if (e.key === "notifications") refresh() }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const persistLocalNotifications = (arr: AppNotification[]) => {
    try { localStorage.setItem("notifications", JSON.stringify(arr)) } catch {}
  }

  const markAllRead = async () => {
    const u = auth?.currentUser
    if (u && isFirestoreReady()) {
      await Promise.all(notifications.filter((n) => !n.read).map((n) => markNotificationReadDb(u.uid, n.id)))
    }
    const arr = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(arr)
    setUnreadNotif(0)
  // Persist locally in all cases to mirror server and survive reloads
  persistLocalNotifications(arr)
  }
  const clearAllNotif = async () => {
    const u = auth?.currentUser
    if (u && isFirestoreReady()) await clearNotificationsDb(u.uid)
    setNotifications([])
    setUnreadNotif(0)
    if (!u) persistLocalNotifications([])
  }
  const markOneRead = async (id: string) => {
    const u = auth?.currentUser
    if (u && isFirestoreReady()) await markNotificationReadDb(u.uid, id)
    const arr = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    setNotifications(arr)
    setUnreadNotif(arr.filter((n) => !n.read).length)
  // Persist locally in all cases to mirror server and survive reloads
  persistLocalNotifications(arr)
  }
  const cancelSubscriptionFromNotification = async (notif: AppNotification) => {
    const subId = notif?.data?.subscriptionId as string | undefined
    const u = auth?.currentUser
    if (!u?.uid || !subId || !isFirestoreReady()) return
    try {
      await removeSubscription(u.uid, subId)
      await markNotificationReadDb(u.uid, notif.id)
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
      setUnreadNotif((c) => Math.max(0, c - 1))
      toast({ title: "Abonelik iptal edildi", description: "Seçili abonelik kaldırıldı." })
    } catch {}
  }
  // Prefer Firebase Auth UID if available; else create/load a stable device id
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => {
  setCurrentUser(u ?? null)
  if (u?.uid) setUserId(u.uid)
      else {
        try {
          const existing = localStorage.getItem("userId")
          if (existing) setUserId(existing)
          else {
            const id = crypto.randomUUID()
            localStorage.setItem("userId", id)
            setUserId(id)
          }
        } catch {}
      }
    })
    return () => {
      if (typeof unsub === "function") unsub()
    }
  }, [])
  // Measure chart containers to avoid 0x0 ResponsiveContainer
  const [mainChartRef, mainSize] = useElementSize<HTMLDivElement>()
  const [pieChartRef, pieSize] = useElementSize<HTMLDivElement>()

  // Persist active chart selection
  useEffect(() => {
    try {
      const saved = localStorage.getItem("activeChart") as "area" | "line" | "bar" | null
      if (saved === "area" || saved === "line" || saved === "bar") {
        setActiveChart(saved)
      }
    } catch {
      // ignore
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("activeChart", activeChart)
    } catch {
      // ignore
    }
  }, [activeChart])

  // Load and persist
  useEffect(() => {
    // read settings for period
    try {
      const raw = localStorage.getItem("settings")
      if (raw) {
        const s = JSON.parse(raw)
        if (typeof s?.monthResetDay === "number") setResetDay(Math.max(1, Math.min(31, s.monthResetDay)))
        if (typeof s?.carryover !== "undefined") setCarryover(Boolean(s.carryover))
  if (typeof s?.currentPeriodRealBalance === "number") setDesiredPeriodBalance(String(s.currentPeriodRealBalance))
  if (typeof s?.allTimeRealBalance === "number") setDesiredAllTimeBalance(String(s.allTimeRealBalance))
      }
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === "settings" && e.newValue) {
        try {
          const s = JSON.parse(e.newValue)
          if (typeof s?.monthResetDay === "number") setResetDay(Math.max(1, Math.min(31, s.monthResetDay)))
          if (typeof s?.carryover !== "undefined") setCarryover(Boolean(s.carryover))
          if (typeof s?.currentPeriodRealBalance === "number") setDesiredPeriodBalance(String(s.currentPeriodRealBalance))
          if (typeof s?.allTimeRealBalance === "number") setDesiredAllTimeBalance(String(s.allTimeRealBalance))
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Current period based on reset day
  const periodRange = useMemo(() => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), resetDay)
    if (today < start) start.setMonth(start.getMonth() - 1)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    end.setDate(end.getDate() - 1)
    return { start, end }
  }, [resetDay])

  const inRange = (iso: string) => {
    const d = new Date(iso)
    return d >= periodRange.start && d <= periodRange.end
  }

  useEffect(() => {
    if (!userId) return
    const useFs = isFirestoreReady()
    if (useFs && auth?.currentUser?.uid) {
      // Live sync from Firestore
      const unsub = watchTransactions(userId, (list) => {
        setTransactions(list)
        try {
          localStorage.setItem("transactions", JSON.stringify(list))
        } catch {}
      })
      // Also perform an initial list to avoid wait for first snapshot
      listTransactions(userId).then((list) => {
        if (list.length) setTransactions(list)
      })
      return () => {
        if (unsub) unsub()
      }
    }
    // Fallback to localStorage seed
    try {
      const raw = localStorage.getItem("transactions")
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) setTransactions(parsed)
          else throw new Error("invalid")
        } catch {
          localStorage.removeItem("transactions")
        }
      } else {
        const today = new Date()
        const iso = (d: Date) => d.toISOString().slice(0, 10)
        const seed: Transaction[] = [
          { id: crypto.randomUUID(), type: "gelir", amount: 45000, description: "Maaş", category: "Maaş", date: iso(new Date(today.getFullYear(), today.getMonth(), 1)) },
          { id: crypto.randomUUID(), type: "gider", amount: 3200, description: "Market", category: "Yemek", date: iso(new Date()) },
          { id: crypto.randomUUID(), type: "gider", amount: 1200, description: "Elektrik Faturası", category: "Fatura", date: iso(new Date()) },
          { id: crypto.randomUUID(), type: "gelir", amount: 2500, description: "Serbest İş", category: "Serbest", date: iso(new Date(today.getFullYear(), today.getMonth(), Math.max(2, today.getDate() - 7))) },
          { id: crypto.randomUUID(), type: "gider", amount: 450, description: "Ulaşım Kartı", category: "Ulaşım", date: iso(new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 3))) },
        ]
    setTransactions(seed)
    try { localStorage.setItem("transactions", JSON.stringify(seed)) } catch {}
      }
  } catch {}
  }, [userId])

  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions))
    } catch {}
  }, [transactions])

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const totalBalance = useMemo(
    () =>
      transactions.reduce((sum: number, t: Transaction) => (t.type === "gelir" ? sum + t.amount : sum - t.amount), 0),
    [transactions]
  )

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t: Transaction) => t.type === "gelir" && inRange(t.date))
      .reduce((a: number, b: Transaction) => a + b.amount, 0)
  }, [transactions, periodRange])

  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter((t: Transaction) => t.type === "gider" && inRange(t.date))
      .reduce((a: number, b: Transaction) => a + b.amount, 0)
  }, [transactions, periodRange])

  const periodCarryover = useMemo(() => {
    if (!carryover) return 0
    const before = transactions.filter((t) => new Date(t.date) < periodRange.start)
    const inc = before.filter((t) => t.type === "gelir").reduce((a, b) => a + b.amount, 0)
    const exp = before.filter((t) => t.type === "gider").reduce((a, b) => a + b.amount, 0)
    return inc - exp
  }, [transactions, periodRange, carryover])

  const monthlyData: MonthlyDatum[] = useMemo(() => {
    // derive based on transactions only; compute now inside to avoid stale dependency warning
    const nowLocal = new Date()
    const list: MonthlyDatum[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowLocal.getFullYear(), nowLocal.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthName = d.toLocaleDateString("tr-TR", { month: "short" })
      const gelir = transactions
        .filter((t: Transaction) => t.type === "gelir" && t.date.slice(0, 7) === key)
        .reduce((a: number, b: Transaction) => a + b.amount, 0)
      const gider = transactions
        .filter((t: Transaction) => t.type === "gider" && t.date.slice(0, 7) === key)
        .reduce((a: number, b: Transaction) => a + b.amount, 0)
      list.push({ month: monthName, gelir, gider, tasarruf: gelir - gider })
    }
    return list
  }, [transactions])

  const expenseCategories: ExpenseCategoryDatum[] = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter((t: Transaction) => t.type === "gider" && t.date.slice(0, 7) === currentMonthKey)
      .forEach((t: Transaction) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount))
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0)
    const entries = Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }))
    return entries
  }, [transactions, currentMonthKey])

  const recentTransactions = useMemo(() => {
    let list = [...transactions]
    // filters
    if (typeFilter !== "hepsi") list = list.filter((t) => t.type === typeFilter)
    if (categoryFilter !== "hepsi") list = list.filter((t) => t.category === categoryFilter)
    if (reconcileOnly) list = list.filter((t) => t.category === "Eşitleme")
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      )
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20)
  }, [transactions, search, typeFilter, categoryFilter, reconcileOnly])

  const openAddDialog = (type: TransactionType) => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const onAdd = async (t: Transaction) => {
  setLastAddedDate(t.date)
  if (isFirestoreReady() && auth?.currentUser?.uid) {
      const id = await addTxnDb(userId, t)
      if (id) setTransactions((prev: Transaction[]) => [{ ...t, id }, ...prev])
      // Bildirim oluştur
      try {
        const title = t.type === "gelir" ? "Yeni Gelir" : "Yeni Gider"
        const desc = `${t.description} • ${formatTRY(Math.abs(t.amount))}`
        if (auth?.currentUser) {
          await addNotification(userId, { title, description: desc, date: new Date().toISOString(), read: false })
        } else {
          const arr = [{ id: crypto.randomUUID(), title, description: desc, date: new Date().toISOString(), read: false }, ...notifications]
          setNotifications(arr as AppNotification[])
          setUnreadNotif((c) => c + 1)
          persistLocalNotifications(arr as AppNotification[])
        }
        // küçük pop-up (toast)
  // küçük pop-up (toast)
  toast({ title, description: desc })
      } catch {}
      return
    }
    setTransactions((prev: Transaction[]) => [t, ...prev])
    // Local bildirim
    try {
      const title = t.type === "gelir" ? "Yeni Gelir" : "Yeni Gider"
      const desc = `${t.description} • ${formatTRY(Math.abs(t.amount))}`
      const raw = localStorage.getItem("notifications")
      const arr = raw ? (JSON.parse(raw) as any[]) : []
      arr.unshift({ id: crypto.randomUUID(), title, description: desc, date: new Date().toISOString(), read: false })
      localStorage.setItem("notifications", JSON.stringify(arr))
    } catch {}
  }
  const onUpdate = async (t: Transaction) => {
    if (isFirestoreReady() && t.id && auth?.currentUser?.uid) {
      await upsertTxnDb(userId, t)
    }
    setTransactions((prev: Transaction[]) => prev.map((p: Transaction) => (p.id === t.id ? t : p)))
    // Bildirim: işlem güncellendi
    try {
      const title = t.type === "gelir" ? "Gelir Güncellendi" : "Gider Güncellendi"
      const desc = `${t.description} • ${formatTRY(Math.abs(t.amount))}`
      if (auth?.currentUser) {
        await addNotification(userId, { title, description: desc, date: new Date().toISOString(), read: false })
      } else {
        const arr = [{ id: crypto.randomUUID(), title, description: desc, date: new Date().toISOString(), read: false }, ...notifications]
        setNotifications(arr as AppNotification[])
        setUnreadNotif((c) => c + 1)
        persistLocalNotifications(arr as AppNotification[])
      }
  toast({ title, description: desc })
    } catch {}
  }
  const onDelete = async (id: string) => {
    const deleted = transactions.find((x) => x.id === id)
    if (isFirestoreReady() && auth?.currentUser?.uid) {
      await removeTxnDb(userId, id)
    }
    setTransactions((prev: Transaction[]) => prev.filter((p: Transaction) => p.id !== id))
    // Bildirim: işlem silindi
    if (deleted) {
      try {
        const title = deleted.type === "gelir" ? "Gelir Silindi" : "Gider Silindi"
        const desc = `${deleted.description} • ${formatTRY(Math.abs(deleted.amount))}`
        if (auth?.currentUser) {
          await addNotification(userId, { title, description: desc, date: new Date().toISOString(), read: false })
        } else {
          const arr = JSON.parse(localStorage.getItem("notifications") || "[]")
          arr.unshift({ id: crypto.randomUUID(), title, description: desc, date: new Date().toISOString(), read: false })
          localStorage.setItem("notifications", JSON.stringify(arr))
        }
      } catch {}
    }
  }

  // Gider eşik uyarısı (settings.locale/currency zaten utils’te okunuyor)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("settings")
      if (!raw) return
      const s = JSON.parse(raw)
      const threshold = Number(s?.expenseAlertThreshold)
      if (!threshold || isNaN(threshold)) return
      if (monthlyExpenses > threshold) {
        const title = "Aylık gider eşiği aşıldı"
        const desc = `Bu ay: ${formatTRY(monthlyExpenses)} (> ${formatTRY(threshold)})`
        if (auth?.currentUser) {
          addNotification(userId, { title, description: desc, date: new Date().toISOString(), read: false })
        } else {
          const arr = [{ id: crypto.randomUUID(), title, description: desc, date: new Date().toISOString(), read: false }, ...notifications]
          setNotifications(arr as AppNotification[])
          setUnreadNotif((c) => c + 1)
          persistLocalNotifications(arr as AppNotification[])
        }
    toast({ title, description: desc })
      }
    } catch {}
  }, [monthlyExpenses, userId])

  // Force Recharts to recalc sizes after mount or chart switch
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 50)
    return () => window.clearTimeout(id)
  }, [activeChart])

  // Also trigger once when first mounted to avoid stuck placeholders
  useEffect(() => {
    if (!mounted) return
    const t1 = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 50)
    const t2 = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 250)
    const t3 = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 750)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [mounted])

  // Recharts tick formatter helpers to avoid inline TS annotations inside JSX
  const yTick = (value: number) => formatTRYCompact(value)
  const pieLabel = (props: any) => {
    const name = typeof props?.name === "string" ? props.name : String(props?.name ?? "")
    const pct = typeof props?.percent === "number" ? Math.round(props.percent * 100) : 0
    return pct > 0 ? `${name} %${pct}` : name
  }
  const pieFormatter = (value: number, name: string) => [formatTRY(value), name]

  // Process subscriptions: create expense on due date, send reminder on cancellationReminderDate
  useEffect(() => {
    const run = async () => {
      if (!auth?.currentUser?.uid || !isFirestoreReady()) return
      try {
        const subs = await listSubscriptions(auth.currentUser.uid)
        if (!Array.isArray(subs) || subs.length === 0) return
        const today = new Date()
        for (const sub of subs) {
          // Next billing: if due or past, add an expense and bump to next month
          if (sub.nextBillingDate) {
            const due = new Date(sub.nextBillingDate)
            // normalize to date-only compare
            const d0 = new Date(due.getFullYear(), due.getMonth(), due.getDate())
            const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            if (d0 <= t0) {
              const txn = {
                id: crypto.randomUUID(),
                type: "gider" as const,
                amount: Number(sub.price) || 0,
                description: `${sub.name} Abonelik`,
                category: "Abonelik",
                date: t0.toISOString().slice(0, 10),
              }
              await onAdd(txn as any)
              // bump next billing by one month
              const next = new Date(t0)
              next.setMonth(next.getMonth() + 1)
              await upsertSubscription(auth.currentUser.uid, { id: sub.id, name: sub.name, price: sub.price, nextBillingDate: next.toISOString(), cancellationReminderDate: sub.cancellationReminderDate })
            }
          }
          // Cancellation reminder
          if (sub.cancellationReminderDate) {
            const remind = new Date(sub.cancellationReminderDate)
            const r0 = new Date(remind.getFullYear(), remind.getMonth(), remind.getDate())
            const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            if (r0 <= t0) {
              await addNotification(auth.currentUser.uid, {
                title: "Abonelik İptal Hatırlatıcı",
                description: `${sub.name} aboneliğini iptal etmek istiyor musunuz?`,
                date: new Date().toISOString(),
                read: false,
                data: { subscriptionId: sub.id },
              })
              // Clear reminder after notifying (avoid daily spam)
              await upsertSubscription(auth.currentUser.uid, { id: sub.id, name: sub.name, price: sub.price, nextBillingDate: sub.nextBillingDate, cancellationReminderDate: undefined })
            }
          }
        }
      } catch {}
    }
    run()
    // also run once per day approx when tab regains focus
    const onFocus = () => run()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [userId])

  const renderMainChart = () => {
    if (activeChart === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gelirGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="giderGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="tasarrufGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} />
          <YAxis tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} tickFormatter={yTick} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="gelir" stroke="#16a34a" fillOpacity={1} fill="url(#gelirGradient)" strokeWidth={3} name="Gelir" />
          <Area type="monotone" dataKey="gider" stroke="#dc2626" fillOpacity={1} fill="url(#giderGradient)" strokeWidth={3} name="Gider" />
          <Area type="monotone" dataKey="tasarruf" stroke="hsl(var(--chart-3))" fillOpacity={1} fill="url(#tasarrufGradient)" strokeWidth={3} name="Tasarruf" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
    if (activeChart === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
  <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} />
          <YAxis tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} tickFormatter={yTick} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="gelir" stroke="#16a34a" strokeWidth={4} dot={{ fill: "#16a34a", strokeWidth: 3, r: 5 }} activeDot={{ r: 7, stroke: "#16a34a", strokeWidth: 3, fill: "#ffffff" }} name="Gelir" />
          <Line type="monotone" dataKey="gider" stroke="#dc2626" strokeWidth={4} dot={{ fill: "#dc2626", strokeWidth: 3, r: 5 }} activeDot={{ r: 7, stroke: "#dc2626", strokeWidth: 3, fill: "#ffffff" }} name="Gider" />
          <Line type="monotone" dataKey="tasarruf" stroke="hsl(var(--chart-3))" strokeWidth={4} dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 3, r: 5 }} activeDot={{ r: 7, stroke: "hsl(var(--chart-3))", strokeWidth: 3, fill: "#ffffff" }} name="Tasarruf" />
        </LineChart>
        </ResponsiveContainer>
      )
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
  <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
        <XAxis dataKey="month" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} />
        <YAxis tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }} tickFormatter={yTick} />
  <RechartsTooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="gelir" fill="#16a34a" name="Gelir" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gider" fill="#dc2626" name="Gider" radius={[4, 4, 0, 0]} />
        <Bar dataKey="tasarruf" fill="hsl(var(--chart-3))" name="Tasarruf" radius={[4, 4, 0, 0]} />
  </BarChart>
  </ResponsiveContainer>
    )
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-background">
  {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">FinansPanel</h1>
              </div>

              <nav className="hidden md:flex items-center space-x-6">
                <Button variant="ghost" className="text-primary font-medium">
                  <Home className="h-4 w-4 mr-2" />
                  Panel
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Receipt className="h-4 w-4 mr-2" />
                  İşlemler
                </Button>
                <Link href="/kartlarim">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Kartlarım
                  </Button>
                </Link>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Target className="h-4 w-4 mr-2" />
                  Bütçeler
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <BalanceChip />

              <ThemeToggle />
              <div className="relative" onKeyDown={(e) => { if (e.key === 'Escape') setShowNotif(false) }}>
                <Button variant="ghost" size="icon" className="relative group" aria-label="Bildirimler"
                  onClick={() => setShowNotif((v: boolean) => !v)}>
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full p-0 text-xs bg-primary text-primary-foreground flex items-center justify-center">
                    {unreadNotif}
                  </Badge>
                </Button>
                {showNotif && (
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                )}
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-lg border border-border/60 bg-card/95 backdrop-blur p-2 shadow-xl z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm font-semibold">Bildirimler</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={markAllRead} disabled={unreadNotif === 0}>Okundu</Button>
                        <Button size="sm" variant="ghost" onClick={clearAllNotif}>Temizle</Button>
                      </div>
                    </div>
                    <div className="divide-y divide-border/50">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Bildirim yok</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="py-2 px-2 flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-2 ${n.read ? 'bg-muted' : 'bg-primary'}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-foreground">{n.title}</div>
                              {n.description && <div className="text-xs text-muted-foreground">{n.description}</div>}
                              <div className="text-[10px] text-muted-foreground">{new Date(n.date).toLocaleString('tr-TR')}</div>
                            </div>
                            {!n.read && n.title === "Abonelik İptal Hatırlatıcı" && n.data?.subscriptionId ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="destructive" onClick={() => cancelSubscriptionFromNotification(n)}>
                                  İptal edildi
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => markOneRead(n.id)}>Okundu</Button>
                              </div>
                            ) : (
                              !n.read && (
                                <Button size="sm" variant="outline" onClick={() => markOneRead(n.id)}>Okundu</Button>
                              )
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="icon" aria-label="Ayarlar">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Not Defteri" onClick={() => setNotesOpen((v) => !v)}>
                <FileText className="h-5 w-5" />
              </Button>
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-sm text-muted-foreground max-w-[12rem] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={currentUser.photoURL || "/placeholder-user.png"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="outline" onClick={() => auth && signOut(auth)}>Çıkış</Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="font-medium">Giriş Yap</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
  {/* Özet Kartları */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Bakiye</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-foreground">{formatTRY(totalBalance)}</div>
                <Popover open={reconcileOpen} onOpenChange={setReconcileOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">Eşitle</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 space-y-3">
                    <div className="space-y-2">
                      <Label>Bu Dönem Gerçek Bakiye (₺)</Label>
                      <Input value={desiredPeriodBalance} onChange={(e) => setDesiredPeriodBalance((e.target as HTMLInputElement).value)} inputMode="decimal" type="number" />
                      <Button size="sm" onClick={async () => {
                        const val = desiredPeriodBalance === "" ? undefined : Number(desiredPeriodBalance)
                        try {
                          const raw = localStorage.getItem("settings")
                          const s = raw ? JSON.parse(raw) : {}
                          s.currentPeriodRealBalance = val
                          localStorage.setItem("settings", JSON.stringify(s))
                        } catch {}
                      }}>Kaydet</Button>
                      <Button size="sm" variant="secondary" onClick={async () => {
                        // Eşitle sadece bu dönem
                        const val = desiredPeriodBalance === "" ? undefined : Number(desiredPeriodBalance)
                        if (typeof val !== "number" || isNaN(val)) return
                        // Teorik dönem bakiyesi (carryover dahil)
                        const before = carryover ? transactions.filter(t => new Date(t.date) < periodRange.start) : []
                        const prevBalance = carryover ? before.filter(t => t.type === 'gelir').reduce((a,b)=>a+b.amount,0) - before.filter(t => t.type === 'gider').reduce((a,b)=>a+b.amount,0) : 0
                        const inThis = transactions.filter(t => new Date(t.date) >= periodRange.start && new Date(t.date) <= periodRange.end)
                        const theoretical = prevBalance + inThis.filter(t => t.type === 'gelir').reduce((a,b)=>a+b.amount,0) - inThis.filter(t => t.type === 'gider').reduce((a,b)=>a+b.amount,0)
                        const delta = val - theoretical
                        if (delta !== 0) {
                          const desc = `${delta > 0 ? 'Bakiye Eşitleme (Bu Ay, Gelir)' : 'Bakiye Eşitleme (Bu Ay, Gider)'} • Teorik: ${formatTRY(theoretical)} • Gerçek: ${formatTRY(val)} • Fark: ${formatTRY(Math.abs(delta))}`
                          const t = { id: crypto.randomUUID(), type: delta > 0 ? 'gelir' : 'gider', amount: Math.abs(delta), description: desc, category: 'Eşitleme', date: new Date().toISOString().slice(0,10) }
                          if (isFirestoreReady() && auth?.currentUser?.uid) {
                            const id = await addTxnDb(userId, t as any)
                            if (id) setTransactions(prev => [{ ...(t as any), id }, ...prev])
                          } else {
                            setTransactions(prev => [t as any, ...prev])
                          }
                        }
                        setReconcileOpen(false)
                      }}>Bu Ayı Eşitle</Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Tüm Zaman Gerçek Bakiye (₺)</Label>
                      <Input value={desiredAllTimeBalance} onChange={(e) => setDesiredAllTimeBalance((e.target as HTMLInputElement).value)} inputMode="decimal" type="number" />
                      <Button size="sm" onClick={async () => {
                        const val = desiredAllTimeBalance === "" ? undefined : Number(desiredAllTimeBalance)
                        try {
                          const raw = localStorage.getItem("settings")
                          const s = raw ? JSON.parse(raw) : {}
                          s.allTimeRealBalance = val
                          localStorage.setItem("settings", JSON.stringify(s))
                        } catch {}
                      }}>Kaydet</Button>
                      <Button size="sm" variant="secondary" onClick={async () => {
                        const val = desiredAllTimeBalance === "" ? undefined : Number(desiredAllTimeBalance)
                        if (typeof val !== "number" || isNaN(val)) return
                        const inc = transactions.filter(t => t.type === 'gelir').reduce((a,b)=>a+b.amount,0)
                        const exp = transactions.filter(t => t.type === 'gider').reduce((a,b)=>a+b.amount,0)
                        const theoretical = inc - exp
                        const delta = val - theoretical
                        if (delta !== 0) {
                          const desc = `${delta > 0 ? 'Bakiye Eşitleme (Tüm Zaman, Gelir)' : 'Bakiye Eşitleme (Tüm Zaman, Gider)'} • Teorik: ${formatTRY(theoretical)} • Gerçek: ${formatTRY(val)} • Fark: ${formatTRY(Math.abs(delta))}`
                          const t = { id: crypto.randomUUID(), type: delta > 0 ? 'gelir' : 'gider', amount: Math.abs(delta), description: desc, category: 'Eşitleme', date: new Date().toISOString().slice(0,10) }
                          if (isFirestoreReady() && auth?.currentUser?.uid) {
                            const id = await addTxnDb(userId, t as any)
                            if (id) setTransactions(prev => [{ ...(t as any), id }, ...prev])
                          } else {
                            setTransactions(prev => [t as any, ...prev])
                          }
                        }
                        setReconcileOpen(false)
                      }}>Tüm Zamanı Eşitle</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <span>Güncel bakiye</span>
              </div>
              {carryover && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <span>(Devreden:</span>
                  <span className={`font-semibold ${periodCarryover >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatTRY(periodCarryover)}</span>
                  <span>)</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Gelir</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatTRY(monthlyIncome)}</div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <span>Bu ayki toplam gelir</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Gider</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatTRY(monthlyExpenses)}</div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <span>Bu ayki toplam gider</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/20 to-chart-3/5 border-chart-3/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasarruf</CardTitle>
              <Target className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatTRY(monthlyIncome - monthlyExpenses)}</div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <span>Bu ayki tasarruf</span>
              </div>
            </CardContent>
          </Card>
        </section>

    {/* Hızlı İşlemler */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button onClick={() => openAddDialog("gelir")} className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700 text-white shadow-lg">
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Gelir Ekle</span>
            </Button>
      <Button onClick={() => openAddDialog("gider")} className="h-20 flex-col space-y-2 bg-red-600 hover:bg-red-700 text-white shadow-lg">
              <Minus className="h-6 w-6" />
              <span className="text-sm font-medium">Gider Ekle</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              onClick={() => setSubscriptionsOpen(true)}
            >
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Abonelikler</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <LucidePieChart className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Takvim</span>
            </Button>
          </div>
        </section>

    {/* Grafikler Bölümü */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 min-w-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Finansal Analiz</span>
                  </CardTitle>
                  <CardDescription>Aylık gelir, gider ve tasarruf analizi</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={activeChart === "area" ? "default" : "outline"}
                    size="sm"
                    aria-pressed={activeChart === "area"}
                    onClick={() => setActiveChart("area")}
                  >
                    Alan
                  </Button>
                  <Button
                    variant={activeChart === "line" ? "default" : "outline"}
                    size="sm"
                    aria-pressed={activeChart === "line"}
                    onClick={() => setActiveChart("line")}
                  >
                    Çizgi
                  </Button>
                  <Button
                    variant={activeChart === "bar" ? "default" : "outline"}
                    size="sm"
                    aria-pressed={activeChart === "bar"}
                    onClick={() => setActiveChart("bar")}
                  >
                    Çubuk
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-w-0">
              <div ref={mainChartRef} className="h-80 w-full min-w-0">
                {mounted ? (
                  renderMainChart()
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Grafik hazırlanıyor...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LucidePieChart className="h-5 w-5 text-primary" />
                <span>Harcama Dağılımı</span>
              </CardTitle>
              <CardDescription>Kategori bazlı gider analizi</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              <div ref={pieChartRef} className="h-64 w-full min-w-0">
                {mounted ? (
                  expenseCategories.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <LucidePieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Kategori verileri yükleniyor...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={pieLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          stroke="hsl(var(--background))"
                          strokeWidth={3}
                        >
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={pieFormatter}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "2px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                            fontWeight: 500,
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <LucidePieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Grafik hazırlanıyor...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 mt-4">
                {expenseCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Henüz kategori verisi bulunmuyor</p>
                  </div>
                ) : (
                  expenseCategories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/30"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-semibold text-foreground">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{formatTRY(category.value)}</div>
                        <div className="text-xs font-medium text-muted-foreground">%{category.percentage}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

  {/* Son İşlemler */}
        <section>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Son İşlemler</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={reconcileOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReconcileOnly((v) => !v)}
                  >
                    Sadece Eşitleme
                  </Button>
                  <Input
                    placeholder="Ara (açıklama/kategori/tutar)"
                    value={search}
                    onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                    className="h-9 w-40 md:w-64"
                  />
                  <Select value={typeFilter} onValueChange={(v: string) => setTypeFilter(v as "hepsi" | TransactionType)}>
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue placeholder="Tür" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hepsi">Hepsi</SelectItem>
                      <SelectItem value="gelir">Gelir</SelectItem>
                      <SelectItem value="gider">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={(v: string) => setCategoryFilter(v)}>
                    <SelectTrigger className="h-9 w-32">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hepsi">Hepsi</SelectItem>
                      {Array.from(new Set(transactions.map((t: Transaction) => t.category))).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
              <CardDescription>En son yapılan finansal işlemler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg font-medium">Henüz işlem bulunmuyor</p>
                  <p className="text-muted-foreground text-sm mt-2">İlk işleminizi ekleyerek başlayın</p>
                </div>
              ) : (
                recentTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const isAdj = transaction.category === "Eşitleme"
                        const baseClass = isAdj
                          ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                          : transaction.type === "gelir"
                            ? "bg-green-500/20 text-green-600 border-green-500/30"
                            : "bg-red-500/20 text-red-600 border-red-500/30"
                        const calcText = isAdj ? transaction.description : ""
                        const icon = isAdj ? <Target className="h-5 w-5" /> : (transaction.type === "gelir" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />)
                        return isAdj ? (
                          <UiTooltipProvider>
                            <UiTooltip>
                              <UiTooltipTrigger asChild>
                                <div className={`p-3 rounded-full border-2 ${baseClass}`}>{icon}</div>
                              </UiTooltipTrigger>
                              <UiTooltipContent>
                                <div className="max-w-xs whitespace-pre-line text-xs">{calcText}</div>
                              </UiTooltipContent>
                            </UiTooltip>
                          </UiTooltipProvider>
                        ) : (
                          <div className={`p-3 rounded-full border-2 ${baseClass}`}>{icon}</div>
                        )
                      })()}
                      <div>
                        <p className="font-semibold text-sm text-foreground">{transaction.description}</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-muted-foreground font-medium">{formatDateTR(transaction.date)}</p>
                          {(() => {
                            const isAdj = transaction.category === "Eşitleme"
                            const cls = isAdj
                              ? "bg-blue-500/20 text-blue-700 border-blue-500/30"
                              : transaction.type === "gelir"
                                ? "bg-green-500/20 text-green-700 border-green-500/30"
                                : "bg-red-500/20 text-red-700 border-red-500/30"
                            const calcText = isAdj ? transaction.description : ""
                            return isAdj ? (
                              <UiTooltipProvider>
                                <UiTooltip>
                                  <UiTooltipTrigger asChild>
                                    <Badge variant="secondary" className={`text-xs font-medium ${cls}`}>{transaction.category}</Badge>
                                  </UiTooltipTrigger>
                                  <UiTooltipContent>
                                    <div className="max-w-xs whitespace-pre-line text-xs">{calcText}</div>
                                  </UiTooltipContent>
                                </UiTooltip>
                              </UiTooltipProvider>
                            ) : (
                              <Badge variant="secondary" className={`text-xs font-medium ${cls}`}>{transaction.category}</Badge>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`font-bold text-base ${
                          transaction.type === "gelir" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.type === "gelir" ? "+" : "-"}
                        {formatTRY(Math.abs(transaction.amount))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(transaction)
                          setDialogType(transaction.type)
                          setDialogOpen(true)
                        }}
                      >
                        Düzenle
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(transaction.id)}>
                        Sil
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) setEditing(null)
          setDialogOpen(v)
        }}
        onAdd={(t: Transaction) => {
          onAdd(t)
          setEditing(null)
        }}
        onUpdate={(t: Transaction) => {
          onUpdate(t)
          setEditing(null)
        }}
        editing={editing}
        defaultType={dialogType}
      />
  <SubscriptionsDialog open={subscriptionsOpen} onOpenChange={setSubscriptionsOpen} />
  <NotesFloat open={notesOpen} onClose={() => setNotesOpen(false)} />
  <CalendarFloat open={calendarOpen} onClose={() => setCalendarOpen(false)} highlightDate={lastAddedDate || undefined} />
  </div>
  </AuthGuard>
  )
}
