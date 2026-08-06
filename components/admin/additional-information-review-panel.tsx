"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
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
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"
import {
  fetchManufacturerAdditionalInformationDetail,
  reviewManufacturerAdditionalInformationRequest,
} from "@/lib/api/admin-manufacturer-additional-information"
import type { ManufacturerApplication } from "@/lib/api/admin-manufacturer-registrations"
import RequestAdditionalInfoDialog from "@/components/admin/request-additional-info-dialog"
import { getApiErrorMessage } from "@/lib/api/errors"

function statusVariant(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
    case "submitted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
    case "expired":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
    default:
      return ""
  }
}

export function VerificationRequestStatusBadge({ status, label }: { status: string; label?: string }) {
  const { t } = useTranslation()
  const rs = t.admin.reviewStatus
  const display = label || rs[status as keyof typeof rs] || status

  return (
    <Badge variant="secondary" className={cn("font-semibold capitalize", statusVariant(status))}>
      {display}
    </Badge>
  )
}

interface AdditionalInformationReviewPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: AdditionalInformationRequest
  onReviewComplete?: () => void
}

export default function AdditionalInformationReviewPanel({
  open,
  onOpenChange,
  request,
  onReviewComplete,
}: AdditionalInformationReviewPanelProps) {
  const { t } = useTranslation()
  const c = t.admin.components.additionalInformationReview
  const common = t.admin.common
  const roles = t.admin.roles
  const { toast } = useToast()
  const [detail, setDetail] = useState<AdditionalInformationRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [requestMoreOpen, setRequestMoreOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setDetail(null)
      setRejectMode(false)
      setRejectReason("")
      setReviewNotes("")
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchManufacturerAdditionalInformationDetail(request.id)
        if (!cancelled) {
          setDetail(data ?? request)
        }
      } catch {
        if (!cancelled) {
          toast({
            title: common.error,
            description: c.loadFailed,
            variant: "destructive",
          })
          setDetail(request)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, request, toast, common.error, c.loadFailed])

  const current = detail ?? request
  const manufacturer = current.manufacturer
  const manufacturerLabel =
    manufacturer?.company_name ||
    manufacturer?.name ||
    manufacturer?.email ||
    roles.manufacturer

  const canReview = current.status === "submitted"
  const canRequestMore =
    manufacturer != null &&
    ["submitted", "pending", "expired", "rejected", "accepted"].includes(current.status)

  const manufacturerForDialog = useMemo<ManufacturerApplication | null>(() => {
    if (!manufacturer) {
      return null
    }

    const nameParts = (manufacturer.name || "").trim().split(/\s+/)

    return {
      id: manufacturer.id,
      email: manufacturer.email,
      company_name: manufacturer.company_name || undefined,
      first_name: nameParts[0] || undefined,
      last_name: nameParts.slice(1).join(" ") || undefined,
    }
  }, [manufacturer])

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    try {
      return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a")
    } catch {
      return dateStr
    }
  }

  const isImage = (mime?: string | null) => mime?.startsWith("image/") ?? false
  const isVideo = (mime?: string | null, type?: string) =>
    type === "video" || (mime?.startsWith("video/") ?? false)

  const handleAccept = async () => {
    try {
      setSubmitting(true)
      const result = await reviewManufacturerAdditionalInformationRequest(current.id, {
        action: "accept",
        notes: reviewNotes.trim() || undefined,
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: c.acceptSuccess,
        description: result.message,
      })
      onReviewComplete?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: common.error,
        description: getApiErrorMessage(error, c.reviewFailed),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: common.error,
        description: c.rejectReasonRequired,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const result = await reviewManufacturerAdditionalInformationRequest(current.id, {
        action: "reject",
        reason: rejectReason.trim(),
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: c.rejectSuccess,
        description: result.message,
      })
      onReviewComplete?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: common.error,
        description: getApiErrorMessage(error, c.reviewFailed),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AdminDialogContent
          showCloseButton
          variant="structured"
          mobile="fullscreen"
          size="lg"
        >
          <DialogHeader className="shrink-0 space-y-3 border-b border-border bg-linear-to-r from-secondary/5 to-transparent px-5 pb-5 pt-5 text-left sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold">{c.title}</DialogTitle>
                <DialogDescription className="mt-1 text-sm">{manufacturerLabel}</DialogDescription>
              </div>
              <VerificationRequestStatusBadge
                status={current.status}
                label={current.status_label}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/5 border border-secondary/10 px-3 py-1.5 text-sm">
                <Shield className="h-4 w-4 text-secondary" />
                <span className="font-mono font-bold text-secondary">
                  {current.reference_id || `SN-MFR-${String(current.id).padStart(6, "0")}`}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {c.requestedAt.replace("{date}", formatDate(current.created_at))}
              </div>
              {current.reviewed_at && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {c.reviewedAt.replace("{date}", formatDate(current.reviewed_at))}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">{common.loading}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {current.review_notes && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.reviewNotes}
                    </h4>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{current.review_notes}</p>
                  </div>
                )}

                <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.requestMessage}
                  </h4>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{current.message}</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.requestedTypes}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {current.allowed_type_labels.map((label) => (
                      <Badge key={label} variant="outline" className="px-2.5 py-1">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {manufacturer && (
                  <div className="rounded-xl border border-border/60 bg-linear-to-br from-background to-muted/30 p-4 shadow-sm">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.manufacturerProfile}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">{c.contact}:</span>{" "}
                        {manufacturer.email}
                      </p>
                      <p>
                        <span className="text-muted-foreground">{c.verificationStatus}:</span>{" "}
                        {manufacturer.manufacture_status_label}
                      </p>
                    </div>
                  </div>
                )}

                {current.responses?.length ? (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="h-4 w-4 text-secondary" />
                      {c.submittedResponses}
                      <Badge variant="outline" className="font-semibold">
                        {current.responses.length}
                      </Badge>
                    </h4>

                    {current.responses.map((response, index) => {
                      const fileUrl = response.file_url || response.video_url || response.url
                      const showImage = fileUrl && isImage(response.mime_type)
                      const showVideo = fileUrl && isVideo(response.mime_type, response.type)

                      return (
                        <div
                          key={String(response.id ?? index)}
                          className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {response.type_label || response.type}
                            </p>
                            {response.created_at && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(response.created_at)}
                              </p>
                            )}
                          </div>

                          {response.message && (
                            <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
                              {response.message}
                            </p>
                          )}

                          {showImage && (
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={fileUrl}
                                alt={response.original_name || "Submitted image"}
                                className="max-h-64 w-full rounded-lg border object-cover"
                              />
                            </a>
                          )}

                          {showVideo && fileUrl && (
                            <video
                              src={fileUrl}
                              controls
                              className="max-h-64 w-full rounded-lg border bg-black"
                            />
                          )}

                          {fileUrl && !showImage && !showVideo && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {response.original_name || c.downloadFile}
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-medium text-foreground">{c.noResponses}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.noResponsesDesc}</p>
                  </div>
                )}

                {canReview && !rejectMode && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <Label htmlFor="review-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.reviewNotes}
                    </Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      placeholder={c.reviewNotesPlaceholder}
                      className="mt-2 min-h-20"
                    />
                  </div>
                )}

                {canReview && rejectMode && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <Label htmlFor="reject-reason" className="text-xs font-semibold uppercase tracking-wider text-destructive">
                      {c.rejectReason}
                    </Label>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder={c.rejectReasonPlaceholder}
                      className="mt-2 min-h-24"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <div className="flex flex-wrap gap-2">
              {current.review_url && (
                <Button asChild size="sm" variant="outline">
                  <Link href={current.review_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    {c.openReview}
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {canRequestMore && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setRequestMoreOpen(true)}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {c.requestMore}
                </Button>
              )}

              {canReview && !rejectMode && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={submitting}
                    onClick={() => setRejectMode(true)}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    {c.reject}
                  </Button>
                  <Button size="sm" disabled={submitting} onClick={() => void handleAccept()}>
                    {submitting ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {c.accept}
                  </Button>
                </>
              )}

              {canReview && rejectMode && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => {
                      setRejectMode(false)
                      setRejectReason("")
                    }}
                  >
                    {common.cancel}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={submitting}
                    onClick={() => void handleReject()}
                  >
                    {submitting ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {c.confirmReject}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      <RequestAdditionalInfoDialog
        open={requestMoreOpen}
        onOpenChange={setRequestMoreOpen}
        manufacturer={manufacturerForDialog}
        onSuccess={() => {
          toast({
            title: c.requestMoreSuccess,
          })
          onReviewComplete?.()
        }}
      />
    </>
  )
}
