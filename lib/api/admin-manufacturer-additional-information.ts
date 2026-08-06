import { apiClient } from "./client"
import type {
  AdditionalInformationRequest,
  AdditionalInformationResponseType,
} from "./manufacturer-additional-information"
import type { PaginationMeta } from "./admin-manufacturer-registrations"

export type AdditionalInformationRequestStatus =
  | "open"
  | "pending"
  | "submitted"
  | "accepted"
  | "rejected"
  | "expired"
  | "all"

export interface AdditionalInformationRequestListResponse {
  success: boolean
  message: string
  data: AdditionalInformationRequest[]
  meta?: PaginationMeta
}

export interface AdditionalInformationRequestDetailResponse {
  success: boolean
  message: string
  data: AdditionalInformationRequest
}

function normalizeAdditionalInformationRequest(raw: unknown): AdditionalInformationRequest | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const record = raw as Record<string, unknown>
  if (typeof record.id !== "number" && typeof record.id !== "string") {
    return null
  }

  return raw as AdditionalInformationRequest
}

export async function createManufacturerAdditionalInformationRequest(
  manufacturerId: number | string,
  payload: {
    message: string
    allowed_types: AdditionalInformationResponseType[]
  }
): Promise<{ success: boolean; message: string; data?: AdditionalInformationRequest }> {
  const response = await apiClient.post(
    `/admin/manufacturer/${manufacturerId}/additional-information`,
    payload
  )

  const body = response.data as {
    success?: boolean
    message?: string
    data?: unknown
  }

  return {
    success: body.success !== false,
    message: typeof body.message === "string" ? body.message : "Request sent.",
    data: normalizeAdditionalInformationRequest(body.data) ?? undefined,
  }
}

export async function fetchManufacturerAdditionalInformationRequests(
  manufacturerId: number | string
): Promise<AdditionalInformationRequest[]> {
  const response = await apiClient.get(
    `/admin/manufacturer/${manufacturerId}/additional-information`
  )

  const data = (response.data as { data?: unknown })?.data ?? response.data
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item) => normalizeAdditionalInformationRequest(item))
    .filter((item): item is AdditionalInformationRequest => item !== null)
}

export async function fetchAllManufacturerAdditionalInformationRequests(
  page: number = 1,
  perPage: number = 10,
  options?: {
    status?: AdditionalInformationRequestStatus
    unverifiedOnly?: boolean
    search?: string
  }
): Promise<AdditionalInformationRequestListResponse> {
  const response = await apiClient.get<AdditionalInformationRequestListResponse>(
    "/admin/manufacturer-additional-information",
    {
      params: {
        page,
        per_page: perPage,
        status:
          options?.status === undefined || options?.status === "open"
            ? undefined
            : options.status === "all"
              ? "all"
              : options.status,
        unverified_only:
          options?.unverifiedOnly === undefined ? 0 : options.unverifiedOnly ? 1 : 0,
        search: options?.search || undefined,
      },
    }
  )

  const body = response.data
  const data = Array.isArray(body.data) ? body.data : []

  return {
    success: body.success !== false,
    message: typeof body.message === "string" ? body.message : "OK",
    data: data
      .map((item) => normalizeAdditionalInformationRequest(item))
      .filter((item): item is AdditionalInformationRequest => item !== null),
    meta: body.meta,
  }
}

export async function fetchManufacturerAdditionalInformationDetail(
  requestId: number | string
): Promise<AdditionalInformationRequest | null> {
  try {
    const response = await apiClient.get<AdditionalInformationRequestDetailResponse>(
      `/admin/manufacturer-additional-information/${requestId}`
    )

    return normalizeAdditionalInformationRequest(response.data.data)
  } catch {
    return null
  }
}

export async function reviewManufacturerAdditionalInformationRequest(
  requestId: number | string,
  payload: {
    action: "accept" | "reject"
    notes?: string
    reason?: string
  }
): Promise<{ success: boolean; message: string; data?: AdditionalInformationRequest }> {
  const response = await apiClient.patch(
    `/admin/manufacturer-additional-information/${requestId}/review`,
    payload
  )

  const body = response.data as {
    success?: boolean
    message?: string
    data?: unknown
  }

  return {
    success: body.success !== false,
    message: typeof body.message === "string" ? body.message : "Review updated.",
    data: normalizeAdditionalInformationRequest(body.data) ?? undefined,
  }
}
