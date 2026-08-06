"use client"

import { useMemo, useState } from "react"
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
import {
  Camera,
  FileSearch,
  ScanEye,
  Loader2,
  Copy,
  Check,
  Shield,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { ManufacturerApplication } from "@/lib/api/admin-manufacturer-registrations"
import {
  generateReviewCode,
  DEFAULT_FACTORY_AREAS,
  type ReviewType,
} from "@/lib/api/admin-reviews"
import { createManufacturerAdditionalInformationRequest } from "@/lib/api/admin-manufacturer-additional-information"
import type { AdditionalInformationResponseType } from "@/lib/api/manufacturer-additional-information"
import { getApiErrorMessage } from "@/lib/api/errors"

const FACTORY_AREA_KEY_MAP: Record<string, "factoryEntrance" | "warehouse" | "machinery" | "productionLine" | "qualityControl" | "packagingArea" | "loadingDock"> = {
  "Factory Entrance": "factoryEntrance",
  "Warehouse": "warehouse",
  "Machinery": "machinery",
  "Production Line": "productionLine",
  "Quality Control Area": "qualityControl",
  "Packaging Area": "packagingArea",
  "Loading Dock": "loadingDock",
}

function reviewTypeToAllowedTypes(reviewType: ReviewType): AdditionalInformationResponseType[] {
  if (reviewType === "additional_document_review") {
    return ["document", "text"]
  }

  return ["image", "video"]
}

function buildReviewMessage(params: {
  reviewTypeLabel: string
  reviewCode: string
  requestedAreas: string[]
  instructions?: string
}): string {
  const lines = [
    `Review Type: ${params.reviewTypeLabel}`,
    `Verification Code: ${params.reviewCode}`,
  ]

  if (params.requestedAreas.length > 0) {
    lines.push(`Requested Areas: ${params.requestedAreas.join(", ")}`)
  }

  if (params.instructions?.trim()) {
    lines.push("", "Additional Instructions:", params.instructions.trim())
  }

  lines.push(
    "",
    "Please use the live camera only. Gallery uploads are blocked.",
    `Overlay verification code ${params.reviewCode} during captures.`
  )

  return lines.join("\n")
}

interface RequestReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manufacturer: ManufacturerApplication
}

