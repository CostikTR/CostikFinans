"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Plus,
  Settings,
  Bell,
  User,
  Wallet,
  Home,
  Receipt,
  Target,
  // FileText,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { isFirestoreReady, listCards, upsertCard, removeCard, watchCards, listCardEntries, addCardEntry, computeMinimumPayment, computeMinimumPaymentForBank, listTransactions, watchTransactions } from "@/lib/db"
import type { CardEntry } from "@/lib/types"
import { addTransaction } from "@/lib/db"
import type { BankCard } from "@/lib/types"
import { formatTRY } from "@/lib/utils"
import { BalanceChip } from "@/components/balance-chip"

// Türkiye bankaları için örnek kart verileri (boş template)
const TURKISH_BANKS = [
  { name: "Ziraat Bankası", logo: "/placeholder.svg?height=32&width=32&query=ziraat" },
  { name: "İş Bankası", logo: "/placeholder.svg?height=32&width=32&query=isbank" },
  { name: "Garanti BBVA", logo: "/placeholder.svg?height=32&width=32&query=garanti" },
  { name: "Akbank", logo: "/placeholder.svg?height=32&width=32&query=akbank" },
  { name: "Yapı Kredi", logo: "/placeholder.svg?height=32&width=32&query=yapikredi" },
  { name: "QNB Finansbank", logo: "/placeholder.svg?height=32&width=32&query=qnb" },
  { name: "Halkbank", logo: "/placeholder.svg?height=32&width=32&query=halkbank" },
  { name: "VakıfBank", logo: "/placeholder.svg?height=32&width=32&query=vakifbank" },
  { name: "Enpara", logo: "/placeholder.svg?height=32&width=32&query=enpara" },
] as const

