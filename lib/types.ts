export type AppNotification = {
  id: string
  title: string
  description?: string
  date: string // ISO date string
  read: boolean
  data?: Record<string, any>
}

export type Note = {
  id: string
  title: string
  contentHtml: string
  updatedAt: string // ISO date string for local, Firestore serverTimestamp stored separately
  tags?: string[]
}

export type Subscription = {
  id: string
  name: string
  price: number
  nextBillingDate: string // ISO date string
  cancellationReminderDate?: string | null // ISO or null to clear
  updatedAt: string
}

export type BankCard = {
  id: string
  bankName: string
  bankLogo?: string | null
  nickname?: string | null // Kart takma adı
  cardNumber?: string | null
  cardHolderName?: string | null
  expiryDate?: string | null // MM/YY or YYYY-MM
  cardType?: string | null // e.g., "Kredi Kartı"
  cardNetwork?: "visa" | "mastercard" | null
  creditLimit?: number | null
  currentDebt?: number | null
  statementDate?: string | null // display string or day-of-month
  paymentDueDate?: string | null // display string or day-of-month
  minimumPayment?: number | null
  status?: "active" | "inactive" | null
  cardColor?: string | null // tailwind class
  updatedAt: string
  // Taksit planları (istemci ve backend tarafından ilerletilir)
  installmentPlans?: InstallmentPlan[] | null
}

// Per-card entry (harcama/ödeme)
export type CardEntry = {
  id: string
  cardId: string
  type: "harcama"
  amount: number
  description?: string
  category?: string
  date: string // ISO YYYY-MM-DD
  createdAt?: string
  // Taksit kaydı eşlemesi için opsiyonel plan id
  planId?: string
}

export type InstallmentPlan = {
  id: string
  description: string
  total: number
  monthlyAmount: number
  remaining: number
  posted: number
  nextDate?: string | null // ISO YYYY-MM-DD veya null (tamamlandı)
  startDate: string // satın alma tarihi (ISO YYYY-MM-DD)
}
