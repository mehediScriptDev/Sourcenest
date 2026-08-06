import { apiClient } from "./client"
import {
  ChatConversation,
  ChatMessage,
  normalizeConversation,
  normalizeMessage,
} from "./messages"

interface ApiConversation {
  id: number
  name: string | null
  created_by: number
  created_at: string
  updated_at: string
  is_unread?: boolean
  last_message_sent_at: string | null
  creator: unknown
  participants: Array<{
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
    company_name?: string
    country?: string
    avatar?: string
  }>
  last_message?: {
    id: number | string
    sender_id?: number | string
    body?: string
    created_at?: string
    is_read?: boolean | number
    attachments?: unknown[]
  }
}

interface ApiMessage {
  id: number | string
  sender_id?: number | string
  body?: string
  created_at?: string
  is_read?: boolean | number
  attachments?: unknown[]
}

export async function getAdminConversations(params?: {
  per_page?: number
  search?: string
  page?: number
}): Promise<ChatConversation[]> {
  try {
    const response = await apiClient.get("/admin/conversations", { params })
    const data = response.data?.data || response.data || []
    if (!Array.isArray(data)) return []

    return data.map((conv: ApiConversation) => normalizeConversation(conv as never))
  } catch (error) {
    console.error("Failed to fetch admin conversations:", error)
    return []
  }
}

export async function getAdminMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const response = await apiClient.get(`/admin/conversations/${conversationId}/messages`, {
      params: { per_page: 100 },
    })
    const data = response.data?.data || response.data || []
    if (!Array.isArray(data)) return []

    const sortedData = [...data].sort((a: ApiMessage, b: ApiMessage) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at.replace(" ", "T")).getTime() - new Date(b.created_at.replace(" ", "T")).getTime()
      }
      return Number(a.id) - Number(b.id)
    })

    return sortedData.map((msg: ApiMessage) => normalizeMessage(msg as never))
  } catch (error) {
    console.error("Failed to fetch admin conversation messages:", error)
    return []
  }
}
