"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"
import {
  Camera,
  Clock,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  ScanEye,
  MapPin,
  Send,
  Image as ImageIcon,
  Trash2,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { ReviewRequest } from "@/lib/api/admin-reviews"
import {
  REVIEW_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
  type ReviewRequestStatus,
} from "@/lib/api/admin-reviews"
import {
  fetchManufacturerReviewCenter,
  type ReviewCenterUser,
  type ReviewCenterVerification,
} from "@/lib/api/manufacturer-review-center"
import { queryKeys } from "@/lib/query-keys"
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"
import {
  storeAdditionalInfoRequest,
  clearAdditionalInfoStorage,
  getActionableAdditionalInfoRequests,
  getStoredAdditionalInfoRequest,
  isAdditionalInfoPending,
} from "@/lib/additional-information-storage"
import AdditionalInformationSubmit from "@/components/manufacturers/additional-information-submit"
import {
  submitReviewCaptures,
} from "@/lib/api/manufacturer-reviews"
import LiveCapture, { type CapturedPhoto } from "./live-capture"

// ─── Status styles ───────────────────────────────────────────────────────────

function statusStyle(status: ReviewRequestStatus) {
  switch (status) {
    case "pending":
    case "re_requested":
      return {
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
        border: "border-amber-200/60 dark:border-amber-500/20",
        icon: Clock,
        iconColor: "text-amber-600",
      }
    case "submitted":
      return {
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
        border: "border-blue-200/60 dark:border-blue-500/20",
        icon: Send,
        iconColor: "text-blue-600",
      }
    case "approved":
    case "completed":
      return {
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
        border: "border-emerald-200/60 dark:border-emerald-500/20",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
      }
    case "rejected":
      return {
        badge: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
        border: "border-red-200/60 dark:border-red-500/20",
        icon: AlertCircle,
        iconColor: "text-red-600",
      }
    default:
      return {
        badge: "",
        border: "",
        icon: Clock,
        iconColor: "text-muted-foreground",
      }
  }
}

function verificationStyle(status: string) {
  switch (status) {
    case "approved":
      return {
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
        border: "border-emerald-200/60 dark:border-emerald-500/20",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
      }
    case "needs_more_info":
      return {
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
        border: "border-blue-200/60 dark:border-blue-500/20",
        icon: AlertCircle,
        iconColor: "text-blue-600",
      }
    case "rejected":
    case "suspended":
      return {
        badge: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
        border: "border-red-200/60 dark:border-red-500/20",
        icon: AlertCircle,
        iconColor: "text-red-600",
      }
    default:
      return {
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
        border: "border-amber-200/60 dark:border-amber-500/20",
        icon: Clock,
        iconColor: "text-amber-600",
      }
  }
}

function additionalInfoStatusStyle(status: string) {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
    case "completed":
    case "approved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
    case "expired":
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300"
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
  }
}

function formatReviewDate(dateStr?: string) {
  if (!dateStr) return ""
  try {
    return format(new Date(dateStr), "MMM d, yyyy")
  } catch {
    return dateStr
  }
}

function additionalInfoHistoryNote(status: string) {
  switch (status) {
    case "submitted":
      return "Your response was sent to the admin team. They will review it and contact you if anything else is needed."
    case "completed":
    case "approved":
      return "This request was reviewed and closed by the admin team."
    case "expired":
      return "This request expired before a response was submitted. Contact support if you still need to send documents."
    case "rejected":
      return "The admin rejected this submission. Watch for a new request or contact support."
    default:
      return null
  }
}

