import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface BuyerDashboardData {
  welcome: {
    first_name: string
    name: string
  }
  stats: {
    active_conversations: {
      value: number
      badge: string | null
    }
    rfqs_submitted: {
      value: number
      badge: string | null
    }
    saved_suppliers: {
      value: number
      badge: string | null
    }
    products_viewed: {
      value: number
      badge: string | null
    }
  }
  recent_messages: Array<{
    conversation_id: number
    name: string
    message: string
    time: string
    time_at: string
    unread: boolean
  }>
  recent_rfqs: Array<{
    id: string
    rfq_id: number
    product: string
    supplier: string
    status: string
    status_value: string
    date: string
    created_at: string
  }>
  recommended_suppliers: Array<{
    id: number
    name: string
    slug: string
    location: {
      city: string
      country: string
    }
    rating: number
    product_count: number
  }>
  recent_activity: Array<{
    id: number
    type: string
    title: string
    description: string
    time: string
    time_at: string
  }>
}

export interface GetBuyerDashboardResponse {
  success: boolean
  message: string
  data: BuyerDashboardData | null
}

export async function getBuyerDashboard(): Promise<GetBuyerDashboardResponse> {
  try {
    const response = await apiClient.get<GetBuyerDashboardResponse>("/buyer/dashboard")
    
    // The response could be nested under "buyer_dashboard" based on the user's JSON,
    // but typically standard responses return { success, data, message }.
    // If the backend wraps it in "buyer_dashboard", let's handle both cases securely.
    let success = false
    let data = null
    let message = ""

    if (response.data && "buyer_dashboard" in response.data) {
      const nested = (response.data as any).buyer_dashboard
      success = nested.success
      data = nested.data
      message = nested.message
    } else {
      success = response.data?.success ?? true
      data = response.data?.data || null
      message = response.data?.message || "Success"
    }

    return {
      success,
      message,
      data,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch buyer dashboard."),
      data: null,
    }
  }
}
