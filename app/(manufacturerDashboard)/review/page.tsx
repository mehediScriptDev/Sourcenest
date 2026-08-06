"use client"

import Link from "next/link"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import AdditionalInformationSubmit from "@/components/manufacturers/additional-information-submit"
import {
  getActionableAdditionalInfoRequests,
  isAdditionalInfoPending,
  resolveAdditionalInfoRequest,
  storeAdditionalInfoRequest,
} from "@/lib/additional-information-storage"
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"
import { fetchAdditionalInformationByToken } from "@/lib/api/manufacturer-additional-information"
import { fetchManufacturerReviewCenter } from "@/lib/api/manufacturer-review-center"
import { Loader2 } from "lucide-react"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  LogOut, 
  Building2, 
  ShieldCheck, 
  Mail,
  FileWarning,
  XCircle
} from "lucide-react"

function ManufacturerAccountReviewContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [additionalInfoRequest, setAdditionalInfoRequest] =
    useState<AdditionalInformationRequest | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(true)

  const loadAdditionalInfoRequest = useCallback(async () => {
    try {
      setLoadingRequest(true)
      const urlToken = searchParams.get("token")

      if (urlToken) {
        const byToken = await fetchAdditionalInformationByToken(urlToken)
        if (byToken && isAdditionalInfoPending(byToken.status)) {
          storeAdditionalInfoRequest(byToken)
          setAdditionalInfoRequest(byToken)
          return
        }
      }

      if (user) {
        const response = await fetchManufacturerReviewCenter()
        const apiRequests = response.data.additional_information_requests || []
        const actionable = getActionableAdditionalInfoRequests(apiRequests)

        if (actionable.length > 0) {
          const resolved = urlToken
            ? actionable.find((item) => item.token === urlToken) ?? actionable[0]
            : actionable[0]
          storeAdditionalInfoRequest(resolved)
          setAdditionalInfoRequest(resolved)
          return
        }
      }

      const fallback = resolveAdditionalInfoRequest(urlToken)
      setAdditionalInfoRequest(
        fallback && isAdditionalInfoPending(fallback.status) ? fallback : null
      )
    } finally {
      setLoadingRequest(false)
    }
  }, [searchParams, user])

  useEffect(() => {
    void loadAdditionalInfoRequest()
  }, [loadAdditionalInfoRequest])

  const handleSignOut = () => {
    logout()
    router.push("/auth/signin?role=manufacturer")
  }

  const status = user?.manufacturerStatus || "pending"
  const isNeedsInfo = status === "needs_more_info"
  const isRejected = status === "rejected"
  const isSuspended = status === "suspended"
  const isApproved = status === "approved"
  const isPending = status === "pending" || status === "pending_approval"

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/50 to-muted/20">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">SN</span>
            </div>
            <span className="font-serif text-lg font-medium">SourceNest</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <Building2 className="h-4 w-4" />
                <span>{user.company || "Manufacturer"}</span>
              </div>
            )}
            {user ? (
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin?role=manufacturer">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
        {/* Page Title & Status Overview */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Review Center</h1>
            <p className="mt-2 text-muted-foreground">
              Track your account approval status and respond to admin requests.
            </p>
          </div>
          
          {/* Main Status Badge */}
          <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 shadow-sm ${
            isPending ? "border-amber-200/60 bg-linear-to-r from-amber-50 to-amber-100/50 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-amber-500/5" :
            isNeedsInfo ? "border-blue-200/60 bg-linear-to-r from-blue-50 to-blue-100/50 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-blue-500/5" :
            "border-red-200/60 bg-linear-to-r from-red-50 to-red-100/50 dark:border-red-500/20 dark:from-red-500/10 dark:to-red-500/5"
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isPending ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
              isNeedsInfo ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" :
              "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
            }`}>
              {isPending && <Clock className="h-5 w-5" />}
              {isNeedsInfo && <AlertCircle className="h-5 w-5" />}
              {(isRejected || isSuspended) && <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                isPending ? "text-amber-800 dark:text-amber-300" :
                isNeedsInfo ? "text-blue-800 dark:text-blue-300" :
                "text-red-800 dark:text-red-300"
              }`}>Application Status</p>
              <h2 className="text-lg font-bold">
                {isPending && "Under Review"}
                {isNeedsInfo && "Action Required"}
                {isRejected && "Rejected"}
                {isSuspended && "Suspended"}
              </h2>
            </div>
          </div>
        </div>

        {loadingRequest ? (
          <div className="mb-8 flex items-center justify-center rounded-lg border bg-card py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : additionalInfoRequest ? (
          <div className="mb-8">
            {!user ? (
              <Card className="border-amber-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information Required</CardTitle>
                  <CardDescription>
                    Sign in to submit the documents and responses requested by the admin team.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild>
                    <Link
                      href={`/auth/signin?role=manufacturer&redirect=${encodeURIComponent(
                        `/review?token=${additionalInfoRequest.token}`
                      )}`}
                    >
                      Sign In to Respond
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <AdditionalInformationSubmit
                request={additionalInfoRequest}
                onSuccess={() => setAdditionalInfoRequest(null)}
              />
            )}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Requirements & Messages */}
          <div className="space-y-6 md:col-span-2">
            
            {/* What is required section */}
            {isPending && (
              <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg">Review in Progress</CardTitle>
                  </div>
                  <CardDescription>
                    Your registration is currently being verified by our compliance team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Thank you for submitting your application! We are checking your business documents and manufacturing details to ensure a safe and secure marketplace. This process normally takes 1-2 business days.
                  </p>
                  <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      Subscription / Payment Registered
                    </p>
                    <p className="mt-1 text-xs opacity-90">
                      Your subscription selection and transaction details have been received. Once your application is approved, your account will be activated and your subscription plan will become active. No further payment action is needed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isNeedsInfo && (
              <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Required Actions</CardTitle>
                  </div>
                  <CardDescription>
                    The admin team has requested modifications or documents to proceed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FileWarning className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-foreground">Verify Registration Details</h4>
                        <p className="text-sm text-muted-foreground">
                          Please review the messages from the administrator below and verify that your uploaded company documents are correct.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(isRejected || isSuspended) && (
              <Card className="overflow-hidden border-l-4 border-l-red-500 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">Account {isRejected ? "Rejected" : "Suspended"}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {isRejected 
                      ? "Unfortunately, your application did not pass our moderation check. This may be due to incomplete factory images, invalid business registration, or compliance mismatch."
                      : "Your account has been suspended by the platform administrator."}
                  </p>
                  <div className="rounded-lg border border-red-200/50 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20 text-sm text-red-900 dark:text-red-200">
                    <p className="font-semibold">Need Help?</p>
                    <p className="mt-1 text-xs opacity-90">
                      If you believe this is in error or you want to request another review, please send a message to support or contact info@sourcenest.tesh.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Communications */}
            <Card className="overflow-hidden shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Messages from Admin</CardTitle>
                </div>
                <CardDescription>Direct communications regarding your application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Message Thread */}
                  <div className="relative pl-6 after:absolute after:bottom-0 after:left-[11px] after:top-2 after:w-px after:bg-border">
                    <div className="relative">
                      <div className="absolute -left-6 mt-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                        <ShieldCheck className="h-3 w-3" />
                      </div>
                      <div className="rounded-lg rounded-tl-none bg-muted/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium text-sm">System Admin</span>
                          <span className="text-xs text-muted-foreground">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Just now"}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {isPending && "Hello! We are currently reviewing your application. We will check your license and factory photos and activate your subscription once verified. Thank you for your patience!"}
                          {isNeedsInfo && "Hello! We need some more verification details. Please verify your business license and website address."}
                          {isRejected && "Hello, your application did not meet our verification requirements. Please contact compliance for details."}
                          {isSuspended && "Your account has been suspended due to policy violations. Please contact support."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Progress & Info */}
          <div className="space-y-6">
            
            {/* Progress Tracker */}
            <Card className="overflow-hidden shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Review Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className={`h-full w-px ${isPending ? "bg-amber-200 dark:bg-amber-800" : "bg-emerald-200 dark:bg-emerald-800"}`} />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-sm">Application Submitted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ${
                        isPending ? "bg-amber-100 text-amber-600 ring-amber-50 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-500/10" :
                        isNeedsInfo ? "bg-blue-100 text-blue-600 ring-blue-50 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-500/10" :
                        isApproved ? "bg-emerald-100 text-emerald-600 ring-emerald-50" :
                        "bg-red-100 text-red-600 ring-red-50 dark:bg-red-500/20 dark:text-red-400"
                      }`}>
                        {isPending && <div className="h-2.5 w-2.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />}
                        {isNeedsInfo && <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />}
                        {(isRejected || isSuspended) && <div className="h-2.5 w-2.5 rounded-full bg-red-600" />}
                      </div>
                      <div className="h-full w-px bg-border" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-sm">
                        {isPending && "Initial Review"}
                        {isNeedsInfo && "More Info Requested"}
                        {(isRejected || isSuspended) && "Review Terminated"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isPending && "Under Review"}
                        {isNeedsInfo && "Action Required"}
                        {(isRejected || isSuspended) && "Rejected/Suspended"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background text-muted-foreground">
                        <span className="text-xs font-medium">3</span>
                      </div>
                      <div className="h-full w-px bg-border" />
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-sm text-muted-foreground">Final Verification</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background text-muted-foreground">
                        <span className="text-xs font-medium">4</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Account Approved</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submitted Info Summary */}
            <Card className="overflow-hidden shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium text-foreground">{user?.company || "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{user?.email || "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{user?.name || "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submitted on</span>
                  <span className="font-medium text-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function ManufacturerAccountReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/20" />}>
      <ManufacturerAccountReviewContent />
    </Suspense>
  )
}