function AdditionalInfoRequestDetails({
  request,
}: {
  request: AdditionalInformationRequest
}) {
  const historyNote = !isAdditionalInfoPending(request.status)
    ? additionalInfoHistoryNote(request.status)
    : null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("font-semibold", additionalInfoStatusStyle(request.status))}>
            {request.status_label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Requested by {request.requested_by.name}
          </span>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What the admin is asking for
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{request.message}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            You can send
          </p>
          <div className="flex flex-wrap gap-1.5">
            {request.allowed_type_labels.map((label) => (
              <Badge key={label} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
          {isAdditionalInfoPending(request.status) && (
            <p className="text-xs text-muted-foreground">
              Photos and videos must be captured live from your camera on this site. Old files cannot be uploaded.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <Clock className="mr-1 inline h-3 w-3" />
          Requested {formatReviewDate(request.created_at)}
          {request.expires_at && ` • Expires ${formatReviewDate(request.expires_at)}`}
          {request.submitted_at && ` • Submitted ${formatReviewDate(request.submitted_at)}`}
        </p>

        {historyNote && (
          <p className="rounded-lg border border-blue-200/60 bg-blue-50/50 px-3 py-2 text-xs text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            {historyNote}
          </p>
        )}

        {!isAdditionalInfoPending(request.status) && request.responses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What you submitted
            </p>
            <div className="space-y-1.5">
              {request.responses.map((response, index) => (
                <div
                  key={response.id ?? `${response.type}-${index}`}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                >
                  <Badge variant="outline" className="capitalize">
                    {response.type}
                  </Badge>
                  <span className="truncate text-muted-foreground">
                    {response.message || response.file_url || response.url || "File attached"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ReviewCenter() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const reviewCenterQuery = useQuery({
    queryKey: queryKeys.manufacturerReviewCenter(),
    queryFn: fetchManufacturerReviewCenter,
  })

  const reviews = reviewCenterQuery.data?.data?.review_requests ?? []
  const user = reviewCenterQuery.data?.data?.user ?? null
  const verification = reviewCenterQuery.data?.data?.verification ?? null
  const additionalRequests = [...(reviewCenterQuery.data?.data?.additional_information_requests ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const loading = reviewCenterQuery.isLoading

  const refreshReviews = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.manufacturerReviewCenter() })
  }

  useEffect(() => {
    if (!reviewCenterQuery.data?.success) {
      return
    }
    const apiRequests = [...(reviewCenterQuery.data.data.additional_information_requests || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const pending = apiRequests.find((request) => isAdditionalInfoPending(request.status))
    if (pending) {
      storeAdditionalInfoRequest(pending)
    } else {
      const stored = getStoredAdditionalInfoRequest()
      const matched = stored
        ? apiRequests.find((request) => request.token === stored.token)
        : null
      if (matched && !isAdditionalInfoPending(matched.status)) {
        clearAdditionalInfoStorage()
      }
    }
  }, [reviewCenterQuery.data])

  useEffect(() => {
    if (reviewCenterQuery.isError) {
      toast({
        title: "Error",
        description: "Failed to load review center.",
        variant: "destructive",
      })
    }
  }, [reviewCenterQuery.isError, toast])

  const [showCompleted, setShowCompleted] = useState(false)

  // Capture flow state
  const [activeReview, setActiveReview] = useState<ReviewRequest | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [showPreSubmit, setShowPreSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitNotes, setSubmitNotes] = useState("")

  // Separate pending vs completed
  const pendingReviews = reviews.filter(
    (r) => r.status === "pending" || r.status === "re_requested"
  )
  const activeReviews = reviews.filter((r) => r.status === "submitted")
  const completedReviews = reviews.filter(
    (r) => r.status === "approved" || r.status === "rejected" || r.status === "completed"
  )
  const actionableAdditionalRequests = getActionableAdditionalInfoRequests(additionalRequests)
  const latestAdditionalRequest = additionalRequests[0] ?? null
  const otherAdditionalRequests = additionalRequests.filter(
    (request) =>
      !actionableAdditionalRequests.some((active) => active.token === request.token)
  )

  const hasContent =
    Boolean(verification) ||
    additionalRequests.length > 0 ||
    pendingReviews.length > 0 ||
    activeReviews.length > 0 ||
    completedReviews.length > 0

  const verificationUi = verification ? verificationStyle(verification.manufacture_status) : null
  const VerificationIcon = verificationUi?.icon ?? Clock

  // Start capture
  const startCapture = (review: ReviewRequest) => {
    setActiveReview(review)
    setCapturedPhotos([])
    setShowPreSubmit(false)
    setSubmitNotes("")
  }

  // Capture complete
  const onCaptureComplete = (captures: CapturedPhoto[]) => {
    setCapturedPhotos(captures)
    setShowPreSubmit(true)
  }

  // Cancel capture
  const onCaptureCancel = () => {
    // Clean up preview URLs
    capturedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setActiveReview(null)
    setCapturedPhotos([])
    setShowPreSubmit(false)
  }

  // Remove photo from pre-submit
  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].previewUrl)
      updated.splice(index, 1)
      return updated
    })
  }

  // Submit captures
  const handleSubmit = async () => {
    if (!activeReview || capturedPhotos.length === 0) return

    try {
      setSubmitting(true)
      await submitReviewCaptures(
        activeReview.id,
        capturedPhotos.map((p) => ({
          area_name: p.areaName,
          photo: p.blob,
        })),
        submitNotes || undefined
      )

      toast({
        title: "Review submitted",
        description: `Your review captures for ${activeReview.review_code} have been submitted successfully.`,
      })

      // Clean up
      capturedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setActiveReview(null)
      setCapturedPhotos([])
      setShowPreSubmit(false)
      setSubmitNotes("")

      // Refresh
      refreshReviews()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to submit review"
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = formatReviewDate

  // ─── Live capture mode ───────────────────────────────────────────────────────

  if (activeReview && !showPreSubmit) {
    return (
      <LiveCapture
        reviewCode={activeReview.review_code}
        areas={activeReview.requested_areas}
        onComplete={onCaptureComplete}
        onCancel={onCaptureCancel}
      />
    )
  }

  // ─── Pre-submit review ───────────────────────────────────────────────────────

  if (activeReview && showPreSubmit) {
    const groupedByArea = activeReview.requested_areas.map((area) => ({
      area,
      photos: capturedPhotos.filter((p) => p.areaName === area),
    }))

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCaptureCancel}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            ← Back to Review Center
          </Button>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Review Your Captures
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your captured photos before submitting for review code{" "}
            <span className="font-mono font-bold text-secondary">
              {activeReview.review_code}
            </span>
          </p>
        </div>

        {/* Grouped by area */}
        {groupedByArea.map(({ area, photos }) => (
          <Card key={area}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <h3 className="text-sm font-semibold">{area}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {photos.length} photo{photos.length !== 1 && "s"}
                </Badge>
              </div>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo, i) => {
                    const globalIdx = capturedPhotos.indexOf(photo)
                    return (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border/60"
                      >
                        <img
                          src={photo.previewUrl}
                          alt={`${area} ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(globalIdx)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No photos captured for this area
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Notes */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-semibold">
              Additional Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              placeholder="Add any notes about the captures..."
              className="mt-2 min-h-16 resize-none"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              setShowPreSubmit(false)
            }}
            disabled={submitting}
          >
            <Camera className="mr-2 h-4 w-4" />
            Retake Photos
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={submitting || capturedPhotos.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Review ({capturedPhotos.length} photos)
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Main review center view ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground md:text-3xl">
          {t.mfg.reviewCenter.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
          {actionableAdditionalRequests.length > 0
            ? "The admin team needs more information. Use the form below to respond with text, documents, or live camera capture."
            : latestAdditionalRequest
              ? "View your admin requests below. Open the submission form to use the live camera."
              : t.mfg.reviewCenter.subtitle}
        </p>
        {latestAdditionalRequest && (
          <div className="mt-4">
            <Button asChild size="lg">
              <Link
                href={`/dashboard/manufacturer/review-center/submit${
                  latestAdditionalRequest.token
                    ? `?token=${encodeURIComponent(latestAdditionalRequest.token)}`
                    : ""
                }`}
              >
                <Camera className="mr-2 h-5 w-5" />
                Open Camera &amp; Submit Form
              </Link>
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center sm:py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{t.mfg.inquiries.loading}</p>
          </CardContent>
        </Card>
      ) : !hasContent ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center sm:py-16">
            <ScanEye className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-foreground">{t.mfg.reviewCenter.noReviews}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              You don&apos;t have any review requests or additional information requests at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {actionableAdditionalRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Action Required — Submit Below ({actionableAdditionalRequests.length})
              </h2>
              {actionableAdditionalRequests.map((request) => (
                <Card
                  key={request.id || request.token}
                  id="additional-info-submit"
                  className="overflow-hidden border-l-4 border-l-amber-500 shadow-md"
                >
                  <CardContent className="space-y-6 p-4 sm:p-6">
                    <AdditionalInfoRequestDetails request={request} />
                    <AdditionalInformationSubmit
                      request={request}
                      embedded
                      onSuccess={() => refreshReviews()}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {verification && verificationUi && (
            <Card className={cn("overflow-hidden border", verificationUi.border)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("font-semibold", verificationUi.badge)}>
                        <VerificationIcon className={cn("mr-1 h-3 w-3", verificationUi.iconColor)} />
                        {verification.manufacture_status_label}
                      </Badge>
                      {user?.company_name && (
                        <span className="text-sm text-muted-foreground">{user.company_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted {formatDate(verification.submitted_at || undefined)}
                      {verification.manufacture_status_at &&
                        ` • Updated ${formatDate(verification.manufacture_status_at)}`}
                    </p>
                    {verification.rejection_reason && (
                      <div className="rounded-lg bg-red-50/50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        <span className="font-semibold">Reason: </span>
                        {verification.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {otherAdditionalRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-4 w-4" />
                Past Requests ({otherAdditionalRequests.length})
              </h2>
              <div className="grid gap-3">
                {otherAdditionalRequests.map((request) => (
                  <Card key={request.id} className="opacity-90">
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <AdditionalInfoRequestDetails request={request} />
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/dashboard/manufacturer/review-center/submit?token=${encodeURIComponent(request.token)}`}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Open submission form
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {/* Pending / Action Required */}
          {pendingReviews.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Action Required ({pendingReviews.length})
              </h2>
              <div className="grid gap-3">
                {pendingReviews.map((review) => {
                  const style = statusStyle(review.status)
                  const StatusIcon = style.icon
                  return (
                    <Card
                      key={String(review.id)}
                      className={cn(
                        "overflow-hidden border-l-4 transition-colors hover:bg-muted/20",
                        review.status === "re_requested"
                          ? "border-l-secondary"
                          : "border-l-amber-500"
                      )}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={cn("font-semibold", style.badge)}>
                                <StatusIcon className={cn("mr-1 h-3 w-3", style.iconColor)} />
                                {REVIEW_STATUS_LABELS[review.status]}
                              </Badge>
                              <div className="flex items-center gap-1.5 rounded-md bg-secondary/5 border border-secondary/10 px-2.5 py-1">
                                <Shield className="h-3.5 w-3.5 text-secondary" />
                                <span className="font-mono text-xs font-bold text-secondary">
                                  {review.review_code}
                                </span>
                              </div>
                            </div>

                            <h3 className="text-sm font-semibold text-foreground">
                              {REVIEW_TYPE_LABELS[review.review_type]}
                            </h3>

                            {/* Requested areas */}
                            <div className="flex flex-wrap gap-1.5">
                              {review.requested_areas.map((area) => (
                                <Badge
                                  key={area}
                                  variant="outline"
                                  className="px-2 py-0.5 text-xs"
                                >
                                  <MapPin className="mr-1 h-2.5 w-2.5" />
                                  {area}
                                </Badge>
                              ))}
                            </div>

                            {/* Instructions */}
                            {review.additional_instructions && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {review.additional_instructions}
                              </p>
                            )}

                            {/* Rejection reason */}
                            {review.rejection_reason && review.status === "re_requested" && (
                              <div className="rounded-lg bg-red-50/50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                                <span className="font-semibold">Previous rejection: </span>
                                {review.rejection_reason}
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              <Clock className="mr-1 inline h-3 w-3" />
                              Requested {formatDate(review.created_at)}
                            </p>
                          </div>

                          <Button
                            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => startCapture(review)}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Start Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submitted / Awaiting Admin */}
          {activeReviews.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <Send className="h-4 w-4" />
                Awaiting Admin Review ({activeReviews.length})
              </h2>
              <div className="grid gap-3">
                {activeReviews.map((review) => {
                  const style = statusStyle(review.status)
                  return (
                    <Card key={String(review.id)} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={cn("font-semibold", style.badge)}>
                                {REVIEW_STATUS_LABELS[review.status]}
                              </Badge>
                              <span className="font-mono text-xs font-bold text-secondary">
                                {review.review_code}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold">
                              {REVIEW_TYPE_LABELS[review.review_type]}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Submitted — awaiting admin review
                            </p>
                          </div>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedReviews.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex w-full items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Completed Reviews ({completedReviews.length})
                {showCompleted ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>

              {showCompleted && (
                <div className="grid gap-3">
                  {completedReviews.map((review) => {
                    const style = statusStyle(review.status)
                    const StatusIcon = style.icon
                    return (
                      <Card
                        key={String(review.id)}
                        className={cn("opacity-75", style.border)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={cn("font-semibold text-xs", style.badge)}>
                                  <StatusIcon className={cn("mr-1 h-3 w-3", style.iconColor)} />
                                  {REVIEW_STATUS_LABELS[review.status]}
                                </Badge>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {review.review_code}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium">
                                {REVIEW_TYPE_LABELS[review.review_type]}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(review.updated_at || review.created_at)}
                            </p>
                          </div>

                          {/* Show rejection reason */}
                          {review.status === "rejected" && review.rejection_reason && (
                            <div className="mt-3 rounded-lg bg-red-50/50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                              <span className="font-semibold">Reason: </span>
                              {review.rejection_reason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
