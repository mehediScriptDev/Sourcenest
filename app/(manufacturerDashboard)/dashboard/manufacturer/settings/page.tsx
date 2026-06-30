"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Shield,
  Globe,
  User,
  Save,
  Loader2
} from "lucide-react"
import { AccountDangerZone } from "@/components/settings/account-danger-zone"
import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import { LanguageSelector } from "@/components/settings/language-selector"
import { useTranslation } from "@/lib/i18n"
import { getManufacturerProfile, updateBasicProfile } from "@/lib/api/manufacturer-profile"
import { useToast } from "@/components/ui/use-toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import Swal from "sweetalert2"

export default function ManufacturerSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [basicProfile, setBasicProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)
        const res = await getManufacturerProfile()
        if (res.success && res.data) {
          setBasicProfile({
            firstName: res.data.first_name || "",
            lastName: res.data.last_name || "",
            email: res.data.email || "",
            phone: res.data.company?.phone || ""
          })
        }
      } catch (err: any) {
        toast({ title: "Failed to load profile", description: getApiErrorMessage(err) || String(err), variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [toast])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const resBasic = await updateBasicProfile({
        first_name: basicProfile.firstName,
        last_name: basicProfile.lastName,
        email: basicProfile.email,
        phone: basicProfile.phone
      })

      if (resBasic && resBasic.success === false) {
        throw new Error(resBasic.message || "Failed to update basic profile")
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Settings updated successfully',
        confirmButtonColor: '#0f172a',
      })
    } catch (err: any) {
      toast({ title: "Update failed", description: getApiErrorMessage(err) || String(err), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{t.settings.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {t.settings.subtitle}
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t.common.save}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.settings.accountDetails}
              </CardTitle>
              <CardDescription>
                {t.settings.accountCredentialsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">{t.settings.firstName}</label>
                  <Input 
                    value={basicProfile.firstName}
                    onChange={(e) => setBasicProfile({ ...basicProfile, firstName: e.target.value })}
                    className="mt-2" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t.settings.lastName}</label>
                  <Input 
                    value={basicProfile.lastName}
                    onChange={(e) => setBasicProfile({ ...basicProfile, lastName: e.target.value })}
                    className="mt-2" 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.settings.emailAddress}</label>
                <Input 
                  value={basicProfile.email}
                  onChange={(e) => setBasicProfile({ ...basicProfile, email: e.target.value })}
                  className="mt-2" 
                  type="email" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.settings.phoneNumber}</label>
                <Input 
                  value={basicProfile.phone}
                  onChange={(e) => setBasicProfile({ ...basicProfile, phone: e.target.value })}
                  className="mt-2" 
                  type="tel" 
                />
              </div>
              <Button variant="outline">{t.settings.changePassword}</Button>
            </CardContent>
          </Card>


          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t.settings.languageRegion}
              </CardTitle>
              <CardDescription>
                {t.settings.languageRegionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">{t.settings.language}</label>
                  <LanguageSelector />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t.settings.timezone}</label>
                  <Select defaultValue="asia-shanghai">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-shanghai">Asia/Shanghai (GMT+8)</SelectItem>
                      <SelectItem value="america-los-angeles">America/Los Angeles (GMT-8)</SelectItem>
                      <SelectItem value="europe-london">Europe/London (GMT+0)</SelectItem>
                      <SelectItem value="europe-berlin">Europe/Berlin (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t.settings.currencyDisplay}</label>
                <Select defaultValue="usd">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD - US Dollar</SelectItem>
                    <SelectItem value="eur">EUR - Euro</SelectItem>
                    <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    <SelectItem value="cny">CNY - Chinese Yuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t.settings.security}
              </CardTitle>
              <CardDescription>
                {t.settings.securityDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TwoFactorSettings />
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">{t.settings.loginHistory}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.loginHistoryDesc}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/manufacturer/settings/login-history">{t.common.view}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          <AccountDangerZone />
        </div>
      </div>
    </div>
  )
}
