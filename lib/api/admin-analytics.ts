import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface AdminAnalyticsMetricItem {
  key: string
  label: string
  value: string
  raw_value: number
  change: string
  trend: "up" | "down" | string
}

export interface AdminAnalyticsMetrics {
  period: string
  date_from: string
  date_to: string
  metrics: AdminAnalyticsMetricItem[]
}

export interface GetAdminAnalyticsMetricsResponse {
  success: boolean
  message: string
  data: AdminAnalyticsMetrics | null
}

export interface GrowthItem {
  name: string
  period: string
  year: number
  users: number
  suppliers: number
  rfqs: number
}

export interface GetAdminAnalyticsGrowthResponse {
  success: boolean
  message: string
  data: GrowthItem[] | null
}

export async function getAdminAnalyticsMetrics(params?: { period?: string }): Promise<GetAdminAnalyticsMetricsResponse> {
  try {
    const response = await apiClient.get<GetAdminAnalyticsMetricsResponse>("/admin/analytics/metrics", { params })
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin analytics metrics."),
      data: null,
    }
  }
}

export async function getAdminAnalyticsGrowth(): Promise<GetAdminAnalyticsGrowthResponse> {
  try {
    const response = await apiClient.get<GetAdminAnalyticsGrowthResponse>("/admin/analytics/growth")
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin analytics growth data."),
      data: null,
    }
  }
}

export interface CountryDistributionItem {
  country: string
  users: string
  raw_users: number
  percentage: number
}

export interface GetAdminAnalyticsCountriesResponse {
  success: boolean
  message: string
  data: CountryDistributionItem[] | null
}

export interface IndustryItem {
  id: number
  industry: string
  slug: string
  suppliers: number
  products: number
}

export interface GetAdminAnalyticsIndustriesResponse {
  success: boolean
  message: string
  data: IndustryItem[] | null
}

export async function getAdminAnalyticsCountries(): Promise<GetAdminAnalyticsCountriesResponse> {
  try {
    const response = await apiClient.get<GetAdminAnalyticsCountriesResponse>("/admin/analytics/countries")
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin analytics country distribution."),
      data: null,
    }
  }
}

export async function getAdminAnalyticsIndustries(): Promise<GetAdminAnalyticsIndustriesResponse> {
  try {
    const response = await apiClient.get<GetAdminAnalyticsIndustriesResponse>("/admin/analytics/industries")
    return {
      success: response.data?.success ?? true,
      message: response.data?.message || "Success",
      data: response.data?.data || null,
    }
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch admin analytics industries."),
      data: null,
    }
  }
}

