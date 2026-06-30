import { apiClient } from "@/lib/api/client"
// Helper functions
function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function toString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export interface SubscriptionManufacturer {
  id: number
  name: string
  email: string
}

export interface SubscriptionPlanPrice {
  amount: string
  currency: string
}

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  monthly_price: SubscriptionPlanPrice
  monthly_price_display: string | null
  yearly_price: SubscriptionPlanPrice
  yearly_price_display: string | null
  button_text: string
  is_popular: boolean
  status: number
  created_at: string | null
  updated_at: string | null
}

export interface AdminSubscription {
  id: number
  manufacturer: SubscriptionManufacturer
  plan: SubscriptionPlan
  billing_interval: string
  status: string
  status_label: string
  auto_renew: boolean
  starts_at: string | null
  ends_at: string | null
  trial_ends_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SubscriptionPayment {
  id: number
  payment_id: string
  payment_method: string
  amount: number
  status: string
  subscription_id: number
  created_at: string
}

export interface SubscriptionLogPlan {
  id: number
  name: string
}

export interface SubscriptionLog {
  id: number
  from_plan: SubscriptionLogPlan | null
  to_plan: SubscriptionLogPlan | null
  event_type: string
  paid_amount: number | null
  created_at: string
}

export interface AdminSubscriptionDetail extends AdminSubscription {
  payments: SubscriptionPayment[]
  logs: SubscriptionLog[]
}

export interface AdminSubscriptionStats {
  period: {
    month: string
    from: string
    to: string
  }
  overview: {
    total_active_subscriptions: number
    total_revenue_all_time: number
    auto_renew_enabled_count: number
  }
  this_month: {
    new_subscriptions: number
    upgrades: number
    cancellations: number
    revenue: number
    payments_count: number
  }
  revenue_by_plan: Array<{
    plan_id: number
    plan_name: string
    revenue: number
    count: number
  }>
  revenue_by_payment_method: Array<{
    payment_method: string
    revenue: number
    count: number
  }>
}

export interface AdminSubscriptionListResponse {
  success: boolean
  message?: string
  data: AdminSubscription[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface AdminSubscriptionDetailResponse {
  success: boolean
  message?: string
  data: AdminSubscriptionDetail | null
}

export interface AdminSubscriptionStatsResponse {
  success: boolean
  message?: string
  data: AdminSubscriptionStats | null
}

// APIs

export async function getAdminSubscriptions(params?: {
  page?: number
  per_page?: number
  status?: string
  search?: string
}): Promise<AdminSubscriptionListResponse> {
  try {
    const response = await apiClient.get("/admin/subscriptions", { params })
    const payload = toRecord(response.data)

    const metaRecord = toRecord(payload.meta)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: toString(payload.message),
      data: readArray(payload.data) as unknown as AdminSubscription[],
      meta: payload.meta ? {
        current_page: toNumber(metaRecord.current_page, 1),
        last_page: toNumber(metaRecord.last_page, 1),
        per_page: toNumber(metaRecord.per_page, 15),
        total: toNumber(metaRecord.total, 0),
      } : undefined
    }
  } catch (error: any) {
    console.error("Error fetching admin subscriptions:", error)
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch subscriptions",
      data: []
    }
  }
}

export async function getAdminSubscriptionStats(month?: string): Promise<AdminSubscriptionStatsResponse> {
  try {
    const params = month ? { month } : undefined
    const response = await apiClient.get("/admin/subscriptions/stats", { params })
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: toString(payload.message),
      data: payload.data ? (payload.data as unknown as AdminSubscriptionStats) : null
    }
  } catch (error: any) {
    console.error("Error fetching admin subscription stats:", error)
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch subscription statistics",
      data: null
    }
  }
}

export async function getAdminSubscriptionDetail(id: string | number): Promise<AdminSubscriptionDetailResponse> {
  try {
    const response = await apiClient.get(`/admin/subscriptions/${id}`)
    const payload = toRecord(response.data)

    return {
      success: typeof payload.success === "boolean" ? payload.success : true,
      message: toString(payload.message),
      data: payload.data ? (payload.data as unknown as AdminSubscriptionDetail) : null
    }
  } catch (error: any) {
    console.error("Error fetching admin subscription detail:", error)
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch subscription detail",
      data: null
    }
  }
}
