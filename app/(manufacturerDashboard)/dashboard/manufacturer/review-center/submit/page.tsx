"use client"

import Link from "next/link"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import AdditionalInformationSubmit from "@/components/manufacturers/additional-information-submit"
import { fetchManufacturerReviewCenter } from "@/lib/api/manufacturer-review-center"
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"
import {
  getActionableAdditionalInfoRequests,
  isAdditionalInfoPending,
  resolveAdditionalInfoRequest,
} from "@/lib/additional-information-storage"

function AdditionalInformationSubmitPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [request, setRequest] = useState<AdditionalInformationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [canSubmit, setCanSubmit] = useState(false)

  const loadRequest = useCallback(async () => {
    try {
      setLoading(true)
      const urlToken = searchParams.get("token")
      const response = await fetchManufacturerReviewCenter()
      const apiRequests = response.data.additional_information_requests || []
      const actionable = getActionableAdditionalInfoRequests(apiRequests)

      let resolved: AdditionalInformationRequest | null = null

      if (actionable.length > 0) {
        resolved = urlToken
          ? actionable.find((item) => item.token === urlToken) ?? actionable[0]
          : actionable[0]
        setCanSubmit(true)
      } else if (apiRequests.length > 0) {
        resolved = urlToken
          ? apiRequests.find((item) => item.token === urlToken) ?? apiRequests[0]
          : apiRequests[0]
        setCanSubmit(isAdditionalInfoPending(resolved.status))
      } else {
        resolved = resolveAdditionalInfoRequest(urlToken)
        setCanSubmit(Boolean(resolved && isAdditionalInfoPending(resolved.status)))
      }

      setRequest(resolved)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    void loadRequest()
  }, [loadRequest])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading submission form...</p>
        </CardContent>
      </Card>
    )
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No additional information request found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The admin team has not asked for anything yet, or your request has expired.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/manufacturer/review-center">Back to Review Center</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/manufacturer/review-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review Center
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
          Submit Additional Information
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use live camera capture for photos and videos. Add text or documents as needed, then submit to admin.
        </p>
      </div>

      {!canSubmit && (
        <Card className="border-amber-300 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                This request is already marked as &quot;{request.status_label}&quot;
              </p>
              <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
                You can still use the form below to preview the camera and response types, but
                submitting again will only work if the admin reopens the request to{" "}
                <strong>Pending</strong>. Ask admin to send a new request if you need to upload more.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <AdditionalInformationSubmit
        request={request}
        submitDisabled={!canSubmit}
        onSuccess={() => {
          router.push("/dashboard/manufacturer/review-center")
        }}
      />
    </div>
  )
}

export default function AdditionalInformationSubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <AdditionalInformationSubmitPageContent />
    </Suspense>
  )
}
