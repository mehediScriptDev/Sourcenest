import { apiClient, publicApiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface ActivePromotionPlan {
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

export interface ActivePromotionStats {
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

export interface ActivePromotion {
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
  plan: ActivePromotionPlan
  stats: ActivePromotionStats
  total_spots: number
  approved: number
  spots_remaining: number
  pending_review: number
}

interface ActivePromotionResponse {
  success: boolean
  message: string
  data: ActivePromotion | null
}

/**
 * GET /admin/promotions/active — fetch the currently active promotion for public view.
 */
export async function fetchActivePromotion(): Promise<{
  success: boolean
  message?: string
  data: ActivePromotion | null
}> {
  try {
    const response = await publicApiClient.get<ActivePromotionResponse>("/promotions/active")
    const payload = response.data
    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: payload?.data || null,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load active promotion."),
      data: null,
    }
  }
}

/**
 * POST /manufacturer/promotions/apply?promotion_id={id} — enroll a manufacturer user in a promotion
 */
export async function enrollInPromotion(
  promotionId: number | string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/manufacturer/promotions/apply?promotion_id=${promotionId}`
    )
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to apply promotion."),
    }
  }
}

