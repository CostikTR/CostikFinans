"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  MoreHorizontal,
  Banknote,
  Landmark,
  PiggyBank,
  Trash2,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { isFirestoreReady, listCards, upsertCard, removeCard, watchCards, listCardEntries, addCardEntry, computeMinimumPayment, computeMinimumPaymentForBank, listTransactions, watchTransactions } from "@/lib/db"
import type { CardEntry, BankCard, InstallmentPlan } from "@/lib/types"
import { addTransaction } from "@/lib/db"
import { formatTRY, cn } from "@/lib/utils"
import { BalanceChip } from "@/components/balance-chip"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown } from "lucide-react"
// Yardımcı: ISO (YYYY-MM-DD) tarihe ay ekle
function addMonthsISO(dateStr: string, months: number) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const base = new Date(y, (m - 1), d)
  base.setMonth(base.getMonth() + months)
  const yyyy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, "0")
  const dd = String(base.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// Türkiye bankaları için örnek kart verileri
const TURKISH_BANKS = [
  { name: "Ziraat Bankası", logo: "/placeholder.svg?height=32&width=32&query=ziraat", color: "bg-red-800" },
  { name: "İş Bankası", logo: "/placeholder.svg?height=32&width=32&query=isbank", color: "bg-blue-800" },
  { name: "Garanti BBVA", logo: "/placeholder.svg?height=32&width=32&query=garanti", color: "bg-green-600" },
  { name: "Akbank", logo: "/placeholder.svg?height=32&width=32&query=akbank", color: "bg-red-600" },
  { name: "Yapı Kredi", logo: "/placeholder.svg?height=32&width=32&query=yapikredi", color: "bg-blue-900" },
  { name: "QNB Finansbank", logo: "/placeholder.svg?height=32&width=32&query=qnb", color: "bg-indigo-900" },
  { name: "Halkbank", logo: "/placeholder.svg?height=32&width=32&query=halkbank", color: "bg-sky-700" },
  { name: "VakıfBank", logo: "/placeholder.svg?height=32&width=32&query=vakifbank", color: "bg-yellow-500" },
  { name: "Enpara", logo: "/placeholder.svg?height=32&width=32&query=enpara", color: "bg-cyan-700" },
] as const

// Yeni Kart Bileşeni
function NewBankCard({ card, onPay, onDetails, onSettings }: { card: BankCard; onPay: () => void; onDetails: () => void; onSettings: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const usagePercent = card.creditLimit ? Math.min(Math.round(((card.currentDebt || 0) / card.creditLimit) * 100), 100) : 0

  const bankColor = TURKISH_BANKS.find(b => b.name === card.bankName)?.color || "bg-gray-700"

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className={cn("p-5 text-white relative flex flex-col justify-between h-48", bankColor)}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">{card.nickname || card.bankName}</p>
            <p className="text-xs opacity-80">{card.bankName}</p>
          </div>
          <div className="flex items-center gap-2">
            <img src={card.bankLogo || "/placeholder.svg?height=32&width=32"} alt={card.bankName} className="h-8 w-8 bg-white/80 rounded-md p-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsVisible(!isVisible)}>
                  {isVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  <span>{isVisible ? "Bilgileri Gizle" : "Bilgileri Göster"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-center mb-2">
            <p className="text-xs opacity-80">Güncel Borç</p>
            <p className={cn("font-bold text-2xl tracking-wider", isVisible ? "blur-0" : "blur-sm")}>
              {isVisible ? formatTRY(card.currentDebt || 0) : "₺ ****,**"}
            </p>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">Kart Sahibi</p>
              <p className="font-medium text-sm">{card.cardHolderName || "Bilinmiyor"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Son Kullanma</p>
              <p className="font-medium text-sm">{card.expiryDate || "**/**"}</p>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col justify-between bg-card">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Limit Kullanımı</span>
            <span className="text-xs font-bold">{usagePercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 mb-4">
            <div
              className={cn("h-2.5 rounded-full", usagePercent > 80 ? "bg-red-500" : usagePercent > 60 ? "bg-yellow-500" : "bg-green-500")}
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kalan Limit</p>
                <p className="font-semibold">{formatTRY((card.creditLimit || 0) - (card.currentDebt || 0))}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Toplam Limit</p>
                <p className="font-semibold">{formatTRY(card.creditLimit || 0)}</p>
              </div>
            </div>
          </div>
          {card.paymentDueDate && (
            <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded-md">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Son Ödeme Tarihi: <span className="font-semibold">{card.paymentDueDate}</span></span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={onDetails}>
            <Receipt className="h-4 w-4 mr-2" />
            Harcamalar
          </Button>
          <Button size="sm" onClick={onPay}>
            <Banknote className="h-4 w-4 mr-2" />
            Borç Öde
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// İskelet Kart Bileşeni
function CardSkeleton() {
  return (
    <div className="border rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-40 mb-4" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-2.5 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

// Boş Durum Bileşeni
function EmptyState({ onAddCard }: { onAddCard: () => void }) {
  return (
    <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">Henüz Kredi Kartı Eklenmemiş</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        İlk kredi kartınızı ekleyerek harcamalarınızı ve limitlerinizi takip etmeye başlayın.
      </p>
      <div className="mt-6">
        <Button onClick={onAddCard}>
          <Plus className="mr-2 h-4 w-4" />
          İlk Kartı Ekle
        </Button>
      </div>
    </div>
  )
}

export default function KartlarimPage() {
  const { toast } = useToast()
  const todayLocal = () => new Date().toISOString().slice(0, 10)

  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [cards, setCards] = useState<BankCard[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Partial<BankCard> & { id?: string }>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<BankCard | null>(null)
  const [payCard, setPayCard] = useState<BankCard | null>(null)
  const [entries, setEntries] = useState<CardEntry[]>([])
  const [installmentsOpen, setInstallmentsOpen] = useState(false)
  const [installmentFormOpen, setInstallmentFormOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Partial<InstallmentPlan> & { cardId?: string } | null>(null)
  const [installmentFilter, setInstallmentFilter] = useState<"aktif" | "tamamlanan" | "buay">("aktif")
  type EntryKind = "harcama"
  const [entryForm, setEntryForm] = useState<{ type: EntryKind; amount: string; description: string; date: string; totalPrice?: string; installments?: string }>({ type: "harcama", amount: "", description: "", date: todayLocal() })

  // Toplam Bakiye Hesaplamaları
  const summary = useMemo(() => {
    const totalLimit = cards.reduce((sum, card) => sum + (card.creditLimit || 0), 0)
    const totalDebt = cards.reduce((sum, card) => sum + (card.currentDebt || 0), 0)
    const availableCredit = totalLimit - totalDebt
    return { totalLimit, totalDebt, availableCredit, cardCount: cards.length }
  }, [cards])

  const allInstallmentPlans = useMemo(() => {
    return cards
      .flatMap(card =>
        (card.installmentPlans || []).map(plan => ({
          ...plan,
          cardNickname: card.nickname || card.bankName,
          cardId: card.id,
          cardBankName: card.bankName,
          cardLogo: card.bankLogo,
        }))
      )
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [cards])

  const filteredInstallmentPlans = useMemo(() => {
    const today = new Date()
    const curY = today.getFullYear()
    const curM = today.getMonth() + 1
    const isSameYM = (iso?: string | null) => {
      if (!iso) return false
      const [y, m] = iso.split("-").map(Number)
      return y === curY && m === curM
    }
    if (installmentFilter === "tamamlanan") {
      return allInstallmentPlans.filter(p => p.remaining === 0)
    }
    if (installmentFilter === "buay") {
      return allInstallmentPlans.filter(p => {
        if (p.remaining === 0) return false
        // Bu ayın tahakkuku: nextDate'in bir önceki ayı bu ayı temsil eder
        const prev = p.nextDate ? addMonthsISO(p.nextDate, -1) : null
        // Eğer plan yeni ve nextDate yoksa (teorik), startDate'i baz al
        return isSameYM(prev || p.startDate)
      })
    }
    // aktif
    return allInstallmentPlans.filter(p => p.remaining > 0)
  }, [allInstallmentPlans, installmentFilter])

  const openAddInstallment = () => {
    setEditingInstallment({ startDate: todayLocal(), total: 0, monthlyAmount: 0, remaining: 0, posted: 0 });
    setInstallmentFormOpen(true);
  };

  const openEditInstallment = (plan: any) => {
    setEditingInstallment({ ...plan });
    setInstallmentFormOpen(true);
  };

  // Taksit ilerletme ve borca yansıtma (sayfa yüklendiğinde/geçikmişler için)
  useEffect(() => {
    const reconcile = async () => {
      if (!userId || cards.length === 0) return
      const today = todayLocal()
      for (const card of cards) {
        const plans = [...(card.installmentPlans || [])]
        let changed = false
        let debtDelta = 0
        for (const p of plans) {
          while (p.nextDate && p.remaining > 0 && p.nextDate <= today) {
            p.posted += 1
            p.remaining -= 1
            debtDelta += p.monthlyAmount
            p.nextDate = p.remaining > 0 ? addMonthsISO(p.nextDate, 1) : null
            changed = true
          }
        }
        if (changed || debtDelta !== 0) {
          await upsertCard(userId, { ...card, installmentPlans: plans, currentDebt: Math.max(0, (card.currentDebt || 0) + debtDelta) })
        }
      }
    }
    reconcile().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleSaveInstallment = async () => {
    if (!userId || !editingInstallment || !editingInstallment.cardId || !editingInstallment.description) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }

    const { cardId, ...planData } = editingInstallment;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const isNew = !planData.id;
    const total = Number(editingInstallment.total || 0);
    const installmentsCount = Number((editingInstallment as any).installments || 0);

    if (total <= 0 || installmentsCount <= 0) {
      toast({ title: "Hata", description: "Toplam tutar ve taksit sayısı pozitif olmalıdır.", variant: "destructive" });
      return;
    }

    const monthlyAmount = total / installmentsCount;

    const newPlan: InstallmentPlan = {
      id: planData.id || crypto.randomUUID(),
      description: planData.description!,
      total: total,
      monthlyAmount: monthlyAmount,
      remaining: installmentsCount - 1,
      posted: 1,
      startDate: planData.startDate || todayLocal(),
      nextDate: new Date(new Date(planData.startDate || todayLocal()).setMonth(new Date(planData.startDate || todayLocal()).getMonth() + 1)).toISOString().slice(0, 10),
    };

    let updatedPlans = [...(card.installmentPlans || [])];
    if (isNew) {
      updatedPlans.push(newPlan);
    } else {
      const index = updatedPlans.findIndex(p => p.id === newPlan.id);
      if (index > -1) {
        // Preserve original posted/remaining counts on edit, only allow description/total change
        const originalPlan = updatedPlans[index];
        updatedPlans[index] = {
          ...originalPlan,
          description: newPlan.description,
          total: newPlan.total,
          monthlyAmount: newPlan.total / (originalPlan.posted + originalPlan.remaining)
        };
      }
    }

    const newDebt = isNew ? (card.currentDebt || 0) + monthlyAmount : card.currentDebt;

    try {
      // Önce kartı ve taksit planlarını güncelle
      await upsertCard(userId, { ...card, installmentPlans: updatedPlans, currentDebt: newDebt });

      // Yeni taksit oluşturuluyorsa, ilk ayın harcamasını kart hareketlerine ekle
      if (isNew) {
        const entry: Omit<CardEntry, 'id'> = {
          cardId: card.id,
          type: 'harcama',
          amount: monthlyAmount,
          description: `Taksit: ${newPlan.description} (1/${installmentsCount})`,
          date: newPlan.startDate,
          planId: newPlan.id,
        }
        await addCardEntry(userId, card.id, entry)
      }
      toast({ title: "Başarılı", description: `Taksit ${isNew ? 'eklendi' : 'güncellendi'}.` });
      setInstallmentFormOpen(false);
    } catch (error) {
      console.error("Taksit kaydedilirken hata:", error);
      toast({ title: "Hata", description: "Taksit kaydedilemedi.", variant: "destructive" });
    }
  };

  const handleDeleteInstallment = async (planToDelete: any) => {
    if (!userId || !planToDelete.cardId) return;
    const card = cards.find(c => c.id === planToDelete.cardId);
    if (!card) return;

    if (!window.confirm(`'${planToDelete.description}' taksidini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;

    const updatedPlans = (card.installmentPlans || []).filter(p => p.id !== planToDelete.id);
    const remainingDebtToCancel = planToDelete.remaining * planToDelete.monthlyAmount;
    const newDebt = (card.currentDebt || 0) - remainingDebtToCancel;

    try {
      await upsertCard(userId, { ...card, installmentPlans: updatedPlans, currentDebt: Math.max(0, newDebt) });
      toast({ title: "Taksit Silindi", description: "Kalan borç kart limitinize iade edildi." });
    } catch (error) {
      console.error("Taksit silinirken hata:", error);
      toast({ title: "Hata", description: "Taksit silinemedi.", variant: "destructive" });
    }
  };

  const handlePayInstallment = async (plan: any) => {
    if (!userId) return
    const card = cards.find(c => c.id === plan.cardId)
    if (!card) return
    if (plan.remaining <= 0 && plan.nextDate == null) return
    const plans = (card.installmentPlans || []).map(p => {
      if (p.id !== plan.id) return p
      const np = { ...p }
      if (np.remaining > 0) {
        np.posted += 1
        np.remaining -= 1
        np.nextDate = np.remaining > 0 && np.nextDate ? addMonthsISO(np.nextDate, 1) : null
      }
      return np
    })
    const newDebt = Math.max(0, (card.currentDebt || 0) - plan.monthlyAmount)
    try {
      await upsertCard(userId, { ...card, installmentPlans: plans, currentDebt: newDebt })
      toast({ title: "Taksit Ödendi", description: `${formatTRY(plan.monthlyAmount)} ödendi.` })
    } catch (e) {
      console.error(e)
      toast({ title: "Hata", description: "Taksit ödenemedi.", variant: "destructive" })
    }
  }


  // Firestore'dan veri çekme ve izleme
  useEffect(() => {
    const unsubAuth = auth?.onAuthStateChanged?.(async (user) => {
      if (user) {
        setUserId(user.uid)
        if (isFirestoreReady()) {
          setIsLoading(true)
          const initialCards = await listCards(user.uid)
          setCards(initialCards)
          setIsLoading(false)
          const unsubCards = watchCards(user.uid, (updatedCards) => {
            setCards(updatedCards)
          })
          return () => {
            if (typeof unsubCards === 'function') {
              unsubCards()
            }
          }
        }
      } else {
        setUserId("")
        setCards([])
        setIsLoading(false)
      }
    })
  return () => { try { typeof unsubAuth === 'function' && unsubAuth() } catch {} }
  }, [])

  const handleAddOrUpdateCard = async (cardData: Partial<BankCard>) => {
    if (!userId) return
    try {
      const bankMeta = TURKISH_BANKS.find(b => b.name === cardData.bankName)
      const dataToSave = {
        id: cardData.id,
        bankName: cardData.bankName || TURKISH_BANKS[0].name,
        nickname: cardData.nickname ?? null,
        cardNumber: cardData.cardNumber ?? null,
        cardHolderName: cardData.cardHolderName ?? null,
        expiryDate: cardData.expiryDate ?? null,
        cardType: cardData.cardType ?? null,
        cardNetwork: cardData.cardNetwork ?? null,
        creditLimit: typeof cardData.creditLimit === 'number' ? cardData.creditLimit : Number(cardData.creditLimit) || 0,
        currentDebt: typeof cardData.currentDebt === 'number' ? cardData.currentDebt : Number(cardData.currentDebt) || 0,
        statementDate: cardData.statementDate ?? null,
        paymentDueDate: cardData.paymentDueDate ?? null,
        minimumPayment: typeof cardData.minimumPayment === 'number' ? cardData.minimumPayment : Number(cardData.minimumPayment) || 0,
        status: cardData.status || 'active',
        bankLogo: cardData.bankLogo || bankMeta?.logo || null,
        cardColor: cardData.cardColor || bankMeta?.color || null,
        installmentPlans: cardData.installmentPlans ?? null,
      }
      await upsertCard(userId, dataToSave)
      toast({ title: "Başarılı", description: `Kart ${cardData.id ? 'güncellendi' : 'eklendi'}.` })
      setAddOpen(false)
      setEditOpen(false)
    } catch (error) {
      console.error("Kart kaydedilirken hata:", error)
      toast({ title: "Hata", description: "Kart kaydedilemedi.", variant: "destructive" })
    }
  }

  const onDeleteCard = async (id: string) => {
    if (!userId) return
    const ok = window.confirm("Bu kartı ve ilgili tüm verileri silmek istediğinizden emin misiniz?")
    if (ok) {
      try {
        await removeCard(userId, id)
        toast({ title: "Kart Silindi" })
      } catch (error) {
        toast({ title: "Hata", description: "Kart silinemedi.", variant: "destructive" })
      }
    }
  }

  const openDetail = async (card: BankCard) => {
    setDetailCard(card)
    setDetailOpen(true)
    if (userId) {
      const cardEntries = await listCardEntries(userId, card.id)
      setEntries(cardEntries)
    }
  }

  const openPay = (card: BankCard) => {
    setPayCard(card)
    setPayOpen(true)
  }

  const openEdit = (card: BankCard) => {
    setEditingCard(card)
    setEditOpen(true)
  }

  const openAdd = () => {
    setEditingCard({
      id: "",
      bankName: TURKISH_BANKS[0].name,
      creditLimit: 0,
      currentDebt: 0,
      statementDate: "",
      paymentDueDate: "",
      nickname: "",
    });
    setAddOpen(true);
  };

  const onAddEntry = async () => {
    if (!userId || !detailCard) return;

    const amount = parseFloat(entryForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Hata", description: "Lütfen geçerli bir tutar girin.", variant: "destructive" });
      return;
    }

    try {
      const entry: Omit<CardEntry, 'id'> = {
        cardId: detailCard.id,
        type: 'harcama',
        amount,
        description: entryForm.description,
        date: entryForm.date || todayLocal(),
      };

      await addCardEntry(userId, detailCard.id, entry);

  // Update card's current debt (only increase for harcama)
  const newDebt = (detailCard.currentDebt || 0) + amount;

      await upsertCard(userId, { ...detailCard, currentDebt: newDebt });

      toast({ title: "Başarılı", description: "Yeni kayıt eklendi." });
      setEntryForm({ type: "harcama", amount: "", description: "", date: todayLocal() });
      openDetail({ ...detailCard, currentDebt: newDebt }); // Refresh details
    } catch (error) {
      console.error("Kayıt eklenirken hata:", error);
      toast({ title: "Hata", description: "Kayıt eklenemedi.", variant: "destructive" });
    }
  };

  const handleQuickPay = async (card: BankCard, type: 'min' | 'full') => {
    if (!userId) return;

    let payAmount = type === 'min'
      ? computeMinimumPaymentForBank(card.bankName, card.creditLimit || 0, card.currentDebt || 0)
      : (card.currentDebt || 0);

    if (payAmount <= 0) {
      toast({ title: "Ödenecek borç yok." });
      return;
    }

    try {
      // Ödeme tutarını taksitlere paylaştır: ödeme, bir taksidin aylık tutarını karşılıyorsa o taksiti bir ay ilerlet.
      const plans = [...(card.installmentPlans || [])]
      // Yakın tarihten uzağa doğru ilerleme için sırala
      plans.sort((a, b) => {
        const ad = a.nextDate ? new Date(a.nextDate).getTime() : Number.MAX_SAFE_INTEGER
        const bd = b.nextDate ? new Date(b.nextDate).getTime() : Number.MAX_SAFE_INTEGER
        return ad - bd
      })

      let advancedCount = 0
      for (const p of plans) {
        if (payAmount <= 0) break
        if (!p || p.remaining <= 0) continue
        const m = p.monthlyAmount || 0
        if (m > 0 && payAmount >= m) {
          // Bu taksitin bir ayını karşıla: bir sonraki aya devret
          p.posted += 1
          p.remaining -= 1
          p.nextDate = p.remaining > 0
            ? (p.nextDate ? addMonthsISO(p.nextDate, 1) : addMonthsISO(todayLocal(), 1))
            : null
          payAmount -= m
          advancedCount += 1
        }
      }

      const totalPaid = type === 'min'
        ? computeMinimumPaymentForBank(card.bankName, card.creditLimit || 0, card.currentDebt || 0)
        : (card.currentDebt || 0)

      // Kalan ödeme (taksitlere yetmeyen kısım) doğrudan borçtan düşsün
      const newDebt = Math.max(0, (card.currentDebt || 0) - totalPaid)
      await upsertCard(userId, { ...card, installmentPlans: plans, currentDebt: newDebt })

      const desc = advancedCount > 0
        ? `${advancedCount} taksit bir sonraki aya devredildi.`
        : `Ödeme borca uygulandı.`
      toast({ title: "Ödeme Başarılı", description: `${formatTRY(totalPaid)} ödendi. ${desc}` })
      setPayOpen(false)
    } catch (error) {
      console.error("Ödeme sırasında hata:", error);
      toast({ title: "Hata", description: "Ödeme işlemi başarısız oldu.", variant: "destructive" });
    }
  };

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
                  <Link href="/"><Button variant="ghost" className="text-muted-foreground hover:text-foreground"><Home className="h-4 w-4 mr-2" />Panel</Button></Link>
                  <Link href="/kartlarim"><Button variant="secondary" className="font-medium"><CreditCard className="h-4 w-4 mr-2" />Kartlarım</Button></Link>
                  <Link href="/bidgets"><Button variant="ghost" className="text-muted-foreground hover:text-foreground"><Target className="h-4 w-4 mr-2" />Bütçeler</Button></Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <BalanceChip />
                <Link href="/settings"><Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button></Link>
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-user.png" />
                  <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Kartlarım</h2>
              <p className="text-muted-foreground mt-1">Kredi kartlarınızı yönetin ve takip edin.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kart Ekle
              </Button>
            </div>
          </section>

          {/* Summary Panel */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Kart</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.cardCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTRY(summary.totalDebt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kullanılabilir Limit</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTRY(summary.availableCredit)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Limit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTRY(summary.totalLimit)}</div>
              </CardContent>
            </Card>
          </section>

          {/* Installments Section */}
          <Collapsible open={installmentsOpen} onOpenChange={setInstallmentsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Taksitlerim ({allInstallmentPlans.length})</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${installmentsOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Aktif Taksitler</CardTitle>
                    <CardDescription>Tüm kartlarınızdaki taksitli harcamalarınız.</CardDescription>
                  </div>
                  <Button onClick={openAddInstallment}>
                    <Plus className="mr-2 h-4 w-4" />
                    Taksit Ekle
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between">
                    <Tabs value={installmentFilter} onValueChange={(v) => setInstallmentFilter(v as any)}>
                      <TabsList>
                        <TabsTrigger value="aktif">Aktif</TabsTrigger>
                        <TabsTrigger value="buay">Bu Ay</TabsTrigger>
                        <TabsTrigger value="tamamlanan">Tamamlanan</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="text-xs text-muted-foreground">Toplam: {filteredInstallmentPlans.length}</div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kart</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-right">Aylık Tutar</TableHead>
                        <TableHead className="text-center">İlerleme</TableHead>
                        <TableHead className="w-[180px]">Durum</TableHead>
                        <TableHead className="text-right">Kalan Tutar</TableHead>
                        <TableHead>Sonraki Ödeme</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstallmentPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-24">
                            Aktif taksit bulunmuyor.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInstallmentPlans.map(plan => (
                          <TableRow key={plan.id}>
                            <TableCell className="flex items-center gap-2">
                              <img src={plan.cardLogo || ""} alt={plan.cardBankName} className="h-6 w-6 object-contain" />
                              {plan.cardNickname}
                            </TableCell>
                            <TableCell>{plan.description}</TableCell>
                            <TableCell className="text-right">{formatTRY(plan.monthlyAmount)}</TableCell>
                            <TableCell className="text-center">{plan.posted}/{plan.posted + plan.remaining}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={((plan.posted) / (plan.posted + plan.remaining)) * 100} className="h-2 w-36" />
                                <span className="text-xs text-muted-foreground">%{Math.round(((plan.posted) / (plan.posted + plan.remaining)) * 100)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatTRY(plan.monthlyAmount * plan.remaining)}</TableCell>
                            <TableCell>{plan.nextDate ? new Date(plan.nextDate).toLocaleDateString("tr-TR") : "Tamamlandı"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => openEditInstallment(plan)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Düzenle</span>
                                  </DropdownMenuItem>
                                  {plan.remaining > 0 && (
                                    <DropdownMenuItem onClick={() => handlePayInstallment(plan)}>
                                      <Banknote className="mr-2 h-4 w-4" />
                                      <span>Taksiti Öde</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDeleteInstallment(plan)} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Sil</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Cards List */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : cards.length === 0 ? (
              <EmptyState onAddCard={openAdd} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <NewBankCard
                    key={card.id}
                    card={card}
                    onDetails={() => openDetail(card)}
                    onPay={() => openPay(card)}
                    onSettings={() => openEdit(card)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Add/Edit Installment Dialog */}
        {installmentFormOpen && (
          <Dialog open={installmentFormOpen} onOpenChange={setInstallmentFormOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingInstallment?.id ? "Taksiti Düzenle" : "Yeni Taksit Ekle"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Kart</Label>
                  <Select
                    value={editingInstallment?.cardId || ""}
                    onValueChange={(v) => setEditingInstallment(e => ({ ...e, cardId: v }))}
                    disabled={!!editingInstallment?.id}
                  >
                    <SelectTrigger><SelectValue placeholder="Taksit yapılacak kartı seçin..." /></SelectTrigger>
                    <SelectContent>
                      {cards.map(card => (
                        <SelectItem key={card.id} value={card.id}>{card.nickname || card.bankName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    placeholder="Örn: Yeni Telefon"
                    value={editingInstallment?.description || ""}
                    onChange={(e) => setEditingInstallment(plan => ({ ...plan, description: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Toplam Tutar (₺)</Label>
                    <Input
                      type="number"
                      placeholder="15000"
                      value={editingInstallment?.total || ""}
                      onChange={(e) => setEditingInstallment(plan => ({ ...plan, total: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taksit Sayısı</Label>
                    <Input
                      type="number"
                      placeholder="12"
                      value={(editingInstallment as any).installments || ""}
                      onChange={(e) => setEditingInstallment(plan => ({ ...plan, installments: Number(e.target.value) }))
                      }
                      disabled={!!editingInstallment?.id}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Satın Alım Tarihi</Label>
                  <Input
                    type="date"
                    value={editingInstallment?.startDate || ""}
                    onChange={(e) => setEditingInstallment(plan => ({ ...plan, startDate: e.target.value }))
                    }
                    disabled={!!editingInstallment?.id}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInstallmentFormOpen(false)}>İptal</Button>
                <Button onClick={handleSaveInstallment}>Kaydet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add/Edit Card Dialog */}
        <Dialog open={addOpen || editOpen} onOpenChange={editingCard.id ? setEditOpen : setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCard.id ? "Kartı Düzenle" : "Yeni Kart Ekle"}</DialogTitle>
              <DialogDescription>
                {editingCard.id ? "Kart bilgilerinizi güncelleyin." : "Yeni bir kredi kartı ekleyin."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nickname">Kart Takma Adı</Label>
                <Input id="nickname" placeholder="Örn: Maaş Kartım" value={editingCard.nickname || ""} onChange={e => setEditingCard({ ...editingCard, nickname: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Banka</Label>
                <Select
                  value={editingCard.bankName || ""}
                  onValueChange={(v) => setEditingCard({ ...editingCard, bankName: v })}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      {editingCard.bankName && (
                        <img 
                          src={TURKISH_BANKS.find(b => b.name === editingCard.bankName)?.logo} 
                          alt={editingCard.bankName} 
                          className="h-4 w-4 object-contain rounded-sm" 
                        />
                      )}
                      <SelectValue placeholder="Banka seçin..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {TURKISH_BANKS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        <div className="flex items-center gap-2">
                          <img src={b.logo} alt={b.name} className="h-4 w-4 object-contain rounded-sm" />
                          <span>{b.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label>Kredi Limiti (₺)</Label>
                <Input type="number" placeholder="5000" value={editingCard.creditLimit || ""} onChange={e => setEditingCard({ ...editingCard, creditLimit: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Son Ödeme Günü</Label>
                <Input placeholder="Ayın 26'sı veya 26" value={editingCard.paymentDueDate || ""} onChange={e => setEditingCard({ ...editingCard, paymentDueDate: e.target.value })} />
              </div>
               <div className="space-y-2">
                <Label>Ekstre Günü</Label>
                <Input placeholder="Ayın 15'i veya 15" value={editingCard.statementDate || ""} onChange={e => setEditingCard({ ...editingCard, statementDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              {editingCard.id && (
                <Button variant="destructive" onClick={() => onDeleteCard(editingCard.id!)}>Sil</Button>
              )}
              <Button variant="outline" onClick={() => editingCard.id ? setEditOpen(false) : setAddOpen(false)}>İptal</Button>
              <Button onClick={() => handleAddOrUpdateCard(editingCard)}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Card Details Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{detailCard?.nickname || detailCard?.bankName} • Kart Hareketleri</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-4 border rounded-lg">
                <div className="md:col-span-3">
                  <Label>Yeni Hareket Ekle</Label>
                </div>
                <div className="space-y-2">
                  <Label>Tutar (₺)</Label>
                  <Input placeholder="150.75" inputMode="decimal" value={entryForm.amount} onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input placeholder="Market Alışverişi" value={entryForm.description} onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input type="date" value={entryForm.date} onChange={(e) => setEntryForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                   <Label>Tür</Label>
                  <Select value={entryForm.type} onValueChange={(v: "harcama") => setEntryForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harcama">Harcama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button className="w-full" onClick={onAddEntry}>Ekle</Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Geçmiş Hareketler</p>
                <div className="border rounded-md divide-y">
                  {entries.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">Henüz kayıt yok.</div>
                  ) : entries.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant={e.type === "harcama" ? "secondary" : "default"} className={cn("font-mono", e.type === "harcama" ? "bg-red-500/10 text-red-700" : "bg-green-500/10 text-green-700")}>
                          {e.type === "harcama" ? "-" : "+"}
                        </Badge>
                        <div>
                          <p className="font-medium">{e.description || "-"}</p>
                          <p className="text-xs text-muted-foreground">{e.date}</p>
                        </div>
                      </div>
                      <span className={cn("font-semibold", e.type === "harcama" ? "text-red-600" : "text-green-600")}>
                        {e.type === "harcama" ? "-" : "+"}
                        {formatTRY(e.amount)}
                      </span>
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

        {/* Quick Pay Dialog */}
        {payCard && (
          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{payCard.nickname || payCard.bankName} • Hızlı Borç Öde</DialogTitle>
                <DialogDescription>
                  Güncel borcunuz: {formatTRY(payCard.currentDebt || 0)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto"
                  onClick={() => handleQuickPay(payCard, 'min')}
                >
                  <div className="flex flex-col items-center p-2">
                    <span className="text-sm text-muted-foreground">Asgari Tutarı Öde</span>
                    <span className="text-xl font-bold">{formatTRY(computeMinimumPaymentForBank(payCard.bankName, payCard.creditLimit || 0, payCard.currentDebt || 0))}</span>
                  </div>
                </Button>
                <Button
                  size="lg"
                  className="h-auto"
                  onClick={() => handleQuickPay(payCard, 'full')}
                >
                  <div className="flex flex-col items-center p-2">
                    <span className="text-sm text-white/80">Tüm Borcu Öde</span>
                    <span className="text-xl font-bold">{formatTRY(payCard.currentDebt || 0)}</span>
                  </div>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>İptal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  )
}
