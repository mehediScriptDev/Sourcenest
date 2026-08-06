"use client"

import { useEffect, useState } from "react"
import { AdminDialogContent } from "@/components/admin/admin-dialog-content"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import { Loader2, FileQuestion } from "lucide-react"
import type { ManufacturerApplication } from "@/lib/api/admin-manufacturer-registrations"
import { createManufacturerAdditionalInformationRequest } from "@/lib/api/admin-manufacturer-additional-information"
import type { AdditionalInformationResponseType } from "@/lib/api/manufacturer-additional-information"
import { getApiErrorMessage } from "@/lib/api/errors"

const RESPONSE_TYPE_OPTIONS: Array<{
  value: AdditionalInformationResponseType
  labelKey: "text" | "image" | "video" | "audio" | "document"
}> = [
  { value: "text", labelKey: "text" },
  { value: "image", labelKey: "image" },
  { value: "video", labelKey: "video" },
  { value: "audio", labelKey: "audio" },
  { value: "document", labelKey: "document" },
]

interface RequestAdditionalInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manufacturer: ManufacturerApplication | null
  onSuccess?: () => void
}

function displayName(row: ManufacturerApplication) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—"
}

function displayCompany(row: ManufacturerApplication) {
  return row.company_name?.trim() || row.company?.company_name?.trim() || "—"
}

export default function RequestAdditionalInfoDialog({
  open,
  onOpenChange,
  manufacturer,
  onSuccess,
}: RequestAdditionalInfoDialogProps) {
  const { t } = useTranslation()
  const p = t.admin.components.requestAdditionalInfo
  const c = t.admin.common
  const { toast } = useToast()

  const [message, setMessage] = useState("")
  const [allowedTypes, setAllowedTypes] = useState<AdditionalInformationResponseType[]>([
    "text",
    "document",
    "image",
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setMessage("")
      setAllowedTypes(["text", "document", "image"])
    }
  }, [open, manufacturer?.id])

  const toggleType = (type: AdditionalInformationResponseType) => {
    setAllowedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    )
  }

  const handleSubmit = async () => {
    if (!manufacturer) return

    if (!message.trim()) {
      toast({
        title: c.missingReason,
        description: p.messageRequired,
        variant: "destructive",
      })
      return
    }

    if (allowedTypes.length === 0) {
      toast({
        title: c.missingReason,
        description: p.typesRequired,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await createManufacturerAdditionalInformationRequest(manufacturer.id, {
        message: message.trim(),
        allowed_types: allowedTypes,
      })

      toast({
        title: c.success,
        description: response.message || p.requestSent,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: c.error,
        description: getApiErrorMessage(error, p.requestFailed),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-secondary" />
            {p.title}
          </DialogTitle>
          <DialogDescription>{p.subtitle}</DialogDescription>
        </DialogHeader>

        {manufacturer && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">{displayName(manufacturer)}</p>
            <p className="text-muted-foreground break-all">{manufacturer.email}</p>
            {displayCompany(manufacturer) !== "—" && (
              <p className="text-muted-foreground">{displayCompany(manufacturer)}</p>
            )}
            <Badge variant="secondary" className="capitalize">
              {manufacturer.manufacture_status_label || manufacturer.status || c.pending}
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additional-info-message">{p.messageLabel}</Label>
            <Textarea
              id="additional-info-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={p.messagePlaceholder}
              className="min-h-28"
              disabled={submitting}
            />
          </div>

          <div className="space-y-3">
            <Label>{p.allowedTypesLabel}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {RESPONSE_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <Checkbox
                    checked={allowedTypes.includes(option.value)}
                    onCheckedChange={() => toggleType(option.value)}
                    disabled={submitting}
                  />
                  <span>{p.responseTypes[option.labelKey]}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{p.manufacturerHint}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {c.cancel}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {p.sending}
              </>
            ) : (
              p.sendRequest
            )}
          </Button>
        </DialogFooter>
      </AdminDialogContent>
    </Dialog>
  )
}
