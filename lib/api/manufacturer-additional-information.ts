import { apiClient } from "./client"

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
  created_at: string
  submit_url?: string
  test_url?: string
  requested_by: AdditionalInformationRequestedBy
  responses: AdditionalInformationSubmittedResponse[]
}

export interface AdditionalInformationSubmittedResponse {
  id?: number
  type: AdditionalInformationResponseType
  message?: string | null
  file_url?: string | null
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
