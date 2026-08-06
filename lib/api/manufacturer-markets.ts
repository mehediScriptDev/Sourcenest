import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface MarketStats {
  active_markets: number
  total_inquiries: number
  total_orders: number
  growth_rate: {
    value: string
    raw_value: number
    trend: "up" | "down" | string
  }
}

export interface ActiveRegion {
  id: number
  region: string
  countries: string[]
  country_codes: string[]
  inquiries: number
  orders: number
}

export interface SuggestionMarket {
  region: string
  reason: string
  potential: string
  potential_key: string
}

export interface MarketMetadata {
  regions: string[]
  geographic_regions: string[]
}

export interface ManufacturerMarketsData {
  stats: MarketStats
  active_regions: ActiveRegion[]
  suggestions: SuggestionMarket[]
  meta: MarketMetadata
}

export interface ManufacturerMarketsResponse {
  success: boolean
  message: string
  data: ManufacturerMarketsData
}

export interface ExportCountry {
  code: string
  name: string
  export_market_region: string
  geographic_region: string
  is_selected: boolean
}

export interface ExportCountriesResponse {
  success: boolean
  message: string
  data: ExportCountry[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Fetch manufacturer export markets overview (stats, active regions, suggestions, metadata)
 * GET /manufacturer/markets
 */
export async function getManufacturerMarkets(): Promise<ManufacturerMarketsResponse> {
  try {
    const response = await apiClient.get<ManufacturerMarketsResponse>("/manufacturer/markets")
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch manufacturer markets overview."))
  }
}

/**
 * Fetch export market countries (paginated or with a custom limit)
 * GET /manufacturer/markets/countries
 */
export async function getExportCountries(params?: {
  page?: number
  per_page?: number
  search?: string
}): Promise<ExportCountriesResponse> {
  try {
    const response = await apiClient.get<ExportCountriesResponse>("/manufacturer/markets/countries", {
      params,
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch export countries."))
  }
}

/**
 * Sync all selected export countries in one request.
 * PUT /manufacturer/markets/countries/sync
 */
export async function syncExportCountries(countryCodes: string[]): Promise<ManufacturerMarketsResponse> {
  try {
    const response = await apiClient.put<ManufacturerMarketsResponse>("/manufacturer/markets/countries/sync", {
      country_codes: countryCodes,
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to sync export countries."))
  }
}

/**
 * Create a new export region
 * POST /manufacturer/markets/regions
 */
export async function createRegionCountries(region: string, countryCodes: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const formData = new FormData()
    formData.append("region", region)
    countryCodes.forEach(code => {
      formData.append("country_codes[]", code)
    })

    const response = await apiClient.post<{ success: boolean; message: string }>("/manufacturer/markets/regions", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create region."))
  }
}

/**
 * Update target countries for an active export region
 * PUT /manufacturer/markets/regions/{id}
 */
export async function updateRegionCountries(id: number, countryCodes: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.put<{ success: boolean; message: string }>(`/manufacturer/markets/regions/${id}`, {
      country_codes: countryCodes
    })
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update region countries."))
  }
}

/**
 * Delete/remove an active export region
 * DELETE /manufacturer/markets/regions/{id}
 */
export async function deleteRegion(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/manufacturer/markets/regions/${id}`)
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to remove region."))
  }
}
