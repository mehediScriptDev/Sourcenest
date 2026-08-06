"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Settings,
  Shield,
  Globe,
  Database,
  Save,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { LOCALES, useTranslation } from "@/lib/i18n"
import { LanguageSelector } from "@/components/settings/language-selector"
import { useToast } from "@/hooks/use-toast"
import { fetchCurrencies, type Currency } from "@/lib/api/currencies"
import {
  createDatabaseExport,
  downloadDatabaseExport,
  fetchAdminPlatformSettings,
  fetchDatabaseBackupStatus,
  fetchDatabaseExports,
  fetchDatabaseTables,
  updateAdminPlatformSettings,
  type DatabaseExport,
  type PlatformSettings,
} from "@/lib/api/admin-platform-settings"

const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platform_name: "",
    support_email: "",
    contact_phone: "",
  },
  security: {
    require_email_verification: true,
    manual_supplier_approval: true,
    rate_limiting: true,
  },
  localization: {
    default_language: "en",
    default_currency: "USD",
    default_timezone: "UTC",
  },
}

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const

function exportStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default"
    case "failed":
      return "destructive"
    case "processing":
      return "secondary"
    default:
      return "outline"
  }
}

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false)

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [exports, setExports] = useState<DatabaseExport[]>([])
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportScope, setExportScope] = useState<"full" | "tables">("full")
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isSubmittingExport, setIsSubmittingExport] = useState(false)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    const result = await fetchAdminPlatformSettings()
    if (result.success && result.data) {
      setSettings(result.data)
    } else {
      toast({
        title: t.settings.title,
        description: result.message || t.settings.failedToLoadSettings,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }, [toast, t.settings.title])

  const loadDatabaseInfo = useCallback(async () => {
    setIsLoadingDatabase(true)
    const [backupResult, exportsResult] = await Promise.all([
      fetchDatabaseBackupStatus(),
      fetchDatabaseExports(1),
    ])

    if (backupResult.success && backupResult.data) {
      setLastBackupAt(backupResult.data.last_backup_at)
    }

    if (exportsResult.success) {
      setExports(exportsResult.data)
    }

    setIsLoadingDatabase(false)
  }, [])

  useEffect(() => {
    void loadSettings()
    void loadDatabaseInfo()
  }, [loadSettings, loadDatabaseInfo])

  useEffect(() => {
    let cancelled = false
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true)
      try {
        const data = await fetchCurrencies()
        if (!cancelled) setCurrencies(data)
      } catch {
        // fetchCurrencies logs internally
      } finally {
        if (!cancelled) setIsLoadingCurrencies(false)
      }
    }
    void loadCurrencies()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateAdminPlatformSettings({
      general: settings.general,
      security: settings.security,
      localization: settings.localization,
    })
    setIsSaving(false)

    if (result.success && result.data) {
      setSettings(result.data)
      toast({
        title: t.common.save,
        description: result.message || t.settings.settingsSavedSuccess,
      })
    } else {
      toast({
        title: t.common.save,
        description: result.message || t.settings.failedToSaveSettings,
        variant: "destructive",
      })
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    const result = await createDatabaseExport({ type: "backup", scope: "full" })
    setIsCreatingBackup(false)

    if (result.success) {
      toast({
        title: t.settings.createBackup,
        description: result.message || t.settings.backupQueuedSuccess,
      })
      void loadDatabaseInfo()
    } else {
      toast({
        title: t.settings.createBackup,
        description: result.message || t.settings.failedToQueueBackup,
        variant: "destructive",
      })
    }
  }

  const openExportDialog = async () => {
    setExportDialogOpen(true)
    setExportScope("full")
    setSelectedTables([])
    setIsLoadingTables(true)
    const result = await fetchDatabaseTables()
    setIsLoadingTables(false)
    if (result.success) {
      setAvailableTables(result.data)
    } else {
      toast({
        title: t.settings.exportData,
        description: result.message || t.settings.failedToLoadTables,
        variant: "destructive",
      })
    }
  }

  const toggleTable = (table: string, checked: boolean) => {
    setSelectedTables((prev) =>
      checked ? [...prev, table] : prev.filter((name) => name !== table)
    )
  }

  const handleSubmitExport = async () => {
    if (exportScope === "tables" && selectedTables.length === 0) {
      toast({
        title: t.settings.exportData,
        description: t.settings.selectAtLeastOneTable,
        variant: "destructive",
      })
      return
    }

    setIsSubmittingExport(true)
    const result = await createDatabaseExport({
      type: "export",
      scope: exportScope,
      ...(exportScope === "tables" ? { tables: selectedTables } : {}),
    })
    setIsSubmittingExport(false)

    if (result.success) {
      toast({
        title: t.settings.exportData,
        description: result.message || t.settings.exportQueuedSuccess,
      })
      setExportDialogOpen(false)
      void loadDatabaseInfo()
    } else {
      toast({
        title: t.settings.exportData,
        description: result.message || t.settings.failedToQueueExport,
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (item: DatabaseExport) => {
    setDownloadingId(item.id)
    const result = await downloadDatabaseExport(item.id, item.download_name || undefined)
    setDownloadingId(null)

    if (!result.success) {
      toast({
        title: t.settings.exportData,
        description: result.message || t.settings.downloadFailed,
        variant: "destructive",
      })
    }
  }

  const updateGeneral = (field: keyof PlatformSettings["general"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [field]: value },
    }))
  }

  const updateSecurity = (field: keyof PlatformSettings["security"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }))
  }

  const updateLocalization = (
    field: keyof PlatformSettings["localization"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      localization: { ...prev.localization, [field]: value },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">{t.settings.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.settings.adminSubtitle}</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t.common.save}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t.nav.loading}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t.settings.generalSettings}
              </CardTitle>
              <CardDescription>{t.settings.generalSettingsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.platformName}
                </label>
                <Input
                  value={settings.general.platform_name}
                  onChange={(e) => updateGeneral("platform_name", e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.supportEmail}
                </label>
                <Input
                  value={settings.general.support_email}
                  onChange={(e) => updateGeneral("support_email", e.target.value)}
                  className="mt-2"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.contactPhone}
                </label>
                <Input
                  value={settings.general.contact_phone}
                  onChange={(e) => updateGeneral("contact_phone", e.target.value)}
                  className="mt-2"
                  type="tel"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t.settings.securitySettings}
              </CardTitle>
              <CardDescription>{t.settings.securitySettingsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {t.settings.requireEmailVerification}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.requireEmailVerificationDesc}
                  </p>
                </div>
                <Switch
                  checked={settings.security.require_email_verification}
                  onCheckedChange={(v) => updateSecurity("require_email_verification", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {t.settings.manualSupplierApproval}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.settings.manualSupplierApprovalDesc}
                  </p>
                </div>
                <Switch
                  checked={settings.security.manual_supplier_approval}
                  onCheckedChange={(v) => updateSecurity("manual_supplier_approval", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t.settings.rateLimiting}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.rateLimitingDesc}</p>
                </div>
                <Switch
                  checked={settings.security.rate_limiting}
                  onCheckedChange={(v) => updateSecurity("rate_limiting", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t.settings.localization}
              </CardTitle>
              <CardDescription>{t.settings.localizationDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.language}
                </label>
                <p className="text-sm text-muted-foreground">{t.settings.languageRegionDesc}</p>
                <LanguageSelector />
              </div>
              {/* Commented out per user request - Default Language Selector
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.defaultLanguage}
                </label>
                <Select
                  value={settings.localization.default_language}
                  onValueChange={(v) => updateLocalization("default_language", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale.code} value={locale.code}>
                        <span className="inline-flex items-center gap-2">
                          <span>{locale.flag}</span>
                          <span>{locale.nativeName}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.defaultCurrency}
                </label>
                <Select
                  value={settings.localization.default_currency}
                  onValueChange={(v) => updateLocalization("default_currency", v)}
                  disabled={isLoadingCurrencies || currencies.length === 0}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={isLoadingCurrencies ? t.nav.loading : undefined} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} — {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  {t.settings.defaultTimezone}
                </label>
                <Select
                  value={settings.localization.default_timezone}
                  onValueChange={(v) => updateLocalization("default_timezone", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t.settings.database}
              </CardTitle>
              <CardDescription>{t.settings.databaseDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">{t.settings.lastBackup}</p>
                <p className="font-medium text-foreground">
                  {isLoadingDatabase ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.nav.loading}
                    </span>
                  ) : lastBackupAt ? (
                    lastBackupAt
                  ) : (
                    t.settings.noBackupsYet
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup || isLoadingDatabase}
                >
                  {isCreatingBackup ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t.settings.createBackup}
                </Button>
                <Button
                  variant="outline"
                  onClick={openExportDialog}
                  disabled={isLoadingDatabase}
                >
                  {t.settings.exportData}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void loadDatabaseInfo()}
                  disabled={isLoadingDatabase}
                  aria-label="Refresh export history"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingDatabase ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {exports.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{t.settings.recentExports}</p>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {exports.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.type} · {item.scope}
                            {item.scope === "tables" && item.tables?.length
                              ? ` (${item.tables.length} tables)`
                              : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.created_at || "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={exportStatusVariant(item.status)}>
                            {item.status}
                          </Badge>
                          {item.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleDownload(item)}
                              disabled={downloadingId === item.id}
                              aria-label="Download export"
                            >
                              {downloadingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.settings.exportData}</DialogTitle>
            <DialogDescription>{t.settings.databaseDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <RadioGroup
              value={exportScope}
              onValueChange={(v) => setExportScope(v as "full" | "tables")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="export-full" />
                <Label htmlFor="export-full">{t.settings.exportFullDatabase}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tables" id="export-tables" />
                <Label htmlFor="export-tables">{t.settings.exportSelectTables}</Label>
              </div>
            </RadioGroup>

            {exportScope === "tables" && (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                {isLoadingTables ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.nav.loading}
                  </div>
                ) : availableTables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.settings.noTablesAvailable}</p>
                ) : (
                  availableTables.map((table) => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table}`}
                        checked={selectedTables.includes(table)}
                        onCheckedChange={(checked) => toggleTable(table, checked === true)}
                      />
                      <Label htmlFor={`table-${table}`} className="font-normal">
                        {table}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmitExport} disabled={isSubmittingExport}>
              {isSubmittingExport ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.settings.exportData}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
