import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information"

const TOKEN_KEY = "sourcenest_additional_info_token"
const REQUEST_KEY = "sourcenest_additional_info_request"

type UserWithAdditionalRequests = {
  additional_information_requests?: AdditionalInformationRequest[]
}

export function getPendingAdditionalInfoRequest(
  user?: UserWithAdditionalRequests | null
): AdditionalInformationRequest | null {
  if (!user?.additional_information_requests?.length) {
    return null
  }

  const pending = user.additional_information_requests
    .filter((request) => isAdditionalInfoPending(request.status))
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

  return pending[0] ?? null
}

export function syncAdditionalInfoFromUser(user?: UserWithAdditionalRequests | null): void {
  if (typeof window === "undefined") {
    return
  }

  const pending = getPendingAdditionalInfoRequest(user)

  if (pending?.token) {
    localStorage.setItem(TOKEN_KEY, pending.token)
    localStorage.setItem(REQUEST_KEY, JSON.stringify(pending))
    return
  }

  clearAdditionalInfoStorage()
}

export function getStoredAdditionalInfoToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const token = localStorage.getItem(TOKEN_KEY)?.trim()
  return token || null
}

export function getStoredAdditionalInfoRequest(): AdditionalInformationRequest | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = localStorage.getItem(REQUEST_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdditionalInformationRequest
  } catch {
    return null
  }
}

export function storeAdditionalInfoRequest(request: AdditionalInformationRequest): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(TOKEN_KEY, request.token)
  localStorage.setItem(REQUEST_KEY, JSON.stringify(request))
}

export function resolveAdditionalInfoRequest(
  urlToken?: string | null
): AdditionalInformationRequest | null {
  const stored = getStoredAdditionalInfoRequest()
  const token = urlToken?.trim() || getStoredAdditionalInfoToken()

  if (!token) {
    return stored && isAdditionalInfoPending(stored.status) ? stored : null
  }

  if (stored?.token === token && isAdditionalInfoPending(stored.status)) {
    return stored
  }

  if (stored && stored.token !== token) {
    return { ...stored, token, status: "pending", status_label: "Pending" }
  }

  return {
    id: 0,
    token,
    message: "Please provide the requested additional information.",
    allowed_types: ["text", "image", "video", "audio", "document"],
    allowed_type_labels: ["Text message", "Image", "Video", "Audio", "Document"],
    status: "pending",
    status_label: "Pending",
    expires_at: null,
    submitted_at: null,
    created_at: new Date().toISOString(),
    requested_by: { id: 0, name: "Admin", email: "" },
    responses: [],
  }
}

export function isAdditionalInfoPending(status: string): boolean {
  return status.trim().toLowerCase() === "pending"
}

export function getActionableAdditionalInfoRequests(
  apiRequests: AdditionalInformationRequest[]
): AdditionalInformationRequest[] {
  const sorted = [...apiRequests].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )

  const pendingFromApi = sorted.filter((request) => isAdditionalInfoPending(request.status))
  if (pendingFromApi.length > 0) {
    return pendingFromApi
  }

  const stored = getStoredAdditionalInfoRequest()
  if (!stored?.token || !isAdditionalInfoPending(stored.status)) {
    return []
  }

  const apiMatch = apiRequests.find((request) => request.token === stored.token)
  if (!apiMatch) {
    return [stored]
  }

  if (isAdditionalInfoPending(apiMatch.status)) {
    return [apiMatch]
  }

  return []
}

export function clearAdditionalInfoStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REQUEST_KEY)
}
