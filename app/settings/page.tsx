"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { auth } from "@/lib/firebase"
import { AuthGuard } from "@/components/auth-guard"
import { getUserSettings, setUserSettings, watchUserSettings } from "@/lib/db"
import Link from "next/link"

type Settings = {
  currency: string
  locale: string
  notifications: boolean
  expenseAlertThreshold?: number
  monthResetDay?: number
  carryover?: boolean
  currentPeriodRealBalance?: number
  allTimeRealBalance?: number
}

const DEFAULTS: Settings = {
  currency: "TRY",
  locale: "tr-TR",
  notifications: true,
  monthResetDay: 1,
  carryover: true,
  currentPeriodRealBalance: undefined,
  allTimeRealBalance: undefined,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const u = auth?.currentUser
    if (u) {
      const unsub = watchUserSettings(u.uid, (s) => {
        if (s) {
          const merged = { ...DEFAULTS, ...s }
          setSettings(merged)
          try { localStorage.setItem("settings", JSON.stringify(merged)) } catch {}
        }
      })
      getUserSettings(u.uid).then((s) => {
        if (s) {
          const merged = { ...DEFAULTS, ...s }
          setSettings(merged)
          try { localStorage.setItem("settings", JSON.stringify(merged)) } catch {}
        }
      })
      return () => {
        if (unsub) unsub()
      }
    }
    try {
      const raw = localStorage.getItem("settings")
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const u = auth?.currentUser
      if (u) {
        await setUserSettings(u.uid, settings)
        try { localStorage.setItem("settings", JSON.stringify(settings)) } catch {}
      } else {
        localStorage.setItem("settings", JSON.stringify(settings))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline">Geri</Button>
          </Link>
          <h1 className="text-2xl font-bold">Ayarlar</h1>
        </div>
        <ThemeToggle />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel</CardTitle>
            <CardDescription>Uygulama tercihlerinizi yönetin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Input value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Yerel</Label>
              <Input value={settings.locale} onChange={(e) => setSettings((s) => ({ ...s, locale: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ay Sıfırlama Günü</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={String(settings.monthResetDay ?? 1)}
                  onChange={(e) => setSettings((s) => ({ ...s, monthResetDay: Math.max(1, Math.min(31, Number(e.target.value || 1))) }))}
                />
                <p className="text-xs text-muted-foreground">Ayın hangi günü yeni dönem başlasın? (1-31)</p>
              </div>
              <div className="space-y-2">
                <Label>Artan Bakiye Devri</Label>
                <div className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span className="text-sm text-muted-foreground">Önceki aydan kalan bakiyeyi devret</span>
                  <Switch checked={!!settings.carryover} onCheckedChange={(v: boolean | "indeterminate") => setSettings((s) => ({ ...s, carryover: Boolean(v) }))} />
                </div>
              </div>
            </div>
            <Separator />
            {/* Gerçek bakiye alanları kullanıcı isteğiyle kaldırıldı */}
            <div className="space-y-2">
              <Label>Gider Uyarı Eşiği (₺)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={String(settings.expenseAlertThreshold ?? "")}
                onChange={(e) => setSettings((s) => ({ ...s, expenseAlertThreshold: e.target.value ? Number(e.target.value) : undefined }))}
              />
              <p className="text-xs text-muted-foreground">Bu eşik aşıldığında bildirim üretir.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Bildirimler</Label>
                <p className="text-sm text-muted-foreground">Yeni işlem ve hatırlatmalar için bildirim al</p>
              </div>
              <Switch checked={settings.notifications} onCheckedChange={(v: boolean | "indeterminate") => setSettings((s) => ({ ...s, notifications: Boolean(v) }))} />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
            <CardDescription>Hesap ayarları ve güvenlik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="text-muted-foreground">Durum</div>
              <div>{auth?.currentUser ? `Giriş yapıldı: ${auth.currentUser.email}` : "Misafir"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
  </div>
  </AuthGuard>
  )
}

