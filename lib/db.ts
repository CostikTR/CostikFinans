"use client"

import { db } from "@/lib/firebase"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore"
import type { Transaction } from "@/components/add-transaction-dialog"
import type { AppNotification, Note, Subscription, BankCard, CardEntry } from "@/lib/types"

// Transactions (users/{uid}/transactions)
const TXN_SUB = "transactions"

export function isFirestoreReady() {
  return !!db
}

export async function listTransactions(userId: string): Promise<Transaction[]> {
  if (!db) return []
  if (!userId) return []
  // Use per-user subcollection to avoid composite index requirements
  const q = query(collection(db, "users", userId, TXN_SUB), orderBy("date", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Transaction[]
}

export function watchTransactions(
  userId: string,
  cb: (txns: Transaction[]) => void
): Unsubscribe | null {
  if (!db) return null
  if (!userId) return null
  const q = query(collection(db, "users", userId, TXN_SUB), orderBy("date", "desc"))
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Transaction[]
    cb(list)
  })
}

export async function addTransaction(userId: string, t: Transaction) {
  if (!db) return null
  if (!userId) return null
  const payload = { ...t, updatedAt: serverTimestamp() }
  const col = collection(db, "users", userId, TXN_SUB)
  const ref = await addDoc(col, payload as any)
  return ref.id
}

export async function upsertTransaction(userId: string, t: Transaction) {
  if (!db || !t.id || !userId) return null
  const ref = doc(db, "users", userId, TXN_SUB, t.id)
  await setDoc(ref, { ...t, updatedAt: serverTimestamp() } as any, { merge: true })
  return t.id
}

export async function removeTransaction(userId: string, id: string) {
  if (!db || !userId) return
  await deleteDoc(doc(db, "users", userId, TXN_SUB, id))
}

// User Settings (users/{uid}/settings)
export type UserSettings = {
  currency: string
  locale: string
  notifications: boolean
  expenseAlertThreshold?: number
  monthResetDay?: number // 1-31; default 1
  carryover?: boolean // include previous period leftovers into current period budget
  currentPeriodRealBalance?: number // user-stated real balance for current period
  allTimeRealBalance?: number // user-stated real balance for all time
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!db) return null
  const ref = doc(db, "users", userId, "meta", "settings")
  const snap = await getDoc(ref)
  return (snap.exists() ? (snap.data() as any) : null) as UserSettings | null
}

export async function setUserSettings(userId: string, settings: UserSettings) {
  if (!db) return
  const ref = doc(db, "users", userId, "meta", "settings")
  await setDoc(ref, { ...settings, updatedAt: serverTimestamp() } as any, { merge: true })
}

export function watchUserSettings(userId: string, cb: (s: UserSettings | null) => void): Unsubscribe | null {
  if (!db) return null
  const ref = doc(db, "users", userId, "meta", "settings")
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? ((snap.data() as any) as UserSettings) : null)
  })
}

// Notifications (users/{uid}/notifications)
export async function listNotifications(userId: string): Promise<AppNotification[]> {
  if (!db) return []
  if (!userId) return []
  const q = query(collection(db, "users", userId, "notifications"), orderBy("date", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AppNotification[]
}

export function watchNotifications(userId: string, cb: (list: AppNotification[]) => void): Unsubscribe | null {
  if (!db) return null
  if (!userId) return null
  const q = query(collection(db, "users", userId, "notifications"), orderBy("date", "desc"))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AppNotification[])
  })
}

export async function addNotification(userId: string, n: Omit<AppNotification, "id">) {
  if (!db) return null
  if (!userId) return null
  const col = collection(db, "users", userId, "notifications")
  const ref = await addDoc(col, n as any)
  return ref.id
}

export async function markNotificationRead(userId: string, id: string, read = true) {
  if (!db || !userId) return
  const ref = doc(db, "users", userId, "notifications", id)
  await updateDoc(ref, { read })
}

