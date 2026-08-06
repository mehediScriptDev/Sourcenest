export const EMAIL_VERIFICATION_STORAGE_KEY = "email_verification_challenge"

export type EmailVerificationChallengePayload = {
  verificationToken: string
  codeExpiryTime: number
  email: string
  role: "buyer" | "manufacturer"
  pendingReview: boolean
  message?: string
  manufactureStatus?: string | null
  transactionId?: string
  planId?: string
  promoId?: string
}

export function saveEmailVerificationChallenge(payload: EmailVerificationChallengePayload): void {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(EMAIL_VERIFICATION_STORAGE_KEY, JSON.stringify(payload))
}

export function readEmailVerificationChallenge(): EmailVerificationChallengePayload | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as EmailVerificationChallengePayload
    if (!parsed?.verificationToken || !parsed?.email) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearEmailVerificationChallenge(): void {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(EMAIL_VERIFICATION_STORAGE_KEY)
}
