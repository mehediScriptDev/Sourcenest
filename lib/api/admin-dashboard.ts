import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface AdminDashboardData {
  stats: Array<{
    key: string
    label: string
    value: string
    raw_value: number
    change: string
    trend: "up" | "down" | string
  }>
  pending_approvals: Array<{
    id: string
    type: string
    name: string
    description: string
    country: string | null
    industry: string | null
    email: string
    submitted_at: string
    submitted_date: string
    status: string
  }>
  recent_reports?: Array<{
    id: string
    type: string
    subject: string
    reporter: string
    reported_at: string
    reported_at_iso: string
  }>
  recent_activity: Array<{
    action: string
    detail: string
    time: string
    time_at: string
  }>
}

export interface GetAdminDashboardResponse {
  success: boolean
  message: string
  data: AdminDashboardData | null
}

export async function getAdminDashboard(): Promise<GetAdminDashboardResponse> {
  try {
    const response = await apiClient.get<GetAdminDashboardResponse>("/admin/dashboard")
    
    // Handle nested payload safely if backend returns {"admin_dashboard": { success, data }}
    let success = false
    let data = null
    let message = ""

    if (response.data && "admin_dashboard" in response.data) {
      const nested = (response.data as any).admin_dashboard
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
      message: getApiErrorMessage(error, "Failed to fetch admin dashboard."),
      data: null,
    }
  }
}