export async function clearNotifications(userId: string) {
  // Simple approach: fetch and delete individually
  if (!db || !userId) return
  const list = await listNotifications(userId)
  await Promise.all(list.map((n) => deleteDoc(doc(db!, "users", userId, "notifications", n.id))))
}

// Notes (users/{uid}/notes)
export async function listNotes(userId: string): Promise<Note[]> {
  if (!db || !userId) return []
  const q = query(collection(db, "users", userId, "notes"), orderBy("updatedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Note[]
}

export function watchNotes(userId: string, cb: (list: Note[]) => void): Unsubscribe | null {
  if (!db || !userId) return null
  const q = query(collection(db, "users", userId, "notes"), orderBy("updatedAt", "desc"))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Note[])
  })
}

export async function upsertNote(userId: string, note: Note) {
  if (!db || !userId) return null
  const ref = note.id
    ? doc(db, "users", userId, "notes", note.id)
    : doc(collection(db, "users", userId, "notes"))
  const payload: any = {
    title: note.title,
    contentHtml: note.contentHtml,
  tags: note.tags || [],
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload, { merge: true })
  return ref.id
}

export async function removeNote(userId: string, id: string) {
  if (!db || !userId) return
  await deleteDoc(doc(db, "users", userId, "notes", id))
}

// Subscriptions (users/{uid}/subscriptions)
const SUBS_SUB = "subscriptions"

export async function listSubscriptions(userId: string): Promise<Subscription[]> {
  if (!db || !userId) return []
  const q = query(collection(db, "users", userId, SUBS_SUB), orderBy("nextBillingDate", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Subscription[]
}

export function watchSubscriptions(userId: string, cb: (list: Subscription[]) => void): Unsubscribe | null {
  if (!db || !userId) return null
  const q = query(collection(db, "users", userId, SUBS_SUB), orderBy("nextBillingDate", "asc"))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Subscription[])
  })
}

export async function upsertSubscription(userId: string, sub: Omit<Subscription, "id" | "updatedAt"> & { id?: string }) {
  if (!db || !userId) return null
  const ref = sub.id
    ? doc(db, "users", userId, SUBS_SUB, sub.id)
    : doc(collection(db, "users", userId, SUBS_SUB))
  // Normalize payload to avoid undefined fields (Firestore rejects undefined)
  const payload: any = {
    name: sub.name,
    price: typeof (sub as any).price === "number" ? (sub as any).price : Number((sub as any).price) || 0,
    nextBillingDate: sub.nextBillingDate,
    // if undefined -> store null; Firestore accepts nulls and we can clear field intentionally
    cancellationReminderDate:
      (sub as any).cancellationReminderDate === undefined
        ? null
        : (sub as any).cancellationReminderDate,
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload, { merge: true })
  return ref.id
}

export async function removeSubscription(userId: string, id: string) {
  if (!db || !userId) return
  await deleteDoc(doc(db, "users", userId, SUBS_SUB, id))
}

// Cards (users/{uid}/cards)
const CARDS_SUB = "cards"

export async function listCards(userId: string): Promise<BankCard[]> {
  if (!db || !userId) return []
  const q = query(collection(db, "users", userId, CARDS_SUB), orderBy("updatedAt", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BankCard[]
}

export function watchCards(userId: string, cb: (list: BankCard[]) => void): Unsubscribe | null {
  if (!db || !userId) return null
  const q = query(collection(db, "users", userId, CARDS_SUB), orderBy("updatedAt", "desc"))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BankCard[])
  })
}

