import { apiClient } from "@/lib/api/client"

export interface ManufacturerCompany {
  company_name: string
  short_description: string | null
  long_description: string | null
  minimum_order_value: number | string | null
  company_logo: string | null
  company_logo_url: string | null
  company_type: string | null
  company_established: string | null
  company_size: string | null
  revenue: string | null
  country: string | null
  city: string | null
  street_address: string | null
  phone: string | null
  zip_code: string | null
  capabilities: string | null // JSON string
  certifications: string | null // JSON string
  export_markets: string | null // JSON string
  language_spoken: string | null // JSON string
  payments_term: string | null // JSON string
  bussiness_license: string | null
  bussiness_license_url: string | null
  company_website: string | null
  notes: string | null
  factory_production: number
  mulitple_factories: number
  industries: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface ManufacturerProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  manufacture_status: string
  manufacture_status_label: string
  company: ManufacturerCompany | null
  factory_images?: Array<{ id?: number; url: string } | string>
}

export interface ManufacturerProfileResponse {
  success: boolean
  message: string
  data: ManufacturerProfile
}

export async function getManufacturerProfile(): Promise<ManufacturerProfileResponse> {
  const response = await apiClient.get("/manufacturer/profile")
  return response.data
}

export async function updateManufacturerProfile(data: FormData): Promise<any> {
  // Laravel cannot parse multipart/form-data on native PUT.
  // Standard workaround: send as POST with _method=PUT field.
  data.append("_method", "PUT")
  const response = await apiClient.post("/manufacturer/profile/update", data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

export async function updateBasicProfile(data: {
  first_name: string
  last_name: string
  email: string
  phone: string
}): Promise<any> {
  const response = await apiClient.put("/manufacturer/profile/basic-profile", data)
  return response.data
}

export async function updateNotificationPreferences(data: {
  quote_notification: boolean
  message_notification: boolean
  supplier_update: boolean
  weekly_digest: boolean
  marketing_promotion: boolean
}): Promise<any> {
  const response = await apiClient.put("/manufacturer/profile/notification-preferences", data)
  return response.data
}
