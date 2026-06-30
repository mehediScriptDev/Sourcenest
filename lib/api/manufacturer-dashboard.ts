import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface ManufacturerDashboardStats {
  profile_completeness: {
    percent: number
    label: string
  }
  stats: {
    new_inquiries_30d: {
      value: number
      change: string
      trend: string
      label: string
    }
    profile_views_30d: {
      value: number
      change: string
      trend: string
      label: string
    }
    quote_value_30d: {
      value: number
      formatted: string
      label: string
    }
    average_rating: {
      value: number
      review_count: number
      label: string
    }
  }
  recent_inquiries: Array<{
    id: string
    buyer: string
    product: string
    quantity: string
    time: string
    created_at: string
    status: string
    status_value: string
  }>
  response_metrics: {
    response_rate: number
    quote_conversion: number
    on_time_delivery: number | null
  }
  quick_stats: {
    active_products: number
    pending_quotes: number
    unread_messages: number
    avg_response_time: string | null
    avg_response_time_seconds: number | null
  }
  recent_activity: Array<{
    type: string
    action: string
    time: string
    time_at: string
  }>
}

export interface GetManufacturerDashboardResponse {
  success: boolean
  message: string
  data: ManufacturerDashboardStats | null
}

export async function getManufacturerDashboard(): Promise<GetManufacturerDashboardResponse> {
  try {
    const response = await apiClient.get<GetManufacturerDashboardResponse>("/manufacturer/dashboard")
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch manufacturer dashboard."),
      data: null,
    }
  }
}