export default function KartlarimPage() {
  const { toast } = useToast()
  // Local YYYY-MM-DD helper to avoid UTC drift from toISOString()
  const todayLocal = () => {
    const dt = new Date()
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }
  const schedulerEnabled = (process.env.NEXT_PUBLIC_ENABLE_LOCAL_TAKSIT_RUNNER ?? "true") !== "false"
  const [userId, setUserId] = useState<string>("")
  const [cards, setCards] = useState<BankCard[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({})
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<Partial<BankCard>>({ bankName: TURKISH_BANKS[0].name, cardNetwork: "visa", status: "active" })
  const [editOpen, setEditOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Partial<BankCard> & { id?: string }>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<BankCard | null>(null)
  const [payCard, setPayCard] = useState<BankCard | null>(null)
  const [plansOpen, setPlansOpen] = useState(false)
  const [plansCard, setPlansCard] = useState<BankCard | null>(null)
  const [entries, setEntries] = useState<CardEntry[]>([])
  type EntryKind = "harcama" | "odeme" | "taksit"
  const [entryForm, setEntryForm] = useState<{ type: EntryKind; amount: string; description: string; date: string; totalPrice?: string; installments?: string }>({ type: "harcama", amount: "", description: "", date: todayLocal() })

  // 'Ödeme Yap' diyalogundaki tutarların güncel olması için payCard'ı cards listesinden canlı olarak eşle.
  const livePayCard = useMemo(() => {
    if (!payCard) return null
    const fresh = cards.find(c => c.id === payCard.id)
    return fresh || payCard
  }, [payCard, cards])

  // Diyalog etiketlerinde güvenilir değerler için türetilmiş durum
  const [payInfo, setPayInfo] = useState<{ min: number; current: number }>({ min: 0, current: 0 })
  useEffect(() => {
    if (livePayCard) {
      const min = computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, livePayCard.currentDebt || 0)
      const current = livePayCard.currentDebt || 0
      setPayInfo({ min, current })
    } else {
      setPayInfo({ min: 0, current: 0 })
    }
  }, [livePayCard, payOpen])

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const addMonthIso = (iso: string) => {
    try {
      const [y, m, d] = iso.split("-").map((x) => Number(x))
      const dt = new Date(y, (m - 1), d)
      dt.setMonth(dt.getMonth() + 1)
      const yyyy = dt.getFullYear(); const mm = String(dt.getMonth() + 1).padStart(2, '0'); const dd = String(dt.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    } catch { return iso }
  }

  const openPlans = (card: BankCard) => {
    setPlansCard(card)
    setPlansOpen(true)
  }

  // Load auth and cards
  useEffect(() => {
    const unsub = auth?.onAuthStateChanged?.((u) => {
      if (u?.uid) setUserId(u.uid)
      else setUserId("")
    })
    return () => { if (typeof unsub === "function") unsub() }
  }, [])

  useEffect(() => {
    if (!userId || !isFirestoreReady()) return
    const unsub = watchCards(userId, (list) => {
      setCards(list)
    })
    return () => { if (typeof unsub === "function") unsub() }
  }, [userId])

  // Paneldeki gibi işlemlerden Toplam Bakiye hesapla (gelir - gider)
  useEffect(() => {
    const u = auth?.currentUser
    let unsub: undefined | null | (() => void)
    if (u?.uid && isFirestoreReady()) {
      unsub = watchTransactions(u.uid, (list: any[]) => setTransactions(list)) as unknown as (() => void) | null | undefined
      listTransactions(u.uid).then((list: any[]) => setTransactions(list)).catch(() => {})
    } else {
      try {
        const raw = localStorage.getItem("transactions")
        setTransactions(raw ? JSON.parse(raw) : [])
      } catch { setTransactions([]) }
    }
    return () => { if (typeof unsub === "function") unsub() }
  }, [userId])

  const totalBalance = (transactions || []).reduce((sum: number, t: any) => (t.type === "gelir" ? sum + t.amount : sum - t.amount), 0)

  // Taksit planlarını kontrol edip vadesi gelenleri ekle
  useEffect(() => {
    const run = async () => {
      if (!userId || !isFirestoreReady() || !schedulerEnabled) return
      const todayIso = todayLocal()
      for (const c of cards) {
        const plans = (c as any).installmentPlans as any[] | undefined
        if (!plans || plans.length === 0) continue
        let changed = false
        let newPlans: any[] = []
        for (const p of plans) {
          if (p.remaining > 0 && p.nextDate && p.nextDate <= todayIso) {
            // Post one installment
            const amt = p.monthlyAmount
            const desc = `${p.description} (Taksit ${p.posted + 1}/${p.posted + p.remaining})`
            // Use plan.nextDate as the entry date to align with statement schedule
            await addCardEntry(userId, c.id, { cardId: c.id, type: "harcama", amount: amt, description: desc, date: p.nextDate, ...(p.id ? { planId: p.id } : {}) } as any)
            const nextDebt = Math.max(0, (c.currentDebt || 0) + amt)
            await upsertCard(userId, { id: c.id, bankName: c.bankName, cardType: c.cardType || "Kredi Kartı", cardNetwork: c.cardNetwork || "visa", creditLimit: Number(c.creditLimit) || 0, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(c.bankName, c.creditLimit || 0, nextDebt), statementDate: c.statementDate ?? null, dueDate: c.dueDate ?? null, status: c.status ?? "active", cardColor: c.cardColor ?? null } as any)
            // Update plan
            const remain = p.remaining - 1
            const posted = (p.posted || 0) + 1
            const nextDate = remain > 0 ? (() => {
              const [y,m,d] = p.nextDate.split('-').map((x: string) => Number(x))
              const dt = new Date(y, m-1, d)
              dt.setMonth(dt.getMonth() + 1)
              const yyyy = dt.getFullYear(); const mm = String(dt.getMonth() + 1).padStart(2, '0'); const dd = String(dt.getDate()).padStart(2, '0')
              return `${yyyy}-${mm}-${dd}`
            })() : null
            const updated = { ...p, remaining: remain, posted, nextDate }
            newPlans.push(updated)
            // optimistic update
            setCards((prev) => prev.map((cc) => cc.id === c.id ? ({ ...cc, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(c.bankName, c.creditLimit || 0, nextDebt), ...( { installmentPlans: newPlans } as any) }) : cc))
            changed = true
          } else {
            newPlans.push(p)
          }
        }
        if (changed) {
          await upsertCard(userId, { id: c.id, bankName: c.bankName, cardType: c.cardType || "Kredi Kartı", cardNetwork: c.cardNetwork || "visa", creditLimit: Number(c.creditLimit) || 0, currentDebt: (cards.find(x=>x.id===c.id)?.currentDebt || c.currentDebt) as number, minimumPayment: computeMinimumPaymentForBank(c.bankName, c.creditLimit || 0, (cards.find(x=>x.id===c.id)?.currentDebt || c.currentDebt) as number), statementDate: c.statementDate ?? null, dueDate: c.dueDate ?? null, status: c.status ?? "active", cardColor: c.cardColor ?? null, ...( { installmentPlans: newPlans } as any) } as any)
        }
      }
    }
    run()
    const onFocus = () => run()
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus) }
  }, [cards, userId, schedulerEnabled])

  const onAddCard = async () => {
    if (!userId || !isFirestoreReady()) {
      toast({ title: "Giriş gerekli", description: "Kart eklemek için giriş yapın." })
      return
    }
    try {
      const bankMeta = TURKISH_BANKS.find(b => b.name === form.bankName)
      const id = await upsertCard(userId, {
        bankName: form.bankName || TURKISH_BANKS[0].name,
        bankLogo: form.bankLogo || bankMeta?.logo || null,
        cardType: form.cardType || "Kredi Kartı",
        cardNetwork: (form.cardNetwork as any) || "visa",
        creditLimit: Number(form.creditLimit) || 0,
        statementDate: form.statementDate || null,
        dueDate: form.dueDate || null,
        status: (form.status as any) || "active",
        cardColor: form.cardColor || null,
      })
      if (id) {
        const list = await listCards(userId)
        setCards(list)
        setAddOpen(false)
        setForm({ bankName: TURKISH_BANKS[0].name, cardNetwork: "visa", status: "active" })
        toast({ title: "Kart eklendi", description: "Kart kaydedildi." })
      }
    } catch (e) {
      toast({ title: "Hata", description: "Kart eklenemedi." })
    }
  }

  const onDeleteCard = async (id: string) => {
    if (!userId || !isFirestoreReady()) return
    const ok = typeof window !== "undefined" ? window.confirm("Bu kartı silmek istediğinize emin misiniz?") : true
    if (!ok) return
    try {
      await removeCard(userId, id)
      toast({ title: "Kart silindi", description: "Kart kaldırıldı." })
    } catch (e) {
      toast({ title: "Hata", description: "Kart silinemedi." })
    }
  }

  const openDetail = async (card: BankCard, initialType: "harcama" | "odeme" = "harcama") => {
    setDetailCard(card)
    setDetailOpen(true)
    setEntryForm((f) => ({ ...f, type: initialType }))
    if (!userId || !isFirestoreReady()) return
    const list = await listCardEntries(userId, card.id)
    setEntries(list)
  }

  const onAddEntry = async () => {
    if (!userId || !detailCard || !isFirestoreReady()) return
    // Yardımcı: yyyy-mm-dd -> ay ekle
    const addMonths = (iso: string, months: number) => {
      const [y, m, d] = iso.split("-").map((x) => Number(x))
      const dt = new Date(y, (m - 1) + months, d)
      const yyyy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, "0")
      const dd = String(dt.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    if (entryForm.type === "taksit") {
      const total = Number(entryForm.totalPrice)
      const n = Number(entryForm.installments)
      if (!total || total <= 0 || !n || n <= 0) return
      const monthly = Math.round((total / n) * 100) / 100
      const current = cards.find(c => c.id === detailCard.id)
      if (!current) return
      // Ekstre gününe hizalanmış ilk post tarihi
      const nextFromStatement = (() => {
        const s = current.statementDate
        const d = Number(String(s || "").replace(/[^0-9]/g, ""))
        const src = entryForm.date
        // Eğer ekstre günü tanımlı değilse, ilk vade tarihi olarak bugün (giriş tarihi) kabul et
        if (!d || isNaN(d)) return src
        const base = new Date(src)
        // sonraki veya aynı ayın 'd' günü
        const y = base.getFullYear()
        const m = base.getMonth()
        const day = d
        const endOfMonth = (yy: number, mm: number) => new Date(yy, mm + 1, 0).getDate()
        const safeDate = (yy: number, mm: number, dd: number) => new Date(yy, mm, Math.min(dd, endOfMonth(yy, mm)))
        const thisMonth = safeDate(y, m, day)
        const target = base <= thisMonth ? safeDate(y, m, day) : safeDate(y, m + 1, day)
        const yyyy = target.getFullYear(); const mm = String(target.getMonth() + 1).padStart(2, "0"); const dd = String(target.getDate()).padStart(2, "0")
        return `${yyyy}-${mm}-${dd}`
      })()
      // Mevcut karta yeni bir plan ekle (birden çok plan desteklenir)
      const existingPlans = ((current as any).installmentPlans as any[]) || []
      const planId = (globalThis.crypto && (crypto as any).randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`
      let plan: any = { id: planId, description: entryForm.description || "Taksit", total, monthlyAmount: monthly, remaining: n, posted: 0, nextDate: nextFromStatement as string, startDate: entryForm.date }
      const todayIso = todayLocal()
      // Alışveriş günü ekstre gününden büyükse ve tarih bugün/eşit ise ilk taksidi hemen işle
      const statementDayNum = Number(String(current.statementDate || "").replace(/[^0-9]/g, ""))
      const baseDayNum = Number(entryForm.date.split("-")[2]) || 0
      const shouldImmediate = !!statementDayNum && baseDayNum > statementDayNum && entryForm.date <= todayIso
      // Eğer ilk post tarihi bugün/geçmişteyse veya 'hemen' kuralı varsa ilk taksidi işle ve planı güncelle
      if (plan.nextDate <= todayIso || shouldImmediate) {
        const amt = plan.monthlyAmount
        // 'Hemen' kuralında giriş tarihi, aksi halde plan.nextDate
        const firstDate = shouldImmediate ? entryForm.date : plan.nextDate
        const desc = `${plan.description} (Taksit 1/${n})`
        const entryId = await addCardEntry(userId, current.id, { cardId: current.id, type: "harcama", amount: amt, description: desc, date: firstDate, planId } as any)
        const nextDebt = Math.max(0, (current.currentDebt || 0) + amt)
        plan = { ...plan, remaining: n - 1, posted: 1, nextDate: n - 1 > 0 ? (() => { const [y,m,d]=firstDate.split('-').map(Number); const dt=new Date(y,m-1,d); dt.setMonth(dt.getMonth()+1); const yyyy=dt.getFullYear(); const mm=String(dt.getMonth()+1).padStart(2,'0'); const dd=String(dt.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}` })() : undefined }
  await upsertCard(userId, { id: current.id, bankName: current.bankName, cardType: current.cardType || "Kredi Kartı", cardNetwork: current.cardNetwork || "visa", creditLimit: Number(current.creditLimit) || 0, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt), statementDate: current.statementDate ?? null, dueDate: current.dueDate ?? null, status: current.status ?? "active", cardColor: current.cardColor ?? null, ...( { installmentPlans: [...existingPlans, plan] } as any) } as any)
  setCards((prev) => prev.map((c) => c.id === current.id ? ({ ...c, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt), ...( { installmentPlans: [...existingPlans, plan] } as any) }) : c))
  // Update detailCard so UI shows new debt immediately
  setDetailCard((prev) => prev && prev.id === current.id ? ({ ...prev, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt) }) as any : prev)
        // Refresh entries list so the first installment appears immediately in the dialog
        try {
          const list = await listCardEntries(userId, current.id)
          setEntries(list)
        } catch {}
      } else {
        await upsertCard(userId, { id: current.id, bankName: current.bankName, cardType: current.cardType || "Kredi Kartı", cardNetwork: current.cardNetwork || "visa", creditLimit: Number(current.creditLimit) || 0, currentDebt: Number(current.currentDebt) || 0, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, Number(current.currentDebt) || 0), statementDate: current.statementDate ?? null, dueDate: current.dueDate ?? null, status: current.status ?? "active", cardColor: current.cardColor ?? null, ...( { installmentPlans: [...existingPlans, plan] } as any) } as any)
        setCards((prev) => prev.map((c) => c.id === current.id ? ({ ...c, ...( { installmentPlans: [...existingPlans, plan] } as any) }) : c))
      }
      setEntryForm({ type: "harcama", amount: "", description: "", date: todayLocal() })
      toast({ title: "Taksit planı kaydedildi", description: `${n} ay, aylık ₺${monthly.toLocaleString("tr-TR")}. İlk taksit ekstre tarihinde eklenecek.` })
      return
    }

    // Normal harcama/ödeme akışı
    const amount = Number(entryForm.amount)
    if (!amount || amount <= 0) return
  const e: Omit<CardEntry, "id"> = { cardId: detailCard.id, type: entryForm.type, amount, description: entryForm.description, date: entryForm.date }
    const id = await addCardEntry(userId, detailCard.id, e)
    if (id) {
      const current = cards.find(c => c.id === detailCard.id)
      if (current) {
        const nextDebt = Math.max(0, (current.currentDebt || 0) + (e.type === "harcama" ? e.amount : -e.amount))
        await upsertCard(userId, { id: current.id, bankName: current.bankName, cardType: current.cardType || "Kredi Kartı", cardNetwork: current.cardNetwork || "visa", creditLimit: Number(current.creditLimit) || 0, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt), statementDate: current.statementDate ?? null, dueDate: current.dueDate ?? null, status: current.status ?? "active", cardColor: current.cardColor ?? null })
        setDetailCard({ ...current, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt) })
        setCards((prev) => prev.map((c) => c.id === current.id ? { ...c, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(current.bankName, current.creditLimit || 0, nextDebt) } : c))
      }
      // Not: 'Ödeme Ekle' (detay formu) ile eklenen ödemeler artık genel işlemlere 'gider' olarak eklenmez.
      const list = await listCardEntries(userId, detailCard.id)
      setEntries(list)
  setEntryForm({ type: "harcama", amount: "", description: "", date: todayLocal() })
      toast({ title: "Eklendi", description: e.type === "harcama" ? "Harcama kaydedildi." : "Ödeme kaydedildi." })
    }
  }

  const openEdit = (card: BankCard) => {
    setEditingCard({
      id: card.id,
      currentDebt: card.currentDebt ?? 0,
      minimumPayment: card.minimumPayment ?? 0,
      statementDate: card.statementDate ?? "",
      dueDate: card.dueDate ?? "",
      status: card.status ?? "active",
      cardColor: card.cardColor ?? "",
    })
    setEditOpen(true)
  }

  const onSaveEdit = async () => {
    if (!userId || !isFirestoreReady() || !editingCard?.id) return
    try {
      const base = cards.find(c => c.id === editingCard.id)
      if (!base) return
      await upsertCard(userId, {
        id: editingCard.id,
        bankName: base.bankName,
        cardType: base.cardType || "Kredi Kartı",
        cardNetwork: base.cardNetwork || "visa",
        creditLimit: Number(base.creditLimit) || 0,
        currentDebt: Number(editingCard.currentDebt) || 0,
        minimumPayment: computeMinimumPaymentForBank(base.bankName, base.creditLimit || 0, Number(editingCard.currentDebt) || 0),
        statementDate: editingCard.statementDate ?? null,
        dueDate: editingCard.dueDate ?? null,
        status: (editingCard.status as any) ?? "active",
        cardColor: editingCard.cardColor ?? null,
      })
      setEditOpen(false)
      setEditingCard({})
      toast({ title: "Kaydedildi", description: "Kart ayarları güncellendi." })
    } catch (e) {
      toast({ title: "Hata", description: "Kart ayarları kaydedilemedi." })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header - Ana sayfa ile benzer */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">FinansPanel</h1>
                </div>

                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="/">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      <Home className="h-4 w-4 mr-2" />
                      Panel
                    </Button>
                  </Link>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Receipt className="h-4 w-4 mr-2" />
                    İşlemler
                  </Button>
                  <Link href="/kartlarim">
                    <Button variant="ghost" className="text-primary font-medium">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Kartlarım
                    </Button>
                  </Link>
                  {/* Abonelikler kaldırıldı */}
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Target className="h-4 w-4 mr-2" />
                    Bütçeler
                  </Button>
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                <BalanceChip />

                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground">
                    0
                  </Badge>
                </Button>
                <Link href="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-user.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Sayfa Başlığı ve Kart Ekleme */}
          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Kartlarım</h2>
              <p className="text-muted-foreground mt-2">Kredi kartlarınızı yönetin ve takip edin</p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kart Ekle
            </Button>
          </section>

          {/* Kart Özeti */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kart Sayısı</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{cards.length}</div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                  <span>Aktif kartlar</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Limit</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  ₺{cards.reduce((total: number, card: BankCard) => total + (card.creditLimit || 0), 0).toLocaleString("tr-TR")}
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                  <span>Toplam limit</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Kartlar</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {cards.length}
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                  <span>Kayıtlı kart sayısı</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Kartlar Listesi */}
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-6">Kredi Kartlarım</h3>

            {cards.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="text-center py-16">
                  <CreditCard className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Henüz kart eklenmemiş</h3>
                  <p className="text-muted-foreground mb-6">İlk kredi kartınızı ekleyerek başlayın</p>
                  <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Kartımı Ekle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cards.map((card) => (
                  <Card key={card.id} className="border-border/50 overflow-hidden">
                    {/* Kart Görsel Temsili */}
                    <div
                      className={`h-48 p-6 text-white relative overflow-hidden ${card.cardColor || "bg-gradient-to-br from-blue-600 to-blue-800"}`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={card.bankLogo || "/placeholder.svg?height=32&width=32&query=bank+logo"}
                              alt={card.bankName}
                              className="h-8 w-8 bg-white rounded"
                            />
                            <span className="font-semibold text-sm">{card.bankName}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => toggleCardVisibility(card.id)}
                          >
                            {visibleCards[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>

                        {/* Kart numarası ve sahibi kullanılmıyor, gizleme ikonu kaldırıldı */}

                        <div className="flex items-center justify-between">
                          <span className="text-xs opacity-80">{card.cardType}</span>
                          <img src={card.cardNetwork === "visa" ? "/placeholder.svg?height=24&width=40&query=visa+logo" : "/placeholder.svg?height=24&width=40&query=mastercard+logo"} alt="network" className="h-6" />
                        </div>
                      </div>
                    </div>

                    {/* Kart Detayları */}
                    <CardContent className="p-6 space-y-4">
                      {/* Limit Bilgisi */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Kredi Limiti</p>
                          <p className="text-lg font-bold text-foreground">
                            ₺{card.creditLimit?.toLocaleString("tr-TR") || "0"}
                          </p>
                        </div>
                      </div>

                      {/* Kullanım Oranı */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground font-medium">Kullanım Oranı</p>
                          <p className="text-xs font-semibold text-foreground">
                            %{card.creditLimit ? Math.round(((card.currentDebt || 0) / (card.creditLimit || 1)) * 100) : 0}
                          </p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (card.currentDebt || 0) / (card.creditLimit || 1) > 0.8
                                ? "bg-red-500"
                                : (card.currentDebt || 0) / (card.creditLimit || 1) > 0.6
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${card.creditLimit ? Math.min(((card.currentDebt || 0) / card.creditLimit) * 100, 100) : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Ekstre Bilgileri */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Ekstre Tarihi</p>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">
                              {card.statementDate || "Belirtilmemiş"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Son Ödeme Tarihi</p>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">{card.dueDate || "Belirtilmemiş"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Taksitler Özeti */}
                      {(() => {
                        const plans = Array.isArray((card as any).installmentPlans) ? (card as any).installmentPlans as any[] : []
                        const active = plans.filter((p: any) => (p?.remaining || 0) > 0)
                        if (active.length === 0) return null
                        const totalRemaining = active.reduce((sum: number, p: any) => sum + (Number(p.remaining) || 0), 0)
                        const nextDates = active.map((p: any) => p.nextDate).filter((x: any) => !!x) as string[]
                        const nearest = nextDates.length ? nextDates.sort()[0] : null
                        return (
                          <div className="mt-3 p-3 rounded-md border border-border/60 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">Taksit</Badge>
                                <span className="text-sm text-foreground font-medium">Kalan: {totalRemaining}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>Sonraki: {nearest || "-"}</span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => openPlans(card)}>Planları Gör</Button>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Asgari ödeme ve mevcut borç kaldırıldı */}

                      {/* Hızlı İşlemler */}
                      <div className="flex space-x-2 pt-4">
                        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => openDetail(card, "odeme")}>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Ödeme Ekle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPayCard(card); setPayOpen(true) }}
                          className="flex-1 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 bg-transparent"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Ödeme Yap
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openPlans(card)}
                          className="flex-1"
                        >
                          Taksit Planları
                        </Button>
                      </div>

                      {/* Kart Durumu */}
                      <div className="flex items-center justify-between pt-2">
                        <Badge
                          variant={card.status === "active" ? "default" : "secondary"}
                          className={`$
                            {card.status === "active"
                              ? "bg-green-500/20 text-green-700 border-green-500/30"
                              : "bg-gray-500/20 text-gray-700 border-gray-500/30"}
                          `}
                        >
                          {card.status === "active" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pasif
                            </>
                          )}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => openEdit(card)}>
                          <Settings className="h-4 w-4 mr-1" />
                          Ayarlar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeleteCard(card.id)}>
                          Sil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Taksit Planları Dialog */}
        <Dialog open={plansOpen} onOpenChange={setPlansOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{plansCard ? `${plansCard.bankName} • Taksit Planları` : 'Taksit Planları'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {plansCard ? (() => {
                const plans = ((plansCard as any).installmentPlans as any[]) || []
                if (!plans.length) return <div className="text-sm text-muted-foreground">Bu kart için kayıtlı taksit planı yok.</div>
                return (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {plans.map((p: any) => (
                      <div key={p.id} className="border rounded-md p-3 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground">{p.description || 'Taksit'}</div>
                          <div className="text-xs text-muted-foreground">Aylık: ₺{Number(p.monthlyAmount || 0).toLocaleString('tr-TR')} • Kalan: {p.remaining || 0} • İşlenen: {p.posted || 0}</div>
                          <div className="text-xs text-muted-foreground">Sonraki vade: {p.nextDate || '-'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={async () => {
                            if (!userId || !isFirestoreReady() || !plansCard) return
                            const card = plansCard
                            if (!p.nextDate || (p.remaining || 0) <= 0) return
                            const desc = `${p.description || 'Taksit'} (Taksit ${(p.posted || 0) + 1}/${(p.posted || 0) + (p.remaining || 0)})`
                            const amt = Number(p.monthlyAmount || 0)
                            await addCardEntry(userId, card.id, { cardId: card.id, type: 'harcama', amount: amt, description: desc, date: p.nextDate, planId: p.id } as any)
                            const nextDebt = Math.max(0, (card.currentDebt || 0) + amt)
                            const remain = Math.max(0, Number(p.remaining || 0) - 1)
                            const posted = Number(p.posted || 0) + 1
                            const nextDate = remain > 0 ? addMonthIso(p.nextDate) : null
                            const newPlans = (plans as any[]).map(x => x.id === p.id ? { ...x, remaining: remain, posted, nextDate } : x)
                            await upsertCard(userId, { id: card.id, bankName: card.bankName, cardType: card.cardType || 'Kredi Kartı', cardNetwork: card.cardNetwork || 'visa', creditLimit: Number(card.creditLimit) || 0, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(card.bankName, card.creditLimit || 0, nextDebt), statementDate: card.statementDate ?? null, dueDate: card.dueDate ?? null, status: card.status ?? 'active', cardColor: card.cardColor ?? null, ...( { installmentPlans: newPlans } as any) } as any)
                            setCards(prev => prev.map(c => c.id === card.id ? ({ ...c, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(card.bankName, card.creditLimit || 0, nextDebt), ...( { installmentPlans: newPlans } as any) }) : c))
                            setPlansCard(prev => prev ? ({ ...prev, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(prev.bankName, prev.creditLimit || 0, nextDebt), ...( { installmentPlans: newPlans } as any) }) as any : prev)
                            toast({ title: 'Taksit işlendi', description: 'Bir taksit el ile işlendi.' })
                          }}>Bir Taksit İşle</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!userId || !isFirestoreReady() || !plansCard) return
                            const ok = typeof window !== 'undefined' ? window.confirm('Bu taksit planını iptal etmek istediğinize emin misiniz?') : true
                            if (!ok) return
                            const card = plansCard
                            const newPlans = (plans as any[]).filter(x => x.id !== p.id)
                            await upsertCard(userId, { id: card.id, bankName: card.bankName, cardType: card.cardType || 'Kredi Kartı', cardNetwork: card.cardNetwork || 'visa', creditLimit: Number(card.creditLimit) || 0, currentDebt: Number(card.currentDebt) || 0, minimumPayment: computeMinimumPaymentForBank(card.bankName, card.creditLimit || 0, Number(card.currentDebt) || 0), statementDate: card.statementDate ?? null, dueDate: card.dueDate ?? null, status: card.status ?? 'active', cardColor: card.cardColor ?? null, ...( { installmentPlans: newPlans } as any) } as any)
                            setCards(prev => prev.map(c => c.id === card.id ? ({ ...c, ...( { installmentPlans: newPlans } as any) }) : c))
                            setPlansCard(prev => prev ? ({ ...prev, ...( { installmentPlans: newPlans } as any) }) as any : prev)
                            toast({ title: 'Plan iptal edildi', description: 'Taksit planı kaldırıldı.' })
                          }}>Planı İptal Et</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })() : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlansOpen(false)}>Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Card Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kart</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banka</Label>
                <Select value={form.bankName} onValueChange={(v: string) => setForm((f) => ({ ...f, bankName: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Banka" />
                  </SelectTrigger>
                  <SelectContent>
                    {TURKISH_BANKS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kart Ağı</Label>
                <Select value={form.cardNetwork || "visa"} onValueChange={(v: string) => setForm((f) => ({ ...f, cardNetwork: v as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ağ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kredi Limiti (₺)</Label>
                <Input inputMode="decimal" type="number" value={form.creditLimit as any || ""} onChange={(e) => setForm((f) => ({ ...f, creditLimit: (e.target as HTMLInputElement).value as any }))} />
              </div>
              <div className="space-y-2">
                <Label>Ekstre Tarihi</Label>
                <Input value={form.statementDate || ""} onChange={(e) => setForm((f) => ({ ...f, statementDate: (e.target as HTMLInputElement).value }))} />
              </div>
              <div className="space-y-2">
                <Label>Son Ödeme Tarihi</Label>
                <Input value={form.dueDate || ""} onChange={(e) => setForm((f) => ({ ...f, dueDate: (e.target as HTMLInputElement).value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Kart Rengi</Label>
                <div className="grid grid-cols-5 gap-2">
                  {["bg-gradient-to-br from-blue-600 to-blue-800","bg-gradient-to-br from-red-600 to-red-800","bg-gradient-to-br from-green-600 to-green-800","bg-gradient-to-br from-purple-600 to-purple-800","bg-gradient-to-br from-orange-600 to-orange-800","bg-gradient-to-br from-slate-600 to-slate-800","bg-gradient-to-br from-emerald-600 to-emerald-800","bg-gradient-to-br from-cyan-600 to-cyan-800","bg-gradient-to-br from-pink-600 to-pink-800","bg-gradient-to-br from-indigo-600 to-indigo-800"].map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, cardColor: c }))} className={`h-8 rounded ${c} border ${form.cardColor === c ? "ring-2 ring-primary" : ""}`} aria-label={c} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Vazgeç</Button>
              <Button onClick={onAddCard}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    {/* Card Detail Dialog - Asgari ödeme butonu kaldırıldı */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
      <DialogTitle>{detailCard ? (entryForm.type === "odeme" ? `${detailCard.bankName} • Ödeme Ekle` : `${detailCard.bankName} Kartı`) : "Kart Detayı"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Güncel Borç</p>
                  <p className="text-lg font-bold text-red-600">₺{(detailCard?.currentDebt || 0).toLocaleString("tr-TR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Asgari Ödeme (otomatik)</p>
                  <p className="text-lg font-bold text-orange-600">₺{computeMinimumPaymentForBank(detailCard?.bankName, detailCard?.creditLimit || 0, detailCard?.currentDebt || 0).toLocaleString("tr-TR")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-1">
                  <Label>Tür</Label>
                  <Select value={entryForm.type} onValueChange={(v: EntryKind) => setEntryForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tür" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harcama">Harcama</SelectItem>
                      <SelectItem value="taksit">Taksit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {entryForm.type !== "taksit" && (
                  <div>
                    <Label>Tutar (₺)</Label>
                    <Input inputMode="decimal" value={entryForm.amount} onChange={(e) => setEntryForm((f) => ({ ...f, amount: (e.target as HTMLInputElement).value }))} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label>Açıklama</Label>
                  <Input value={entryForm.description} onChange={(e) => setEntryForm((f) => ({ ...f, description: (e.target as HTMLInputElement).value }))} />
                </div>
                <div>
                  <Label>Tarih</Label>
                  <Input type="date" value={entryForm.date} onChange={(e) => setEntryForm((f) => ({ ...f, date: (e.target as HTMLInputElement).value }))} />
                </div>
                {entryForm.type === "taksit" && (
                  <>
                    <div>
                      <Label>Ürün Fiyatı (₺)</Label>
                      <Input inputMode="decimal" value={entryForm.totalPrice || ""} onChange={(e) => setEntryForm((f) => ({ ...f, totalPrice: (e.target as HTMLInputElement).value }))} />
                    </div>
                    <div>
                      <Label>Kalan Taksit Adedi</Label>
                      <Input inputMode="numeric" value={entryForm.installments || ""} onChange={(e) => setEntryForm((f) => ({ ...f, installments: (e.target as HTMLInputElement).value }))} />
                    </div>
                  </>
                )}
                <div className="md:col-span-1">
                  <Button className="w-full" onClick={onAddEntry}>Ekle</Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Kayıtlar</p>
                <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                  {entries.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">Henüz kayıt yok.</div>
                  ) : entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant={e.type === "harcama" ? "secondary" : "default"} className={e.type === "harcama" ? "bg-blue-500/10 text-blue-700" : "bg-green-500/10 text-green-700"}>
                          {e.type === "harcama" ? "Harcama" : "Ödeme"}
                        </Badge>
                        <span>{e.description || "-"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={e.type === "harcama" ? "text-red-600" : "text-green-600"}>₺{e.amount.toLocaleString("tr-TR")}</span>
                        <span className="text-muted-foreground">{e.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Quick Actions Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{payCard ? `${payCard.bankName} • Ödeme Yap` : "Ödeme Yap"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={async () => {
                    if (!userId || !isFirestoreReady() || !livePayCard) return
                    const amount = computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, livePayCard.currentDebt || 0)
                    if (amount <= 0) { toast({ title: "Asgari tutar yok" }); return }
                    const today = new Date().toISOString().slice(0,10)
                    await addCardEntry(userId, livePayCard.id, { cardId: livePayCard.id, type: "odeme", amount, description: "Asgari ödeme", date: today })
                    await addTransaction(userId, { id: crypto.randomUUID(), type: "gider", amount, description: `Asgari ödeme - ${livePayCard.bankName}` , category: "Fatura", date: today } as any)
                    const nextDebt = Math.max(0, (livePayCard.currentDebt || 0) - amount)
                    await upsertCard(userId, { id: livePayCard.id, bankName: livePayCard.bankName, cardType: livePayCard.cardType || "Kredi Kartı", cardNetwork: livePayCard.cardNetwork || "visa", creditLimit: Number(livePayCard.creditLimit) || 0, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, nextDebt), statementDate: livePayCard.statementDate ?? null, dueDate: livePayCard.dueDate ?? null, status: livePayCard.status ?? "active", cardColor: livePayCard.cardColor ?? null })
                    // Optimistic local update so UI reflects immediately
                    setCards((prev) => prev.map((c) => c.id === livePayCard.id ? { ...c, currentDebt: nextDebt, minimumPayment: computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, nextDebt) } : c))
                    setPayOpen(false)
                    toast({ title: "Asgari ödeme kaydedildi" })
                  }}
                >
                  Asgari Öde ₺{payInfo.min.toLocaleString("tr-TR")}
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    if (!userId || !isFirestoreReady() || !livePayCard) return
                    const amount = livePayCard.currentDebt || 0
                    if (amount <= 0) { toast({ title: "Ödenecek borç yok" }); return }
                    const today = new Date().toISOString().slice(0,10)
                    await addCardEntry(userId, livePayCard.id, { cardId: livePayCard.id, type: "odeme", amount, description: "Dönem borcu ödemesi", date: today })
                    await addTransaction(userId, { id: crypto.randomUUID(), type: "gider", amount, description: `Dönem borcu - ${livePayCard.bankName}`, category: "Fatura", date: today } as any)
                    await upsertCard(userId, { id: livePayCard.id, bankName: livePayCard.bankName, cardType: livePayCard.cardType || "Kredi Kartı", cardNetwork: livePayCard.cardNetwork || "visa", creditLimit: Number(livePayCard.creditLimit) || 0, currentDebt: 0, minimumPayment: computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, 0), statementDate: livePayCard.statementDate ?? null, dueDate: livePayCard.dueDate ?? null, status: livePayCard.status ?? "active", cardColor: livePayCard.cardColor ?? null })
                    // Optimistic local update
                    setCards((prev) => prev.map((c) => c.id === livePayCard.id ? { ...c, currentDebt: 0, minimumPayment: computeMinimumPaymentForBank(livePayCard.bankName, livePayCard.creditLimit || 0, 0) } : c))
                    setPayOpen(false)
                    toast({ title: "Dönem borcu ödendi" })
                  }}
                >
                  Güncel Dönem Borcunu Öde ₺{payInfo.current.toLocaleString("tr-TR")}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)}>Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Card Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kart Ayarları</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mevcut Borç (₺)</Label>
                <Input inputMode="decimal" type="number" value={(editingCard.currentDebt as any) ?? ""} onChange={(e) => setEditingCard((f) => ({ ...f, currentDebt: (e.target as HTMLInputElement).value as any }))} />
              </div>
              {/* Asgari Ödeme alanı kaldırıldı */}
              <div className="space-y-2">
                <Label>Ekstre Tarihi</Label>
                <Input value={editingCard.statementDate || ""} onChange={(e) => setEditingCard((f) => ({ ...f, statementDate: (e.target as HTMLInputElement).value }))} />
              </div>
              <div className="space-y-2">
                <Label>Son Ödeme Tarihi</Label>
                <Input value={editingCard.dueDate || ""} onChange={(e) => setEditingCard((f) => ({ ...f, dueDate: (e.target as HTMLInputElement).value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kart Durumu</Label>
                <Select value={(editingCard.status as any) || "active"} onValueChange={(v: string) => setEditingCard((f) => ({ ...f, status: v as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Kart Rengi</Label>
                <div className="grid grid-cols-5 gap-2">
                  {["bg-gradient-to-br from-blue-600 to-blue-800","bg-gradient-to-br from-red-600 to-red-800","bg-gradient-to-br from-green-600 to-green-800","bg-gradient-to-br from-purple-600 to-purple-800","bg-gradient-to-br from-orange-600 to-orange-800","bg-gradient-to-br from-slate-600 to-slate-800","bg-gradient-to-br from-emerald-600 to-emerald-800","bg-gradient-to-br from-cyan-600 to-cyan-800","bg-gradient-to-br from-pink-600 to-pink-800","bg-gradient-to-br from-indigo-600 to-indigo-800"].map((c) => (
                    <button key={c} type="button" onClick={() => setEditingCard((f) => ({ ...f, cardColor: c }))} className={`h-8 rounded ${c} border ${editingCard.cardColor === c ? "ring-2 ring-primary" : ""}`} aria-label={c} />
                  ))}
                </div>
                <Input className="mt-2" value={editingCard.cardColor || ""} onChange={(e) => setEditingCard((f) => ({ ...f, cardColor: (e.target as HTMLInputElement).value }))} placeholder="Örn: bg-gradient-to-br from-blue-600 to-blue-800 (özel)" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Vazgeç</Button>
              {editingCard.id ? (
                <Button variant="destructive" onClick={async () => { await onDeleteCard(editingCard.id!); setEditOpen(false); }}>Sil</Button>
              ) : null}
              <Button onClick={onSaveEdit}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
