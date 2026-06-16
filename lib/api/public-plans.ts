import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

/** A single feature entry as returned by GET /plans. */
export interface PublicPlanFeature {
  id: number
  features: {
    id: number
    name: string
    key: string
  }
  input_type: "boolean" | "text"
  value: string
}

/** A plan entry as returned by GET /plans. */
export interface PublicPlan {
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
  features: PublicPlanFeature[]
}

interface PublicPlansResponse {
  success: boolean
  message: string
  data: PublicPlan[]
}

/**
 * GET /plans — fetch all public pricing plans.
 * Used on the public /pricing page to render plan cards dynamically.
 */
export async function fetchPublicPlans(): Promise<{
  success: boolean
  message?: string
  data: PublicPlan[]
}> {
  try {
    const response = await apiClient.get<PublicPlansResponse>("/plans")
    const payload = response.data

    return {
      success: payload?.success ?? true,
      message: payload?.message,
      data: Array.isArray(payload?.data) ? payload.data : [],
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to load pricing plans."),
      data: [],
    }
  }
}
