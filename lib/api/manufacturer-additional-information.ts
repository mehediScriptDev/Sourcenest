import { apiClient, publicApiClient } from "./client"

export type AdditionalInformationResponseType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"

export interface AdditionalInformationRequestedBy {
  id: number
  name: string
  email: string
}

export interface AdditionalInformationManufacturerSummary {
  id: number
  name?: string | null
  email: string
  company_name?: string | null
  manufacture_status: string
  manufacture_status_label: string
}

export interface AdditionalInformationRequest {
  id: number
  token: string
  message: string
  allowed_types: AdditionalInformationResponseType[]
  allowed_type_labels: string[]
  status: string
  status_label: string
  expires_at: string | null
  submitted_at: string | null
  reviewed_at?: string | null
  review_notes?: string | null
  created_at: string
  reference_id?: string
  ticket_id?: number | null
  response_count?: number
  submit_url?: string
  review_url?: string
  test_url?: string
  requested_by?: AdditionalInformationRequestedBy
  reviewed_by?: AdditionalInformationRequestedBy
  manufacturer?: AdditionalInformationManufacturerSummary
  responses: AdditionalInformationSubmittedResponse[]
}

export interface AdditionalInformationSubmittedResponse {
  id?: number
  type: AdditionalInformationResponseType
  type_label?: string
  message?: string | null
  file_url?: string | null
  video_url?: string | null
  is_video?: boolean
  original_name?: string | null
  mime_type?: string | null
  url?: string | null
  created_at?: string | null
}

export type AdditionalInformationResponseItem =
  | { type: "text"; message: string }
  | { type: "document"; message?: string; file: File }
  | { type: "image" | "video" | "audio"; file: File; message?: string }

export interface SubmitAdditionalInformationResponse {
  success: boolean
  message: string
  data?: unknown
}

export async function fetchAdditionalInformationByToken(
  requestToken: string
): Promise<AdditionalInformationRequest | null> {
  try {
    const response = await publicApiClient.get(
      `/manufacturer/additional-information/${requestToken}`
    )
    const data = (response.data as { data?: unknown })?.data ?? response.data
    if (!data || typeof data !== "object") {
      return null
    }
    return data as AdditionalInformationRequest
  } catch {
    return null
  }
}

export async function submitAdditionalInformation(
  requestToken: string,
  responses: AdditionalInformationResponseItem[]
): Promise<SubmitAdditionalInformationResponse> {
  const formData = new FormData()

  responses.forEach((item, index) => {
    formData.append(`responses[${index}][type]`, item.type)

    if (item.type === "text") {
      formData.append(`responses[${index}][message]`, item.message)
      return
    }

    if (item.message) {
      formData.append(`responses[${index}][message]`, item.message)
    }

    if ("file" in item) {
      formData.append(`responses[${index}][file]`, item.file)
    }
  })

  const response = await apiClient.post<SubmitAdditionalInformationResponse>(
    `/manufacturer/additional-information/${requestToken}`,
    formData
  )

  return response.data
}
