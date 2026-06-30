import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface PromotionPlan {
  id: number
  name: string
  description: string
  monthly_price: {
    amount: string
    currency: string
  }
  monthly_price_display: string | null
  yearly_price: {
    amount: string
    currency: string
  }
  yearly_price_display: string | null
  button_text: string
  is_popular: boolean
  status: number
  created_at: string | null
  updated_at: string | null
}

export interface PromotionStats {
  total_participants: number
  accepted: number
  pending: number
  rejected: number
  spots_joined: number
  spots_remaining: number
  slots_total: number
  fill_percentage: number
  is_full: boolean
}

export interface Promotion {
  id: number
  promotion_title: string
  short_description: string
  button_text: string
  cta_button_text: string
  highlight_text: string
  slots: number
  duration_months: number
  expires_at: string | null
  status: boolean
  created_at: string | null
  updated_at: string | null
  plan: PromotionPlan
  stats: PromotionStats
  total_spots: number
  approved: number
  spots_remaining: number
  pending_review: number
}

interface PromotionsResponse {
  success: boolean
  message: string
  data: Promotion[]
}

/**
 * GET /admin/promotions — fetch all promotions.
 */
export async function fetchAdminPromotions(): Promise<{
  success: boolean
  message?: string
  data: Promotion[]
}> {
  try {
    const response = await apiClient.get<PromotionsResponse>("/admin/promotions")
    const payload = response.data
    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: Array.isArray(payload?.data) ? payload.data : [],
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load promotions."),
      data: [],
    }
  }
}

/**
 * POST /admin/promotions/reset — reset promotion counters.
 */
export async function resetAdminPromotions(): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>("/admin/promotions/reset")
    const payload = response.data
    return {
      success: payload?.success ?? true,
      message: payload?.message,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to reset promotions."),
    }
  }
}

export interface PromotionParticipant {
  user_id: number
  supplier: {
    company_name: string | null
    email: string
    first_name: string
    last_name: string
  }
  country: string | null
  joined_at: string
  status: string
  status_label: string
  trial_ends_at: string | null
}

export interface PromotionDetailResponse {
  success: boolean
  message: string
  data: {
    promotion: Promotion
    participants: PromotionParticipant[]
  }
}

export interface PromotionParticipantsResponse {
  success: boolean
  message: string
  data: PromotionParticipant[]
}

/**
 * GET /admin/promotions/{id} — fetch a specific promotion.
 */
export async function fetchAdminPromotionById(id: string | number): Promise<{
  success: boolean
  message?: string
  data: {
    promotion: Promotion | null
    participants: PromotionParticipant[]
  }
}> {
  try {
    const response = await apiClient.get<PromotionDetailResponse>(`/admin/promotions/${id}`)
    const payload = response.data
    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: {
        promotion: payload?.data?.promotion || null,
        participants: Array.isArray(payload?.data?.participants) ? payload.data.participants : [],
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load promotion details."),
      data: { promotion: null, participants: [] },
    }
  }
}

/**
 * GET /admin/promotions/{id}/participants — fetch participants for a promotion
 */
export async function fetchAdminPromotionParticipants(id: string | number): Promise<{
  success: boolean
  message?: string
  data: PromotionParticipant[]
}> {
  try {
    const response = await apiClient.get<PromotionParticipantsResponse>(`/admin/promotions/${id}/participants`)
    const payload = response.data
    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: Array.isArray(payload?.data) ? payload.data : [],
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load participants."),
      data: [],
    }
  }
}


export interface UpdatePromotionPayload {
  plan_id: number
  slots: number
  duration_months: number
  promotion_title: string
  short_description: string
  button_text: string
  cta_button_text: string
  highlight_text: string
  expires_at: string | null
  status: boolean
}

/**
 * PUT /admin/promotions/{id} — update a promotion
 */
export async function updateAdminPromotion(id: string | number, payload: UpdatePromotionPayload): Promise<{
  success: boolean
  message?: string
  data?: Promotion
}> {
  try {
    const response = await apiClient.put<{ success: boolean; message: string; data?: Promotion }>(
      `/admin/promotions/${id}`,
      payload
    )
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
      data: response.data?.data,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to update promotion."),
    }
  }
}

/**
 * PATCH /admin/promotions/{id}/toggle-status — toggle promotion status
 */
export async function toggleAdminPromotionStatus(id: string | number): Promise<{
  success: boolean
  message?: string
  data?: Promotion
}> {
  try {
    const response = await apiClient.patch<{ success: boolean; message: string; data?: Promotion }>(
      `/admin/promotions/${id}/toggle-status`
    )
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
      data: response.data?.data,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to toggle promotion status."),
    }
  }
}

/**
 * PATCH /admin/promotions/{promotion_id}/participants/{user_id} — approve a participant in a promotion
 */
export async function enrollAdminPromotionParticipant(
  promotionId: string | number,
  userId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/admin/promotions/${promotionId}/participants/${userId}`,
      { status: "accepted" }
    )
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to approve participant."),
    }
  }
}

