import { apiClient } from "./client"
import { getApiErrorMessage } from "./errors"

export interface ContactFormData {
  name: string
  email: string
  company_name?: string
  inquiry_type: string
  message: string
  is_read?: boolean
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = {
      ...data,
      is_read: false // Default to unread for new submissions
    }
    
    const response = await apiClient.post("/contact", payload)
    
    return {
      success: typeof response.data?.success === "boolean" ? response.data.success : true,
      message: response.data?.message || "Your message has been sent successfully.",
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: getApiErrorMessage(error, "Failed to submit contact form. Please try again later."),
    }
  }
}
