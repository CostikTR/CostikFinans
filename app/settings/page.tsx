"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth-guard"
import { PushNotificationToggleCompact } from "@/components/push-notification-toggle"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Moon, Globe, Lock, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground">
            Uygulama ayarlarınızı ve tercihlerinizi yönetin
          </p>
        </div>

        {/* Bildirim Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Bildirim Ayarları</CardTitle>
            </div>
            <CardDescription>
              Push bildirimleri ve uyarı tercihlerinizi yönetin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PushNotificationToggleCompact />
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">
                  Önemli güncellemeler için e-posta alın
                </p>
              </div>
              <Switch id="email-notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="transaction-alerts">İşlem Uyarıları</Label>
                <p className="text-sm text-muted-foreground">
                  Yeni işlemler için anında bildirim
                </p>
              </div>
              <Switch id="transaction-alerts" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-alerts">Bütçe Uyarıları</Label>
                <p className="text-sm text-muted-foreground">
                  Bütçe limitlerini aştığınızda uyarı
                </p>
              </div>
              <Switch id="budget-alerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Görünüm Ayarları */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              <CardTitle>Görünüm</CardTitle>
            </div>
            <CardDescription>
              Uygulama görünümünü özelleştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Karanlık Mod</Label>
                <p className="text-sm text-muted-foreground">
                  Otomatik tema değişimi
                </p>
              </div>
              <Switch id="dark-mode" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-view">Kompakt Görünüm</Label>
                <p className="text-sm text-muted-foreground">
                  Daha fazla veri göster
                </p>
              </div>
              <Switch id="compact-view" />
            </div>
          </CardContent>
        </Card>

        {/* Dil ve Bölge */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Dil ve Bölge</CardTitle>
            </div>
            <CardDescription>
              Dil ve para birimi ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <select
                id="language"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <select
                id="currency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="TRY">₺ Türk Lirası (TRY)</option>
                <option value="USD">$ Amerikan Doları (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Güvenlik */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Güvenlik</CardTitle>
            </div>
            <CardDescription>
              Hesap güvenliği ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">İki Faktörlü Kimlik Doğrulama</Label>
                <p className="text-sm text-muted-foreground">
                  Ekstra güvenlik katmanı ekleyin
                </p>
              </div>
              <Switch id="two-factor" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="biometric">Biyometrik Giriş</Label>
                <p className="text-sm text-muted-foreground">
                  Parmak izi veya yüz tanıma
                </p>
              </div>
              <Switch id="biometric" />
            </div>
          </CardContent>
        </Card>

        {/* Veri Yönetimi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Veri Yönetimi</CardTitle>
            </div>
            <CardDescription>
              Verilerinizi yedekleyin veya dışa aktarın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-backup">Otomatik Yedekleme</Label>
                <p className="text-sm text-muted-foreground">
                  Günlük otomatik yedekleme
                </p>
              </div>
              <Switch id="auto-backup" defaultChecked />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <button className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/10">
                Verileri Dışa Aktar (JSON)
              </button>
              <button className="w-full px-4 py-2 text-sm font-medium text-destructive border border-destructive rounded-md hover:bg-destructive/10">
                Tüm Verileri Sil
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
