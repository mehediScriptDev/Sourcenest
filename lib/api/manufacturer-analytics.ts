import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface AnalyticsMetricItem {
  key: string
  label: string
  value: string
  raw_value: number
  change: string
  trend: "up" | "down" | string
}

export interface ManufacturerAnalyticsMetrics {
  period: string
  date_from: string
  date_to: string
  metrics: AnalyticsMetricItem[]
}

export interface GetManufacturerAnalyticsMetricsResponse {
  success: boolean
  message: string
  data: ManufacturerAnalyticsMetrics | null
}

export async function getManufacturerAnalyticsMetrics(params?: { period?: string }): Promise<GetManufacturerAnalyticsMetricsResponse> {
  try {
    const response = await apiClient.get<GetManufacturerAnalyticsMetricsResponse>("/manufacturer/analytics/metrics", { params })
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch manufacturer analytics metrics."),
      data: null,
    }
  }
}

export interface AnalyticsPerformanceItem {
  name: string
  period: string
  date_from: string
  date_to: string
  profile_views: number
  inquiries: number
  messages: number
  quote_requests: number
}

export interface GetManufacturerAnalyticsPerformanceResponse {
  success: boolean
  message: string
  data: AnalyticsPerformanceItem[]
}

export async function getManufacturerAnalyticsPerformance(params?: { period?: string }): Promise<GetManufacturerAnalyticsPerformanceResponse> {
  try {
    const response = await apiClient.get<GetManufacturerAnalyticsPerformanceResponse>("/manufacturer/analytics/performance", { params })
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || [],
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch manufacturer analytics performance."),
      data: [],
    }
  }
}

export interface AnalyticsFunnelStep {
  key: string
  label: string
  value: number
  value_formatted: string
  conversion: number | null
  conversion_label: string | null
}

export interface ManufacturerAnalyticsFunnel {
  period: string
  date_from: string
  date_to: string
  steps: AnalyticsFunnelStep[]
}

export interface GetManufacturerAnalyticsFunnelResponse {
  success: boolean
  message: string
  data: ManufacturerAnalyticsFunnel | null
}

export async function getManufacturerAnalyticsFunnel(params?: { period?: string }): Promise<GetManufacturerAnalyticsFunnelResponse> {
  try {
    const response = await apiClient.get<GetManufacturerAnalyticsFunnelResponse>("/manufacturer/analytics/funnel", { params })
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch manufacturer analytics funnel."),
      data: null,
    }
  }
}
