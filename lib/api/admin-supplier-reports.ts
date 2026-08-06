import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"
import type { SupplierReportReason, SupplierReportStatus } from "./supplier-reports"

export interface AdminSupplierReport {
  id: number
  subject: string
  reason: SupplierReportReason
  reason_label: string
  details: string | null
  status: SupplierReportStatus
  status_label: string
  priority: string
  priority_label: string
  target: string | null
  source_page: string | null
  assigned_to: number | null
  resolved_at: string | null
  created_at: string | null
  updated_at: string | null
  reporter: {
    id: number
    name: string | null
    email: string
  } | null
  supplier: {
    id: number
    name: string | null
    email: string
    company_name: string | null
  } | null
  assignee?: {
    id: number
    name: string | null
    email: string
  } | null
  status_logs?: Array<{
    id: number
    from_status: string | null
    from_status_label: string | null
    to_status: string
    to_status_label: string
    message: string | null
    created_at: string | null
    admin: {
      id: number
      name: string | null
      email: string
    } | null
  }>
}

export interface AdminSupplierReportsResponse {
  success: boolean
  message: string
  data: AdminSupplierReport[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface UpdateSupplierReportPayload {
  status?: SupplierReportStatus
  priority?: "low" | "medium" | "high"
  assigned_to?: number | null
  message?: string
}

export async function fetchAdminSupplierReports(params?: {
  status?: string
  priority?: string
  search?: string
  page?: number
  per_page?: number
}): Promise<AdminSupplierReportsResponse> {
  try {
    const response = await apiClient.get<AdminSupplierReportsResponse>("/admin/supplier-reports", {
      params,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load supplier reports"))
  }
}

export async function fetchAdminSupplierReport(
  reportId: number | string
): Promise<{ success: boolean; message: string; data: AdminSupplierReport }> {
  try {
    const response = await apiClient.get<{
      success: boolean
      message: string
      data: AdminSupplierReport
    }>(`/admin/supplier-reports/${reportId}`)

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load supplier report"))
  }
}

export async function updateAdminSupplierReport(
  reportId: number | string,
  payload: UpdateSupplierReportPayload
): Promise<{ success: boolean; message: string; data: AdminSupplierReport }> {
  try {
    const response = await apiClient.patch<{
      success: boolean
      message: string
      data: AdminSupplierReport
    }>(`/admin/supplier-reports/${reportId}`, payload)

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update supplier report"))
  }
}