export default function RequestReviewDialog({
  open,
  onOpenChange,
  manufacturer,
}: RequestReviewDialogProps) {
  const { t } = useTranslation()
  const c = t.admin.components.requestReview
  const rt = t.admin.reviewType
  const fa = t.admin.factoryAreas
  const common = t.admin.common
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const reviewTypeOptions = useMemo(() => [
    {
      value: "live_factory_capture" as ReviewType,
      label: rt.live_factory_capture,
      description: rt.live_factory_capture_desc,
      icon: Camera,
    },
    {
      value: "additional_document_review" as ReviewType,
      label: rt.additional_document_review,
      description: rt.additional_document_review_desc,
      icon: FileSearch,
    },
    {
      value: "specific_area_capture" as ReviewType,
      label: rt.specific_area_capture,
      description: rt.specific_area_capture_desc,
      icon: ScanEye,
    },
  ], [rt])

  const [reviewType, setReviewType] = useState<ReviewType>("live_factory_capture")
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [customArea, setCustomArea] = useState("")
  const [instructions, setInstructions] = useState("")
  const [reviewCode] = useState(() => generateReviewCode())

  const getAreaLabel = (area: string) => {
    const key = FACTORY_AREA_KEY_MAP[area]
    return key ? fa[key] : area
  }

  const showAreasSelection =
    reviewType === "live_factory_capture" || reviewType === "specific_area_capture"

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const addCustomArea = () => {
    const trimmed = customArea.trim()
    if (trimmed && !selectedAreas.includes(trimmed)) {
      setSelectedAreas((prev) => [...prev, trimmed])
      setCustomArea("")
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(reviewCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleSubmit = async () => {
    if (showAreasSelection && selectedAreas.length === 0) {
      toast({
        title: c.selectAreas,
        description: c.selectAreasDesc,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const selectedType = reviewTypeOptions.find((option) => option.value === reviewType)
      const response = await createManufacturerAdditionalInformationRequest(manufacturer.id, {
        message: buildReviewMessage({
          reviewTypeLabel: selectedType?.label ?? reviewType,
          reviewCode,
          requestedAreas: selectedAreas,
          instructions: instructions || undefined,
        }),
        allowed_types: reviewTypeToAllowedTypes(reviewType),
      })

      const name = manufacturer.company_name || manufacturer.email
      toast({
        title: c.reviewRequested,
        description: response.message || c.reviewRequestedDesc.replace("{code}", reviewCode).replace("{name}", name),
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: common.error,
        description: getApiErrorMessage(error, c.createFailed),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const companyName =
    manufacturer.company_name?.trim() ||
    [manufacturer.first_name, manufacturer.last_name].filter(Boolean).join(" ") ||
    manufacturer.email

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent
        showCloseButton
        variant="structured"
        mobile="fullscreen"
        size="md"
      >
        <DialogHeader className="shrink-0 space-y-3 border-b border-border bg-linear-to-r from-secondary/5 to-transparent px-5 pb-5 pt-5 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-secondary/20 to-secondary/10 shadow-sm">
              <ScanEye className="h-5 w-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold leading-tight">
                {c.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {c.subtitle.replace("{name}", companyName)}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-3">
            <Shield className="h-5 w-5 shrink-0 text-secondary" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-secondary/80">
                {c.reviewCode}
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold tracking-widest text-secondary">
                {reviewCode}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-secondary hover:bg-secondary/15"
              onClick={copyCode}
            >
              {codeCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{c.reviewType}</Label>
              <div className="grid gap-2.5">
                {reviewTypeOptions.map((option) => {
                  const selected = reviewType === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setReviewType(option.value)
                        if (option.value === "additional_document_review") {
                          setSelectedAreas([])
                        }
                      }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                        selected
                          ? "border-secondary bg-secondary/5 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-secondary/15 text-secondary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <option.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            selected ? "text-secondary" : "text-foreground"
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                          selected
                            ? "border-secondary bg-secondary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selected && (
                          <Check className="h-full w-full p-0.5 text-white" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {showAreasSelection && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  <MapPin className="mb-0.5 mr-1.5 inline h-4 w-4 text-muted-foreground" />
                  {c.requestedAreas}
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DEFAULT_FACTORY_AREAS.map((area) => (
                    <label
                      key={area}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        selectedAreas.includes(area)
                          ? "border-secondary/30 bg-secondary/5"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={selectedAreas.includes(area)}
                        onCheckedChange={() => toggleArea(area)}
                        className="data-[state=checked]:border-secondary data-[state=checked]:bg-secondary"
                      />
                      <span className="text-sm">{getAreaLabel(area)}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={c.addCustomArea}
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomArea())}
                    className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addCustomArea}
                    disabled={!customArea.trim()}
                  >
                    {c.add}
                  </Button>
                </div>

                {selectedAreas
                  .filter((a) => !(DEFAULT_FACTORY_AREAS as readonly string[]).includes(a))
                  .map((area) => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className="mr-1.5 gap-1 px-2.5 py-1"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => toggleArea(area)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}

                {selectedAreas.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedAreas.length === 1
                      ? common.areasSelectedSingular
                      : common.areasSelectedPlural.replace("{count}", String(selectedAreas.length))}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                {c.additionalInstructions}{" "}
                <span className="font-normal text-muted-foreground">{common.optional}</span>
              </Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={c.instructionsPlaceholder}
                className="min-h-20 resize-none"
              />
            </div>

            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-semibold">{c.howItWorks}</p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-amber-700 dark:text-amber-400">
                <li>{c.howItWorks1}</li>
                <li>{c.howItWorks2}</li>
                <li>{c.howItWorks3.replace("{code}", reviewCode)}</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {common.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (showAreasSelection && selectedAreas.length === 0)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {common.sending}
              </>
            ) : (
              <>
                <ScanEye className="mr-2 h-4 w-4" />
                {c.sendReviewRequest}
              </>
            )}
          </Button>
        </DialogFooter>
      </AdminDialogContent>
    </Dialog>
  )
}
