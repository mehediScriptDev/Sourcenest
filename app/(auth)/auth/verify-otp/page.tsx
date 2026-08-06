"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuth } from "@/lib/auth-context"
import { REGISTER_SUCCESS_STORAGE_KEY } from "@/lib/register-success-storage"
import {
  clearEmailVerificationChallenge,
  readEmailVerificationChallenge,
} from "@/lib/email-verification-storage"

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { verifyEmailSignup, resendEmailVerification } = useAuth()

  const challenge = readEmailVerificationChallenge()
  const email = searchParams.get("email") || challenge?.email || ""
  const role = (searchParams.get("role") || challenge?.role || "buyer") as "buyer" | "manufacturer"
  const urlToken = searchParams.get("token") || searchParams.get("verification_token")
  const verificationToken = urlToken || challenge?.verificationToken

  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!verificationToken) {
      setError(t?.auth?.verifySessionExpired || "Session expired. Please try registering again.")
      return
    }

    if (otp.length < 6) {
      setError(t?.auth?.verifyOtpRequired || "Please enter a 6-digit verification code.")
      return
    }

    setIsLoading(true)
    setError("")
    setInfo("")

    try {
      const deviceName = typeof window !== "undefined" ? navigator.userAgent : "web"
      const result = await verifyEmailSignup({
        verificationToken,
        otp,
        deviceName,
        pendingReview: challenge?.pendingReview,
        manufactureStatus: challenge?.manufactureStatus ?? null,
      })

      if (!result.success) {
        setError(result.message || (t?.auth?.errorOccurred || "An error occurred. Please try again."))
        if (result.retryAfterSeconds) {
          setResendCooldown(result.retryAfterSeconds)
        }
        return
      }

      clearEmailVerificationChallenge()

      if (result.pendingReview) {
        const payload = {
          message: result.message || challenge?.message || "",
          manufactureStatus: result.manufactureStatus ?? challenge?.manufactureStatus ?? null,
          isLoggedIn: true as const,
        }
        sessionStorage.setItem(REGISTER_SUCCESS_STORAGE_KEY, JSON.stringify(payload))
        router.push("/auth/register-success")
        return
      }

      router.push(result.redirectTo)
    } catch {
      setError(t?.auth?.errorOccurred || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!verificationToken || resendCooldown > 0 || isResending) {
      return
    }

    setIsResending(true)
    setError("")
    setInfo("")

    try {
      const result = await resendEmailVerification(verificationToken)

      if (!result.success) {
        setError(result.message || (t?.auth?.errorOccurred || "An error occurred. Please try again."))
        if (result.retryAfterSeconds) {
          setResendCooldown(result.retryAfterSeconds)
        }
        return
      }

      setOtp("")
      setInfo(result.message || (t?.auth?.verifyResendSent || "A new verification code has been sent."))
    } catch {
      setError(t?.auth?.errorOccurred || "An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!verificationToken) {
    return (
      <div className="lg:flex lg:min-h-[calc(100vh-6rem)] lg:flex-col lg:justify-center">
        <div className="text-center lg:text-left">
          <h1 className="font-serif text-3xl font-medium text-foreground">
            {t?.auth?.verifyEmailTitle || "Verify your email"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t?.auth?.verifySessionExpired || "Session expired. Please try registering again."}
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => router.push(`/auth/signup?role=${role}`)}
          >
            {t?.auth?.backToDetails || "Back to registration"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:flex lg:min-h-[calc(100vh-6rem)] lg:flex-col lg:justify-center">
      <div className="text-center lg:text-left">
        <button
          type="button"
          onClick={() => router.push(`/auth/signup?role=${role}`)}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t?.auth?.backToDetails || "Back to registration"}
        </button>
        <h1 className="font-serif text-3xl font-medium text-foreground">
          {t?.auth?.verifyEmailTitle || "Verify your email"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t?.auth?.verifyEmailSubtitle || "We've sent a 6-digit verification code to"}{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
        {challenge?.codeExpiryTime ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Code expires in {challenge.codeExpiryTime} minutes.
          </p>
        ) : null}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {info && (
        <div className="mt-4 rounded-lg bg-secondary/10 p-3 text-sm text-foreground">
          {info}
        </div>
      )}

      <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
        <div className="flex justify-center lg:justify-start">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t?.auth?.verifyingEmail || "Verifying..."}
            </>
          ) : (
            t?.auth?.verifyEmailButton || "Verify Email"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t?.auth?.verifyResendPrompt || "Didn't receive the code?"}{" "}
          <button
            type="button"
            className="font-medium text-secondary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending
              ? (t?.auth?.verifyingEmail || "Verifying...")
              : resendCooldown > 0
                ? `${t?.auth?.verifyResendWait || "Resend available in"} ${resendCooldown}s`
                : (t?.auth?.verifyResend || "Resend")}
          </button>
        </p>
      </form>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}
