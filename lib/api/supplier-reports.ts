import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export type SupplierReportReason =
  | "fake"
  | "scam"
  | "quality"
  | "communication"
  | "certification"
  | "other"

export type SupplierReportStatus = "open" | "investigating" | "resolved" | "dismissed"

export interface SupplierReport {
  id: number
  reason: SupplierReportReason
  reason_label: string
  details: string | null
  status: SupplierReportStatus
  status_label: string
  priority: string
  priority_label: string
  source_page: string | null
  resolved_at: string | null
  created_at: string | null
  updated_at: string | null
  supplier?: {
    id: number
    name: string | null
    email: string
    company_name?: string | null
  }
}

export interface SubmitSupplierReportPayload {
  reason: SupplierReportReason
  details?: string
  source_page?: string
}

export async function submitSupplierReport(
  supplierId: number | string,
  payload: SubmitSupplierReportPayload
): Promise<{ success: boolean; message: string; data: SupplierReport }> {
  try {
    const response = await apiClient.post<{
      success: boolean
      message: string
      data: SupplierReport
    }>(`/buyer/suppliers/${supplierId}/reports`, payload)

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to submit report"))
  }
}

export async function canReportSupplier(
  supplierId: number | string
): Promise<{ can_report: boolean; reason?: string }> {
  try {
    const response = await apiClient.get<{
      success: boolean
      data: { can_report: boolean; reason?: string }
    }>(`/buyer/suppliers/${supplierId}/reports/can-report`)

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to check report status"))
  }
}
