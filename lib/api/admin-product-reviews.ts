import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface BackendReview {
  id: number
  locale: string
  rating: number
  title: string
  comment: string
  status: "published" | "pending" | "hidden" | "flagged"
  status_label: string
  created_at: string
  updated_at: string
  available_locales: string[]
  translations: Array<{
    locale: string
    title: string
    comment: string
  }>
  reviewer: {
    id: number
    first_name: string
    last_name: string
    full_name: string
    company_name: string
    country: string
  }
  supplier: {
    id: number
    company_name: string
    country: string
  }
  product?: {
    id: number
    name: string
    category: string
  } | null
  order?: {
    id: number
    total_amount: string
    currency_code: string
    status: string
    status_label: string
    created_at: string
  } | null
}

export interface AdminReviewsStatsData {
  total_reviews: number
  published: number
  pending_review: number
  flagged: number
  hidden: number
  labels: {
    total_reviews: string
    published: string
    pending_review: string
    flagged: string
    hidden: string
  }
  status_options: Array<{
    value: string
    label: string
  }>
}

export interface GetAdminReviewsStatsResponse {
  success: boolean
  message: string
  data: AdminReviewsStatsData | null
}

export interface AdminReviewsMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number | null
  to: number | null
}

export interface AdminReviewsListResponse {
  success: boolean
  message?: string
  data: BackendReview[]
  meta: any // we handle raw response metadata or normalized metadata
}

export async function getAdminReviewsStats(): Promise<GetAdminReviewsStatsResponse> {
  try {
    const response = await apiClient.get<GetAdminReviewsStatsResponse>("/admin/reviews/stats")
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin reviews statistics."),
      data: null,
    }
  }
}

export async function getAdminReviews(
  page = 1,
  filters?: {
    status?: string
    rating?: string
    search?: string
  }
): Promise<{ success: boolean; message?: string; data: BackendReview[]; meta: AdminReviewsMeta | null }> {
  try {
    const params: Record<string, unknown> = { page }
    if (filters?.status && filters.status !== "all") {
      params.status = filters.status
    }
    if (filters?.rating && filters.rating !== "all") {
      params.rating = filters.rating
    }
    if (filters?.search && filters.search.trim()) {
      params.search = filters.search.trim()
    }

    const response = await apiClient.get<AdminReviewsListResponse>("/admin/reviews", { params })
    const data = response.data

    const metaPayload = data.meta
    const meta = metaPayload ? {
      currentPage: Number(metaPayload.current_page || 1),
      lastPage: Number(metaPayload.last_page || 1),
      perPage: Number(metaPayload.per_page || 15),
      total: Number(metaPayload.total || 0),
      from: metaPayload.from == null ? null : Number(metaPayload.from),
      to: metaPayload.to == null ? null : Number(metaPayload.to),
    } : null

    return {
      success: data.success ?? true,
      message: data.message,
      data: Array.isArray(data.data) ? data.data : [],
      meta,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch reviews."),
      data: [],
      meta: null,
    }
  }
}

export async function updateAdminReviewStatus(
  id: number | string,
  status: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.patch(`/admin/reviews/${id}`, { status })
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to update review status."),
    }
  }
}

export async function deleteAdminReview(
  id: number | string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.delete(`/admin/reviews/${id}`)
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to delete review."),
    }
  }
}