export async function upsertCard(userId: string, card: Omit<BankCard, "id" | "updatedAt"> & { id?: string }) {
  if (!db || !userId) return null
  const ref = card.id ? doc(db, "users", userId, CARDS_SUB, card.id) : doc(collection(db, "users", userId, CARDS_SUB))
  // Normalize undefined -> null to satisfy Firestore
  const norm = (v: any) => (v === undefined ? null : v)
  const payload: any = {
    bankName: card.bankName,
    bankLogo: norm(card.bankLogo),
    cardNumber: norm(card.cardNumber),
    cardHolderName: norm(card.cardHolderName),
    expiryDate: norm(card.expiryDate),
    cardType: norm(card.cardType),
    cardNetwork: norm(card.cardNetwork),
    creditLimit: typeof (card as any).creditLimit === "number" ? (card as any).creditLimit : Number((card as any).creditLimit) || 0,
    currentDebt: typeof (card as any).currentDebt === "number" ? (card as any).currentDebt : Number((card as any).currentDebt) || 0,
    statementDate: norm(card.statementDate),
    dueDate: norm(card.dueDate),
    minimumPayment: typeof (card as any).minimumPayment === "number" ? (card as any).minimumPayment : Number((card as any).minimumPayment) || 0,
    status: norm(card.status) ?? "active",
    cardColor: norm(card.cardColor),
  installmentPlans: Array.isArray((card as any).installmentPlans) ? (card as any).installmentPlans : norm((card as any).installmentPlans),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload, { merge: true })
  return ref.id
}

export async function removeCard(userId: string, id: string) {
  if (!db || !userId) return
  await deleteDoc(doc(db, "users", userId, CARDS_SUB, id))
}

// Card entries (users/{uid}/cards/{cardId}/entries)
export async function listCardEntries(userId: string, cardId: string): Promise<CardEntry[]> {
  if (!db || !userId || !cardId) return []
  const q = query(collection(db, "users", userId, CARDS_SUB, cardId, "entries"), orderBy("date", "desc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CardEntry[]
}

export async function addCardEntry(userId: string, cardId: string, e: Omit<CardEntry, "id">) {
  if (!db || !userId || !cardId) return null
  const col = collection(db, "users", userId, CARDS_SUB, cardId, "entries")
  const payload: any = { ...e, createdAt: serverTimestamp() }
  const ref = await addDoc(col, payload)
  return ref.id
}

export async function removeCardEntry(userId: string, cardId: string, id: string) {
  if (!db || !userId || !cardId) return
  await deleteDoc(doc(db, "users", userId, CARDS_SUB, cardId, "entries", id))
}

// Compute minimum payment (simple: %20 of statement debt, min 0)
export function computeMinimumPayment(currentDebt: number): number {
  if (!currentDebt || currentDebt <= 0) return 0
  return Math.max(0, Math.round(currentDebt * 0.2))
}

// Bankaya ve limite göre esnek asgari ödeme kuralı (Türkiye piyasasına uyumlu, varsayılanlar):
// - Taban oran: %20
// - Yüksek limit (>= 20.000₺) için: %30
// - Asgari taban tutar: 250₺
// Gerekirse bankaya özel oranlar buradan özelleştirilebilir.
const BANK_MIN_RULES: Record<string, { basePercent?: number; highLimitPercent?: number; highLimit?: number; floor?: number }> = {
  "Ziraat Bankası": { },
  "İş Bankası": { },
  "Garanti BBVA": { },
  "Akbank": { },
  "Yapı Kredi": { },
  "QNB Finansbank": { },
  "Halkbank": { },
  "VakıfBank": { },
  "Enpara": { },
}

export function computeMinimumPaymentForBank(bankName: string | undefined | null, creditLimit: number | null | undefined, currentDebt: number): number {
  if (!currentDebt || currentDebt <= 0) return 0
  const rule = (bankName && BANK_MIN_RULES[bankName]) || {}
  const base = rule.basePercent ?? 0.2
  const highLimit = rule.highLimit ?? 20000
  const highPct = rule.highLimitPercent ?? 0.3
  const floor = rule.floor ?? 250
  const pct = (creditLimit || 0) >= highLimit ? highPct : base
  return Math.max(floor, Math.round(currentDebt * pct))
}
