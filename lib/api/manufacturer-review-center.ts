import { apiClient } from "./client"
import type { ReviewRequest } from "./admin-reviews"
import type {
  AdditionalInformationRequest,
  AdditionalInformationRequestedBy,
} from "./manufacturer-additional-information"

export type {
  AdditionalInformationRequest,
  AdditionalInformationRequestedBy,
}

export interface ReviewCenterUser {
  id: number
  first_name: string
  last_name: string
  email: string
  company_name: string
}

export interface ReviewCenterVerification {
  manufacture_status: string
  manufacture_status_label: string
  rejection_reason: string | null
  manufacture_status_at: string | null
  submitted_at: string | null
}

export interface ManufacturerReviewCenterData {
  user: ReviewCenterUser
  verification: ReviewCenterVerification
  additional_information_requests: AdditionalInformationRequest[]
  review_requests: ReviewRequest[]
}

export interface ManufacturerReviewCenterResponse {
  success: boolean
  message: string
  data: ManufacturerReviewCenterData
}

export async function fetchManufacturerReviewCenter(): Promise<ManufacturerReviewCenterResponse> {
  const response = await apiClient.get<ManufacturerReviewCenterResponse>(
    "/manufacturer/review-center"
  )
  return response.data
}
