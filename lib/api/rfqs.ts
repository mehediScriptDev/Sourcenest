import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface CreateRFQPayload {
  product_id: number
  quantity: number
  quantity_unit: string
  target_price: number
  target_currency_code: string
  required_delivery_date: string
  shipping_terms: string
  destination_country: string
  destination_port_city: string
  packaging_details: string
  additional_requirements?: string
}

export interface RFQResponse {
  success: boolean
  message?: string
  data?: {
    id: number
    product_id: number
    quantity: number
    quantity_unit: string
    target_price: string
    target_currency_code: string
    required_delivery_date: string
    shipping_terms: string
    destination_country: string
    destination_port_city: string
    packaging_details: string
    additional_requirements: string | null
    status: string
    created_at: string
    updated_at: string
  }
}

// Create a new RFQ (Request for Quotation)
export async function createRFQ(payload: CreateRFQPayload): Promise<RFQResponse> {
  try {
    const response = await apiClient.post("/buyer/rfqs", payload)
    
    return {
      success: response.data?.success ?? true,
      message: response.data?.message,
      data: response.data?.data,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to create RFQ."),
    }
  }
}

export interface ManufacturerRFQ {
  id: number
  rfq_number: string
  status: string
  created_at: string
  quantity: number
  quantity_unit: string
  target_price: string | null
  target_currency_code: string | null
  required_delivery_date: string
  shipping_terms: string
  destination_country: string
  destination_port_city: string
  packaging_details: string
  additional_requirements: string | null
  manufacturer_reply: string | null
  quoted_price: string | null
  quote_currency_code: string | null
  minimum_order_quantity: number | null
  lead_time_days: number | null
  quote_valid_until: string | null
  quoted_at: string | null
  buyer_action_at: string | null
  product: {
    id: number
    name: string
    slug: string
  }
  buyer: {
    id: number
    name: string
    email: string
  }
  send_quote_endpoint: string
  reply_endpoint: string
}

export interface GetManufacturerRFQsResponse {
  success: boolean
  message: string
  data: ManufacturerRFQ[]
  meta?: any
  links?: any
}

export interface GetManufacturerRFQResponse {
  success: boolean
  message: string
  data: ManufacturerRFQ | null
}

// Fetch Manufacturer RFQs
export async function getManufacturerRFQs(page: number = 1): Promise<GetManufacturerRFQsResponse> {
  try {
    const response = await apiClient.get<GetManufacturerRFQsResponse>(`/manufacturer/rfqs?page=${page}`)
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch inquiries."),
      data: []
    }
  }
}

// Fetch Manufacturer RFQ Details
export async function getManufacturerRFQ(id: string | number): Promise<GetManufacturerRFQResponse> {
  try {
    const response = await apiClient.get<GetManufacturerRFQResponse>(`/manufacturer/rfqs/${id}`)
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch inquiry details."),
      data: null
    }
  }
}

export interface SubmitManufacturerQuoteResponse {
  success: boolean
  message: string
}

// Submit Quote
export async function submitManufacturerQuote(id: string | number, payload: FormData): Promise<SubmitManufacturerQuoteResponse> {
  try {
    const response = await apiClient.post<SubmitManufacturerQuoteResponse>(`/manufacturer/rfqs/${id}/quote`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to submit quote."),
    }
  }
}

export interface QuoteAttachment {
  id: number
  type: string
  name: string
  original_name: string
  file_mime: string
  size_bytes: number
  url: string
}

export interface BuyerRFQ {
  id: number
  rfq_number: string
  status: string
  created_at: string
  quantity: number
  quantity_unit: string
  target_price: string | null
  target_currency_code: string | null
  required_delivery_date: string
  shipping_terms: string
  destination_country: string
  destination_port_city: string
  packaging_details: string | null
  additional_requirements: string | null
  quoted_price: string | null
  quote_currency_code: string | null
  minimum_order_quantity: number | null
  lead_time_days: number | null
  lead_time: string | null
  quote_valid_until: string | null
  quote_shipping_terms: string | null
  quote_payment_terms: string | null
  sample_cost: string | null
  sample_lead_time: string | null
  quote_packaging_details: string | null
  quote_certifications: string[] | null
  quote_notes: string | null
  manufacturer_reply: string | null
  quoted_at: string | null
  buyer_action_at: string | null
  quote_attachments?: QuoteAttachment[]
  quote_photos?: string[]
  quote_documents?: QuoteAttachment[]
  conversation_id: number | null
  product: {
    id: number
    name: string
    slug: string
    inquiry_count: number
  }
  supplier: {
    id: number
    company_name: string | null
    location: string
  }
  message_endpoint: string
  quote_action_endpoint: string
}

export interface GetBuyerRFQsResponse {
  success: boolean
  message: string
  data: BuyerRFQ[]
  meta?: any
  links?: any
}

// Fetch Buyer RFQs
export async function getBuyerRFQs(page: number = 1, perPage: number = 15): Promise<GetBuyerRFQsResponse> {
  try {
    const response = await apiClient.get<GetBuyerRFQsResponse>(`/buyer/rfqs?page=${page}&per_page=${perPage}`)
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch RFQs."),
      data: []
    }
  }
}

export interface GetBuyerRFQResponse {
  success: boolean
  message: string
  data: BuyerRFQ | null
}

// Fetch Buyer RFQ Details
export async function getBuyerRFQ(id: string | number): Promise<GetBuyerRFQResponse> {
  try {
    const response = await apiClient.get<GetBuyerRFQResponse>(`/buyer/rfqs/${id}`)
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to fetch RFQ details."),
      data: null
    }
  }
}

export interface RespondToQuotePayload {
  action: "accept" | "cancel"
}

export interface RespondToQuoteResponse {
  success: boolean
  message: string
}

// Respond to Quote
export async function respondToQuote(id: string | number, payload: RespondToQuotePayload): Promise<RespondToQuoteResponse> {
  try {
    const response = await apiClient.post<RespondToQuoteResponse>(`/buyer/rfqs/${id}/respond-quote`, payload)
    return response.data
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to respond to quote."),
    }
  }
}
