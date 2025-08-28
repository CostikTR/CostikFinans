"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, X, Minimize2, Maximize2, Image as ImageIcon, Trash2, ExternalLink } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { watchTransactions } from "@/lib/db"
import { auth } from "@/lib/firebase"
import type { Transaction } from "@/components/add-transaction-dialog"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { formatTRY } from "@/lib/utils"

type Props = {
  open: boolean
  onClose: () => void
  highlightDate?: string | Date
}

export function CalendarFloat({ open, onClose, highlightDate }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [pos, setPos] = useState({ x: 100, y: 120 })
  const [size, setSize] = useState({ w: 400, h: 480 })
  const [minimized, setMinimized] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)

  const dragRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const userId = auth?.currentUser?.uid || ""

  useEffect(() => {
    if (!userId || !open) return
    const unsub = watchTransactions(userId, setTransactions)
    return () => unsub?.()
  }, [userId, open])

  // Drag logic
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const nx = e.clientX - offsetRef.current.x
        const ny = e.clientY - offsetRef.current.y
        const maxX = Math.max(0, window.innerWidth - size.w - 8)
        const maxY = Math.max(0, window.innerHeight - 40)
        setPos({ x: Math.min(Math.max(0, nx), maxX), y: Math.min(Math.max(0, ny), maxY) })
      }
    }
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [size.w])

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    draggingRef.current = true
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
    e.preventDefault()
  }

  // Resize logic
  const resizingRef = useRef(false)
  const resizeStartRef = useRef({ w: 400, h: 480, x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (resizingRef.current) {
        const dx = e.clientX - resizeStartRef.current.x
        const dy = e.clientY - resizeStartRef.current.y
        const nw = Math.max(320, Math.min(900, resizeStartRef.current.w + dx))
        const nh = Math.max(260, Math.min(900, resizeStartRef.current.h + dy))
        setSize({ w: nw, h: nh })
      }
    }
    const onUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])
  const startResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    resizingRef.current = true
    resizeStartRef.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }
    document.body.style.userSelect = "none"
    document.body.style.cursor = "se-resize"
    e.preventDefault()
  }

  const dayModifiers = {
    income: transactions
      .filter((t) => t.type === "gelir")
      .map((t) => new Date(t.date)),
    expense: transactions
      .filter((t) => t.type === "gider")
      .map((t) => new Date(t.date)),
  newlyAdded: highlightDate ? [new Date(typeof highlightDate === "string" ? highlightDate : highlightDate)] : [],
  }

  const dayModifiersClassNames = {
    income: "day-income",
    expense: "day-expense",
  newlyAdded: "day-new",
  }

  const selectedDayTransactions = transactions.filter(
    (t) => selectedDate && format(new Date(t.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  )

  // Media (per-day image) persisted in localStorage keyed by userId + date (yyyy-MM-dd)
  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
  const STORAGE_KEY = userId ? `calendarMedia:${userId}` : `calendarMedia:guest`
  const loadMedia = () => {
    try {
      if (!dateKey) return null
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const map = JSON.parse(raw) as Record<string, string>
      return map[dateKey] || null
    } catch { return null }
  }
  const saveMedia = (dataUrl: string | null) => {
    try {
      if (!dateKey) return
      const raw = localStorage.getItem(STORAGE_KEY)
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
      if (dataUrl) map[dateKey] = dataUrl
      else delete map[dateKey]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }
  useEffect(() => {
    setMediaUrl(loadMedia())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, open])

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const onPickImage = () => fileInputRef.current?.click()
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || "")
      setMediaUrl(url)
      saveMedia(url)
    }
    reader.readAsDataURL(file)
    e.currentTarget.value = ""
  }
  const onRemoveImage = () => {
    setMediaUrl(null)
    saveMedia(null)
  }

  if (!open) return null

  return (
    <div style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 60, width: size.w }} className="select-none">
      <Card className="border-border/60 bg-card/95 backdrop-blur relative" style={{ width: size.w }}>
        <div ref={dragRef} onMouseDown={startDrag} className="flex items-center justify-between cursor-grab active:cursor-grabbing px-2 py-1 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarIcon className="h-4 w-4" /> İşlem Takvimi
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setMinimized((m) => !m)} title={minimized ? "Genişlet" : "Küçült"}>
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} title="Kapat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content toolbar (right side icon) */}
        {!minimized && (
          <div className="flex justify-end items-center px-2 py-1 border-b border-border/40">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <Button size="icon" variant="ghost" title="Fotoğraf Ekle/Göster" onClick={onPickImage}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

  {!minimized && (
          <div className="p-2" style={{ width: size.w, height: size.h }}>
            <style>{`
              .day-income { position: relative; }
              .day-income::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--chart-2)); }
              .day-expense { position: relative; }
              .day-expense::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background-color: hsl(var(--destructive)); }
              .day-new { position: relative; }
              .day-new::after { content: ''; position: absolute; bottom: 2px; right: 2px; width: 8px; height: 8px; border-radius: 50%; background-color: hsl(var(--primary)); box-shadow: 0 0 0 3px color-mix(in oklab, hsl(var(--primary)) 20%, transparent); }
            `}</style>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              locale={tr}
              modifiers={dayModifiers}
              modifiersClassNames={dayModifiersClassNames}
            />
            <div className="mt-4">
              <h4 className="font-semibold text-center mb-2">
                {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: tr }) : "Tarih Seçin"}
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {selectedDayTransactions.length > 0 ? (
                  selectedDayTransactions.map((t) => (
                    <div key={t.id} className={`flex justify-between items-center p-2 rounded-md ${t.type === 'gelir' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <span className="text-sm font-medium">{t.description}</span>
                      <span className={`font-semibold ${t.type === 'gelir' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'gelir' ? '+' : '-'}
                        {formatTRY(t.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground">Bu tarihte işlem yok.</p>
                )}
              </div>
            {/* Media preview/actions */}
            <div className="mt-3">
              {mediaUrl ? (
                <div className="rounded-md border border-border/60 p-2 flex items-center gap-3 bg-muted/30">
                  <a href={mediaUrl} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={mediaUrl} alt="Gün Fotoğrafı" className="w-20 h-20 object-cover rounded" />
                  </a>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={() => window.open(mediaUrl!, "_blank")}> <ExternalLink className="h-4 w-4 mr-1" /> Aç</Button>
                    <Button size="sm" variant="destructive" onClick={onRemoveImage}> <Trash2 className="h-4 w-4 mr-1" /> Kaldır</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">Bu güne henüz fotoğraf eklenmedi.</p>
              )}
            </div>
            </div>
            {/* Resize handle */}
            <div
              onMouseDown={startResize}
              title="Yeniden boyutlandır"
              className="absolute right-1 bottom-1 h-3 w-3 cursor-se-resize"
              style={{ borderRight: "6px solid transparent", borderBottom: "6px solid hsl(var(--border))" }}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
