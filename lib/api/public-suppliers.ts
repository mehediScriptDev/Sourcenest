import { publicApiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface SupplierLocation {
  city: string | null
  country: string | null
  country_code: string | null
}

export interface Supplier {
  id: number
  name: string
  slug: string
  short_description: string | null
  location: SupplierLocation
  industry: string | null
  industry_slug: string | null
  reviewed: boolean
  reviewed_level: string | null
  rating: number
  review_count: number
  product_count: number
  main_products: string[]
  certifications: string[]
  export_markets: string[]
  response_rate: string | null
  response_time: string | null
  on_time_delivery: string | null
  // Details fields
  long_description?: string | null
  logo?: string | null
  year_established?: string | null
  employee_count?: string | null
  revenue?: string | null
  min_order_value?: number | null
  business_type?: string | null
  capabilities?: string[]
  languages?: string[]
  payment_terms?: string[]
  website?: string | null
  factory_photos?: string[]
}

export interface SuppliersResponse {
  success: boolean
  message: string
  data: Supplier[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number
    last_page: number
    path: string
    per_page: number
    to: number
    total: number
  }
}

export interface SupplierDetailsResponse {
  success: boolean
  message: string
  data: Supplier
}

export interface ApiSupplierProduct {
  id: number
  supplier_id: number
  name: string
  slug: string
  description: string | null
  price: { amount: string; currency: string } | null
  price_display: string | null
  image: string | null
  images: { id: number; url: string }[]
  pricing_quantities: {
    min_price: { price: { amount: string; currency: string } }
    max_price: { price: { amount: string; currency: string } }
    minimum_order_quantity: number
    unit: string
  } | null
  specifications: { id: number; specification_title: string; specification_value: string }[]
  product_key_features: { id: number; value: string }[]
}

export interface SupplierProductsResponse {
  success: boolean
  message: string
  data: ApiSupplierProduct[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

export interface GetSuppliersParams {
  page?: number
  per_page?: number
  search?: string
  industry?: string
  country?: string
  certification?: string
  moq?: string
  export_market?: string
  reviewed?: boolean
  sort?: string
}

export const SUPPLIERS_LIST_PER_PAGE = 12

export async function getPublicSuppliers(params?: GetSuppliersParams): Promise<SuppliersResponse | null> {
  try {
    const response = await publicApiClient.get<SuppliersResponse>("/suppliers", {
      params: {
        per_page: SUPPLIERS_LIST_PER_PAGE,
        ...params,
      },
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch public suppliers:", getApiErrorMessage(error))
    return null
  }
}

export async function getPublicSupplierDetails(slugOrId: string): Promise<SupplierDetailsResponse | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${slugOrId}`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      // cache: "no-store",
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch supplier details for ${slugOrId}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

export interface ApiSupplierReviewStats {
  average_rating: number
  total_reviews: number
  breakdown: {
    rating: number
    count: number
    percentage: number
  }[]
}

export interface ApiSupplierReview {
  id: number
  rating: number
  title: string
  comment: string
  created_at: string
  reviewer: {
    id: number
    first_name: string
    last_name: string
    company_name: string
    country: string
  }
  order: {
    id: number
    total_amount: string
    currency_code: string
    status: string
  } | null
}

export interface SupplierReviewsResponse {
  success: boolean
  message: string
  data: {
    review_stats: ApiSupplierReviewStats
    reviews: ApiSupplierReview[]
  }
}

export interface ApiSupplierCatalog {
  id: number
  name: string
  file_size: string
  file_path: string
  total_downloads: number
  status: string
  created_at: string
  updated_at: string
}

export interface SupplierCatalogsResponse {
  success: boolean
  message: string
  data: ApiSupplierCatalog[]
}

export async function getPublicSupplierProducts(slugOrId: string, page = 1): Promise<SupplierProductsResponse | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${slugOrId}/products?page=${page}`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch products for supplier ${slugOrId}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

export async function getPublicSupplierReviews(slugOrId: string): Promise<SupplierReviewsResponse | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${slugOrId}/reviews`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch reviews for supplier ${slugOrId}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

export async function getPublicSupplierCatalogs(slugOrId: string): Promise<SupplierCatalogsResponse | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${slugOrId}/catalogs`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch catalogs for supplier ${slugOrId}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

export interface SupplierCertificationsResponse {
  success: boolean
  message: string
  data: {
    profile_certifications: string[]
    uploaded_certificates: any[]
  }
}

export async function getPublicSupplierCertifications(slugOrId: string): Promise<SupplierCertificationsResponse | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${slugOrId}/certifications`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch certifications for supplier ${slugOrId}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

export interface ApiSupplierMapCountry {
  name: string
  country: string
  country_code: string
  group: string
  subregion: string
  coordinates: {
    lat: number | null
    lng: number | null
  }
  suppliers_count: number
  has_suppliers: boolean
  flag: string
  flag_icon: string
}

export interface ApiSupplierMapResponse {
  success: boolean
  message: string
  data: {
    countries: ApiSupplierMapCountry[]
    country_code_groups: {
      group: string
      countries: string[]
    }[]
    total_countries: number
    countries_with_suppliers: number
    total_suppliers: number
    filters: {
      group: string | null
      search: string | null
    }
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }
}

export interface SuppliersMapParams {
  search?: string
  group?: string
  page?: number
  per_page?: number
}

export async function getSuppliersMap(params?: SuppliersMapParams): Promise<ApiSupplierMapResponse | null> {
  try {
    const response = await publicApiClient.get<ApiSupplierMapResponse>("/suppliers/map", {
      params: {
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.group ? { group: params.group } : {}),
        ...(typeof params?.page === "number" ? { page: params.page } : {}),
        ...(typeof params?.per_page === "number" ? { per_page: params.per_page } : {}),
      },
    })
    return response.data
  } catch (error) {
    console.error("Failed to fetch suppliers map:", getApiErrorMessage(error))
    return null
  }
}

export interface ApiSupplierMapGroup {
  group: string
  country_count: number
  countries_with_suppliers: number
  suppliers_count: number
}

export interface ApiSupplierMapGroupsResponse {
  success: boolean
  message: string
  data: {
    total_groups: number
    groups: ApiSupplierMapGroup[]
  }
}

export async function getSuppliersMapGroups(): Promise<ApiSupplierMapGroupsResponse | null> {
  try {
    const response = await publicApiClient.get<ApiSupplierMapGroupsResponse>("/suppliers/map/groups")
    return response.data
  } catch (error) {
    console.error("Failed to fetch suppliers map groups:", getApiErrorMessage(error))
    return null
  }
}

export interface ApiSupplierMapTopCountry {
  country: string
  country_code: string
  group: string
  subregion: string
  manufacturers_count: number
  flag: string
  flag_icon: string
}

export interface ApiSupplierMapTopCountriesResponse {
  success: boolean
  message: string
  data: {
    countries: ApiSupplierMapTopCountry[]
    filters: Record<string, any>
    pagination: Record<string, any>
  }
}

export async function getSuppliersMapTopCountries(): Promise<ApiSupplierMapTopCountriesResponse | null> {
  try {
    const response = await publicApiClient.get<ApiSupplierMapTopCountriesResponse>("/suppliers/map/top-countries")
    return response.data
  } catch (error) {
    console.error("Failed to fetch suppliers map top countries:", getApiErrorMessage(error))
    return null
  }
}

