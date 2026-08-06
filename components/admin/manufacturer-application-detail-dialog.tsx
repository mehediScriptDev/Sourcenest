"use client"

import { useEffect, useState } from "react"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { ManufacturerApplication } from "@/lib/api/admin-manufacturer-registrations"
import { fetchManufacturerDetail } from "@/lib/api/admin-manufacturer-registrations"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import {
  Building2,
  FileText,
  Globe,
  IdCard,
  ImageIcon,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

function Field({
  label,
  children,
  className,
  notProvidedLabel,
}: {
  label: string
  children: React.ReactNode
  className?: string
  notProvidedLabel: string
}) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="wrap-break-word text-sm font-medium text-foreground">
        {typeof children === 'string' && children === '—' ? (
          <span className="text-muted-foreground italic">{notProvidedLabel}</span>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function ManufacturerApplicationDetailDialog({
  open,
  onOpenChange,
  application,
  manufacturerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: ManufacturerApplication
  manufacturerId?: number | string
}) {
  const { t } = useTranslation()
  const c = t.admin.components.mfgApplicationDetail
  const common = t.admin.common
  const { toast } = useToast()
  const [detailedData, setDetailedData] = useState<ManufacturerApplication | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !manufacturerId) {
      setDetailedData(null)
      return
    }

    const loadDetail = async () => {
      try {
        setLoading(true)
        const response = await fetchManufacturerDetail(manufacturerId)
        setDetailedData(response.data)
      } catch {
        toast({
          title: common.error,
          description: c.loadFailed,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
  }, [open, manufacturerId, toast, common.error, c.loadFailed])

  const data = detailedData || application
  const company = data.company
  const factoryImages = data.factory_images || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent
        showCloseButton
        variant="structured"
        mobile="fullscreen"
        size="lg"
      >
        <DialogHeader className="shrink-0 space-y-4 border-b border-border bg-linear-to-r from-secondary/5 to-transparent px-4 pb-6 pt-6 text-left sm:px-6">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-secondary/20 to-secondary/10 shadow-sm">
              <Building2 className="h-7 w-7 text-secondary" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <DialogTitle className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                {company?.company_name?.trim() || data.company_name?.trim() || c.manufacturer}
              </DialogTitle>
              <DialogDescription className="mt-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.reference}{" "}
                <span className="font-mono text-sm font-semibold text-foreground">
                  #{data.application_reference || data.id}
                </span>
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-1">
            <Badge 
              variant="secondary" 
              className="capitalize font-semibold px-4 py-2 text-sm"
            >
              {data.manufacture_status_label || data.status || common.pending}
            </Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-5 shadow-sm hover:border-border/80 transition-colors">
                <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <IdCard className="h-4 w-4 text-blue-600" />
                  </div>
                  {c.contactInfo}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={c.firstName} notProvidedLabel={common.notProvided}>{data.first_name || "—"}</Field>
                  <Field label={c.lastName} notProvidedLabel={common.notProvided}>{data.last_name || "—"}</Field>
                  <Field label={common.email} className="sm:col-span-2" notProvidedLabel={common.notProvided}>
                    {data.email ? (
                      <a href={`mailto:${data.email}`} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors break-all">
                        {data.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Field>
                  <Field label={c.termsAccepted} className="sm:col-span-2" notProvidedLabel={common.notProvided}>
                    {data.agreed_to_terms || data.terms_accepted ? (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-semibold text-green-700">
                        <ShieldCheck className="h-4 w-4" />
                        {c.accepted}
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">{c.notAccepted}</span>
                    )}
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-5 shadow-sm hover:border-border/80 transition-colors">
                <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                    <Building2 className="h-4 w-4 text-purple-600" />
                  </div>
                  {c.companyInfo}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={c.companyName} className="sm:col-span-2" notProvidedLabel={common.notProvided}>
                    <span className="font-semibold text-base">
                      {company?.company_name || data.company_name || "—"}
                    </span>
                  </Field>
                  <Field label={common.country} notProvidedLabel={common.notProvided}>{company?.country || data.country || "—"}</Field>
                  <Field label={common.city} notProvidedLabel={common.notProvided}>{company?.city || data.city || "—"}</Field>
                  <Field label={c.website} className="sm:col-span-2" notProvidedLabel={common.notProvided}>
                    {(company?.company_website || data.company_website)?.trim() ? (
                      <a
                        href={company?.company_website || data.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors break-all"
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        {company?.company_website || data.company_website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Field>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-5 shadow-sm hover:border-border/80 transition-colors">
                <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  {c.verificationDocs}
                </h3>
                <Field label={c.businessLicense} notProvidedLabel={common.notProvided}>
                  {company?.bussiness_license_url ? (
                    <a
                      href={company.bussiness_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-500/20 transition-colors"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      {c.viewLicense}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">{common.notProvided}</span>
                  )}
                </Field>
              </div>

              {factoryImages && factoryImages.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-5 shadow-sm hover:border-border/80 transition-colors">
                  <h3 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
                      <ImageIcon className="h-4 w-4 text-pink-600" />
                    </div>
                    {c.factoryPhotos} <Badge variant="outline" className="ml-auto font-semibold">{factoryImages.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {factoryImages.map((img, i) => (
                      <a
                        key={`${img.id}-${i}`}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border/60 bg-muted shadow-sm hover:shadow-md transition-shadow"
                      >
                        <img
                          src={img.url}
                          alt={common.factoryPhoto.replace("{n}", String(i + 1))}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminDialogContent>
    </Dialog>
  )
}
